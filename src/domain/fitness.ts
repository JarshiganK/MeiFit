/**
 * Fitness checks (plan §4): every 3–6 weeks (default 4), due on a Saturday
 * with a window of 3 days either side. Missing the window has no penalty: the
 * check moves to the next weekend. Strength is an estimated 1-rep max from
 * the last 4 weeks of sets: weight × (1 + reps ÷ 30).
 */
import { addDays, daysBetween, weekStart, type LocalDate } from './date'
import type { WeekAverage } from './body'

export const DEFAULT_INTERVAL_WEEKS = 4
export const INTERVAL_WEEKS = { min: 3, max: 6 } as const
export const WINDOW_DAYS = 3
export const STRENGTH_LOOKBACK_DAYS = 28
export const MAX_MAIN_LIFTS = 3

export const CHECK_REWARD = { vit: 50, strPerImprovement: 10, strMax: 30 } as const

/** Estimated 1-rep max, to the nearest 0.5 kg. */
export function e1rm(weightKg: number, reps: number): number {
  if (weightKg <= 0 || reps <= 0) return 0
  return Math.round(weightKg * (1 + reps / 30) * 2) / 2
}

export interface StrengthSet {
  date: LocalDate
  exerciseId: number
  reps?: number | undefined
  weightKg?: number | undefined
  done: boolean
}

/** The best estimated 1RM for an exercise in the 4 weeks up to `today`. */
export function bestE1rm(
  sets: readonly StrengthSet[],
  exerciseId: number,
  today: LocalDate,
): number | undefined {
  const from = addDays(today, -(STRENGTH_LOOKBACK_DAYS - 1))
  let best: number | undefined
  for (const s of sets) {
    if (!s.done || s.exerciseId !== exerciseId || s.date < from || s.date > today) continue
    const value = e1rm(s.weightKg ?? 0, s.reps ?? 0)
    if (value > 0 && (best === undefined || value > best)) best = value
  }
  return best
}

/** The Saturday of the Monday–Sunday week containing `date`. */
export function saturdayOf(date: LocalDate): LocalDate {
  return addDays(weekStart(date), 5)
}

/** When the next check is due: the booked baseline, then every interval after the last check. */
export function nextDue(
  baselineDue: LocalDate | undefined,
  lastCheck: LocalDate | undefined,
  intervalWeeks: number,
  setupDate: LocalDate,
): LocalDate {
  if (!lastCheck) return baselineDue ?? saturdayOf(addDays(setupDate, 7))
  return saturdayOf(addDays(lastCheck, intervalWeeks * 7))
}

export interface CheckWindow {
  /** The due day, moved on a week at a time once a window has passed. */
  due: LocalDate
  opens: LocalDate
  closes: LocalDate
  open: boolean
  /** True once the original due day's window was missed. */
  moved: boolean
}

export function checkWindow(due: LocalDate, today: LocalDate): CheckWindow {
  let current = due
  while (addDays(current, WINDOW_DAYS) < today) current = addDays(current, 7)
  const opens = addDays(current, -WINDOW_DAYS)
  const closes = addDays(current, WINDOW_DAYS)
  return {
    due: current,
    opens,
    closes,
    open: today >= opens && today <= closes,
    moved: current !== due,
  }
}

export interface CheckResults {
  waistCm?: number | undefined
  pushups?: number | undefined
  plankSec?: number | undefined
  squats60s?: number | undefined
  restingHr?: number | undefined
}

export type Trend = 'up' | 'down' | 'same' | 'new'

export function trend(
  current: number | undefined,
  previous: number | undefined,
): Trend | undefined {
  if (current === undefined) return undefined
  if (previous === undefined) return 'new'
  if (current > previous) return 'up'
  if (current < previous) return 'down'
  return 'same'
}

export const ENDURANCE_TESTS = ['pushups', 'plankSec', 'squats60s'] as const

