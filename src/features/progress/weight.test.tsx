import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { en } from '../../copy/en'
import { allWeighIns } from '../../db/body'
import { db } from '../../db/db'
import { atLocalTime } from '../../domain/date'
import { seedProfile } from '../../test/fixtures'
import { renderApp } from '../../test/renderApp'

vi.mock('eruda', () => ({ default: { init: vi.fn(), destroy: vi.fn() } }))
// jsdom has no canvas; the chart's data is covered by the text summary and table.
vi.mock('./WeightChart', () => ({ default: () => <div data-testid="weight-chart" /> }))

const NOW = new Date(2026, 9, 25, 7, 30) // Sunday

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'], now: NOW })
})

afterEach(() => {
  vi.useRealTimers()
})

async function openWeight() {
  renderApp('/progress')
  await screen.findByRole('heading', { level: 1, name: 'Progress' })
  await screen.findByLabelText('Today’s weight (kg)')
  return screen.getByRole('region', { name: 'Weight' })
}

async function seedWeights(entries: [string, number][]) {
  await db.bodyLogs.bulkAdd(
    entries.map(([date, weightKg]) => ({ date, at: atLocalTime(date, 7, 0), weightKg })),
  )
}

describe('weight log', () => {
  it('saves today’s weight and shows this week’s average', async () => {
    await seedProfile()
    await seedWeights([['2026-10-21', 69.6]])
    const card = await openWeight()

    await userEvent.type(within(card).getByLabelText('Today’s weight (kg)'), '69,2')
    await userEvent.click(within(card).getByRole('button', { name: 'Save' }))
    expect(await screen.findByText('Saved 69.2 kg')).toBeInTheDocument()
    expect(await allWeighIns()).toMatchObject([
      { date: '2026-10-21', weightKg: 69.6 },
      { date: '2026-10-25', weightKg: 69.2 },
    ])
    expect(await within(card).findByText('≈69.4 kg average from 2 weigh-ins')).toBeInTheDocument()
    expect(within(card).getByText('Today: 69.2 kg')).toBeInTheDocument()
  })

  it('replaces the same day’s weigh-in and can undo it', async () => {
    await seedProfile()
    await seedWeights([['2026-10-25', 70]])
    const card = await openWeight()
    await userEvent.type(within(card).getByLabelText('Today’s weight (kg)'), '69.8')
    await userEvent.click(within(card).getByRole('button', { name: 'Save' }))
    await waitFor(async () => expect((await allWeighIns())[0]?.weightKg).toBe(69.8))
    await userEvent.click(await screen.findByRole('button', { name: 'Undo' }))
    await waitFor(async () => expect((await allWeighIns())[0]?.weightKg).toBe(70))
  })

  it('refuses an empty or impossible weight', async () => {
    await seedProfile()
    const card = await openWeight()
    await userEvent.click(within(card).getByRole('button', { name: 'Save' }))
    expect(within(card).getByText(en.weight.errors.required)).toBeInTheDocument()
    await userEvent.type(within(card).getByLabelText('Today’s weight (kg)'), '690')
    await userEvent.click(within(card).getByRole('button', { name: 'Save' }))
    expect(within(card).getByText(en.weight.errors.outOfRange)).toBeInTheDocument()
    expect(await allWeighIns()).toEqual([])
  })

  it('summarises the trend in words and a table for the chart', async () => {
    await seedProfile()
    await seedWeights([
      ['2026-10-12', 70],
      ['2026-10-14', 69.6],
      ['2026-10-19', 69.4],
      ['2026-10-22', 69],
    ])
    const card = await openWeight()
    expect(
      within(card).getByText('Weekly averages over 2 weeks, from 69.8 kg to 69.2 kg.'),
    ).toBeInTheDocument()
    expect(within(card).getByText('−0.6 kg (−0.9%) from the week before')).toBeInTheDocument()
    expect(await within(card).findByTestId('weight-chart')).toBeInTheDocument()
    const table = within(card).getByRole('table', { name: 'Weight trend' })
    expect(within(table).getAllByRole('row')).toHaveLength(3)
    expect(within(card).getByText('≈69.2 kg average from 2 weigh-ins')).toBeInTheDocument()
  })

  it('edits and deletes an earlier weigh-in, with Undo', async () => {
    await seedProfile()
    await seedWeights([['2026-10-22', 69]])
    const card = await openWeight()
    await userEvent.click(within(card).getByRole('button', { name: 'Thu 22 Oct: 69 kg' }))
    const sheet = await screen.findByRole('dialog', { name: 'Weigh-in on Thu 22 Oct' })
    const input = within(sheet).getByLabelText('Weight (kg)')
    await userEvent.clear(input)
    await userEvent.type(input, '68.7')
    await userEvent.click(within(sheet).getByRole('button', { name: 'Save' }))
    await waitFor(async () => expect((await allWeighIns())[0]?.weightKg).toBe(68.7))

    await userEvent.click(await within(card).findByRole('button', { name: 'Thu 22 Oct: 68.7 kg' }))
    await userEvent.click(
      within(await screen.findByRole('dialog', { name: 'Weigh-in on Thu 22 Oct' })).getByRole(
        'button',
        { name: 'Delete' },
      ),
    )
    await waitFor(async () => expect(await allWeighIns()).toEqual([]))
    await userEvent.click(await screen.findByRole('button', { name: 'Undo' }))
    await waitFor(async () => expect(await allWeighIns()).toHaveLength(1))
  })

  it('shows a designed empty state before any weigh-in', async () => {
    await seedProfile()
    const card = await openWeight()
    expect(within(card).getByText(en.weight.chartEmpty)).toBeInTheDocument()
    expect(within(card).getByText(en.weight.noWeekYet)).toBeInTheDocument()
    expect(within(card).queryByTestId('weight-chart')).not.toBeInTheDocument()
  })
})
