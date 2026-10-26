import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '../../db/db'
import { mealsOn } from '../../db/food'
import { STARTER_MENU } from '../../db/seed/starterMenu'
import type { MealItem } from '../../db/types'
import { atLocalTime } from '../../domain/date'
import { sampleTables } from '../../test/fixtures'
import { renderApp } from '../../test/renderApp'

vi.mock('eruda', () => ({ default: { init: vi.fn(), destroy: vi.fn() } }))

const TODAY = '2026-10-26' // Monday; setup was 2026-10-01
const NOW = new Date(2026, 9, 26, 13, 0)

const protein = (grams: number): MealItem => ({
  foodId: 1,
  name: 'Chicken curry',
  portion: 1,
  kcal: 200,
  proteinG: grams,
  countsAsProtein: true,
})

async function seed({ birthDate = '2001-10-25' } = {}) {
  const tables = sampleTables()
  await db.profile.put({ ...tables.profile[0]!, birthDate })
  await db.targetHistory.add({ ...tables.targetHistory[0]!, proteinQuestThresholdG: 90 })
  await db.foods.bulkAdd(STARTER_MENU.map((food) => ({ ...food })))
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'], now: NOW })
  localStorage.removeItem('dq.seenLevel')
})

afterEach(() => {
  vi.useRealTimers()
})

async function openStatus() {
  renderApp('/')
  return screen.findByRole('region', { name: 'Today’s quests' })
}

function questRow(board: HTMLElement, name: string | RegExp): HTMLElement {
  return within(board).getByText(name).closest('li')!
}

describe('quest board (plan §7)', () => {
  it('lists the seven daily quests at level 1', async () => {
    await seed()
    const board = await openStatus()
    expect(within(board).getAllByRole('listitem')).toHaveLength(7)
    for (const name of [
      'Protein at breakfast',
      'Two proteins at lunch',
      'Two proteins at dinner',
      'Daily protein: 90 g',
      'Workout',
      'Study blocks',
      'Sleep 7 h',
    ]) {
      expect(within(board).getByText(name)).toBeInTheDocument()
    }
    // No plan yet, so the workout quest is locked.
    expect(within(questRow(board, 'Workout')).getByText('Not available yet')).toBeInTheDocument()
    expect(screen.getByText('125 XP to level 2')).toBeInTheDocument()
  })

  it('completes a quest from a log and adds its XP', async () => {
    await seed()
    const board = await openStatus()
    expect(within(questRow(board, 'Protein at breakfast')).getByText('Not yet')).toBeInTheDocument()

    await db.meals.add({
      date: TODAY,
      at: atLocalTime(TODAY, 8, 0),
      slot: 'breakfast',
      items: [protein(20)],
      kcal: 200,
      proteinG: 20,
      source: 'tap',
    })
    await waitFor(() =>
      expect(within(questRow(board, 'Protein at breakfast')).getByText('Done')).toBeInTheDocument(),
    )
    expect(screen.getByText('10 of 220 XP today')).toBeInTheDocument()
    expect(screen.getByText('10 XP in total')).toBeInTheDocument()
  })

  it('gives earlier days credit too (plan §13, item 11)', async () => {
    await seed()
    await db.sleepLogs.bulkAdd(
      ['2026-10-20', '2026-10-21', '2026-10-22'].map((wakeDate) => ({
        wakeDate,
        bedAt: 0,
        wakeAt: 0,
        minutes: 450,
        source: 'tap' as const,
      })),
    )
    await openStatus()
    expect(screen.getByText('60 XP in total')).toBeInTheDocument()
  })

  it('shows the weekly quests', async () => {
    await seed()
    await db.bodyLogs.bulkAdd([{ date: TODAY, at: 0, weightKg: 69 }])
    await openStatus()
    const week = screen.getByRole('region', { name: 'This week' })
    expect(within(week).getByText('1 of 3 weigh-ins')).toBeInTheDocument()
    expect(within(week).getByText('Export a backup')).toBeInTheDocument()
  })

  it('celebrates a new level once, and it can be skipped', async () => {
    await seed()
    localStorage.setItem('dq.seenLevel', '1')
    await db.sleepLogs.bulkAdd(
      Array.from({ length: 7 }, (_, i) => ({
        wakeDate: `2026-10-${String(10 + i).padStart(2, '0')}`,
        bedAt: 0,
        wakeAt: 0,
        minutes: 450,
        source: 'tap' as const,
      })),
    ) // 140 XP: level 2
    await openStatus()
    const dialog = await screen.findByRole('dialog', { name: 'Level up!' })
    expect(within(dialog).getByText('You reached level 2. Keep it steady.')).toBeInTheDocument()
    await userEvent.click(within(dialog).getByRole('button', { name: 'Continue' }))
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: 'Level up!' })).not.toBeInTheDocument(),
    )
    expect(localStorage.getItem('dq.seenLevel')).toBe('2')
  })

  it('doesn’t celebrate on the first visit', async () => {
    await seed()
    await db.sleepLogs.add({
      wakeDate: '2026-10-10',
      bedAt: 0,
      wakeAt: 0,
      minutes: 450,
      source: 'tap',
    })
    await openStatus()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    // Recorded by an effect just after the board renders.
    await waitFor(() => expect(localStorage.getItem('dq.seenLevel')).toBe('1'))
  })
})

describe('quick logs on Status (plan §10)', () => {
  it('logs the +1 drink in one tap', async () => {
    await seed()
    await openStatus()
    await userEvent.click(
      screen.getByRole('button', { name: '+1 Nescafe with milk (1 tsp sugar)' }),
    )
    await waitFor(async () => expect(await mealsOn(TODAY)).toMatchObject([{ slot: 'drink' }]))
  })

  it('switches today to a flex day, which changes the dinner quest', async () => {
    await seed()
    const board = await openStatus()
    await userEvent.click(screen.getByRole('switch', { name: 'Flex day' }))
    expect(await within(board).findByText('Flex dinner within budget')).toBeInTheDocument()
  })

  it('keeps under-18s on two proteins at dinner, with no flex switch', async () => {
    await seed({ birthDate: '2010-01-01' })
    await db.days.put({ date: TODAY, isFlexDay: true, isPlannedRest: false })
    const board = await openStatus()
    expect(within(board).getByText('Two proteins at dinner')).toBeInTheDocument()
    expect(screen.queryByRole('switch', { name: 'Flex day' })).not.toBeInTheDocument()
  })
})

describe('rank and stats (plan §7)', () => {
  it('shows the rank, the next rank and a level for each stat', async () => {
    await seed()
    // 7 nights of sleep: 140 VIT, so VIT reaches level 2.
    await db.sleepLogs.bulkAdd(
      Array.from({ length: 7 }, (_, i) => ({
        wakeDate: `2026-10-${String(10 + i).padStart(2, '0')}`,
        bedAt: 0,
        wakeAt: 0,
        minutes: 450,
        source: 'tap' as const,
      })),
    )
    await openStatus()
    expect(screen.getByText('Rank E')).toBeInTheDocument()
    expect(screen.getByText('Rank D at level 10')).toBeInTheDocument()
    const stats = screen.getByRole('region', { name: 'Stats' })
    expect(within(stats).getByRole('progressbar', { name: 'Vitality Lv 2' })).toBeInTheDocument()
    expect(within(stats).getByRole('progressbar', { name: 'Strength Lv 1' })).toBeInTheDocument()
    expect(within(stats).getByRole('progressbar', { name: 'Intellect Lv 1' })).toBeInTheDocument()
  })
})
