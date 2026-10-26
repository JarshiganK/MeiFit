/**
 * Exercises and workout plans (plan §6, §9). The plan is edited in place, one
 * change at a time, so nothing is lost if iOS closes the app mid-edit.
 */
import { toLocalDate, type LocalDate } from '../domain/date'
import {
  dayRule,
  restDaysToWrite,
  sortDays,
  type PlanKind,
  type PlannedExercise,
} from '../domain/workout'
import { db } from './db'
import { STARTER_EXERCISES } from './seed/exercises'
import type { Exercise, WorkoutPlan } from './types'

export async function allExercises(): Promise<Exercise[]> {
  const exercises = await db.exercises.toArray()
  return exercises.sort((a, b) => a.name.localeCompare(b.name))
}

/** Adds an exercise, or returns the existing one with the same name (ignoring case). */
export async function addExercise(exercise: Omit<Exercise, 'id'>): Promise<number> {
  const name = exercise.name.trim()
  const existing = (await db.exercises.toArray()).find(
    (e) => e.name.toLowerCase() === name.toLowerCase(),
  )
  if (existing?.id !== undefined) return existing.id
  const id = await db.exercises.add({ ...exercise, name, muscleGroup: exercise.muscleGroup.trim() })
  if (id === undefined) throw new Error('The exercise was not saved')
  return id
}

export async function getPlan(kind: PlanKind = 'normal'): Promise<WorkoutPlan | undefined> {
  return db.workoutPlans.where('kind').equals(kind).first()
}

/** The plan of this kind, created empty (with the starter exercises) the first time. */
export async function ensurePlan(kind: PlanKind = 'normal'): Promise<WorkoutPlan> {
  return db.transaction('rw', db.workoutPlans, db.exercises, async () => {
    const existing = await db.workoutPlans.where('kind').equals(kind).first()
    if (existing) return existing
    if ((await db.exercises.count()) === 0) {
      await db.exercises.bulkAdd(STARTER_EXERCISES.map((e) => ({ ...e })))
    }
    const plan: WorkoutPlan = { name: kind === 'exam' ? 'Exam plan' : 'My plan', kind, days: [] }
    const id = await db.workoutPlans.add(plan)
    if (id === undefined) throw new Error('The plan was not saved')
    return { ...plan, id }
  })
}

/**
 * Applies one change to a plan. Today isn't over, so an edit to the normal
 * plan also updates today's planned-rest flag; past days keep theirs.
 */
async function changePlan(planId: number, change: (plan: WorkoutPlan) => WorkoutPlan) {
  await db.transaction('rw', db.workoutPlans, db.days, async () => {
    const plan = await db.workoutPlans.get(planId)
    if (!plan) throw new Error('No such plan')
    const changed = change(plan)
    const next = { ...changed, days: sortDays(changed.days) }
    await db.workoutPlans.put(next)
    if (next.kind === 'normal') {
      const today = toLocalDate(Date.now())
      const row = await db.days.get(today)
      // A day already switched to another plan day keeps that choice.
      if (row && row.planWeekday === undefined) {
        const { isFlexDay, date } = row
        await db.days.put({ date, isFlexDay, ...dayRule(next, today) })
      }
    }
  })
}

/** Makes a weekday a training day (empty) or a rest day. */
export async function setTrainingDay(planId: number, weekday: number, on: boolean): Promise<void> {
  await changePlan(planId, (plan) => {
    const has = plan.days.some((d) => d.weekday === weekday)
    if (on === has) return plan
    return {
      ...plan,
      days: on
        ? [...plan.days, { weekday, exercises: [] }]
        : plan.days.filter((d) => d.weekday !== weekday),
    }
  })
}

/** Puts a whole plan back as it was (Undo). */
export async function restorePlan(plan: WorkoutPlan): Promise<void> {
  await db.workoutPlans.put(plan)
}

export async function addToDay(
  planId: number,
  weekday: number,
  target: PlannedExercise,
): Promise<void> {
  await changePlan(planId, (plan) => ({
    ...plan,
    days: plan.days.map((d) =>
      d.weekday === weekday ? { ...d, exercises: [...d.exercises, target] } : d,
    ),
  }))
}

export async function updateTarget(
  planId: number,
  weekday: number,
  index: number,
  target: PlannedExercise,
): Promise<void> {
  await changePlan(planId, (plan) => ({
    ...plan,
    days: plan.days.map((d) =>
      d.weekday === weekday
        ? { ...d, exercises: d.exercises.map((e, i) => (i === index ? target : e)) }
        : d,
    ),
  }))
}

export async function removeFromDay(planId: number, weekday: number, index: number): Promise<void> {
  await changePlan(planId, (plan) => ({
    ...plan,
    days: plan.days.map((d) =>
      d.weekday === weekday ? { ...d, exercises: d.exercises.filter((_, i) => i !== index) } : d,
    ),
  }))
}

/** Moves an exercise one place up (-1) or down (+1) within its day. */
export async function moveInDay(
  planId: number,
  weekday: number,
  index: number,
  by: -1 | 1,
): Promise<void> {
  await changePlan(planId, (plan) => ({
    ...plan,
    days: plan.days.map((d) => {
      const to = index + by
      if (d.weekday !== weekday || to < 0 || to >= d.exercises.length) return d
      const exercises = [...d.exercises]
      const [moved] = exercises.splice(index, 1)
      exercises.splice(to, 0, moved!)
      return { ...d, exercises }
    }),
  }))
}

/**
 * Writes the planned-rest flag for every day not saved yet, up to today, from
 * the current plan (approved default). Run when the app opens.
 */
export async function recordPlannedRest(today: LocalDate): Promise<void> {
  await db.transaction('rw', db.days, db.workoutPlans, async () => {
    const plan = await db.workoutPlans.where('kind').equals('normal').first()
    const last = await db.days.orderBy('date').last()
    const recent = await db.days
      .where('date')
      .aboveOrEqual(last?.date ?? today)
      .toArray()
    const rows = restDaysToWrite(last?.date, today, plan, new Set(recent.map((d) => d.date)))
    if (rows.length > 0) await db.days.bulkAdd(rows)
  })
}
