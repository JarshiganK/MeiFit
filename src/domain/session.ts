/**
 * Workout sessions (plan §5, §6, §7). Sets are pre-filled from the last
 * session of the same exercise, so most sets are logged with one tap. A
 * workout counts on the day it starts, even if it runs past midnight.
 */
import { addDays, datesInRange, toLocalDate, weekday as weekdayOf, type LocalDate } from './date'
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
  if (match) {
    // A target raised since last time (a progression step) wins over last time's weight or hold.
    return valuesFor(type, {
      reps: match.reps ?? 0,
      weightKg: Math.max(match.weightKg ?? 0, target.targetKg ?? 0),
      seconds: Math.max(match.seconds ?? 0, target.seconds ?? 0),
    })
  }
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

/** Steps up when the last session hit the top of the target on every planned set. */
export const PROGRESSION = { kg: 2.5, reps: 2, seconds: 5 } as const

/**
 * A suggested next target (plan §6: progression suggestions), or undefined.
 * Weight × reps: every planned set reached the top of the rep range, so add
 * 2.5 kg. Reps only: raise the range by 2. Holds: add 5 seconds.
 */
export function progressionFor(
  target: PlannedExercise,
  type: ExerciseType,
  previous: readonly LoggedSet[],
): PlannedExercise | undefined {
  const planned = previous.filter((s) => s.setNumber <= target.sets)
  if (planned.length < target.sets) return undefined
  if (type === 'seconds') {
    const seconds = target.seconds ?? 0
    if (seconds <= 0 || !planned.every((s) => (s.seconds ?? 0) >= seconds)) return undefined
    return { ...target, seconds: seconds + PROGRESSION.seconds }
  }
  const top = target.repMax ?? target.repMin
  if (top === undefined || !planned.every((s) => (s.reps ?? 0) >= top)) return undefined
  if (type === 'reps') {
    return {
      ...target,
      repMin: (target.repMin ?? top) + PROGRESSION.reps,
      repMax: top + PROGRESSION.reps,
    }
  }
  const kg = target.targetKg ?? 0
  if (!planned.every((s) => (s.weightKg ?? 0) >= kg)) return undefined
  return { ...target, targetKg: kg + PROGRESSION.kg }
}

export interface DayRow {
  date: LocalDate
  isPlannedRest: boolean
  plannedSets?: number
  planWeekday?: number
}

/**
 * Training days earlier this week (Monday to yesterday) with no set done and
 * not made up on a later day, most recent first (plan §6: missed-session
 * reschedule). The plan weekday is the one to run again.
 */
export function missedSessions(
  today: LocalDate,
  rows: readonly DayRow[],
  setDates: ReadonlySet<LocalDate>,
  ruleFor: (date: LocalDate) => DayRow,
): { date: LocalDate; planWeekday: number }[] {
  const monday = addDays(today, 1 - weekdayOf(today))
  if (monday >= today) return []
  const days = datesInRange(monday, addDays(today, -1)).map(
    (date) => rows.find((r) => r.date === date) ?? ruleFor(date),
  )
  const madeUp = new Set(
    rows.filter((r) => r.date >= monday && r.planWeekday !== undefined).map((r) => r.planWeekday),
  )
  return days
    .filter((d) => !d.isPlannedRest && (d.plannedSets ?? 0) > 0 && !setDates.has(d.date))
    .map((d) => ({ date: d.date, planWeekday: d.planWeekday ?? weekdayOf(d.date) }))
    .filter((m) => !madeUp.has(m.planWeekday))
    .reverse()
}
