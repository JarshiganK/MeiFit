import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { en } from '../../copy/en'
import { db } from '../../db/db'
import { mealsOn } from '../../db/food'
import { STARTER_MENU } from '../../db/seed/starterMenu'
import { sampleTables } from '../../test/fixtures'
import { renderApp } from '../../test/renderApp'

vi.mock('eruda', () => ({ default: { init: vi.fn(), destroy: vi.fn() } }))

const LUNCHTIME = new Date(2026, 9, 25, 13, 5) // Sunday 25 Oct 2026, 1:05 p.m.
const TODAY = '2026-10-25'

async function seed({ birthDate = '2001-10-25' } = {}) {
  const tables = sampleTables()
  await db.profile.put({ ...tables.profile[0]!, birthDate })
  await db.targetHistory.bulkAdd(tables.targetHistory)
  await db.foods.bulkAdd(STARTER_MENU.map((food) => ({ ...food })))
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'], now: LUNCHTIME })
})

afterEach(() => {
  vi.useRealTimers()
})

const escape = (text: string) => text.replace(/[()]/g, '\\$&')
/** A menu tile: its name, then its numbers ("Rice≈200 kcal · 4 g"). */
const tile = (name: string) => new RegExp(`^${escape(name)}(≈|\\d)`)
/** A portion button: its label, then its calories if shown. */
const portionButton = (label: string) => new RegExp(`^${escape(label)}(≈|$)`)

async function openFood() {
  renderApp('/food')
  return screen.findByRole('heading', { level: 1, name: 'Food' })
}

/** Taps a menu item, then a portion: the two taps of plan §3. */
async function logItem(name: string, portion: string) {
  await userEvent.click(screen.getByRole('button', { name: tile(name) }))
  const sheet = await screen.findByRole('dialog', { name })
  await userEvent.click(within(sheet).getByRole('button', { name: portionButton(portion) }))
  await screen.findByText(new RegExp(`^Added ${escape(name)}`))
}

