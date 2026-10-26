import { describe, expect, it } from 'vitest'
import { atLocalTime } from './date'
import { dayRule } from './workout'
import {
  currentSession,
  lastSessionSets,
  missedSessions,
  meetsWorkoutQuest,
  plannedSetCount,
  plannedSetsDone,
  prefill,
  progressionFor,
  valuesFor,
  type LoggedSet,
} from './session'

const set = (date: string, setNumber: number, values: Partial<LoggedSet> = {}): LoggedSet => ({
  date,
  startedAt: atLocalTime(date, 18, 0),
  exerciseId: 1,
  setNumber,
  done: true,
  reps: 8,
  weightKg: 40,
  ...values,
})

describe('currentSession (plan §5)', () => {
  const start = atLocalTime('2026-10-25', 23, 50)

  it('keeps sets after midnight in the session that started the day before', () => {
    const recent = [{ date: '2026-10-25', startedAt: start, loggedAt: start + 5 * 60_000 }]
    expect(currentSession(atLocalTime('2026-10-26', 0, 20), recent)).toEqual({
      date: '2026-10-25',
      startedAt: start,
    })
  })

  it('starts a new session after a 3-hour gap, or with nothing logged', () => {
    const recent = [{ date: '2026-10-25', startedAt: start, loggedAt: start }]
    const later = start + 3 * 3_600_000
    expect(currentSession(later, recent)).toEqual({ date: '2026-10-26', startedAt: later })
    expect(currentSession(start, [])).toEqual({ date: '2026-10-25', startedAt: start })
  })

  it('ignores a set logged in the future (a changed clock)', () => {
    const recent = [
      { date: '2026-10-26', startedAt: start + 3_600_000, loggedAt: start + 3_600_000 },
    ]
    expect(currentSession(start, recent).date).toBe('2026-10-25')
  })
})

describe('pre-fill from the last session', () => {
  const sets = [
    set('2026-10-19', 1, { weightKg: 37.5 }),
    set('2026-10-22', 2, { reps: 7 }),
    set('2026-10-22', 1, { reps: 9 }),
    set('2026-10-23', 1, { done: false, reps: 1 }),
    set('2026-10-26', 1, { reps: 12 }), // today: not "last session"
    set('2026-10-22', 1, { exerciseId: 2 }),
  ]

  it('finds the latest earlier session with sets done', () => {
    expect(lastSessionSets(sets, 1, '2026-10-26').map((s) => [s.date, s.setNumber])).toEqual([
      ['2026-10-22', 1],
      ['2026-10-22', 2],
    ])
    expect(lastSessionSets(sets, 3, '2026-10-26')).toEqual([])
  })

  it('copies the same set, or the last set when there were fewer', () => {
    const previous = lastSessionSets(sets, 1, '2026-10-26')
    const target = { exerciseId: 1, sets: 3, repMin: 8, repMax: 12, targetKg: 20 }
    expect(prefill(target, 'weight-reps', 1, previous)).toEqual({ reps: 9, weightKg: 40 })
    expect(prefill(target, 'weight-reps', 3, previous)).toEqual({ reps: 7, weightKg: 40 })
  })

  it('uses a target raised since last time', () => {
    const previous = lastSessionSets(sets, 1, '2026-10-26')
    const raised = { exerciseId: 1, sets: 3, repMin: 8, repMax: 12, targetKg: 42.5 }
    expect(prefill(raised, 'weight-reps', 1, previous)).toEqual({ reps: 9, weightKg: 42.5 })
    const hold = [set('2026-10-22', 1, { seconds: 30 })]
    expect(prefill({ exerciseId: 1, sets: 1, seconds: 35 }, 'seconds', 1, hold)).toEqual({
      seconds: 35,
    })
  })

  it('falls back to the plan target: the bottom of the rep range', () => {
    expect(
      prefill(
        { exerciseId: 1, sets: 3, repMin: 8, repMax: 12, targetKg: 20 },
        'weight-reps',
        1,
        [],
      ),
    ).toEqual({ reps: 8, weightKg: 20 })
    expect(prefill({ exerciseId: 1, sets: 3, seconds: 30 }, 'seconds', 1, [])).toEqual({
      seconds: 30,
    })
    expect(prefill({ exerciseId: 1, sets: 3 }, 'reps', 1, [])).toEqual({ reps: 0 })
  })

  it('keeps only the values for the exercise type', () => {
    expect(valuesFor('reps', { reps: 10, weightKg: 5, seconds: 3 })).toEqual({ reps: 10 })
    expect(valuesFor('seconds', {})).toEqual({ seconds: 0 })
    expect(valuesFor('weight-reps', {})).toEqual({ reps: 0, weightKg: 0 })
  })
})

