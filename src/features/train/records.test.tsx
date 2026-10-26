import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '../../db/db'
import { getSetting, setSetting } from '../../db/settings'
import { atLocalTime } from '../../domain/date'
import { seedProfile } from '../../test/fixtures'
import { renderApp } from '../../test/renderApp'

vi.mock('eruda', () => ({ default: { init: vi.fn(), destroy: vi.fn() } }))
vi.mock('../progress/WeightChart', () => ({ default: () => null }))

const NOW = new Date(2026, 9, 26, 18, 0) // Monday

beforeEach(async () => {
  vi.useFakeTimers({ toFake: ['Date'], now: NOW })
  await seedProfile()
  await db.exercises.add({ id: 1, name: 'Push-ups', muscleGroup: 'Chest', type: 'reps' })
  await db.workoutPlans.add({
    name: 'My plan',
    kind: 'normal',
    days: [{ weekday: 1, exercises: [{ exerciseId: 1, sets: 2, repMin: 10, repMax: 15 }] }],
  })
  // Last Thursday: 12 push-ups.
  await db.workoutSets.add({
    date: '2026-10-22',
    startedAt: atLocalTime('2026-10-22', 18, 0),
    exerciseId: 1,
    setNumber: 1,
    reps: 12,
    done: true,
  })
})

afterEach(() => {
  vi.useRealTimers()
})

async function pushups() {
  renderApp('/train')
  return screen.findByRole('region', { name: 'Push-ups' })
}

describe('rest timer (plan §6, §12)', () => {
  it('starts after a tick, keeps time from its start, and can be skipped', async () => {
    const card = await pushups()
    await userEvent.click(within(card).getByRole('button', { name: 'Set 1 of Push-ups done' }))
    const bar = await screen.findByRole('region', { name: 'Rest' })
    expect(within(bar).getByRole('timer')).toHaveTextContent('Rest 01:30')
    expect(await getSetting('restTimer', null)).toEqual({ startedAt: NOW.getTime(), seconds: 90 })

    await userEvent.click(within(bar).getByRole('button', { name: '+15 s' }))
    await waitFor(async () => expect((await getSetting('restTimer', null))?.seconds).toBe(105))

    vi.setSystemTime(NOW.getTime() + 200_000)
    expect(await within(bar).findByText('Rest’s over. Next set!')).toBeInTheDocument()
    await userEvent.click(within(bar).getByRole('button', { name: 'Dismiss' }))
    await waitFor(() =>
      expect(screen.queryByRole('region', { name: 'Rest' })).not.toBeInTheDocument(),
    )
  })

  it('uses the rest length set in the plan editor', async () => {
    await setSetting('restSeconds', 60)
    const card = await pushups()
    await userEvent.click(within(card).getByRole('button', { name: 'Set 1 of Push-ups done' }))
    const bar = await screen.findByRole('region', { name: 'Rest' })
    expect(within(bar).getByRole('timer')).toHaveTextContent('Rest 01:00')
    await userEvent.click(within(bar).getByRole('button', { name: 'Skip' }))
    await waitFor(async () => expect(await getSetting('restTimer', null)).toBeNull())
  })
})

describe('personal records (plan §7)', () => {
  it('celebrates a set that beats every earlier session, and lists it on Progress', async () => {
    const card = await pushups()
    // Pre-filled with last session's 12: equal, not a record.
    await userEvent.click(within(card).getByRole('button', { name: 'Set 1 of Push-ups done' }))
    expect(await screen.findByText('Set 1 of Push-ups done', { selector: 'p' })).toBeInTheDocument()

    await userEvent.click(within(card).getByRole('button', { name: /^Change set 2 of Push-ups/ }))
    const sheet = await screen.findByRole('dialog', { name: 'Push-ups: Set 2' })
    await userEvent.click(within(sheet).getByRole('button', { name: 'Increase Reps' }))
    await userEvent.click(within(sheet).getByRole('button', { name: 'Save and tick' }))
    expect(
      await screen.findByText('Set 2 of Push-ups done. New personal record! +25 STR'),
    ).toBeInTheDocument()

    await userEvent.click(screen.getByRole('link', { name: 'Progress' }))
    const records = await screen.findByRole('region', { name: 'Personal records' })
    expect(await within(records).findByText('1 record so far')).toBeInTheDocument()
    expect(within(records).getByText('13 reps, Mon 26 Oct')).toBeInTheDocument()
  })
})