describe('Food screen', () => {
  it('logs rice in cups with two taps and shows ≈ totals', async () => {
    await seed()
    await openFood()
    // Lunchtime, so lunch is preselected.
    expect(screen.getByRole('radio', { name: 'Lunch' })).toBeChecked()

    await userEvent.click(screen.getByRole('button', { name: tile('Rice') }))
    const sheet = await screen.findByRole('dialog', { name: 'Rice' })
    expect(within(sheet).getByText(/Adds to lunch/)).toBeInTheDocument()
    await userEvent.click(within(sheet).getByRole('button', { name: portionButton('1½ cups') }))

    expect(await screen.findByText('Added Rice (1½ cups) to lunch')).toBeInTheDocument()
    const [meal] = await mealsOn(TODAY)
    expect(meal).toMatchObject({ slot: 'lunch', kcal: 300, proteinG: 6, source: 'tap' })

    const totals = screen.getByRole('region', { name: 'Totals' })
    expect(await within(totals).findByText('≈300')).toBeInTheDocument()
    expect(within(totals).getByText('of ≈2,020')).toBeInTheDocument()
    expect(within(totals).getByText('≈1,720 left')).toBeInTheDocument()
    expect(within(totals).getByText('6 g')).toBeInTheDocument()
    expect(within(totals).getByRole('progressbar', { name: 'Protein' })).toHaveAttribute(
      'aria-valuetext',
      '6 of 124 grams',
    )
  })

  it('undoes a log from the toast', async () => {
    await seed()
    await openFood()
    await logItem('Boiled egg', '× 2')
    await userEvent.click(screen.getByRole('button', { name: 'Undo' }))
    await waitFor(async () => expect(await mealsOn(TODAY)).toEqual([]))
  })

  it('counts protein items per meal and files drinks under drinks', async () => {
    await seed()
    await openFood()
    await logItem('Chicken curry', 'Normal')
    await logItem('Soya curry', 'Large')
    await logItem('Plain tea (1 tsp sugar)', '× 1')
    const log = screen.getByRole('region', { name: 'Logged' })
    const lunch = await within(log).findByRole('region', { name: 'Lunch' })
    expect(await within(lunch).findByText('2 protein items')).toBeInTheDocument()
    expect(await within(log).findByRole('region', { name: 'Drinks' })).toHaveTextContent(
      'Plain tea',
    )
  })

  it('changes a portion, moves and removes a logged item (with Undo)', async () => {
    await seed()
    await openFood()
    await logItem('Rice', '1 cup')

    await userEvent.click(await screen.findByRole('button', { name: /^Change ?Rice/ }))
    let sheet = await screen.findByRole('dialog', { name: 'Rice' })
    expect(within(sheet).getByRole('button', { name: portionButton('1 cup') })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await userEvent.click(within(sheet).getByRole('button', { name: portionButton('2 cups') }))
    await waitFor(async () => expect((await mealsOn(TODAY))[0]?.kcal).toBe(400))

    await userEvent.click(screen.getByRole('button', { name: /^Change ?Rice/ }))
    sheet = await screen.findByRole('dialog', { name: 'Rice' })
    await userEvent.click(within(sheet).getByRole('radio', { name: 'Dinner' }))
    await waitFor(async () => expect((await mealsOn(TODAY))[0]?.slot).toBe('dinner'))
    // The line moves to the Dinner section, so wait for the new button.
    const dinner = await within(screen.getByRole('region', { name: 'Logged' })).findByRole(
      'region',
      { name: 'Dinner' },
    )

    await userEvent.click(within(dinner).getByRole('button', { name: /^Change ?Rice/ }))
    sheet = await screen.findByRole('dialog', { name: 'Rice' })
    await userEvent.click(within(sheet).getByRole('button', { name: 'Remove' }))
    await waitFor(async () => expect(await mealsOn(TODAY)).toEqual([]))
    await userEvent.click(await screen.findByRole('button', { name: 'Undo' }))
    await waitFor(async () => expect(await mealsOn(TODAY)).toHaveLength(1))
  })

  it('logs on an earlier day at a typical time for the meal', async () => {
    await seed()
    await openFood()
    expect(screen.getByRole('button', { name: 'Next day' })).toBeDisabled()
    await userEvent.click(screen.getByRole('button', { name: 'Previous day' }))
    expect(await screen.findByText('Yesterday')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('radio', { name: 'Breakfast' }))
    await logItem('Bread', '× 2')
    const [meal] = await mealsOn('2026-10-24')
    expect(meal?.slot).toBe('breakfast')
    expect(new Date(meal!.at).getHours()).toBe(8)
    expect(await mealsOn(TODAY)).toEqual([])
  })

  it('shows protein only for under-18s', async () => {
    await seed({ birthDate: '2010-01-01' })
    await openFood()
    expect(screen.queryByText(/kcal/)).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Calories' })).not.toBeInTheDocument()
    expect(screen.getByText(en.food.plateRule)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: tile('Rice') }))
    const sheet = await screen.findByRole('dialog', { name: 'Rice' })
    expect(within(sheet).queryByText(/≈/)).not.toBeInTheDocument()
  })

  it('points to the menu editor when the menu is empty', async () => {
    await db.profile.put(sampleTables().profile[0]!)
    await openFood()
    expect(screen.getByText(en.food.emptyMenuTitle)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: en.food.addFirstItem })).toHaveAttribute(
      'href',
      '/settings/menu',
    )
    expect(screen.getByText(en.food.nothingLogged)).toBeInTheDocument()
  })
})

