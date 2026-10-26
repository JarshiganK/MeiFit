import { describe, expect, it } from 'vitest'
import { atLocalTime } from '../domain/date'
import { db } from './db'
import {
  choosePlanDay,
  restoreSet,
  sessionDate,
  setsFor,
  setsOn,
  tickSet,
  untickSet,
} from './sessions'
import type { WorkoutPlan } from './types'

const late = atLocalTime('2026-10-25', 23, 50)

describe('ticking sets', () => {
  it('saves a set with its values, and keeps a session past midnight on its first day', async () => {
    await tickSet({ exerciseId: 1, setNumber: 1, values: { reps: 8, weightKg: 40 }, now: late })
    const afterMidnight = atLocalTime('2026-10-26', 0, 15)
    expect(await sessionDate(afterMidnight)).toBe('2026-10-25')
    await tickSet({
      exerciseId: 1,
      setNumber: 2,
      values: { reps: 7, weightKg: 40 },
      now: afterMidnight,
    })

    const sets = await setsOn('2026-10-25')
    expect(sets.map((s) => [s.setNumber, s.reps, s.startedAt])).toEqual([
      [1, 8, late],
      [2, 7, late],
    ])
    expect(sets[1]).toMatchObject({ done: true, loggedAt: afterMidnight })
    expect(await sessionDate(atLocalTime('2026-10-26', 9, 0))).toBe('2026-10-26')
  })

  it('replaces a set ticked again, with an undo copy', async () => {
    const first = await tickSet({ exerciseId: 1, setNumber: 1, values: { reps: 8 }, now: late })
    const again = await tickSet({
      exerciseId: 1,
      setNumber: 1,
      values: { reps: 10 },
      now: late + 60_000,
    })
    expect(again.id).toBe(first.id)
    expect(again.before?.reps).toBe(8)
    expect(await db.workoutSets.count()).toBe(1)

    await restoreSet(again.id, again.before)
    expect((await db.workoutSets.get(first.id))?.reps).toBe(8)
    await restoreSet(first.id, undefined)
    expect(await db.workoutSets.count()).toBe(0)
  })

  it('unticks a set and puts it back', async () => {
    const { id } = await tickSet({
      exerciseId: 2,
      setNumber: 1,
      values: { seconds: 30 },
      now: late,
    })
    const removed = await untickSet(id)
    expect(await setsOn('2026-10-25')).toEqual([])
    await restoreSet(id, removed)
    expect(await setsOn('2026-10-25')).toHaveLength(1)
  })

  it('finds every set of some exercises', async () => {
    await tickSet({ exerciseId: 1, setNumber: 1, values: { reps: 8 }, now: late })
    await tickSet({ exerciseId: 2, setNumber: 1, values: { reps: 8 }, now: late })
    expect((await setsFor([2])).map((s) => s.exerciseId)).toEqual([2])
    expect(await setsFor([])).toEqual([])
  })
})

describe('training another plan day', () => {
  const plan: WorkoutPlan = {
    id: 1,
    name: 'My plan',
    kind: 'normal',
    days: [
      {
        weekday: 1,
        exercises: [
          { exerciseId: 1, sets: 4 },
          { exerciseId: 2, sets: 3 },
        ],
      },
    ],
  }

  it('makes a rest day a training day with that day’s sets, and can go back', async () => {
    await db.days.put({ date: '2026-10-27', isFlexDay: true, isPlannedRest: true }) // Tuesday
    await choosePlanDay('2026-10-27', plan, 1)
    expect(await db.days.get('2026-10-27')).toEqual({
      date: '2026-10-27',
      isFlexDay: true,
      isPlannedRest: false,
      plannedSets: 7,
      planWeekday: 1,
    })
    await choosePlanDay('2026-10-27', plan, undefined)
    expect(await db.days.get('2026-10-27')).toEqual({
      date: '2026-10-27',
      isFlexDay: true,
      isPlannedRest: true,
    })
  })
})
