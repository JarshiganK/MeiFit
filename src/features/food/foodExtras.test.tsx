import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { en } from '../../copy/en'
import { db } from '../../db/db'
import { allCombos, mealsOn } from '../../db/food'
import { currentTarget } from '../../db/profile'
import { STARTER_MENU } from '../../db/seed/starterMenu'
import type { Meal } from '../../db/types'
import { addDays, atLocalTime } from '../../domain/date'
import { CUSTOM_FOOD_ID } from '../../domain/food'
import { sampleTables } from '../../test/fixtures'
import { renderApp } from '../../test/renderApp'

vi.mock('eruda', () => ({ default: { init: vi.fn(), destroy: vi.fn() } }))

const TODAY = '2026-10-25' // a Sunday
const LUNCHTIME = new Date(2026, 9, 25, 13, 5)

async function seed({
  setupDate = '2026-10-01',
  birthDate = '2001-10-25',
  flexDaysPerWeek = 1,
}: { setupDate?: string; birthDate?: string; flexDaysPerWeek?: number } = {}) {
  const tables = sampleTables()
  await db.profile.put({ ...tables.profile[0]!, setupDate, birthDate, flexDaysPerWeek })
  await db.targetHistory.add({ ...tables.targetHistory[0]!, startsOn: setupDate })
  await db.bodyLogs.add({ date: setupDate, at: atLocalTime(setupDate, 7, 0), weightKg: 69 })
  await db.foods.bulkAdd(STARTER_MENU.map((food) => ({ ...food })))
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'], now: LUNCHTIME })
})

afterEach(() => {
  vi.useRealTimers()
})

const escape = (text: string) => text.replace(/[()]/g, '\\$&')
const tile = (name: string) => new RegExp(`^${escape(name)}(≈|\\d)`)
const portionButton = (label: string) => new RegExp(`^${escape(label)}(≈|$)`)

async function openFood() {
  renderApp('/food')
  await screen.findByRole('heading', { level: 1, name: 'Food' })
}

async function logItem(name: string, portion: string) {
  await userEvent.click(screen.getByRole('button', { name: tile(name) }))
  const sheet = await screen.findByRole('dialog', { name })
  await userEvent.click(within(sheet).getByRole('button', { name: portionButton(portion) }))
  await screen.findByText(new RegExp(`^Added ${escape(name)}`))
}

describe('combos', () => {
  it('saves a logged meal as a combo and logs it again in one tap', async () => {
    await seed()
    await openFood()
    await logItem('Rice', '2 cups')
    await logItem('Chicken curry', 'Normal')

    await userEvent.click(await screen.findByRole('button', { name: 'Save lunch as a combo' }))
    const sheet = await screen.findByRole('dialog', { name: 'Save as a combo' })
    const name = within(sheet).getByLabelText('Combo name')
    expect(name).toHaveValue('Lunch')
    await userEvent.clear(name)
    await userEvent.type(name, 'Usual lunch')
    await userEvent.click(within(sheet).getByRole('button', { name: 'Save' }))
    expect(await screen.findByText('Saved combo Usual lunch')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('radio', { name: 'Dinner' }))
    await userEvent.click(await screen.findByRole('button', { name: /^Usual lunch/ }))
    expect(await screen.findByText('Added Usual lunch to dinner')).toBeInTheDocument()
    await waitFor(async () => {
      const dinner = (await mealsOn(TODAY)).find((meal) => meal.slot === 'dinner')
      expect(dinner).toMatchObject({ source: 'combo', kcal: 600, proteinG: 28 })
    })
  })

  it('deletes a combo from the menu editor, with Undo', async () => {
    await seed()
    await db.combos.add({ name: 'Usual lunch', items: [{ foodId: 1, portion: 2 }] })
    renderApp('/settings/menu')
    await userEvent.click(await screen.findByRole('button', { name: 'Delete Usual lunch' }))
    await waitFor(async () => expect(await allCombos()).toEqual([]))
    await userEvent.click(await screen.findByRole('button', { name: 'Undo' }))
    await waitFor(async () => expect(await allCombos()).toHaveLength(1))
  })
})

