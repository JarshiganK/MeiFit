/**
 * Averages over a stretch of days, for the fitness check review (4 weeks,
 * plan §4) and the weekly report (plan §6).
 */
import { datesInRange, type LocalDate } from './date'
import { dayTotals } from './food'
import { indexHistory, questsForDay, type QuestHistory } from './quests'
import { mainSleep } from './sleep'

export interface PeriodSummary {
  days: number
  /** Average main sleep on nights that were logged. */
  sleepAvgMin: number | null
  nightsLogged: number
  studyMinutes: number
  /** Averages over days with any food logged. */
  proteinAvgG: number | null
  kcalAvg: number | null
  foodDays: number
  /** Training days whose workout quest was done, against training days planned. */
  workoutsDone: number
  workoutsPlanned: number
}

const avg = (values: readonly number[]) =>
  values.length === 0 ? null : values.reduce((a, b) => a + b, 0) / values.length

export function periodSummary(
  history: QuestHistory,
  from: LocalDate,
  to: LocalDate,
): PeriodSummary {
  const index = indexHistory(history)
  const dates = from <= to ? datesInRange(from, to) : []
  const sleeps: number[] = []
  const protein: number[] = []
  const kcal: number[] = []
  let studyMinutes = 0
  let workoutsDone = 0
  let workoutsPlanned = 0
  for (const date of dates) {
    const sleep = mainSleep(index.sleeps.get(date) ?? [])
    if (sleep) sleeps.push(sleep.minutes)
    const meals = index.meals.get(date) ?? []
    const totals = dayTotals(meals)
    if (totals.itemCount > 0) {
      protein.push(totals.proteinG)
      kcal.push(totals.kcal)
    }
    studyMinutes += (index.study.get(date) ?? []).reduce((sum, s) => sum + s.minutes, 0)
    const workout = questsForDay(index, date).find((q) => q.id === 'workout')
    if (workout?.variant === 'training') {
      workoutsPlanned++
      if (workout.done) workoutsDone++
    }
  }
  const round = (n: number | null) => (n === null ? null : Math.round(n))
  return {
    days: dates.length,
    sleepAvgMin: round(avg(sleeps)),
    nightsLogged: sleeps.length,
    studyMinutes,
    proteinAvgG: round(avg(protein)),
    kcalAvg: round(avg(kcal)),
    foodDays: protein.length,
    workoutsDone,
    workoutsPlanned,
  }
}
