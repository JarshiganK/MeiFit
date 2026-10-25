/**
 * Weight (plan §2): weigh 3–4 mornings a week, and compare weekly averages
 * (Monday–Sunday), since a single weigh-in swings with water and food.
 */
import { addDays, weekStart, type LocalDate } from './date'

export const WEIGHT_LIMITS = { min: 25, max: 300 } as const
export const WAIST_LIMITS = { min: 40, max: 200 } as const

export interface WeighIn {
  date: LocalDate
  weightKg: number
}

export interface WeekAverage {
  /** The Monday the week starts on. */
  weekStart: LocalDate
  averageKg: number
  count: number
}

const round1 = (n: number) => Math.round(n * 10) / 10
const round2 = (n: number) => Math.round(n * 100) / 100

export function validateWeight(kg: number | undefined): 'required' | 'outOfRange' | null {
  if (kg === undefined) return 'required'
  if (!Number.isFinite(kg) || kg < WEIGHT_LIMITS.min || kg > WEIGHT_LIMITS.max) return 'outOfRange'
  return null
}

/** Weights are kept to 0.1 kg, as a home scale shows them. */
export function roundWeight(kg: number): number {
  return round1(kg)
}

/** Weekly averages, oldest week first. Weeks without a weigh-in are left out. */
export function weeklyAverages(weighIns: readonly WeighIn[]): WeekAverage[] {
  const weeks = new Map<LocalDate, number[]>()
  for (const { date, weightKg } of weighIns) {
    const start = weekStart(date)
    weeks.set(start, [...(weeks.get(start) ?? []), weightKg])
  }
  return [...weeks.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([start, kgs]) => ({
      weekStart: start,
      averageKg: round2(kgs.reduce((sum, kg) => sum + kg, 0) / kgs.length),
      count: kgs.length,
    }))
}

/** The average for the week containing `date`, if it has any weigh-ins. */
export function weekAverageFor(
  date: LocalDate,
  weighIns: readonly WeighIn[],
): WeekAverage | undefined {
  const start = weekStart(date)
  return weeklyAverages(weighIns).find((week) => week.weekStart === start)
}

/** Weigh-ins in the Monday–Sunday week of `date` (the weekly quest wants 3+). */
export function weighInsInWeek(date: LocalDate, weighIns: readonly WeighIn[]): number {
  const start = weekStart(date)
  const end = addDays(start, 6)
  return weighIns.filter((w) => w.date >= start && w.date <= end).length
}

/**
 * Change from the previous week that has weigh-ins, in kg and as a percentage
 * of that week's average. Undefined until there are two weeks to compare.
 */
export function weeklyChange(
  weeks: readonly WeekAverage[],
): { kg: number; percent: number } | undefined {
  const last = weeks.at(-1)
  const previous = weeks.at(-2)
  if (!last || !previous) return undefined
  const kg = round2(last.averageKg - previous.averageKg)
  return { kg, percent: round2((kg / previous.averageKg) * 100) }
}
