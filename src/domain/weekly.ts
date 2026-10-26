/**
 * The weekly boss and report (plan §6, §7), judged on Monday for the finished
 * Monday–Sunday week.
 */
import { weekAverageFor, weeklyAverages } from './body'
import { addDays, datesInRange, weekStart, type LocalDate } from './date'
import { isExamDay } from './exams'
import { indexHistory, questsForDay, type QuestHistory } from './quests'
import { periodSummary, type PeriodSummary } from './review'
import { QUESTS_FOR_STREAK } from './streak'

export const BOSS_XP = 100
export const BOSS_WEIGH_INS = 3
export const EXAM_WORKOUT_TARGET = 2

/** Original titles earned by beating the boss, in order (never copied from any game). */
export const BOSS_TITLES = [
  'Steady Climber',
  'Early Riser',
  'Iron Habit',
  'Lamp Keeper',
  'Quiet Storm',
  'Long Haul',
  'True North',
  'Unbroken Week',
] as const

export type WeightCheck =
  | { ok: false; reason: 'fewWeighIns'; weighIns: number }
  | { ok: boolean; reason: 'compared'; averageKg: number; referenceKg: number }

export interface BossResult {
  weekStart: LocalDate
  weight: WeightCheck
  workouts: { done: number; target: number; ok: boolean }
  study: { minutes: number; goalMinutes: number; ok: boolean }
  won: boolean
}

function startingWeight(history: QuestHistory): number | undefined {
  return [...history.weighIns]
    .filter((w) => w.weightKg !== undefined)
    .sort((a, b) => a.date.localeCompare(b.date))[0]?.weightKg
}

/**
 * Weight on track (plan §7). Losing: this week's average is lower than two
 * weeks ago. Maintaining: within ±1% of the goal weight. Building muscle:
 * higher than two weeks ago, by no more than 0.5%. Needs 3+ weigh-ins; in the
 * first 2 weeks it compares with the starting weight.
 */
export function weightCheck(history: QuestHistory, monday: LocalDate): WeightCheck {
  const weighIns = history.weighIns.filter(
    (w): w is { date: LocalDate; weightKg: number } => w.weightKg !== undefined,
  )
  const sunday = addDays(monday, 6)
  const count = weighIns.filter((w) => w.date >= monday && w.date <= sunday).length
  if (count < BOSS_WEIGH_INS) return { ok: false, reason: 'fewWeighIns', weighIns: count }
  const averageKg = weekAverageFor(monday, weighIns)!.averageKg
  const goal = history.profile.goal ?? 'maintain'
  const start = startingWeight(history) ?? averageKg

  if (goal === 'maintain') {
    const referenceKg = history.profile.goalWeightKg ?? start
    return {
      ok: Math.abs(averageKg - referenceKg) <= referenceKg * 0.01,
      reason: 'compared',
      averageKg,
      referenceKg,
    }
  }
  const earlyWeeks = monday < addDays(history.profile.setupDate, 14)
  const twoWeeksAgo = weeklyAverages(weighIns)
    .filter((w) => w.weekStart <= addDays(monday, -14))
    .at(-1)?.averageKg
  const referenceKg = earlyWeeks || twoWeeksAgo === undefined ? start : twoWeeksAgo
  const ok =
    goal === 'lose'
      ? averageKg < referenceKg
      : averageKg > referenceKg && averageKg <= referenceKg * 1.005
  return { ok, reason: 'compared', averageKg, referenceKg }
}

export function bossFor(history: QuestHistory, monday: LocalDate): BossResult {
  const index = indexHistory(history)
  const week = datesInRange(monday, addDays(monday, 6))
  const examWeek = week.some((d) => isExamDay(d, history.examPeriods))
  const goal = history.profile.workoutsPerWeek ?? 0
  const target = examWeek ? Math.min(goal, EXAM_WORKOUT_TARGET) : goal
  const done = week.filter((d) => {
    const workout = questsForDay(index, d).find((q) => q.id === 'workout')
    return workout?.variant === 'training' && workout.done
  }).length
  const minutes = week.reduce(
    (sum, d) => sum + (index.study.get(d) ?? []).reduce((s, x) => s + x.minutes, 0),
    0,
  )
  const goalMinutes = (history.profile.studyGoalHours ?? 0) * 60
  const weight = weightCheck(history, monday)
  const workouts = { done, target, ok: done >= target }
  const study = { minutes, goalMinutes, ok: minutes >= goalMinutes }
  return { weekStart: monday, weight, workouts, study, won: weight.ok && workouts.ok && study.ok }
}

/** Every finished week since setup with its boss result, oldest first. */
export function bossHistory(history: QuestHistory, today: LocalDate): BossResult[] {
  const results: BossResult[] = []
  for (
    let monday = weekStart(history.profile.setupDate);
    addDays(monday, 6) < today;
    monday = addDays(monday, 7)
  ) {
    results.push(bossFor(history, monday))
  }
  return results
}

/** Titles earned so far, in the order they were won. */
export function earnedTitles(results: readonly BossResult[]): string[] {
  return results.filter((r) => r.won).map((_, i) => BOSS_TITLES[i % BOSS_TITLES.length]!)
}

export interface WeeklyReport {
  weekStart: LocalDate
  summary: PeriodSummary
  weighIns: number
  averageKg: number | undefined
  /** Change from the previous week's average, if both have weigh-ins. */
  changeKg: number | undefined
  /** Days that counted toward the streak (5+ quests). */
  questDays: number
  boss: BossResult
}

export function weeklyReport(history: QuestHistory, monday: LocalDate): WeeklyReport {
  const sunday = addDays(monday, 6)
  const index = indexHistory(history)
  const weights = history.weighIns.filter(
    (w): w is { date: LocalDate; weightKg: number } => w.weightKg !== undefined,
  )
  const thisWeek = weekAverageFor(monday, weights)
  const lastWeek = weekAverageFor(addDays(monday, -7), weights)
  return {
    weekStart: monday,
    summary: periodSummary(history, monday, sunday),
    weighIns: thisWeek?.count ?? 0,
    averageKg: thisWeek?.averageKg,
    changeKg:
      thisWeek && lastWeek
        ? Math.round((thisWeek.averageKg - lastWeek.averageKg) * 100) / 100
        : undefined,
    questDays: datesInRange(monday, sunday).filter(
      (d) => questsForDay(index, d).filter((q) => q.done).length >= QUESTS_FOR_STREAK,
    ).length,
    boss: bossFor(history, monday),
  }
}