describe('drinks +1', () => {
  it('starts with the first drink, then follows the most-logged one', async () => {
    await seed()
    await openFood()
    const drinks = screen.getByRole('region', { name: 'Quick drinks' })
    expect(
      within(drinks).getByRole('button', { name: '+1 Nescafe with milk (1 tsp sugar)' }),
    ).toBeInTheDocument()

    for (let i = 0; i < 2; i++) {
      await userEvent.click(within(drinks).getByRole('button', { name: 'All drinks' }))
      const sheet = await screen.findByRole('dialog', { name: 'Add a drink' })
      await userEvent.click(within(sheet).getByRole('button', { name: /^Plain tea/ }))
      await screen.findByText(/^Added Plain tea/)
    }
    expect(
      await within(drinks).findByRole('button', { name: '+1 Plain tea (1 tsp sugar)' }),
    ).toBeInTheDocument()

    await userEvent.click(
      within(drinks).getByRole('button', { name: '+1 Plain tea (1 tsp sugar)' }),
    )
    await waitFor(async () => expect(await mealsOn(TODAY)).toHaveLength(3))
    expect((await mealsOn(TODAY)).every((meal) => meal.slot === 'drink')).toBe(true)
  })
})

describe('something else (outside food)', () => {
  it('logs a one-off entry with estimated values', async () => {
    await seed()
    await openFood()
    await userEvent.click(screen.getByRole('button', { name: 'Something else' }))
    const sheet = await screen.findByRole('dialog', { name: 'Add something else' })
    await userEvent.type(within(sheet).getByLabelText('What was it?'), 'Shop kottu')
    await userEvent.type(within(sheet).getByLabelText('Calories per serving (kcal)'), '950')
    await userEvent.type(within(sheet).getByLabelText('Protein per serving (g)'), '30')
    await userEvent.click(within(sheet).getByRole('switch', { name: 'Counts as a protein' }))
    await userEvent.click(within(sheet).getByRole('button', { name: 'Add' }))

    expect(await screen.findByText('Added Shop kottu to lunch')).toBeInTheDocument()
    const [meal] = await mealsOn(TODAY)
    expect(meal).toMatchObject({ source: 'custom', slot: 'lunch', kcal: 950, proteinG: 30 })
    expect(meal?.items[0]).toMatchObject({ foodId: CUSTOM_FOOD_ID, countsAsProtein: true })
    expect(await db.foods.where('name').equals('Shop kottu').count()).toBe(0)
  })

  it('can also add it to the menu as outside food', async () => {
    await seed()
    await openFood()
    await userEvent.click(screen.getByRole('button', { name: 'Something else' }))
    const sheet = await screen.findByRole('dialog', { name: 'Add something else' })
    await userEvent.type(within(sheet).getByLabelText('What was it?'), 'Shop kottu')
    await userEvent.type(within(sheet).getByLabelText('Calories per serving (kcal)'), '950')
    await userEvent.type(within(sheet).getByLabelText('Protein per serving (g)'), '30')
    await userEvent.click(within(sheet).getByRole('switch', { name: 'Also add it to my menu' }))
    await userEvent.click(within(sheet).getByRole('button', { name: 'Add' }))

    await screen.findByText('Added Shop kottu to lunch')
    const food = await db.foods.where('name').equals('Shop kottu').first()
    expect(food).toMatchObject({ category: 'outside', kcal: 950 })
    expect((await mealsOn(TODAY))[0]?.items[0]?.foodId).toBe(food?.id)
  })

  it('checks the entry before adding it', async () => {
    await seed()
    await openFood()
    await userEvent.click(screen.getByRole('button', { name: 'Something else' }))
    const sheet = await screen.findByRole('dialog', { name: 'Add something else' })
    await userEvent.click(within(sheet).getByRole('button', { name: 'Add' }))
    expect(within(sheet).getAllByText(en.menuEditor.errors.required)).toHaveLength(3)
    expect(await mealsOn(TODAY)).toEqual([])
  })
})

