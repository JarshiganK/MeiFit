/**
 * Protein calibration (plan §3, owner change 2). For the first 14 days the
 * protein quest is "log all three main meals" and protein isn't judged. From
 * day 15 the app proposes a quest threshold: the average protein on days with
 * all three main meals logged, + 10 g, rounded to the nearest 5 g, between
 * 1.2 g/kg and the protein target. With fewer than 5 such days it proposes
 * 1.2 g/kg instead.
 */
import { addDays, daysBetween, type LocalDate } from './date'
import { MAIN_MEALS, type LoggedMeal } from './food'

export const CALIBRATION_DAYS = 14
export const MIN_FULL_DAYS = 5
export const CALIBRATION_BONUS_G = 10
export const FLOOR_G_PER_KG = 1.2

export interface CalibrationStatus {
  /** True on days 1–14 counted from the setup date. */
  calibrating: boolean
  /** 1-based day number in the calibration (1–14), or null after it. */
  day: number | null
  /** The first day the proposal can be made (setup date + 14). */
  proposalFrom: LocalDate
}

export function calibrationStatus(setupDate: LocalDate, date: LocalDate): CalibrationStatus {
  const elapsed = daysBetween(setupDate, date)
  const calibrating = elapsed >= 0 && elapsed < CALIBRATION_DAYS
  return {
    calibrating,
    day: calibrating ? elapsed + 1 : null,
    proposalFrom: addDays(setupDate, CALIBRATION_DAYS),
  }
}

/** True when breakfast, lunch and dinner each have at least one item. */
export function hasAllMainMeals(meals: readonly LoggedMeal[]): boolean {
  return MAIN_MEALS.every((slot) =>
    meals.some((meal) => meal.slot === slot && meal.items.length > 0),
  )
}

export interface DayProtein {
  date: LocalDate
  meals: readonly LoggedMeal[]
}

export interface ThresholdProposal {
  thresholdG: number
  /** Days in the window with all three main meals logged. */
  fullDays: number
  /** Their average protein, or null when there were too few to use. */
  averageG: number | null
  minG: number
  maxG: number
  /** True when there were fewer than 5 full days and 1.2 g/kg was used. */
  fallback: boolean
}

export function roundTo5(grams: number): number {
  return Math.round(grams / 5) * 5
}

/** The allowed range for the threshold: 1.2 g/kg up to the protein target. */
export function thresholdRange(weightKg: number, targetG: number): { minG: number; maxG: number } {
  const minG = Math.min(Math.ceil(FLOOR_G_PER_KG * weightKg), targetG)
  return { minG, maxG: targetG }
}

export function proposeThreshold(
  days: readonly DayProtein[],
  weightKg: number,
  targetG: number,
): ThresholdProposal {
  const full = days.filter((day) => hasAllMainMeals(day.meals))
  const { minG, maxG } = thresholdRange(weightKg, targetG)
  const clamp = (g: number) => Math.min(maxG, Math.max(minG, g))
  if (full.length < MIN_FULL_DAYS) {
    return { thresholdG: minG, fullDays: full.length, averageG: null, minG, maxG, fallback: true }
  }
  const totals = full.map((day) =>
    day.meals.reduce((sum, meal) => sum + meal.items.reduce((s, item) => s + item.proteinG, 0), 0),
  )
  const averageG = totals.reduce((a, b) => a + b, 0) / totals.length
  return {
    thresholdG: clamp(roundTo5(averageG + CALIBRATION_BONUS_G)),
    fullDays: full.length,
    averageG: Math.round(averageG * 10) / 10,
    minG,
    maxG,
    fallback: false,
  }
}
