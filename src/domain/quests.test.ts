import { describe, expect, it } from 'vitest'
import type { MealItem, MealSlot } from './food'
import {
  bonusXp,
  dayXp,
  indexHistory,
  questsForDay,
  totalXp,
  weeklyQuests,
  xpBreakdown,
  type QuestHistory,
  type QuestId,
  type QuestResult,
} from './quests'

const SETUP = '2026-10-01'
const DAY = '2026-10-26' // a Monday, after calibration

const item = (proteinG: number, countsAsProtein: boolean, kcal = 200): MealItem => ({
  foodId: 1,
  name: 'Food',
  portion: 1,
  kcal,
  proteinG,
  countsAsProtein,
})
const meal = (slot: MealSlot, items: MealItem[], date = DAY) => ({ date, slot, items })

function history(patch: Partial<QuestHistory> = {}): QuestHistory {
  return {
    profile: { setupDate: SETUP, birthDate: '2001-10-25', sleepTargetMin: 420, blockMin: 50 },
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
    ...patch,
  }
}

function quests(h: QuestHistory, date = DAY): Record<QuestId, QuestResult> {
  return Object.fromEntries(questsForDay(indexHistory(h), date).map((q) => [q.id, q])) as Record<
    QuestId,
    QuestResult
  >
}

describe('food quests (plan §7)', () => {
  it('needs a protein at breakfast and two at lunch', () => {
    const q = quests(
      history({
        meals: [
          meal('breakfast', [item(6, true)]),
          meal('lunch', [item(20, true), item(4, false)]),
          meal('lunch', [item(12, true)]),
        ],
      }),
    )
    expect(q.proteinBreakfast).toMatchObject({ done: true, xp: 10 })
    expect(q.lunchProteins).toMatchObject({ done: true, xp: 10, progress: { value: 2, max: 2 } })
  })

  it('counts lunch with one protein item as not done', () => {
    const q = quests(history({ meals: [meal('lunch', [item(30, true), item(5, false)])] }))
    expect(q.lunchProteins).toMatchObject({ done: false, xp: 0, progress: { value: 1, max: 2 } })
  })

  it('wants two proteins at dinner on a normal day', () => {
    const q = quests(history({ meals: [meal('dinner', [item(20, true), item(6, true)])] }))
    expect(q.dinner).toMatchObject({ done: true, xp: 10 })
    expect(q.dinner.variant).toBeUndefined()
  })

  it('wants dinner within the budget on a flex day', () => {
    const days = [{ date: DAY, isFlexDay: true, isPlannedRest: false }]
    const within = quests(
      history({
        days,
        meals: [meal('lunch', [item(10, false, 800)]), meal('dinner', [item(10, false, 1200)])],
      }),
    )
    expect(within.dinner).toMatchObject({ done: true, variant: 'flexDinner' })
    const over = quests(
      history({
        days,
        meals: [meal('lunch', [item(10, false, 800)]), meal('dinner', [item(10, false, 1251)])],
      }),
    )
    expect(over.dinner.done).toBe(false)
  })

  it('always wants two proteins at dinner for under-18s (owner answer B)', () => {
    const q = quests(
      history({
        profile: { setupDate: SETUP, birthDate: '2010-01-01', sleepTargetMin: 480, blockMin: 50 },
        days: [{ date: DAY, isFlexDay: true, isPlannedRest: false }],
        meals: [meal('dinner', [item(10, false, 300)])],
      }),
    )
    expect(q.dinner).toMatchObject({ done: false })
    expect(q.dinner.variant).toBeUndefined()
  })
})

describe('daily protein and calibration (plan §3)', () => {
  const allMeals = (protein: number, date = DAY) => [
    meal('breakfast', [item(protein / 3, true)], date),
    meal('lunch', [item(protein / 3, true)], date),
    meal('dinner', [item(protein / 3, true)], date),
  ]

  it('is "log all three main meals" in the first 14 days', () => {
    const date = '2026-10-05'
    const q = quests(history({ meals: allMeals(30, date) }), date)
    expect(q.dailyProtein).toMatchObject({ done: true, xp: 20, variant: 'calibration' })
    const partial = quests(history({ meals: allMeals(30, date).slice(0, 2) }), date)
    expect(partial.dailyProtein).toMatchObject({ done: false, progress: { value: 2, max: 3 } })
  })

  it('stays on the calibration rule until a threshold is set', () => {
    const q = quests(
      history({
        targets: [{ startsOn: SETUP, kcal: 2000, proteinQuestThresholdG: null }],
        meals: allMeals(30),
      }),
    )
    expect(q.dailyProtein).toMatchObject({ done: true, variant: 'calibration' })
  })

  it('then needs total protein at or above the threshold', () => {
    expect(quests(history({ meals: allMeals(90) })).dailyProtein).toMatchObject({
      done: true,
      variant: 'threshold',
    })
    expect(quests(history({ meals: allMeals(89.7) })).dailyProtein).toMatchObject({
      done: false,
      progress: { value: 89.7, max: 90 },
    })
  })

  it('uses the threshold that applied on that date', () => {
    const h = history({
      targets: [
        { startsOn: SETUP, kcal: 2000, proteinQuestThresholdG: 90 },
        { startsOn: '2026-10-27', kcal: 2000, proteinQuestThresholdG: 100 },
      ],
      meals: allMeals(95),
    })
    expect(quests(h).dailyProtein.done).toBe(true)
  })
})