describe('flex day', () => {
  it('shows the dinner budget: target minus everything before dinner', async () => {
    await seed()
    await openFood()
    await logItem('Rice', '2 cups') // 400 kcal at lunch
    await userEvent.click(screen.getByRole('switch', { name: 'Flex day' }))
    const totals = screen.getByRole('region', { name: 'Totals' })
    // 2,021 − 400 = 1,621 → ≈1,620.
    expect(await within(totals).findByText('≈1,620')).toBeInTheDocument()
    expect(within(totals).getByText('≈1,620 left for dinner')).toBeInTheDocument()
    expect((await db.days.get(TODAY))?.isFlexDay).toBe(true)

    await userEvent.click(screen.getByRole('radio', { name: 'Dinner' }))
    await logItem('Chicken kottu', 'Large') // 1,500 kcal
    expect(await within(totals).findByText('≈120 left for dinner')).toBeInTheDocument()
  })

  it('stops at the weekly number of flex days', async () => {
    await seed()
    await db.days.put({ date: addDays(TODAY, -3), isFlexDay: true, isPlannedRest: false })
    await openFood()
    expect(screen.queryByRole('switch', { name: 'Flex day' })).not.toBeInTheDocument()
    expect(screen.getByText(en.food.flexUsedUp(1))).toBeInTheDocument()
  })

  it('isn’t offered to under-18s', async () => {
    await seed({ birthDate: '2010-01-01' })
    await openFood()
    expect(screen.queryByRole('switch', { name: 'Flex day' })).not.toBeInTheDocument()
  })
})

describe('protein calibration (plan §3)', () => {
  it('explains the first 14 days and counts the main meals', async () => {
    await seed({ setupDate: addDays(TODAY, -2) })
    await openFood()
    expect(screen.getByText(en.food.calibrating(3))).toBeInTheDocument()
    expect(screen.getByText('Main meals logged: 0 of 3')).toBeInTheDocument()
    await logItem('Rice', '1 cup')
    expect(await screen.findByText('Main meals logged: 1 of 3')).toBeInTheDocument()
  })

  it('proposes a realistic quest on day 15 and saves it', async () => {
    const setupDate = '2026-10-01'
    await seed({ setupDate })
    // Five days with all three main meals at 80 g → 90 g.
    const meals: Meal[] = []
    for (let i = 0; i < 5; i++) {
      const date = addDays(setupDate, i)
      for (const [slot, proteinG] of [
        ['breakfast', 20],
        ['lunch', 40],
        ['dinner', 20],
      ] as const) {
        meals.push({
          date,
          at: atLocalTime(date, 12, 0),
          slot,
          items: [
            { foodId: 1, name: 'Food', portion: 1, kcal: 300, proteinG, countsAsProtein: true },
          ],
          kcal: 300,
          proteinG,
          source: 'tap',
        })
      }
    }
    await db.meals.bulkAdd(meals)
    await openFood()

    const card = await screen.findByRole('region', { name: 'Set your protein quest' })
    expect(within(card).getByLabelText('Daily protein quest (g)')).toHaveValue('90')
    await userEvent.click(within(card).getByRole('button', { name: 'Use this quest' }))
    expect(await screen.findByText('Protein quest set to 90 g a day')).toBeInTheDocument()
    await waitFor(async () =>
      expect(await currentTarget(TODAY)).toMatchObject({
        proteinQuestThresholdG: 90,
        reason: 'calibration',
      }),
    )
    expect(await screen.findByText('Protein quest: 90 g')).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Set your protein quest' })).not.toBeInTheDocument()
  })
})
