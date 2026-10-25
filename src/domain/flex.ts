/**
 * Flex days (plan §3): breakfast and lunch are lighter, and dinner gets the
 * rest of the day's calories. Flex budget = calorie target − everything
 * logged before dinner (approved default: every non-dinner item that day).
 */
import { weekDates, type LocalDate } from './date'
import type { LoggedMeal } from './food'

/** Dinner may run this far over the budget and still count (estimates are rough). */
export const FLEX_TOLERANCE_KCAL = 50

export interface FlexBudget {
  /** Calories left for dinner once everything else is counted. */
  budget: number
  dinnerKcal: number
  /** Budget minus dinner so far; negative when over. */
  remaining: number
  dinnerLogged: boolean
  /** Dinner is logged and within budget + tolerance. */
  withinBudget: boolean
}

export function flexBudget(targetKcal: number, meals: readonly LoggedMeal[]): FlexBudget {
  let other = 0
  let dinnerKcal = 0
  let dinnerLogged = false
  for (const meal of meals) {
    const kcal = meal.items.reduce((sum, item) => sum + item.kcal, 0)
    if (meal.slot === 'dinner') {
      dinnerKcal += kcal
      if (meal.items.length > 0) dinnerLogged = true
    } else {
      other += kcal
    }
  }
  const budget = Math.max(0, targetKcal - other)
  return {
    budget,
    dinnerKcal,
    remaining: budget - dinnerKcal,
    dinnerLogged,
    withinBudget: dinnerLogged && dinnerKcal <= budget + FLEX_TOLERANCE_KCAL,
  }
}

/** The flex days already used in the Monday–Sunday week of `date`. */
export function flexDaysInWeek(
  date: LocalDate,
  days: readonly { date: LocalDate; isFlexDay: boolean }[],
): LocalDate[] {
  const week = new Set(weekDates(date))
  return days.filter((day) => day.isFlexDay && week.has(day.date)).map((day) => day.date)
}

/**
 * Whether `date` can be switched to a flex day: the week still has one to
 * spare. Switching one off is always allowed.
 */
export function canMakeFlexDay(
  date: LocalDate,
  perWeek: number,
  days: readonly { date: LocalDate; isFlexDay: boolean }[],
): boolean {
  const used = flexDaysInWeek(date, days).filter((d) => d !== date)
  return used.length < perWeek
}
