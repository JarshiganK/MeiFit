import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { en } from '../../copy/en'
import { db } from '../../db/db'
import { getPlan } from '../../db/workout'
import { seedProfile } from '../../test/fixtures'
import { renderApp } from '../../test/renderApp'

vi.mock('eruda', () => ({ default: { init: vi.fn(), destroy: vi.fn() } }))

const MONDAY = new Date(2026, 9, 26, 18, 0)

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'], now: MONDAY })
})

afterEach(() => {
  vi.useRealTimers()
})

async function openEditor() {
  renderApp('/train/plan')
  await screen.findByRole('heading', { level: 1, name: 'Workout plan' })
  return screen.findByRole('region', { name: 'Training days' })
}

describe('plan builder', () => {
  it('starts from an empty Train screen with a link to build a plan', async () => {
    await seedProfile()
    renderApp('/train')
    expect(await screen.findByText(en.train.emptyTitle)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Build my plan' })).toHaveAttribute(
      'href',
      '/train/plan',
    )
  })

  it('picks training days and adds starter exercises with sensible targets', async () => {
    await seedProfile() // goal: 4 workouts a week
    const days = await openEditor()
    expect(within(days).getByText(en.plan.daysHint(0, 4))).toBeInTheDocument()

    await userEvent.click(within(days).getByRole('button', { name: 'Mon' }))
    await userEvent.click(within(days).getByRole('button', { name: 'Thu' }))
    await waitFor(() =>
      expect(within(days).getByRole('button', { name: 'Mon' })).toHaveAttribute(
        'aria-pressed',
        'true',
      ),
    )
    const monday = await screen.findByRole('region', { name: 'Monday' })
    await userEvent.click(within(monday).getByRole('button', { name: 'Add exercise' }))
    const sheet = await screen.findByRole('dialog', { name: 'Add to Monday' })
    await userEvent.type(within(sheet).getByLabelText('Search exercises'), 'bench')
    await userEvent.click(within(sheet).getByRole('button', { name: /^Bench press/ }))

    expect(await screen.findByText('Added Bench press to Monday')).toBeInTheDocument()
    expect(await within(monday).findByText('3 × 8–12 @ 20 kg')).toBeInTheDocument()
    const plan = await getPlan()
    expect(plan?.days.map((d) => d.weekday)).toEqual([1, 4])
    expect(plan?.days[0]?.exercises).toEqual([
      { exerciseId: expect.any(Number), sets: 3, repMin: 8, repMax: 12, targetKg: 20 },
    ])
  })

  it('edits targets and checks them', async () => {
    await seedProfile()
    const days = await openEditor()
    await userEvent.click(within(days).getByRole('button', { name: 'Mon' }))
    const monday = await screen.findByRole('region', { name: 'Monday' })
    await userEvent.click(within(monday).getByRole('button', { name: 'Add exercise' }))
    await userEvent.click(
      within(await screen.findByRole('dialog', { name: 'Add to Monday' })).getByRole('button', {
        name: /^Plank/,
      }),
    )
    await userEvent.click(await within(monday).findByRole('button', { name: /^Change ?Plank/ }))
    const sheet = await screen.findByRole('dialog', { name: 'Plank' })
    await userEvent.click(within(sheet).getByRole('button', { name: 'Increase Sets' }))
    const seconds = within(sheet).getByLabelText('Seconds per set')
    await userEvent.clear(seconds)
    await userEvent.type(seconds, '45{Enter}')
    expect(seconds).toHaveValue('45')
    await userEvent.click(within(sheet).getByRole('button', { name: 'Save' }))
    await waitFor(async () =>
      expect((await getPlan())?.days[0]?.exercises[0]).toEqual({
        exerciseId: expect.any(Number),
        sets: 4,
        seconds: 45,
      }),
    )
  })

  it('stops the fewest reps going above the most reps', async () => {
    await seedProfile()
    const days = await openEditor()
    await userEvent.click(within(days).getByRole('button', { name: 'Mon' }))
    const monday = await screen.findByRole('region', { name: 'Monday' })
    await userEvent.click(within(monday).getByRole('button', { name: 'Add exercise' }))
    await userEvent.click(
      within(await screen.findByRole('dialog', { name: 'Add to Monday' })).getByRole('button', {
        name: /^Push-ups/,
      }),
    )
    await userEvent.click(await within(monday).findByRole('button', { name: /^Change ?Push-ups/ }))
    const sheet = await screen.findByRole('dialog', { name: 'Push-ups' })
    const min = within(sheet).getByLabelText('Fewest reps')
    await userEvent.clear(min)
    await userEvent.type(min, '20')
    await userEvent.tab()
    await userEvent.click(within(sheet).getByRole('button', { name: 'Save' }))
    expect(within(sheet).getByRole('alert')).toHaveTextContent(en.plan.errors.repOrder)
  })

  it('creates a new exercise and removes exercises and days with Undo', async () => {
    await seedProfile()
    const days = await openEditor()
    await userEvent.click(within(days).getByRole('button', { name: 'Wed' }))
    const wednesday = await screen.findByRole('region', { name: 'Wednesday' })
    await userEvent.click(within(wednesday).getByRole('button', { name: 'Add exercise' }))
    let sheet = await screen.findByRole('dialog', { name: 'Add to Wednesday' })
    await userEvent.type(within(sheet).getByLabelText('Search exercises'), 'Skipping')
    expect(within(sheet).getByText(en.plan.noMatch)).toBeInTheDocument()
    await userEvent.click(within(sheet).getByRole('button', { name: 'New exercise' }))
    expect(within(sheet).getByLabelText('Name')).toHaveValue('Skipping')
    await userEvent.click(within(sheet).getByRole('radio', { name: 'Seconds' }))
    await userEvent.click(within(sheet).getByRole('button', { name: 'Create and add' }))
    expect(await within(wednesday).findByText('3 × 30 s')).toBeInTheDocument()
    expect(await db.exercises.where('name').equals('Skipping').first()).toMatchObject({
      type: 'seconds',
    })

    await userEvent.click(within(wednesday).getByRole('button', { name: /^Change ?Skipping/ }))
    sheet = await screen.findByRole('dialog', { name: 'Skipping' })
    await userEvent.click(within(sheet).getByRole('button', { name: 'Remove from this day' }))
    await waitFor(async () => expect((await getPlan())?.days[0]?.exercises).toEqual([]))
    await userEvent.click(await screen.findByRole('button', { name: 'Undo' }))
    await waitFor(async () => expect((await getPlan())?.days[0]?.exercises).toHaveLength(1))

    await userEvent.click(within(days).getByRole('button', { name: 'Wed' }))
    expect(await screen.findByText('Wednesday is now a rest day')).toBeInTheDocument()
    await waitFor(async () => expect((await getPlan())?.days).toEqual([]))
  })
})

