/**
 * Daily and weekly quests and total XP (plan §7, §9). Nothing here is
 * stored: every result is worked out from the logs, so correcting a log
 * corrects the XP, and days logged before the quest board existed get credit.
 *
 * Phase 1 (owner answer A): no exam-mode multiplier, streaks or stats yet.
 */
import { hasAllMainMeals, calibrationStatus } from './calibration'
import {
  ageOn,
  addDays,
  datesInRange,
  daysBetween,
  weekDates,
  weekStart,
  type LocalDate,
} from './date'
import { flexBudget } from './flex'
import { dayTotals, type LoggedMeal } from './food'
import { mainSleep, meetsSleepTarget } from './sleep'
import { STUDY_MULTIPLIER, isExamDay, type Period } from './exams'
import { checkRewards, creditedWaistDates, type CheckResults } from './fitness'
import { blocksOn, type LoggedSession } from './study'
import { meetsWorkoutQuest, plannedSetsDone } from './session'
import { PR_XP, personalRecords, type RecordSet } from './records'
import { activePlan, dayRule, planDayFor, type ExerciseType, type PlanShape } from './workout'
import { ADULT_AGE } from './targets'

export type QuestId =
  'proteinBreakfast' | 'lunchProteins' | 'dinner' | 'dailyProtein' | 'workout' | 'study' | 'sleep'

export type QuestStat = 'str' | 'vit' | 'int'

export const QUEST_XP = {
  proteinBreakfast: 10,
  lunchProteins: 10,
  dinner: 10,
  dailyProtein: 20,
  workout: 50,
  restDay: 10,
  studyBlock: 30,
  sleep: 20,
  weighIns: 20,
  backup: 15,
  waist: 15,
} as const

export const WEEKLY_WEIGH_INS = 3

export interface QuestResult {
  id: QuestId
  stat: QuestStat
  done: boolean
  xp: number
  maxXp: number
  /** False when the quest can't be done yet (e.g. no workout plan). */
  available: boolean
  /** How far along it is, for the board. */
  progress: { value: number; max: number }
  /** Which version of the quest applies today. */
  variant?: 'flexDinner' | 'calibration' | 'threshold' | 'restDay' | 'training' | 'noPlan' | 'exam'
}

export interface QuestHistory {
  profile: { setupDate: LocalDate; birthDate: LocalDate; sleepTargetMin: number; blockMin: number }
  /** Target rows, any order. */
  targets: readonly { startsOn: LocalDate; kcal: number; proteinQuestThresholdG: number | null }[]
  days: readonly {
    date: LocalDate
    isFlexDay: boolean
    isPlannedRest: boolean
    plannedSets?: number
    planWeekday?: number
  }[]
  meals: readonly (LoggedMeal & { date: LocalDate })[]
  sleeps: readonly { wakeDate: LocalDate; minutes: number }[]
  study: readonly LoggedSession[]
  sets: readonly (RecordSet & { setNumber: number })[]
  /** The current normal plan, used for days saved before planned sets were. */
  plan: PlanShape | undefined
  weighIns: readonly { date: LocalDate }[]
  exports: readonly { date: LocalDate }[]
  /** Waist measurements (plan §7: every 2 weeks). */
  waists: readonly { date: LocalDate }[]
  /** Completed fitness checks (plan §4). */
  checks: readonly ({ date: LocalDate } & CheckResults)[]
  /** Saved exam-mode periods, automatic and manual (plan §7). */
  examPeriods: readonly Period[]
  /** The exam-mode workout plan, if built. */
  examPlan: PlanShape | undefined
  /** Exercise types, to judge personal records. */
  exercises: readonly { id?: number | undefined; type: ExerciseType }[]
}

function groupBy<T>(items: readonly T[], key: (item: T) => LocalDate): Map<LocalDate, T[]> {
  const map = new Map<LocalDate, T[]>()
  for (const item of items) {
    const k = key(item)
    const list = map.get(k)
    if (list) list.push(item)
    else map.set(k, [item])
  }
  return map
}

