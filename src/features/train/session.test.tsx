import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '../../db/db'
import { setsOn } from '../../db/sessions'
import { atLocalTime } from '../../domain/date'
import { seedProfile } from '../../test/fixtures'
import { renderApp } from '../../test/renderApp'

vi.mock('eruda', () => ({ default: { init: vi.fn(), destroy: vi.fn() } }))

const MONDAY = '2026-10-26'

beforeEach(async () => {
  vi.useFakeTimers({ toFake: ['Date'], now: new Date(2026, 9, 26, 18, 0) })
  await seedProfile()
  await db.exercises.bulkAdd([
    { id: 1, name: 'Squat', muscleGroup: 'Legs', type: 'weight-reps' },
    { id: 2, name: 'Plank', muscleGroup: 'Core', type: 'seconds' },
  ])
  await db.workoutPlans.add({
    name: 'My plan',
    kind: 'normal',
    days: [
      {
        weekday: 1,
        exercises: [
          { exerciseId: 1, sets: 3, repMin: 8, repMax: 12, targetKg: 40 },
          { exerciseId: 2, sets: 2, seconds: 30 },
        ],
      },
      { weekday: 4, exercises: [{ exerciseId: 2, sets: 3, seconds: 45 }] },
    ],
  })
})

afterEach(() => {
  vi.useRealTimers()
})

async function openSession(name = 'Today, Monday') {
  renderApp('/train')
  return screen.findByRole('region', { name })
}