/** Endurance tests that improved on the previous check. */
export function improvedTests(
  current: CheckResults,
  previous: CheckResults | undefined,
): (typeof ENDURANCE_TESTS)[number][] {
  if (!previous) return []
  return ENDURANCE_TESTS.filter((test) => trend(current[test], previous[test]) === 'up')
}

/** Rewards (plan §4): 50 VIT, plus 10 STR for each improved endurance test, up to 30. */
export function checkRewards(
  current: CheckResults,
  previous: CheckResults | undefined,
): { vit: number; str: number; xp: number } {
  const str = Math.min(
    CHECK_REWARD.strMax,
    improvedTests(current, previous).length * CHECK_REWARD.strPerImprovement,
  )
  return { vit: CHECK_REWARD.vit, str, xp: CHECK_REWARD.vit + str }
}

/**
 * Each check nudges the protein quest threshold toward the target (plan §3):
 * halfway, rounded to 5 g, by at least 5 g and never past the target.
 */
export function nudgeThreshold(threshold: number | null, targetG: number): number | null {
  if (threshold === null || threshold >= targetG) return threshold
  const halfway = Math.round((threshold + (targetG - threshold) / 2) / 5) * 5
  return Math.min(targetG, Math.max(threshold + 5, halfway))
}

export type CalorieSuggestion =
  { kind: 'none' } | { kind: 'cut'; kcal: number } | { kind: 'add'; kcal: number }

/** The middle of the plan's 150–200 kcal adjustments. */
export const ADJUST_KCAL = 175
export const EARLY_WEEKS_IGNORED = 2

/**
 * The adjustment rules of plan §2, for fat loss: if the weekly average hasn't
 * dropped over 2 weeks, cut; if losing more than 1% a week (after the first
 * 2 weeks, which are mostly water), add some back. Weeks are oldest first.
 */
export function suggestCalories(
  weeks: readonly WeekAverage[],
  goal: 'lose' | 'maintain' | 'gain',
  setupDate: LocalDate,
): CalorieSuggestion {
  if (goal !== 'lose' || weeks.length < 2) return { kind: 'none' }
  const last = weeks.at(-1)!
  const previous = weeks.at(-2)!
  const pastEarlyWeeks = daysBetween(setupDate, last.weekStart) >= EARLY_WEEKS_IGNORED * 7
  const weeklyLoss = (previous.averageKg - last.averageKg) / previous.averageKg
  if (pastEarlyWeeks && weeklyLoss > 0.01) return { kind: 'add', kcal: ADJUST_KCAL }
  const twoWeeksAgo = weeks.at(-3)
  if (twoWeeksAgo && last.averageKg >= twoWeeksAgo.averageKg)
    return { kind: 'cut', kcal: ADJUST_KCAL }
  return { kind: 'none' }
}

/** Whether the goal weight or goal waist has been reached (plan §4: offer to switch to maintain). */
export function goalReached(
  goal: 'lose' | 'maintain' | 'gain',
  goals: { goalWeightKg?: number | undefined; goalWaistCm?: number | undefined },
  current: { weightKg?: number | undefined; waistCm?: number | undefined },
): boolean {
  if (goal === 'maintain') return false
  const reached = (value: number | undefined, target: number | undefined) =>
    value !== undefined &&
    target !== undefined &&
    (goal === 'lose' ? value <= target : value >= target)
  return (
    reached(current.weightKg, goals.goalWeightKg) || reached(current.waistCm, goals.goalWaistCm)
  )
}

/** Waist is measured every 2 weeks (plan §7): a measurement earns XP if the last credited one is 13+ days old. */
export const WAIST_EVERY_DAYS = 13

/** The dates whose waist measurement earns the waist quest's XP, oldest first. */
export function creditedWaistDates(dates: readonly LocalDate[]): LocalDate[] {
  const credited: LocalDate[] = []
  for (const date of [...new Set(dates)].sort()) {
    const last = credited.at(-1)
    if (last === undefined || daysBetween(last, date) >= WAIST_EVERY_DAYS) credited.push(date)
  }
  return credited
}
