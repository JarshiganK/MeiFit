import { describe, expect, it } from 'vitest'
import type { QuestHistory } from './quests'
import { bossFor, bossHistory, earnedTitles, weeklyReport, weightCheck } from './weekly'
import { xpBreakdown } from './quests'
import { xpTotals } from './xp'

const SETUP = '2026-09-28' // a Monday
const WEEK = '2026-10-19' // Monday of the judged week

function history(
  patch: Partial<QuestHistory> & { goal?: 'lose' | 'maintain' | 'gain' } = {},
): QuestHistory {
  const { goal = 'lose', ...rest } = patch
  return {
    profile: {
      setupDate: SETUP,
      birthDate: '2001-10-25',
      sleepTargetMin: 420,
      blockMin: 50,
      goal,
      workoutsPerWeek: 2,
      studyGoalHours: 2,
    },
    targets: [{ startsOn: SETUP, kcal: 2000, proteinQuestThresholdG: 90 }],
    days: [],
    meals: [],
    sleeps: [],
    study: [],
    sets: [],
    plan: undefined,
    weighIns: [],
    exports: [],
    waists: [],
    checks: [],
    examPeriods: [],
    examPlan: undefined,
    exercises: [],
    ...rest,
  }
}

const weighIns = (monday: string, kgs: number[]) =>
  kgs.map((weightKg, i) => ({ date: addDay(monday, i * 2), weightKg }))

function addDay(date: string, days: number): string {
  const d = new Date(`${date}T12:00:00`)
  d.setDate(d.getDate() + days)
  return d.toLocaleDateString('en-CA')
}

describe('weight on track (plan §7)', () => {
  const start = [{ date: SETUP, weightKg: 72 }]

  it('needs 3 weigh-ins in the week', () => {
    expect(weightCheck(history({ weighIns: weighIns(WEEK, [70, 70]) }), WEEK)).toEqual({
      ok: false,
      reason: 'fewWeighIns',
      weighIns: 2,
    })
  })

  it('losing: lower than the average two weeks earlier', () => {
    const h = history({
      weighIns: [
        ...start,
        ...weighIns('2026-10-05', [70, 70.2, 70.1]),
        ...weighIns(WEEK, [69.8, 69.7, 69.9]),
      ],
    })
    expect(weightCheck(h, WEEK)).toMatchObject({ ok: true, averageKg: 69.8, referenceKg: 70.1 })
    const up = history({
      weighIns: [
        ...start,
        ...weighIns('2026-10-05', [70, 70, 70]),
        ...weighIns(WEEK, [70, 70.1, 70]),
      ],
    })
    expect(weightCheck(up, WEEK).ok).toBe(false)
  })

  it('compares with the starting weight in the first 2 weeks', () => {
    const h = history({ weighIns: [...start, ...weighIns('2026-10-05', [71.5, 71.5, 71.5])] })
    expect(weightCheck(h, '2026-10-05')).toMatchObject({ ok: true, referenceKg: 72 })
  })

  it('maintaining: within ±1% of the goal weight', () => {
    const h = history({ goal: 'maintain', weighIns: weighIns(WEEK, [70.6, 70.7, 70.7]) })
    h.profile.goalWeightKg = 70
    expect(weightCheck(h, WEEK).ok).toBe(true) // 70.67, within 0.7
    h.profile.goalWeightKg = 69.9
    expect(weightCheck(h, WEEK).ok).toBe(false)
  })

  it('building: higher than two weeks ago, by no more than 0.5%', () => {
    const base = [...start, ...weighIns('2026-10-05', [70, 70, 70])]
    const good = history({
      goal: 'gain',
      weighIns: [...base, ...weighIns(WEEK, [70.3, 70.3, 70.3])],
    })
    expect(weightCheck(good, WEEK).ok).toBe(true)
    const tooFast = history({
      goal: 'gain',
      weighIns: [...base, ...weighIns(WEEK, [70.4, 70.4, 70.4])],
    })
    expect(weightCheck(tooFast, WEEK).ok).toBe(false)
  })
})

describe('weekly boss (plan §7)', () => {
  const plan = {
    days: [1, 3].map((weekday) => ({ weekday, exercises: [{ exerciseId: 1, sets: 1 }] })),
  }
  const workout = (date: string) => ({ date, exerciseId: 1, setNumber: 1, done: true })
  const winning = () =>
    history({
      plan,
      weighIns: [
        { date: SETUP, weightKg: 72 },
        ...weighIns('2026-10-05', [70, 70, 70]),
        ...weighIns(WEEK, [69.5, 69.5, 69.5]),
      ],
      sets: [workout('2026-10-19'), workout('2026-10-21')],
      study: [{ date: '2026-10-20', minutes: 120, completed: true, source: 'manual' }],
    })

  it('is won when weight, workouts and study all hold', () => {
    expect(bossFor(winning(), WEEK)).toMatchObject({
      won: true,
      workouts: { done: 2, target: 2, ok: true },
      study: { minutes: 120, goalMinutes: 120, ok: true },
    })
  })

  it('is lost if any one falls short', () => {
    const h = winning()
    h.study = [{ date: '2026-10-20', minutes: 119, completed: true, source: 'manual' }]
    expect(bossFor(h, WEEK)).toMatchObject({ won: false, study: { ok: false } })
  })

  it('needs only 2 workouts in an exam week', () => {
    const h = winning()
    h.profile.workoutsPerWeek = 4
    expect(bossFor(h, WEEK).workouts).toMatchObject({ target: 4, ok: false })
    h.examPeriods = [{ startsOn: '2026-10-24', endsOn: '2026-11-10' }]
    expect(bossFor(h, WEEK).workouts).toMatchObject({ target: 2, ok: true })
  })

  it('judges finished weeks only, and gives a title per win', () => {
    const results = bossHistory(winning(), '2026-10-26')
    expect(results.map((r) => r.weekStart)).toEqual([
      '2026-09-28',
      '2026-10-05',
      '2026-10-12',
      '2026-10-19',
    ])
    expect(results.map((r) => r.won)).toEqual([false, false, false, true])
    expect(earnedTitles(results)).toEqual(['Steady Climber'])
    expect(bossHistory(winning(), '2026-10-25')).toHaveLength(3)
  })

  it('adds 100 XP per win to the totals', () => {
    const withBoss = xpTotals(winning(), '2026-10-26')
    const before = xpTotals(winning(), '2026-10-25')
    // When the week ends: the boss (100) and the week's 3 weigh-ins (20), both plain XP.
    expect(withBoss.total - before.total).toBe(120)
    expect(withBoss.plain - before.plain).toBe(120)
    expect(withBoss.total - xpBreakdown(winning(), '2026-10-26').total).toBe(100)
  })
})

describe('weekly report', () => {
  it('sums up the finished week', () => {
    const h = history({
      weighIns: [...weighIns('2026-10-12', [70, 70, 70]), ...weighIns(WEEK, [69.6, 69.6, 69.6])],
      sleeps: [{ wakeDate: '2026-10-20', minutes: 450 }],
    })
    const report = weeklyReport(h, WEEK)
    expect(report).toMatchObject({
      weekStart: WEEK,
      weighIns: 3,
      averageKg: 69.6,
      changeKg: -0.4,
      questDays: 0,
    })
    expect(report.summary.sleepAvgMin).toBe(450)
    expect(weeklyReport(history(), WEEK)).toMatchObject({
      averageKg: undefined,
      changeKg: undefined,
    })
  })
})