describe('Train screen', () => {
  it('shows the week and today’s exercises, or a rest day', async () => {
    await seedProfile()
    await db.exercises.add({ id: 1, name: 'Squat', muscleGroup: 'Legs', type: 'weight-reps' })
    await db.workoutPlans.add({
      name: 'My plan',
      kind: 'normal',
      days: [
        { weekday: 1, exercises: [{ exerciseId: 1, sets: 5, repMin: 5, repMax: 5, targetKg: 60 }] },
      ],
    })
    renderApp('/train')
    const today = await screen.findByRole('region', { name: 'Today, Monday' })
    expect(within(today).getByText('Squat')).toBeInTheDocument()
    expect(within(today).getByText('5 × 5 @ 60 kg')).toBeInTheDocument()
    expect(screen.getByRole('listitem', { name: 'Monday: training' })).toHaveAttribute(
      'aria-current',
      'date',
    )
    expect(screen.getByRole('listitem', { name: 'Tuesday: rest' })).toBeInTheDocument()

    vi.setSystemTime(new Date(2026, 9, 27, 18, 0))
  })

  it('records today as planned rest when the app opens on a rest day', async () => {
    vi.setSystemTime(new Date(2026, 9, 27, 18, 0)) // Tuesday
    await seedProfile()
    await db.workoutPlans.add({
      name: 'My plan',
      kind: 'normal',
      days: [{ weekday: 1, exercises: [] }],
    })
    renderApp('/train')
    expect(await screen.findByText(en.train.restToday)).toBeInTheDocument()
    await waitFor(async () =>
      expect(await db.days.get('2026-10-27')).toMatchObject({ isPlannedRest: true }),
    )
  })
})