describe('session logging', () => {
  it('ticks a set in one tap with the plan target when there’s no earlier session', async () => {
    const card = await openSession()
    const squat = within(card).getByRole('region', { name: 'Squat' })
    expect(within(squat).getAllByText('8 reps × 40 kg')).toHaveLength(3)
    await userEvent.click(within(squat).getByRole('button', { name: 'Set 1 of Squat done' }))

    expect(await screen.findByText('Set 1 of Squat done', { selector: 'p' })).toBeInTheDocument()
    expect(await setsOn(MONDAY)).toMatchObject([
      { exerciseId: 1, setNumber: 1, reps: 8, weightKg: 40, done: true },
    ])
    await waitFor(() =>
      expect(within(squat).getByRole('button', { name: 'Set 1 of Squat done' })).toHaveAttribute(
        'aria-pressed',
        'true',
      ),
    )
    expect(within(card).getByText('1 of 5 sets done')).toBeInTheDocument()
  })

  it('pre-fills from the last session of the same exercise', async () => {
    const last = '2026-10-22'
    await db.workoutSets.bulkAdd([
      {
        date: last,
        startedAt: atLocalTime(last, 18, 0),
        exerciseId: 1,
        setNumber: 1,
        reps: 10,
        weightKg: 42.5,
        done: true,
      },
      {
        date: last,
        startedAt: atLocalTime(last, 18, 0),
        exerciseId: 1,
        setNumber: 2,
        reps: 9,
        weightKg: 42.5,
        done: true,
      },
    ])
    const card = await openSession()
    const squat = within(card).getByRole('region', { name: 'Squat' })
    expect(within(squat).getByText('10 reps × 42.5 kg')).toBeInTheDocument()
    // Set 3 copies the last set of that session.
    expect(within(squat).getAllByText('9 reps × 42.5 kg')).toHaveLength(2)
  })

  it('edits a set’s values, then unticks it with Undo', async () => {
    const card = await openSession()
    const plank = within(card).getByRole('region', { name: 'Plank' })
    await userEvent.click(
      within(plank).getAllByRole('button', { name: /^Change set 1 of Plank/ })[0]!,
    )
    const sheet = await screen.findByRole('dialog', { name: 'Plank: Set 1' })
    await userEvent.click(within(sheet).getByRole('button', { name: 'Increase Seconds' }))
    await userEvent.click(within(sheet).getByRole('button', { name: 'Save and tick' }))
    await waitFor(async () =>
      expect(await setsOn(MONDAY)).toMatchObject([{ exerciseId: 2, seconds: 35, done: true }]),
    )

    await userEvent.click(
      await within(plank).findByRole('button', { name: 'Set 1 of Plank done', pressed: true }),
    )
    await waitFor(async () => expect(await setsOn(MONDAY)).toEqual([]))
    // Wait for the untick's own toast, so Undo isn't the earlier tick's button.
    const toast = (await screen.findByText('Set 1 of Plank unticked')).closest('[role="status"]')
    await userEvent.click(within(toast as HTMLElement).getByRole('button', { name: 'Undo' }))
    await waitFor(async () => expect(await setsOn(MONDAY)).toHaveLength(1))
  })

  it('adds an extra set beyond the plan', async () => {
    const card = await openSession()
    const plank = within(card).getByRole('region', { name: 'Plank' })
    await userEvent.click(within(plank).getByRole('button', { name: 'Add a set' }))
    await userEvent.click(within(plank).getByRole('button', { name: 'Set 3 of Plank done' }))
    await waitFor(async () => expect(await setsOn(MONDAY)).toMatchObject([{ setNumber: 3 }]))
    // Extra sets don't count toward the planned ones.
    expect(within(card).getByText('0 of 5 sets done')).toBeInTheDocument()
  })

  it('trains another plan day on a rest day', async () => {
    vi.setSystemTime(new Date(2026, 9, 27, 18, 0)) // Tuesday: rest
    const card = await openSession('Today, Tuesday')
    expect(within(card).getByText('Planned rest. Recovery counts too.')).toBeInTheDocument()
    await userEvent.click(within(card).getByRole('button', { name: 'Train anyway' }))
    const sheet = await screen.findByRole('dialog', { name: 'Which workout?' })
    await userEvent.click(within(sheet).getByRole('button', { name: /^Thursday/ }))

    const other = await screen.findByRole('region', { name: 'Today: Thursday’s workout' })
    expect(within(other).getByText('0 of 3 sets done')).toBeInTheDocument()
    expect(await db.days.get('2026-10-27')).toMatchObject({
      isPlannedRest: false,
      plannedSets: 3,
      planWeekday: 4,
    })

    await userEvent.click(within(other).getByRole('button', { name: 'Back to today’s plan' }))
    expect(await screen.findByText('Planned rest. Recovery counts too.')).toBeInTheDocument()
  })

  it('keeps a session that runs past midnight on the day it started', async () => {
    vi.setSystemTime(new Date(2026, 9, 26, 23, 50))
    let card = await openSession()
    await userEvent.click(
      within(within(card).getByRole('region', { name: 'Squat' })).getByRole('button', {
        name: 'Set 1 of Squat done',
      }),
    )
    await waitFor(async () => expect(await setsOn(MONDAY)).toHaveLength(1))

    vi.setSystemTime(new Date(2026, 9, 27, 0, 10))
    card = screen.getByRole('region', { name: 'Today, Monday' })
    await userEvent.click(
      within(within(card).getByRole('region', { name: 'Squat' })).getByRole('button', {
        name: 'Set 2 of Squat done',
      }),
    )
    await waitFor(async () => expect(await setsOn(MONDAY)).toHaveLength(2))
    expect(await setsOn('2026-10-27')).toEqual([])
  })
})

describe('progression suggestions (plan §6)', () => {
  it('suggests +2.5 kg after a session at the top of the range, and updates the plan', async () => {
    const last = '2026-10-19'
    await db.workoutSets.bulkAdd(
      [1, 2, 3].map((setNumber) => ({
        date: last,
        startedAt: atLocalTime(last, 18, 0),
        exerciseId: 1,
        setNumber,
        reps: 12,
        weightKg: 40,
        done: true,
      })),
    )
    const card = await openSession()
    const squat = within(card).getByRole('region', { name: 'Squat' })
    expect(within(squat).getByText('Ready to step up: 3 × 8–12 @ 42.5 kg')).toBeInTheDocument()
    await userEvent.click(within(squat).getByRole('button', { name: 'Update plan' }))
    expect(await screen.findByText('Squat target raised')).toBeInTheDocument()
    await waitFor(async () =>
      expect((await db.workoutPlans.toArray())[0]?.days[0]?.exercises[0]?.targetKg).toBe(42.5),
    )
    // The sets now start from the new weight.
    expect(await within(squat).findAllByText('12 reps × 42.5 kg')).toHaveLength(3)
  })
})
