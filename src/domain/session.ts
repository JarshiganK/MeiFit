/**
 * Workout sessions (plan §5, §6, §7). Sets are pre-filled from the last
 * session of the same exercise, so most sets are logged with one tap. A
 * workout counts on the day it starts, even if it runs past midnight.
 */
import { toLocalDate, type LocalDate } from './date'
import type { ExerciseType, PlannedExercise } from './workout'

/** Sets logged within this long of the previous one belong to the same session. */
export const SESSION_GAP_MS = 3 * 3_600_000

/** The workout quest needs at least this share of the planned sets (plan §7). */
export const WORKOUT_QUEST_SHARE = 0.8

export interface SetValues {
  reps?: number
  weightKg?: number
  seconds?: number
}

export interface LoggedSet extends SetValues {
  date: LocalDate
  startedAt: number
  exerciseId: number
  setNumber: number
  done: boolean
}

/**
 * The session a new set belongs to: the one in progress if its last set was
 * logged less than 3 hours ago, otherwise a new one starting now.
 */
export function currentSession(
  now: number,
  recent: readonly { date: LocalDate; startedAt: number; loggedAt: number }[],
): { date: LocalDate; startedAt: number } {
  const last = recent.reduce<(typeof recent)[number] | undefined>(
    (latest, s) => (latest === undefined || s.loggedAt > latest.loggedAt ? s : latest),
    undefined,
  )
  if (last && now - last.loggedAt < SESSION_GAP_MS && now >= last.loggedAt) {
    return { date: last.date, startedAt: last.startedAt }
  }
  return { date: toLocalDate(now), startedAt: now }
}

/** The sets of the most recent earlier session with this exercise, by set number. */
export function lastSessionSets(
  sets: readonly LoggedSet[],
  exerciseId: number,
  before: LocalDate,
): LoggedSet[] {
  const earlier = sets.filter((s) => s.exerciseId === exerciseId && s.done && s.date < before)
  const lastDate = earlier.reduce<LocalDate | undefined>(
    (latest, s) => (latest === undefined || s.date > latest ? s.date : latest),
    undefined,
  )
  return earlier.filter((s) => s.date === lastDate).sort((a, b) => a.setNumber - b.setNumber)
}

/** Only the values that apply to an exercise type. */
export function valuesFor(type: ExerciseType, values: SetValues): SetValues {
  if (type === 'seconds') return { seconds: values.seconds ?? 0 }
  if (type === 'reps') return { reps: values.reps ?? 0 }
  return { reps: values.reps ?? 0, weightKg: values.weightKg ?? 0 }
}

/**
 * Pre-fill for set `setNumber`: the same set last session, or that session's
 * last set if it had fewer, or else the plan's target (the bottom of the rep
 * range, approved default).
 */
export function prefill(
  target: PlannedExercise,
  type: ExerciseType,
  setNumber: number,
  previous: readonly LoggedSet[],
): SetValues {
  const match = previous.find((s) => s.setNumber === setNumber) ?? previous.at(-1)
  if (match) return valuesFor(type, match)
  return valuesFor(type, {
    reps: target.repMin ?? target.repMax ?? 0,
    weightKg: target.targetKg ?? 0,
    seconds: target.seconds ?? 0,
  })
}

/** Total planned sets for a plan day. */
export function plannedSetCount(exercises: readonly PlannedExercise[]): number {
  return exercises.reduce((sum, e) => sum + e.sets, 0)
}

/** Done sets that were planned: extra sets beyond a plan's count don't add to it. */
export function plannedSetsDone(
  exercises: readonly PlannedExercise[],
  sets: readonly { exerciseId: number; setNumber: number; done: boolean }[],
): number {
  return exercises.reduce((sum, planned) => {
    const done = sets.filter(
      (s) => s.done && s.exerciseId === planned.exerciseId && s.setNumber <= planned.sets,
    ).length
    return sum + Math.min(done, planned.sets)
  }, 0)
}

/** The workout quest's main rule (plan §7): at least 80% of the planned sets. */
export function meetsWorkoutQuest(planned: number, done: number): boolean {
  return planned > 0 && done >= Math.ceil(planned * WORKOUT_QUEST_SHARE)
}
