import { screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '../../db/db'
import { datesInRange } from '../../domain/date'
import { sampleTables } from '../../test/fixtures'
import { renderApp } from '../../test/renderApp'

vi.mock('eruda', () => ({ default: { init: vi.fn(), destroy: vi.fn() } }))

const NOW = new Date(2026, 9, 9, 12, 0) // 9 Oct

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'], now: NOW })
})

afterEach(() => {
  vi.useRealTimers()
})

/** Days with all four food quests and a study block: 5 quests each. */
async function seedGoodDays(dates: string[]) {
  const tables = sampleTables()
  await db.profile.put(tables.profile[0]!) // set up on 1 Oct
  await db.targetHistory.bulkAdd(tables.targetHistory)
  const item = { foodId: 1, name: 'Egg', portion: 1, kcal: 70, proteinG: 30, countsAsProtein: true }
  for (const date of dates) {
    for (const slot of ['breakfast', 'lunch', 'dinner'] as const) {
      await db.meals.add({
        date,
        at: 0,
        slot,
        items: [item, item],
        kcal: 140,
        proteinG: 60,
        source: 'tap',
      })
    }
    await db.studySessions.add({
      date,
      startedAt: 0,
      minutes: 50,
      completed: true,
      source: 'timer',
    })
  }
}

async function streakCard() {
  renderApp('/')
  const flame = await screen.findByText(/streak|No streak yet/)
  return flame.closest('section')!
}

describe('streak card', () => {
  it('shows the streak, a shield after 7 days and today’s progress', async () => {
    await seedGoodDays(datesInRange('2026-10-01', '2026-10-08'))
    const card = await streakCard()
    expect(within(card).getByText('8-day streak')).toBeInTheDocument()
    expect(within(card).getByText('1 of 2 shields')).toBeInTheDocument()
    expect(within(card).getByText('Today: 0 of 5 quests to keep it going')).toBeInTheDocument()
  })

  it('says when a shield covered a missed day', async () => {
    const dates = datesInRange('2026-10-01', '2026-10-08').filter((d) => d !== '2026-10-08')
    await seedGoodDays(dates)
    const card = await streakCard()
    expect(within(card).getByText('7-day streak')).toBeInTheDocument()
    expect(within(card).getByText('0 of 2 shields')).toBeInTheDocument()
    expect(within(card).getByText(/A shield covered Thu 8 Oct/)).toBeInTheDocument()
  })

  it('starts with no streak', async () => {
    await seedGoodDays([])
    const card = await streakCard()
    expect(within(card).getByText('No streak yet')).toBeInTheDocument()
  })
})