describe('workout quest', () => {
  const plan = { days: [{ weekday: 1, exercises: [{ exerciseId: 1, sets: 5 }] }] }
  const sets = (n: number) =>
    Array.from({ length: n }, (_, i) => ({
      date: DAY,
      exerciseId: 1,
      setNumber: i + 1,
      done: true,
    }))

  it('needs 80% of the planned sets saved with the day', () => {
    const days = [{ date: DAY, isFlexDay: false, isPlannedRest: false, plannedSets: 5 }]
    expect(quests(history({ plan, days, sets: sets(4) })).workout).toMatchObject({
      done: true,
      xp: 50,
      progress: { value: 4, max: 5 },
    })
    expect(quests(history({ plan, days, sets: sets(3) })).workout.done).toBe(false)
  })

  it('earns 10 on a planned rest day', () => {
    const days = [{ date: '2026-10-27', isFlexDay: false, isPlannedRest: true }]
    expect(quests(history({ plan, days }), '2026-10-27').workout).toMatchObject({
      done: true,
      xp: 10,
      maxXp: 10,
      variant: 'restDay',
    })
  })

  it('judges another plan day trained on a rest day by that day’s sets', () => {
    const days = [
      {
        date: '2026-10-27',
        isFlexDay: false,
        isPlannedRest: false,
        plannedSets: 5,
        planWeekday: 1,
      },
    ]
    const done = sets(4).map((s) => ({ ...s, date: '2026-10-27' }))
    expect(quests(history({ plan, days, sets: done }), '2026-10-27').workout).toMatchObject({
      done: true,
      variant: 'training',
    })
  })

  it('falls back to the plan for a day with no saved row, capping extra sets', () => {
    const extra = [...sets(5), { date: DAY, exerciseId: 1, setNumber: 6, done: true }]
    expect(quests(history({ plan, sets: extra })).workout.progress).toEqual({ value: 5, max: 5 })
    // Without the plan day, done sets are capped at the planned count.
    const noPlanDay = [
      { date: DAY, isFlexDay: false, isPlannedRest: false, plannedSets: 2, planWeekday: 3 },
    ]
    expect(quests(history({ plan, days: noPlanDay, sets: sets(4) })).workout.progress).toEqual({
      value: 2,
      max: 2,
    })
  })

  it('isn’t available without a plan', () => {
    expect(quests(history()).workout).toMatchObject({ available: false, variant: 'noPlan', xp: 0 })
  })
})

describe('study and sleep quests', () => {
  it('gives 30 INT per block, up to 5', () => {
    const study = [{ date: DAY, minutes: 400, completed: true, source: 'manual' as const }]
    expect(quests(history({ study })).study).toMatchObject({
      done: true,
      xp: 150,
      progress: { value: 5, max: 5 },
    })
    expect(quests(history()).study).toMatchObject({ done: false, xp: 0 })
  })

  it('needs the main sleep ending that day to meet the target', () => {
    const sleeps = [
      { wakeDate: DAY, minutes: 40 },
      { wakeDate: DAY, minutes: 425 },
    ]
    expect(quests(history({ sleeps })).sleep).toMatchObject({ done: true, xp: 20 })
    expect(quests(history({ sleeps: [{ wakeDate: DAY, minutes: 400 }] })).sleep.done).toBe(false)
  })
})