/** History indexed by date, so a year of days stays fast. */
export interface IndexedHistory {
  source: QuestHistory
  targets: QuestHistory['targets']
  days: Map<LocalDate, QuestHistory['days'][number]>
  meals: Map<LocalDate, QuestHistory['meals'][number][]>
  sleeps: Map<LocalDate, QuestHistory['sleeps'][number][]>
  study: Map<LocalDate, LoggedSession[]>
  sets: Map<LocalDate, QuestHistory['sets'][number][]>
}

export function indexHistory(history: QuestHistory): IndexedHistory {
  return {
    source: history,
    targets: [...history.targets].sort((a, b) => a.startsOn.localeCompare(b.startsOn)),
    days: new Map(history.days.map((d) => [d.date, d])),
    meals: groupBy(history.meals, (m) => m.date),
    sleeps: groupBy(history.sleeps, (s) => s.wakeDate),
    study: groupBy(history.study, (s) => s.date),
    sets: groupBy(history.sets, (s) => s.date),
  }
}

function targetOn(index: IndexedHistory, date: LocalDate) {
  let current: IndexedHistory['targets'][number] | undefined
  for (const t of index.targets) if (t.startsOn <= date) current = t
  return current
}

function quest(
  id: QuestId,
  stat: QuestStat,
  done: boolean,
  maxXp: number,
  progress: { value: number; max: number },
  extra: Partial<QuestResult> = {},
): QuestResult {
  return { id, stat, done, xp: done ? maxXp : 0, maxXp, available: true, progress, ...extra }
}

