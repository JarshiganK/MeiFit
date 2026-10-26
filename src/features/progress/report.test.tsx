import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '../../db/db'
import { currentTarget } from '../../db/profile'
import { atLocalTime } from '../../domain/date'
import { sampleTables } from '../../test/fixtures'
import { renderApp } from '../../test/renderApp'

vi.mock('eruda', () => ({ default: { init: vi.fn(), destroy: vi.fn() } }))
vi.mock('./WeightChart', () => ({ default: () => null }))

const MONDAY = new Date(2026, 9, 26, 9, 0) // Monday 26 Oct

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'], now: MONDAY })
})

afterEach(() => {
  vi.useRealTimers()
})

/** Set up on 28 Sep (a Monday), losing fat, 2 workouts and 2 study hours a week. */
async function seed(weeks: [string, number][]) {
  const tables = sampleTables()
  await db.profile.put({
    ...tables.profile[0]!,
    setupDate: '2026-09-28',
    workoutsPerWeek: 2,
    studyGoalHours: 2,
  })
  await db.targetHistory.add({ ...tables.targetHistory[0]!, startsOn: '2026-09-28' })
  await db.exercises.add({ id: 1, name: 'Squat', muscleGroup: 'Legs', type: 'weight-reps' })
  await db.workoutPlans.add({
    name: 'My plan',
    kind: 'normal',
    days: [1, 3].map((weekday) => ({ weekday, exercises: [{ exerciseId: 1, sets: 1 }] })),
  })
  // Three weigh-ins in each listed week (Mon, Wed, Fri).
  let id = 1
  for (const [monday, kg] of weeks) {
    for (const offset of [0, 2, 4]) {
      const d = new Date(`${monday}T12:00:00`)
      d.setDate(d.getDate() + offset)
      const date = d.toLocaleDateString('en-CA')
      await db.bodyLogs.add({ id: id++, date, at: atLocalTime(date, 7, 0), weightKg: kg })
    }
  }
}

async function beatLastWeek() {
  for (const date of ['2026-10-19', '2026-10-21']) {
    await db.workoutSets.add({
      date,
      startedAt: atLocalTime(date, 18, 0),
      exerciseId: 1,
      setNumber: 1,
      reps: 5,
      weightKg: 40,
      done: true,
    })
  }
  await db.studySessions.add({
    date: '2026-10-20',
    startedAt: atLocalTime('2026-10-20', 9, 0),
    minutes: 120,
    completed: true,
    source: 'manual',
  })
}

async function report() {
  renderApp('/progress')
  await screen.findByRole('button', { name: 'Previous week' })
  return screen.getByRole('region', { name: 'Weekly report' })
}

describe('weekly report (plan §6)', () => {
  it('reports the finished week and the boss win with its title', async () => {
    await seed([
      ['2026-10-05', 70.2],
      ['2026-10-12', 70],
      ['2026-10-19', 69.6],
    ])
    await beatLastWeek()
    const card = await report()
    expect(within(card).getByText('Mon 19 Oct – Sun 25 Oct')).toBeInTheDocument()
    expect(within(card).getByText('Weight: 69.6 kg average (3 weigh-ins)')).toBeInTheDocument()
    expect(within(card).getByText('−0.4 kg from the week before')).toBeInTheDocument()
    expect(within(card).getByText('Workouts: 2 of 2 planned')).toBeInTheDocument()
    const boss = within(card).getByRole('region', { name: 'Weekly boss' })
    expect(
      within(boss).getByText(/Boss beaten! \+100 XP and the title “Steady Climber”/),
    ).toBeInTheDocument()
    expect(within(card).getByText('Titles earned: Steady Climber')).toBeInTheDocument()

    await userEvent.click(within(card).getByRole('button', { name: 'Previous week' }))
    expect(within(card).getByText('Mon 12 Oct – Sun 18 Oct')).toBeInTheDocument()
    expect(within(card).getByText(/Not this week/)).toBeInTheDocument()
  })

  it('suggests a calorie cut when the average stalls, and applies it once', async () => {
    await seed([
      ['2026-10-05', 70],
      ['2026-10-12', 70.1],
      ['2026-10-19', 70.1],
    ])
    const card = await report()
    const check = within(card).getByRole('region', { name: 'Calorie check' })
    await userEvent.click(within(check).getByRole('button', { name: 'Apply from today' }))
    expect(await screen.findByText('Calorie target is now ≈1,850')).toBeInTheDocument()
    await waitFor(async () =>
      expect(await currentTarget('2026-10-26')).toMatchObject({ kcal: 1846, reason: 'manual' }),
    )
    await waitFor(() =>
      expect(within(card).queryByRole('region', { name: 'Calorie check' })).not.toBeInTheDocument(),
    )
  })

  it('waits for the first finished week', async () => {
    await seed([])
    vi.setSystemTime(new Date(2026, 8, 30, 9, 0)) // still in the first week
    renderApp('/progress')
    expect(await screen.findByText(/Your first report arrives on Monday/)).toBeInTheDocument()
  })
})

describe('the boss on Status (plan §7)', () => {
  it('shows last week’s result on Monday and this week’s progress', async () => {
    await seed([
      ['2026-10-05', 70.2],
      ['2026-10-12', 70],
      ['2026-10-19', 69.6],
    ])
    await beatLastWeek()
    renderApp('/')
    const banner = await screen.findByRole('region', { name: 'Last week’s boss' })
    expect(within(banner).getByText(/Boss beaten!/)).toBeInTheDocument()
    expect(within(banner).getByRole('link', { name: 'See the weekly report' })).toHaveAttribute(
      'href',
      '/progress',
    )
    const thisWeek = screen.getByRole('region', { name: 'This week’s boss' })
    expect(within(thisWeek).getByText('Needs 3 weigh-ins (0 so far)')).toBeInTheDocument()
    expect(within(thisWeek).getByText(/Workouts: 0 of 2/)).toBeInTheDocument()
  })
})
