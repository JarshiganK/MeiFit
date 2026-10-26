import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { en } from '../../copy/en'
import { db } from '../../db/db'
import { STARTER_MENU } from '../../db/seed/starterMenu'
import { seedProfile } from '../../test/fixtures'
import { renderApp } from '../../test/renderApp'

vi.mock('eruda', () => ({ default: { init: vi.fn(), destroy: vi.fn() } }))
vi.mock('../progress/WeightChart', () => ({ default: () => null }))

const CLIPBOARD = [
  'DQ1;meal;2026-10-25T13:05;chicken curry,soya curry,rice,pizza',
  'DQ1;sleep;2026-10-24T23:10;2026-10-25T06:28',
  'DQ1;steps;2026-10-24;8234',
  'DQ1;nap;2026-10-25T13:05',
].join('\n')

beforeEach(async () => {
  vi.useFakeTimers({ toFake: ['Date'], now: new Date(2026, 9, 25, 14, 0) })
  await seedProfile()
  await db.foods.bulkAdd(STARTER_MENU.map((food) => ({ ...food })))
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

function stubClipboard(readText: () => Promise<string>) {
  vi.stubGlobal('navigator', { ...navigator, clipboard: { readText } })
}

describe('import from Shortcuts (plan §11)', () => {
  it('opens from Status, pastes, reviews the meal and saves everything', async () => {
    stubClipboard(() => Promise.resolve(CLIPBOARD))
    const router = renderApp('/')
    await userEvent.click(await screen.findByRole('link', { name: 'Import from Shortcuts' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Paste' }))

    const meal = await screen.findByRole('region', { name: 'Lunch at 13:05, Sun 25 Oct' })
    expect(within(meal).getByLabelText('“chicken curry”')).toHaveDisplayValue('Chicken curry')
    expect(within(meal).getByLabelText('“rice”')).toHaveDisplayValue('Rice')
    expect(within(meal).getByLabelText('“pizza”')).toHaveDisplayValue(en.import.skip)
    expect(within(meal).getByText(en.import.noMatch)).toBeInTheDocument()
    // Change one pick before saving.
    await userEvent.selectOptions(within(meal).getByLabelText('“soya curry”'), 'Boiled egg')

    expect(screen.getByText('Sleep: 7 h 18 min, woke Sun 25 Oct')).toBeInTheDocument()
    expect(screen.getByText('Steps: 8,234 on Sat 24 Oct')).toBeInTheDocument()
    const problems = screen.getByRole('region', { name: en.import.problemsTitle })
    expect(within(problems).getByText(/Line 4: unknown kind/)).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Save import' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/'))
    expect(await screen.findByText('Imported 3 items')).toBeInTheDocument()
    const [saved] = await db.meals.toArray()
    expect(saved).toMatchObject({ slot: 'lunch', source: 'import', date: '2026-10-25' })
    expect(saved?.items.map((i) => i.name)).toEqual(['Chicken curry', 'Boiled egg', 'Rice'])
    expect(await db.sleepLogs.toArray()).toMatchObject([{ minutes: 438, source: 'import' }])
    expect(await db.stepsLogs.toArray()).toMatchObject([{ date: '2026-10-24', steps: 8234 }])
  })

  it('falls back to the text box when the clipboard can’t be read', async () => {
    stubClipboard(() => Promise.reject(new Error('denied')))
    renderApp('/import')
    await userEvent.click(await screen.findByRole('button', { name: 'Paste' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(en.import.pasteFailed)
    await userEvent.type(
      screen.getByLabelText('Or paste the text here'),
      'DQ1;steps;2026-10-24;500',
    )
    await userEvent.click(screen.getByRole('button', { name: 'Read' }))
    expect(await screen.findByText('Steps: 500 on Sat 24 Oct')).toBeInTheDocument()
  })

  it('says when there’s nothing to import', async () => {
    renderApp('/import')
    await userEvent.click(await screen.findByRole('button', { name: 'Read' }))
    expect(await screen.findByText(en.import.nothing)).toBeInTheDocument()
  })

  it('shows imported steps on Progress', async () => {
    await db.stepsLogs.bulkAdd([
      { date: '2026-10-23', steps: 6000, source: 'import' },
      { date: '2026-10-24', steps: 8000, source: 'import' },
    ])
    renderApp('/progress')
    const card = await screen.findByRole('region', { name: 'Steps' })
    expect(within(card).getByText('8,000 on Sat 24 Oct')).toBeInTheDocument()
    expect(within(card).getByText('7-day average: 7,000')).toBeInTheDocument()
  })
})
