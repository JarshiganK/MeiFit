/**
 * Personal records (plan §6, §7): a set that beats every earlier day's best
 * for that exercise. Weight × reps compares the estimated 1-rep max, reps-only
 * moves compare reps, and holds compare seconds. Each exercise earns at most
 * one record a day, and its first day never counts (there's nothing to beat).
 * Worked out from the logs, like all XP.
 */
import type { LocalDate } from './date'
import { e1rm } from './fitness'
import type { ExerciseType } from './workout'

export const PR_XP = 25

export interface RecordSet {
  date: LocalDate
  exerciseId: number
  done: boolean
  reps?: number | undefined
  weightKg?: number | undefined
  seconds?: number | undefined
}

/** The number a record is judged on for an exercise type. */
export function setScore(type: ExerciseType, set: RecordSet): number {
  if (type === 'seconds') return set.seconds ?? 0
  if (type === 'reps') return set.reps ?? 0
  return e1rm(set.weightKg ?? 0, set.reps ?? 0)
}

export interface PersonalRecord {
  date: LocalDate
  exerciseId: number
  value: number
  previous: number
}

/** Every record, oldest first. */
export function personalRecords(
  sets: readonly RecordSet[],
  typeOf: (exerciseId: number) => ExerciseType | undefined,
): PersonalRecord[] {
  // Best score per exercise per day.
  const days = new Map<number, Map<LocalDate, number>>()
  for (const set of sets) {
    if (!set.done) continue
    const type = typeOf(set.exerciseId)
    if (!type) continue
    const score = setScore(type, set)
    if (score <= 0) continue
    const byDay = days.get(set.exerciseId) ?? new Map<LocalDate, number>()
    byDay.set(set.date, Math.max(byDay.get(set.date) ?? 0, score))
    days.set(set.exerciseId, byDay)
  }
  const records: PersonalRecord[] = []
  for (const [exerciseId, byDay] of days) {
    let best: number | undefined
    for (const [date, score] of [...byDay].sort(([a], [b]) => a.localeCompare(b))) {
      if (best !== undefined && score > best)
        records.push({ date, exerciseId, value: score, previous: best })
      best = best === undefined ? score : Math.max(best, score)
    }
  }
  return records.sort((a, b) => a.date.localeCompare(b.date) || a.exerciseId - b.exerciseId)
}

/** The best ever score for each exercise. */
export function bestScores(
  sets: readonly RecordSet[],
  typeOf: (exerciseId: number) => ExerciseType | undefined,
): Map<number, { value: number; date: LocalDate }> {
  const best = new Map<number, { value: number; date: LocalDate }>()
  for (const set of sets) {
    const type = typeOf(set.exerciseId)
    if (!set.done || !type) continue
    const value = setScore(type, set)
    const current = best.get(set.exerciseId)
    if (value > 0 && (!current || value > current.value))
      best.set(set.exerciseId, { value, date: set.date })
  }
  return best
}

// ---------------------------------------------------------------- rest timer

export const REST_SECONDS = { min: 30, max: 300, step: 15, default: 90 } as const

export interface RestTimer {
  startedAt: number
  seconds: number
}

/** Seconds of rest left, worked out from the start time (plan §12). */
export function restLeft(timer: RestTimer, now: number): number {
  return Math.max(0, Math.ceil((timer.startedAt + timer.seconds * 1000 - now) / 1000))
}