describe('menu editor', () => {
  async function openEditor() {
    renderApp('/settings/menu')
    await screen.findByRole('heading', { level: 1, name: 'Menu' })
  }

  it('adds an item that can then be logged', async () => {
    await seed()
    await openEditor()
    await userEvent.click(screen.getByRole('button', { name: 'Add item' }))
    const sheet = await screen.findByRole('dialog', { name: 'New menu item' })
    await userEvent.click(within(sheet).getByRole('button', { name: 'Save' }))
    expect(within(sheet).getAllByText(en.menuEditor.errors.required)).toHaveLength(3)

    await userEvent.type(within(sheet).getByLabelText('Name'), 'Fish curry')
    await userEvent.type(within(sheet).getByLabelText('One serving'), '1 serving')
    await userEvent.type(within(sheet).getByLabelText('Calories per serving (kcal)'), '180')
    await userEvent.type(within(sheet).getByLabelText('Protein per serving (g)'), '18')
    await userEvent.click(within(sheet).getByRole('switch', { name: 'Counts as a protein' }))
    await userEvent.click(within(sheet).getByRole('button', { name: 'Save' }))

    expect(await screen.findByText('Saved Fish curry')).toBeInTheDocument()
    const fish = await db.foods.where('name').equals('Fish curry').first()
    expect(fish).toMatchObject({ category: 'curry', unit: 'size', kcal: 180, proteinG: 18 })
    expect(fish?.countsAsProtein).toBe(true)
  })

  it('rejects a duplicate name and more protein than the calories allow', async () => {
    await seed()
    await openEditor()
    await userEvent.click(screen.getByRole('button', { name: 'Add item' }))
    const sheet = await screen.findByRole('dialog', { name: 'New menu item' })
    await userEvent.type(within(sheet).getByLabelText('Name'), 'rice')
    await userEvent.type(within(sheet).getByLabelText('Calories per serving (kcal)'), '50')
    await userEvent.type(within(sheet).getByLabelText('Protein per serving (g)'), '20')
    await userEvent.click(within(sheet).getByRole('button', { name: 'Save' }))
    expect(within(sheet).getByText(en.menuEditor.errors.duplicate)).toBeInTheDocument()
    expect(within(sheet).getByText(en.menuEditor.errors.proteinTooHigh)).toBeInTheDocument()
    await waitFor(() => expect(within(sheet).getByLabelText('Name')).toHaveFocus())
  })

  it('edits an item without changing meals already logged', async () => {
    await seed()
    const rice = (await db.foods.where('name').equals('Rice').first())!
    await db.meals.add({
      date: TODAY,
      at: LUNCHTIME.getTime(),
      slot: 'lunch',
      items: [
        {
          foodId: rice.id!,
          name: 'Rice',
          portion: 1,
          kcal: 200,
          proteinG: 4,
          countsAsProtein: false,
        },
      ],
      kcal: 200,
      proteinG: 4,
      source: 'tap',
    })
    await openEditor()
    await userEvent.click(screen.getByRole('button', { name: /^Edit ?Rice ?1 cup/ }))
    const sheet = await screen.findByRole('dialog', { name: 'Edit Rice' })
    const kcal = within(sheet).getByLabelText('Calories per serving (kcal)')
    await userEvent.clear(kcal)
    await userEvent.type(kcal, '210')
    await userEvent.click(within(sheet).getByRole('button', { name: 'Save' }))
    await waitFor(async () => expect((await db.foods.get(rice.id))?.kcal).toBe(210))
    expect((await mealsOn(TODAY))[0]?.kcal).toBe(200)
  })

  it('removes an item from the menu, with Undo and Put back', async () => {
    await seed()
    await openEditor()
    await userEvent.click(screen.getByRole('button', { name: /^Edit ?Cream bun/ }))
    const sheet = await screen.findByRole('dialog', { name: 'Edit Cream bun' })
    await userEvent.click(within(sheet).getByRole('button', { name: 'Remove from menu' }))
    expect(await screen.findByText('Removed Cream bun from the menu')).toBeInTheDocument()
    await waitFor(async () =>
      expect((await db.foods.where('name').equals('Cream bun').first())?.archived).toBe(true),
    )

    await userEvent.click(await screen.findByRole('button', { name: 'Put Cream bun back' }))
    await waitFor(async () =>
      expect((await db.foods.where('name').equals('Cream bun').first())?.archived).toBe(false),
    )
  })

  it('hides calories from under-18s and saves new items with 0 kcal', async () => {
    await seed({ birthDate: '2010-01-01' })
    await openEditor()
    expect(screen.queryByText(/kcal/)).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Add item' }))
    const sheet = await screen.findByRole('dialog', { name: 'New menu item' })
    expect(within(sheet).queryByLabelText('Calories per serving (kcal)')).not.toBeInTheDocument()
    await userEvent.type(within(sheet).getByLabelText('Name'), 'Curd')
    await userEvent.type(within(sheet).getByLabelText('Protein per serving (g)'), '8')
    await userEvent.click(within(sheet).getByRole('button', { name: 'Save' }))
    await waitFor(async () =>
      expect(await db.foods.where('name').equals('Curd').first()).toMatchObject({ kcal: 0 }),
    )
  })
})
