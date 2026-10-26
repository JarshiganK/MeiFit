import { screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '../../db/db'
import { sampleTables } from '../../test/fixtures'
import { renderApp } from '../../test/renderApp'

vi.mock('eruda', () => ({ default: { init: vi.fn(), destroy: vi.fn() } }))
vi.mock('./WeightChart', () => ({ default: () => null }))

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'], now: new Date(2026, 10, 25, 9, 0) })
})

afterEach(() => {
  vi.useRealTimers()
})

describe('achievements card', () => {
  it('shows progress and unlocks Checkpoint after 3 fitness checks', async () => {
    await db.profile.put(sampleTables().profile[0]!)
    await db.fitnessChecks.bulkAdd(
      ['2026-10-03', '2026-10-31', '2026-11-21'].map((date) => ({ date, lifts: [] })),
    )
    renderApp('/progress')
    const card = await screen.findByRole('region', { name: 'Achievements' })
    expect(await within(card).findByText('1 of 5 unlocked')).toBeInTheDocument()
    const checkpoint = within(card).getByText('Checkpoint').closest('li')!
    expect(within(checkpoint).getByText('Unlocked')).toBeInTheDocument()
    expect(within(card).getByRole('progressbar', { name: 'Scholar' })).toHaveAttribute(
      'aria-valuetext',
      '0 of 100',
    )
  })
})
