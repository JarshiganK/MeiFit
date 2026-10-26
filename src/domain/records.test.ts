import { describe, expect, it } from 'vitest'
import { bestScores, personalRecords, restLeft, setScore } from './records'
import type { ExerciseType } from './workout'

const types: Record<number, ExerciseType> = { 1: 'weight-reps', 2: 'reps', 3: 'seconds' }
const typeOf = (id: number) => types[id]
const set = (
  date: string,
  exerciseId: number,
  values: { reps?: number; weightKg?: number; seconds?: number },
  done = true,
) => ({
  date,
  exerciseId,
  done,
  ...values,
})

describe('personal records (plan §7)', () => {
  it('judges lifts by estimated 1RM, bodyweight moves by reps and holds by seconds', () => {
    expect(
      setScore('weight-reps', { date: '', exerciseId: 1, done: true, reps: 5, weightKg: 60 }),
    ).toBe(70)
    expect(setScore('reps', { date: '', exerciseId: 2, done: true, reps: 15 })).toBe(15)
    expect(setScore('seconds', { date: '', exerciseId: 3, done: true, seconds: 45 })).toBe(45)
  })

  it('finds a record when a day beats every earlier day; the first day never counts', () => {
    const sets = [
      set('2026-10-01', 1, { reps: 5, weightKg: 60 }), // 70: first day
      set('2026-10-05', 1, { reps: 5, weightKg: 60 }), // 70: equal, not a record
      set('2026-10-08', 1, { reps: 6, weightKg: 60 }), // 72: record
      set('2026-10-08', 1, { reps: 7, weightKg: 60 }), // 74: same day, one record
      set('2026-10-12', 1, { reps: 8, weightKg: 62.5 }, false), // not done
      set('2026-10-01', 2, { reps: 10 }),
      set('2026-10-03', 2, { reps: 12 }), // record
      set('2026-10-01', 3, { seconds: 60 }),
      set('2026-10-04', 3, { seconds: 50 }),
      set('2026-10-06', 3, { seconds: 61 }), // record over the earlier best of 60
      set('2026-10-06', 9, { reps: 99 }), // unknown exercise
    ]
    expect(personalRecords(sets, typeOf)).toEqual([
      { date: '2026-10-03', exerciseId: 2, value: 12, previous: 10 },
      { date: '2026-10-06', exerciseId: 3, value: 61, previous: 60 },
      { date: '2026-10-08', exerciseId: 1, value: 74, previous: 70 },
    ])
  })

  it('ignores empty sets', () => {
    expect(
      personalRecords([set('2026-10-01', 2, {}), set('2026-10-02', 2, { reps: 5 })], typeOf),
    ).toEqual([])
  })

  it('keeps the best ever score per exercise', () => {
    const best = bestScores(
      [
        set('2026-10-01', 2, { reps: 10 }),
        set('2026-10-03', 2, { reps: 12 }),
        set('2026-10-04', 2, { reps: 30 }, false),
        set('2026-10-04', 9, { reps: 30 }),
      ],
      typeOf,
    )
    expect([...best]).toEqual([[2, { value: 12, date: '2026-10-03' }]])
  })
})

describe('rest timer (plan §12)', () => {
  it('counts down from the saved start time', () => {
    const timer = { startedAt: 1_000_000, seconds: 90 }
    expect(restLeft(timer, 1_000_000)).toBe(90)
    expect(restLeft(timer, 1_000_000 + 30_500)).toBe(60)
    expect(restLeft(timer, 1_000_000 + 200_000)).toBe(0)
  })
})