describe('XP (plan §7)', () => {
  it('a full day earns 270 XP', () => {
    const h = history({
      plan: { days: [{ weekday: 1, exercises: [{ exerciseId: 1, sets: 1 }] }] },
      meals: [
        meal('breakfast', [item(20, true)]),
        meal('lunch', [item(40, true), item(20, true)]),
        meal('dinner', [item(20, true), item(10, true)]),
      ],
      sets: [{ date: DAY, exerciseId: 1, setNumber: 1, done: true }],
      study: [{ date: DAY, minutes: 250, completed: true, source: 'timer' }],
      sleeps: [{ wakeDate: DAY, minutes: 480 }],
    })
    expect(dayXp(questsForDay(indexHistory(h), DAY))).toBe(270)
  })

  it('gives weekly XP for 3+ weigh-ins and a backup', () => {
    const h = history({
      weighIns: [{ date: '2026-10-19' }, { date: '2026-10-21' }, { date: '2026-10-25' }],
      exports: [{ date: '2026-10-24' }],
    })
    expect(weeklyQuests(h, '2026-10-22').map((q) => [q.id, q.xp])).toEqual([
      ['weighIns', 20],
      ['backup', 15],
      ['waist', 0], // never measured, so it's due
    ])
    expect(weeklyQuests(h, '2026-10-27').map((q) => q.xp)).toEqual([0, 0, 0])
  })

  it('adds up every day since setup, crediting weekly quests once the week is over', () => {
    const h = history({
      profile: {
        setupDate: '2026-10-19',
        birthDate: '2001-10-25',
        sleepTargetMin: 420,
        blockMin: 50,
      },
      targets: [{ startsOn: '2026-10-19', kcal: 2000, proteinQuestThresholdG: null }],
      sleeps: [
        { wakeDate: '2026-10-20', minutes: 480 },
        { wakeDate: '2026-10-26', minutes: 480 },
      ],
      weighIns: [{ date: '2026-10-19' }, { date: '2026-10-21' }, { date: '2026-10-25' }],
    })
    // Two sleeps (40) + last week's weigh-ins (20), credited on Monday the 26th.
    expect(totalXp(h, '2026-10-26')).toBe(60)
    // On Sunday the week isn't over yet.
    expect(totalXp(h, '2026-10-25')).toBe(20)
    expect(totalXp(h, '2026-10-18')).toBe(0)
  })

  it('recalculates when a log is corrected', () => {
    const sleeps = [{ wakeDate: DAY, minutes: 480 }]
    expect(totalXp(history({ sleeps }), DAY)).toBeGreaterThan(totalXp(history(), DAY))
  })
})

describe('fitness check and waist XP (plan §4, §7)', () => {
  it('credits each check on its date: 50 VIT plus 10 STR per improved test', () => {
    const h = history({
      checks: [
        { date: '2026-10-03', pushups: 20, plankSec: 60 },
        { date: '2026-10-31', pushups: 25, plankSec: 70 }, // two improvements
      ],
    })
    expect(bonusXp(h, '2026-10-30')).toBe(50)
    expect(bonusXp(h, '2026-10-31')).toBe(50 + 70)
  })

  it('credits a waist measurement at most every 2 weeks, from setup on', () => {
    const h = history({
      waists: [
        { date: '2026-09-25' }, // before setup
        { date: '2026-10-03' }, // too soon
        { date: '2026-10-10' },
        { date: '2026-10-20' }, // too soon
      ],
    })
    // 09-25 starts the chain (before setup: no XP); 10-10 is 13+ days on; 10-20 is too soon.
    expect(bonusXp(h, '2026-10-31')).toBe(15)
  })
})

describe('xpBreakdown', () => {
  it('splits XP by stat, with weekly and waist XP as plain XP', () => {
    const h = history({
      profile: {
        setupDate: '2026-10-19',
        birthDate: '2001-10-25',
        sleepTargetMin: 420,
        blockMin: 50,
      },
      sleeps: [{ wakeDate: '2026-10-20', minutes: 480 }],
      study: [{ date: '2026-10-20', minutes: 50, completed: true, source: 'timer' }],
      exports: [{ date: '2026-10-21' }],
      waists: [{ date: '2026-10-22' }],
      checks: [{ date: '2026-10-24', pushups: 20 }],
    })
    expect(xpBreakdown(h, '2026-10-26')).toEqual({
      vit: 20 + 50,
      int: 30,
      str: 0,
      plain: 15 + 15,
      total: 130,
    })
    expect(xpBreakdown(h, '2026-10-18').total).toBe(0)
  })
})

describe('exam mode (plan §7)', () => {
  const examPeriods = [{ startsOn: '2026-10-20', endsOn: '2026-10-30' }]

  it('multiplies study XP by 1.5: 45 per block, 345 for a full day', () => {
    const study = [{ date: DAY, minutes: 250, completed: true, source: 'timer' as const }]
    const q = quests(history({ examPeriods, study }))
    expect(q.study).toMatchObject({ xp: 225, maxXp: 225, variant: 'exam' })
    expect(quests(history({ study })).study).toMatchObject({ xp: 150, maxXp: 150 })
  })

  it('uses the exam workout plan instead of the normal one', () => {
    const plan = { days: [{ weekday: 1, exercises: [{ exerciseId: 1, sets: 5 }] }] }
    const examPlan = { days: [{ weekday: 2, exercises: [{ exerciseId: 2, sets: 2 }] }] }
    // Monday: a training day normally, a rest day in exam mode.
    expect(quests(history({ plan, examPlan, examPeriods })).workout.variant).toBe('restDay')
    expect(quests(history({ plan, examPlan })).workout.variant).toBe('training')
    // An empty exam plan falls back to the normal plan.
    expect(quests(history({ plan, examPlan: { days: [] }, examPeriods })).workout.variant).toBe(
      'training',
    )
  })

  it('hides the waist quest and its XP during exam mode', () => {
    const h = history({ examPeriods, waists: [{ date: '2026-10-25' }] })
    expect(weeklyQuests(h, '2026-10-25').map((q) => q.id)).toEqual(['weighIns', 'backup'])
    expect(bonusXp(h, DAY)).toBe(0)
  })
})
