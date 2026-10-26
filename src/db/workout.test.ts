import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defaultTarget } from '../domain/workout'
import { db } from './db'
import { setFlexDay } from './days'
import { STARTER_EXERCISES } from './seed/exercises'
import {
  addExercise,
  addToDay,
  allExercises,
  ensurePlan,
  getPlan,
  moveInDay,
  recordPlannedRest,
  removeFromDay,
  restorePlan,
  setTrainingDay,
  updateTarget,
} from './workout'

beforeEach(() => {
  // Tuesday 27 Oct 2026; only the clock is faked so Dexie keeps real timers.
  vi.useFakeTimers({ toFake: ['Date'], now: new Date(2026, 9, 27, 9, 0) })
})

afterEach(() => {
  vi.useRealTimers()
})

describe('exercises', () => {
  it('adds an exercise once, ignoring case and spaces', async () => {
    const id = await addExercise({ name: ' Push-ups ', muscleGroup: ' Chest ', type: 'reps' })
    expect(await addExercise({ name: 'push-ups', muscleGroup: 'Chest', type: 'reps' })).toBe(id)
    expect(await allExercises()).toEqual([
      { id, name: 'Push-ups', muscleGroup: 'Chest', type: 'reps' },
    ])
  })
})

describe('plan builder', () => {
  it('creates the plan once, with the starter exercises', async () => {
    const plan = await ensurePlan()
    expect(plan).toMatchObject({ name: 'My plan', kind: 'normal', days: [] })
    expect(await ensurePlan()).toEqual(plan)
    expect(await db.exercises.count()).toBe(STARTER_EXERCISES.length)
    expect(await getPlan('exam')).toBeUndefined()
  })

  it('doesn’t reload the starter exercises when there are some already', async () => {
    await addExercise({ name: 'Rowing', muscleGroup: 'Back', type: 'reps' })
    await ensurePlan()
    expect(await db.exercises.count()).toBe(1)
  })

  it('adds days in weekday order, edits, reorders and removes exercises', async () => {
    const { id } = await ensurePlan()
    await setTrainingDay(id!, 5, true)
    await setTrainingDay(id!, 1, true)
    await setTrainingDay(id!, 1, true) // already on
    await addToDay(id!, 1, defaultTarget(1, 'reps'))
    await addToDay(id!, 1, defaultTarget(2, 'seconds'))
    await updateTarget(id!, 1, 0, { exerciseId: 1, sets: 4, repMin: 6, repMax: 10 })
    await moveInDay(id!, 1, 1, -1)
    await moveInDay(id!, 1, 0, -1) // already first: no change

    let plan = await getPlan()
    expect(plan?.days.map((d) => d.weekday)).toEqual([1, 5])
    expect(plan?.days[0]?.exercises).toEqual([
      { exerciseId: 2, sets: 3, seconds: 30 },
      { exerciseId: 1, sets: 4, repMin: 6, repMax: 10 },
    ])

    const before = plan!
    await removeFromDay(id!, 1, 0)
    await setTrainingDay(id!, 5, false)
    plan = await getPlan()
    expect(plan?.days).toEqual([
      { weekday: 1, exercises: [{ exerciseId: 1, sets: 4, repMin: 6, repMax: 10 }] },
    ])

    await restorePlan(before)
    expect((await getPlan())?.days).toHaveLength(2)
  })

  it('updates today’s planned-rest flag when the plan changes, but not past days', async () => {
    const { id } = await ensurePlan()
    await db.days.bulkAdd([
      { date: '2026-10-20', isFlexDay: false, isPlannedRest: true }, // last Tuesday
      { date: '2026-10-27', isFlexDay: true, isPlannedRest: true }, // today, a Tuesday
    ])
    await setTrainingDay(id!, 2, true)
    expect(await db.days.get('2026-10-27')).toEqual({
      date: '2026-10-27',
      isFlexDay: true,
      isPlannedRest: false,
      plannedSets: 0,
    })
    expect((await db.days.get('2026-10-20'))?.isPlannedRest).toBe(true)
  })

  it('rejects a change to a plan that doesn’t exist', async () => {
    await expect(setTrainingDay(99, 1, true)).rejects.toThrow()
  })
})

describe('recordPlannedRest (approved default)', () => {
  it('fills in the days since the app was last opened from the current plan', async () => {
    const { id } = await ensurePlan()
    await setTrainingDay(id!, 1, true) // Mondays only
    await db.days.add({ date: '2026-10-24', isFlexDay: true, isPlannedRest: true })
    await recordPlannedRest('2026-10-27')
    expect(await db.days.orderBy('date').toArray()).toEqual([
      { date: '2026-10-24', isFlexDay: true, isPlannedRest: true },
      { date: '2026-10-25', isFlexDay: false, isPlannedRest: true },
      { date: '2026-10-26', isFlexDay: false, isPlannedRest: false, plannedSets: 0 },
      { date: '2026-10-27', isFlexDay: false, isPlannedRest: true },
    ])
    await recordPlannedRest('2026-10-27')
    expect(await db.days.count()).toBe(4)
  })

  it('takes a new flex day’s planned rest from the plan', async () => {
    const { id } = await ensurePlan()
    await setTrainingDay(id!, 1, true)
    await setFlexDay('2026-10-27', true)
    expect(await db.days.get('2026-10-27')).toMatchObject({ isPlannedRest: true })
  })
})
