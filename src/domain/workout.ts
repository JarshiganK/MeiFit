/**
 * Workout plans (plan §6, §9). A plan day belongs to a weekday; weekdays
 * without one are planned rest (approved default). A day's planned-rest flag
 * is saved with the date when the day is first opened, so editing the plan
 * later never changes past days.
 */
import { addDays, datesInRange, weekday, type LocalDate, type Weekday } from './date'

export type ExerciseType = 'weight-reps' | 'reps' | 'seconds'
export type PlanKind = 'normal' | 'exam'

export interface PlannedExercise {
  exerciseId: number
  sets: number
  repMin?: number
  repMax?: number
  seconds?: number
  targetKg?: number
}

export interface PlanDay {
  weekday: number
  exercises: PlannedExercise[]
}

export interface PlanShape {
  days: PlanDay[]
}

export const WEEKDAYS: readonly Weekday[] = [1, 2, 3, 4, 5, 6, 7]

export const PLAN_LIMITS = {
  sets: { min: 1, max: 10 },
  reps: { min: 1, max: 100 },
  seconds: { min: 5, max: 600, step: 5 },
  kg: { min: 0, max: 500, step: 0.5 },
} as const

/** Sensible starting targets for a newly added exercise. */
export function defaultTarget(exerciseId: number, type: ExerciseType): PlannedExercise {
  if (type === 'seconds') return { exerciseId, sets: 3, seconds: 30 }
  if (type === 'reps') return { exerciseId, sets: 3, repMin: 8, repMax: 12 }
  return { exerciseId, sets: 3, repMin: 8, repMax: 12, targetKg: 20 }
}

export type TargetError = 'sets' | 'reps' | 'repOrder' | 'seconds' | 'kg'

/** Checks one exercise's targets for its type; returns the problems found. */
export function validateTarget(target: PlannedExercise, type: ExerciseType): TargetError[] {
  const errors: TargetError[] = []
  const within = (n: number | undefined, { min, max }: { min: number; max: number }) =>
    n !== undefined && Number.isFinite(n) && n >= min && n <= max
  if (!Number.isInteger(target.sets) || !within(target.sets, PLAN_LIMITS.sets)) errors.push('sets')
  if (type === 'seconds') {
    if (!within(target.seconds, PLAN_LIMITS.seconds)) errors.push('seconds')
    return errors
  }
  const repsOk =
    Number.isInteger(target.repMin) &&
    Number.isInteger(target.repMax) &&
    within(target.repMin, PLAN_LIMITS.reps) &&
    within(target.repMax, PLAN_LIMITS.reps)
  if (!repsOk) errors.push('reps')
  else if ((target.repMin ?? 0) > (target.repMax ?? 0)) errors.push('repOrder')
  if (type === 'weight-reps' && !within(target.targetKg, PLAN_LIMITS.kg)) errors.push('kg')
  return errors
}

/** The plan day for a date, or undefined on a planned rest day. */
export function planDayFor(plan: PlanShape | undefined, date: LocalDate): PlanDay | undefined {
  if (!plan) return undefined
  const day = weekday(date)
  return plan.days.find((d) => d.weekday === day)
}

/** True when the plan has no workout that weekday. With no plan, nothing is planned rest. */
export function isPlannedRest(plan: PlanShape | undefined, date: LocalDate): boolean {
  if (!plan || plan.days.length === 0) return false
  return planDayFor(plan, date) === undefined
}

/** Training days a week in the plan. */
export function workoutsInPlan(plan: PlanShape | undefined): number {
  return plan?.days.length ?? 0
}

/**
 * Day rows to write when the app opens (approved default): every date after
 * the last saved one, up to today, gets its planned-rest flag from the plan
 * as it is now. With nothing saved yet, only today is written. Existing rows
 * are never touched.
 */
export function restDaysToWrite(
  lastSaved: LocalDate | undefined,
  today: LocalDate,
  planFor: (date: LocalDate) => PlanShape | undefined,
  savedDates: ReadonlySet<LocalDate>,
): ({ date: LocalDate; isFlexDay: boolean } & DayRule)[] {
  const from = lastSaved && lastSaved < today ? addDays(lastSaved, 1) : today
  return datesInRange(from, today)
    .filter((date) => !savedDates.has(date))
    .map((date) => ({ date, isFlexDay: false, ...dayRule(planFor(date), date) }))
}

/**
 * The plan that applies on a date: the exam plan during exam mode, if it has
 * any training days (plan §7), otherwise the normal plan.
 */
export function activePlan<P extends PlanShape>(
  examDay: boolean,
  normal: P | undefined,
  exam: P | undefined,
): P | undefined {
  return examDay && exam && exam.days.length > 0 ? exam : normal
}

export interface DayRule {
  isPlannedRest: boolean
  /** Planned sets on a training day (absent on rest days and without a plan). */
  plannedSets?: number
}

/** What the plan says about a date: rest, or how many sets are planned. */
export function dayRule(plan: PlanShape | undefined, date: LocalDate): DayRule {
  const day = planDayFor(plan, date)
  if (!day) return { isPlannedRest: isPlannedRest(plan, date) }
  return { isPlannedRest: false, plannedSets: day.exercises.reduce((sum, e) => sum + e.sets, 0) }
}

/** Sorts plan days Monday to Sunday. */
export function sortDays(days: readonly PlanDay[]): PlanDay[] {
  return [...days].sort((a, b) => a.weekday - b.weekday)
}