describe('workout quest (plan §7)', () => {
  const planned = [
    { exerciseId: 1, sets: 3 },
    { exerciseId: 2, sets: 2 },
  ]

  it('counts planned sets, and done sets only up to each plan', () => {
    expect(plannedSetCount(planned)).toBe(5)
    const sets = [
      ...[1, 2, 3, 4].map((n) => ({ exerciseId: 1, setNumber: n, done: true })), // set 4 is extra
      { exerciseId: 2, setNumber: 1, done: true },
      { exerciseId: 2, setNumber: 2, done: false },
      { exerciseId: 9, setNumber: 1, done: true },
    ]
    expect(plannedSetsDone(planned, sets)).toBe(4)
  })

  it('needs at least 80% of the planned sets', () => {
    expect(meetsWorkoutQuest(5, 4)).toBe(true)
    expect(meetsWorkoutQuest(5, 3)).toBe(false)
    expect(meetsWorkoutQuest(9, 8)).toBe(true) // ⌈7.2⌉ = 8
    expect(meetsWorkoutQuest(9, 7)).toBe(false)
    expect(meetsWorkoutQuest(0, 0)).toBe(false)
  })
})

describe('progression suggestions (plan §6)', () => {
  const done = (setNumber: number, values: Partial<LoggedSet>) =>
    set('2026-10-22', setNumber, values)

  it('adds 2.5 kg once every planned set reached the top of the rep range', () => {
    const target = { exerciseId: 1, sets: 3, repMin: 8, repMax: 12, targetKg: 40 }
    const all12 = [1, 2, 3].map((n) => done(n, { reps: 12, weightKg: 40 }))
    expect(progressionFor(target, 'weight-reps', all12)).toEqual({ ...target, targetKg: 42.5 })
    const oneShort = [...all12.slice(0, 2), done(3, { reps: 11, weightKg: 40 })]
    expect(progressionFor(target, 'weight-reps', oneShort)).toBeUndefined()
    // Lighter than the target doesn't count.
    const lighter = [1, 2, 3].map((n) => done(n, { reps: 12, weightKg: 35 }))
    expect(progressionFor(target, 'weight-reps', lighter)).toBeUndefined()
    // Missing a set: no suggestion.
    expect(progressionFor(target, 'weight-reps', all12.slice(0, 2))).toBeUndefined()
  })

  it('raises the rep range by 2 for bodyweight moves', () => {
    const target = { exerciseId: 1, sets: 2, repMin: 8, repMax: 12 }
    const sets = [1, 2].map((n) => done(n, { reps: 12 }))
    expect(progressionFor(target, 'reps', sets)).toEqual({ ...target, repMin: 10, repMax: 14 })
    expect(progressionFor({ exerciseId: 1, sets: 1 }, 'reps', sets)).toBeUndefined()
  })

  it('adds 5 seconds to a hold', () => {
    const target = { exerciseId: 1, sets: 2, seconds: 30 }
    const sets = [1, 2].map((n) => done(n, { seconds: 30 }))
    expect(progressionFor(target, 'seconds', sets)).toEqual({ ...target, seconds: 35 })
    expect(progressionFor({ ...target, seconds: 0 }, 'seconds', sets)).toBeUndefined()
    expect(progressionFor(target, 'seconds', [sets[0]!, done(2, { seconds: 25 })])).toBeUndefined()
  })
})

describe('missed sessions (plan §6)', () => {
  const plan = {
    days: [1, 3].map((weekday) => ({ weekday, exercises: [{ exerciseId: 1, sets: 3 }] })),
  }
  const ruleFor = (date: string) => ({ date, ...dayRule(plan, date) })
  const today = '2026-10-29' // Thursday

  it('finds training days this week with nothing done, most recent first', () => {
    expect(missedSessions(today, [], new Set(), ruleFor)).toEqual([
      { date: '2026-10-28', planWeekday: 3 },
      { date: '2026-10-26', planWeekday: 1 },
    ])
  })

  it('leaves out days that were trained, or made up later', () => {
    expect(missedSessions(today, [], new Set(['2026-10-26']), ruleFor)).toEqual([
      { date: '2026-10-28', planWeekday: 3 },
    ])
    const madeUp = [{ date: '2026-10-27', isPlannedRest: false, plannedSets: 3, planWeekday: 1 }]
    expect(missedSessions(today, madeUp, new Set(['2026-10-27']), ruleFor)).toEqual([
      { date: '2026-10-28', planWeekday: 3 },
    ])
  })

  it('uses the saved day rules and looks only at this week', () => {
    const rows = [{ date: '2026-10-28', isPlannedRest: true }]
    expect(missedSessions(today, rows, new Set(), ruleFor)).toEqual([
      { date: '2026-10-26', planWeekday: 1 },
    ])
    expect(missedSessions('2026-10-26', [], new Set(), ruleFor)).toEqual([])
  })
})