/** The seven daily quests for one date. */
export function questsForDay(index: IndexedHistory, date: LocalDate): QuestResult[] {
  const { profile } = index.source
  const meals = index.meals.get(date) ?? []
  const totals = dayTotals(meals)
  const target = targetOn(index, date)
  const day = index.days.get(date)
  const isMinor = ageOn(profile.birthDate, date) < ADULT_AGE
  const xp = QUEST_XP

  // Dinner: two proteins, or on a flex day dinner within the budget. Always two proteins for under-18s.
  const flexDinner = Boolean(day?.isFlexDay) && !isMinor && target !== undefined
  const flex = flexDinner && target ? flexBudget(target.kcal, meals) : null
  const dinner = flex
    ? quest(
        'dinner',
        'vit',
        flex.withinBudget,
        xp.dinner,
        {
          value: Math.min(flex.dinnerKcal, flex.budget),
          max: flex.budget,
        },
        { variant: 'flexDinner' },
      )
    : quest('dinner', 'vit', totals.bySlot.dinner.proteinItems >= 2, xp.dinner, {
        value: Math.min(totals.bySlot.dinner.proteinItems, 2),
        max: 2,
      })

  // Daily protein: in the first 14 days, or until a threshold is set, log all three main meals.
  const threshold = target?.proteinQuestThresholdG ?? null
  const calibrating = calibrationStatus(profile.setupDate, date).calibrating || threshold === null
  const mainMeals = (['breakfast', 'lunch', 'dinner'] as const).filter(
    (slot) => totals.bySlot[slot].itemCount > 0,
  ).length
  const dailyProtein = calibrating
    ? quest(
        'dailyProtein',
        'vit',
        hasAllMainMeals(meals),
        xp.dailyProtein,
        {
          value: mainMeals,
          max: 3,
        },
        { variant: 'calibration' },
      )
    : quest(
        'dailyProtein',
        'vit',
        totals.proteinG >= (threshold ?? 0),
        xp.dailyProtein,
        {
          value: Math.min(totals.proteinG, threshold ?? 0),
          max: threshold ?? 0,
        },
        { variant: 'threshold' },
      )

  // Workout: 80% of the planned sets; a planned rest day earns 10.
  // In exam mode the exam plan replaces the normal one (plan §7), if there is one.
  const examDay = isExamDay(date, index.source.examPeriods)
  const plan = activePlan(examDay, index.source.plan, index.source.examPlan)
  const rule = day ?? { ...dayRule(plan, date), planWeekday: undefined }
  const sets = index.sets.get(date) ?? []
  const planned = rule.plannedSets ?? 0
  let workout: QuestResult
  if (rule.isPlannedRest && rule.planWeekday === undefined) {
    workout = quest(
      'workout',
      'str',
      true,
      xp.restDay,
      { value: 1, max: 1 },
      { variant: 'restDay' },
    )
  } else if (planned > 0) {
    const planDay =
      rule.planWeekday !== undefined
        ? plan?.days.find((d) => d.weekday === rule.planWeekday)
        : planDayFor(plan, date)
    const doneSets = Math.min(
      planned,
      planDay ? plannedSetsDone(planDay.exercises, sets) : sets.filter((s) => s.done).length,
    )
    workout = quest(
      'workout',
      'str',
      meetsWorkoutQuest(planned, doneSets),
      xp.workout,
      {
        value: doneSets,
        max: planned,
      },
      { variant: 'training' },
    )
  } else {
    workout = {
      ...quest('workout', 'str', false, xp.workout, { value: 0, max: 0 }),
      available: false,
      variant: 'noPlan',
    }
  }

  // Study: 30 INT per block, up to 5; ×1.5 in exam mode (plan §7).
  const blocks = blocksOn(date, index.study.get(date) ?? [], profile.blockMin)
  const perBlock = examDay ? xp.studyBlock * STUDY_MULTIPLIER : xp.studyBlock
  const study: QuestResult = {
    id: 'study',
    stat: 'int',
    done: blocks > 0,
    xp: blocks * perBlock,
    maxXp: 5 * perBlock,
    available: true,
    progress: { value: blocks, max: 5 },
    ...(examDay ? { variant: 'exam' as const } : {}),
  }

  // Sleep: the main sleep that ended today meets the target.
  const sleepMin = mainSleep(index.sleeps.get(date) ?? [])?.minutes
  const sleep = quest(
    'sleep',
    'vit',
    meetsSleepTarget(sleepMin, profile.sleepTargetMin),
    xp.sleep,
    {
      value: Math.min(sleepMin ?? 0, profile.sleepTargetMin),
      max: profile.sleepTargetMin,
    },
  )

  return [
    quest(
      'proteinBreakfast',
      'vit',
      totals.bySlot.breakfast.proteinItems >= 1,
      xp.proteinBreakfast,
      {
        value: Math.min(totals.bySlot.breakfast.proteinItems, 1),
        max: 1,
      },
    ),
    quest('lunchProteins', 'vit', totals.bySlot.lunch.proteinItems >= 2, xp.lunchProteins, {
      value: Math.min(totals.bySlot.lunch.proteinItems, 2),
      max: 2,
    }),
    dinner,
    dailyProtein,
    workout,
    study,
    sleep,
  ]
}

export function dayXp(quests: readonly QuestResult[]): number {
  return quests.reduce((sum, q) => sum + q.xp, 0)
}

export type WeeklyQuestId = 'weighIns' | 'backup' | 'waist'

export interface WeeklyResult {
  id: WeeklyQuestId
  done: boolean
  xp: number
  maxXp: number
  progress: { value: number; max: number }
}

/** The weekly quests for the Monday–Sunday week containing `date`. */
export function weeklyQuests(history: QuestHistory, date: LocalDate): WeeklyResult[] {
  const week = new Set(weekDates(date))
  const weighIns = new Set(history.weighIns.filter((w) => week.has(w.date)).map((w) => w.date)).size
  const backups = history.exports.filter((e) => week.has(e.date)).length
  return [
    {
      id: 'weighIns',
      done: weighIns >= WEEKLY_WEIGH_INS,
      xp: weighIns >= WEEKLY_WEIGH_INS ? QUEST_XP.weighIns : 0,
      maxXp: QUEST_XP.weighIns,
      progress: { value: Math.min(weighIns, WEEKLY_WEIGH_INS), max: WEEKLY_WEIGH_INS },
    },
    {
      id: 'backup',
      done: backups > 0,
      xp: backups > 0 ? QUEST_XP.backup : 0,
      maxXp: QUEST_XP.backup,
      progress: { value: Math.min(backups, 1), max: 1 },
    },
    ...waistQuest(history, date, week),
  ]
}

