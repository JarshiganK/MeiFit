/**
 * Logged workout sets (plan §6). Ticking a set saves it with its values; a
 * set belongs to the session in progress, so a workout running past midnight
 * stays on the day it started (plan §5).
 */
import { addDays, toLocalDate, type LocalDate } from '../domain/date'
import { currentSession, type SetValues } from '../domain/session'
import { dayRule } from '../domain/workout'
import { db } from './db'
import type { WorkoutPlan, WorkoutSet } from './types'

/** Sets from yesterday and today, enough to find a session in progress. */
async function recentSets(now: number): Promise<WorkoutSet[]> {
  return db.workoutSets
    .where('date')
    .aboveOrEqual(addDays(toLocalDate(now), -1))
    .toArray()
}

/** The date of the session in progress, or today if none is. */
export async function sessionDate(now: number): Promise<LocalDate> {
  return currentSession(now, (await recentSets(now)).map(asRecent)).date
}

function asRecent(set: WorkoutSet) {
  return { date: set.date, startedAt: set.startedAt, loggedAt: set.loggedAt ?? set.startedAt }
}

export async function setsOn(date: LocalDate): Promise<WorkoutSet[]> {
  return db.workoutSets.where('date').equals(date).toArray()
}

/** Every set of these exercises, for pre-filling from the last session. */
export async function setsFor(exerciseIds: readonly number[]): Promise<WorkoutSet[]> {
  if (exerciseIds.length === 0) return []
  return db.workoutSets
    .where('exerciseId')
    .anyOf([...exerciseIds])
    .toArray()
}

/**
 * Saves a set as done with its values (replacing that set number in the
 * session if it was saved before). Returns the row as it was, for Undo.
 */
export async function tickSet(input: {
  exerciseId: number
  setNumber: number
  values: SetValues
  now: number
}): Promise<{ id: number; before: WorkoutSet | undefined }> {
  return db.transaction('rw', db.workoutSets, async () => {
    const session = currentSession(input.now, (await recentSets(input.now)).map(asRecent))
    const existing = (await db.workoutSets.where('date').equals(session.date).toArray()).find(
      (s) => s.exerciseId === input.exerciseId && s.setNumber === input.setNumber,
    )
    const row: WorkoutSet = {
      date: session.date,
      startedAt: existing?.startedAt ?? session.startedAt,
      exerciseId: input.exerciseId,
      setNumber: input.setNumber,
      ...input.values,
      done: true,
      loggedAt: input.now,
    }
    if (existing?.id !== undefined) {
      await db.workoutSets.put({ ...row, id: existing.id })
      return { id: existing.id, before: existing }
    }
    const id = await db.workoutSets.add(row)
    if (id === undefined) throw new Error('The set was not saved')
    return { id, before: undefined }
  })
}

/** Removes a ticked set; returns it for Undo. */
export async function untickSet(id: number): Promise<WorkoutSet | undefined> {
  const set = await db.workoutSets.get(id)
  await db.workoutSets.delete(id)
  return set
}

/** Undo for tick and untick: puts the set back as it was, or removes it. */
export async function restoreSet(id: number, before: WorkoutSet | undefined): Promise<void> {
  if (before) await db.workoutSets.put(before)
  else await db.workoutSets.delete(id)
}

/**
 * Trains another plan day on `date` (approved default): the day becomes a
 * training day with that day's planned sets. `undefined` goes back to the plan.
 */
export async function choosePlanDay(
  date: LocalDate,
  plan: WorkoutPlan,
  weekday: number | undefined,
): Promise<void> {
  await db.transaction('rw', db.days, async () => {
    const day = await db.days.get(date)
    const isFlexDay = day?.isFlexDay ?? false
    const chosen = plan.days.find((d) => d.weekday === weekday)
    if (weekday === undefined || !chosen) {
      await db.days.put({ date, isFlexDay, ...dayRule(plan, date) })
      return
    }
    await db.days.put({
      date,
      isFlexDay,
      isPlannedRest: false,
      plannedSets: chosen.exercises.reduce((sum, e) => sum + e.sets, 0),
      planWeekday: weekday,
    })
  })
}