/**
 * The waist quest shows in a week when a measurement is due (13+ days since
 * the last credited one) or was credited that week. Its XP counts on the day.
 */
function waistQuest(history: QuestHistory, date: LocalDate, week: Set<LocalDate>): WeeklyResult[] {
  // Hidden in exam mode (plan §7).
  if (isExamDay(date, history.examPeriods)) return []
  const credited = creditedWaistDates(waistDates(history))
  const thisWeek = credited.find((d) => week.has(d))
  const before = credited.filter((d) => d < weekStart(date)).at(-1)
  const due = before === undefined || daysBetween(before, addDays(weekStart(date), 6)) >= 13
  if (!thisWeek && !due) return []
  return [
    {
      id: 'waist',
      done: thisWeek !== undefined,
      xp: thisWeek ? QUEST_XP.waist : 0,
      maxXp: QUEST_XP.waist,
      progress: { value: thisWeek ? 1 : 0, max: 1 },
    },
  ]
}

/** Personal records from the setup date up to `today` (+25 STR each, plan §7). */
export function recordsUpTo(history: QuestHistory, today: LocalDate) {
  const types = new Map(history.exercises.map((e) => [e.id, e.type]))
  return personalRecords(history.sets, (id) => types.get(id)).filter(
    (r) => r.date >= history.profile.setupDate && r.date <= today,
  )
}

/** Waist measurements outside exam mode (the waist quest is hidden during exams). */
function waistDates(history: QuestHistory): LocalDate[] {
  return history.waists.map((w) => w.date).filter((d) => !isExamDay(d, history.examPeriods))
}

/** XP from waist measurements and fitness checks, credited on their own dates, up to `today`. */
export function bonusXp(history: QuestHistory, today: LocalDate): number {
  const { vit, str, plain } = bonusBreakdown(history, today)
  return vit + str + plain
}

function bonusBreakdown(
  history: QuestHistory,
  today: LocalDate,
): { vit: number; str: number; plain: number } {
  const waist = creditedWaistDates(waistDates(history)).filter(
    (d) => d >= history.profile.setupDate && d <= today,
  ).length
  const checks = [...history.checks].sort((a, b) => a.date.localeCompare(b.date))
  let vit = 0
  let str = 0
  checks.forEach((check, i) => {
    if (check.date > today) return
    const reward = checkRewards(check, checks[i - 1])
    vit += reward.vit
    str += reward.str
  })
  return { vit, str, plain: waist * QUEST_XP.waist }
}

/**
 * Total XP from the setup date to today. Daily quests count as they're done,
 * including today. Weekly quests are credited once their week has finished,
 * to its Sunday (approved default).
 */
export function totalXp(history: QuestHistory, today: LocalDate): number {
  return xpBreakdown(history, today).total
}

/** XP by stat; weekly quests and the waist quest earn plain XP. */
export interface XpBreakdown {
  total: number
  str: number
  vit: number
  int: number
  plain: number
}

export function xpBreakdown(history: QuestHistory, today: LocalDate): XpBreakdown {
  const result: XpBreakdown = { total: 0, str: 0, vit: 0, int: 0, plain: 0 }
  const start = history.profile.setupDate
  if (start > today) return result
  const index = indexHistory(history)
  for (const date of datesInRange(start, today)) {
    for (const quest of questsForDay(index, date)) result[quest.stat] += quest.xp
  }
  for (let monday = weekStart(start); addDays(monday, 6) < today; monday = addDays(monday, 7)) {
    result.plain += weeklyQuests(history, monday)
      .filter((q) => q.id !== 'waist')
      .reduce((sum, q) => sum + q.xp, 0)
  }
  const bonus = bonusBreakdown(history, today)
  result.vit += bonus.vit
  result.str += bonus.str + recordsUpTo(history, today).length * PR_XP
  result.plain += bonus.plain
  result.total = result.str + result.vit + result.int + result.plain
  return result
}
