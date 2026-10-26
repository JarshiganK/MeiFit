import { describe, expect, it } from 'vitest'
import { addDays, datesInRange } from './date'
import type { QuestHistory } from './quests'
import { streakFor, walkStreak } from './streak'

const START = '2026-10-01'

/** A streak walk where `missed` days don't count. */
function walk(today: string, missed: string[] = [], from = START) {
  return walkStreak((date) => !missed.includes(date), from, today)
}

describe('streaks and shields (plan §7)', () => {
  it('earns the first shield after 7 days in a row', () => {
    expect(walk('2026-10-06')).toMatchObject({ current: 6, shields: 0 })
    expect(walk('2026-10-07')).toMatchObject({ current: 7, shields: 1 })
  })

  it('earns a second shield at 14 days, and never holds more than 2', () => {
    expect(walk('2026-10-14')).toMatchObject({ current: 14, shields: 2 })
    expect(walk('2026-10-28')).toMatchObject({ current: 28, shields: 2 })
  })

  it('uses a shield on a missed day and keeps the streak', () => {
    const state = walk('2026-10-10', ['2026-10-08'])
    expect(state).toMatchObject({ current: 9, shields: 0, shieldedDays: ['2026-10-08'] })
  })

  it('breaks the streak on a missed day without a shield', () => {
    const state = walk('2026-10-10', ['2026-10-05'])
    expect(state).toMatchObject({ current: 5, best: 5, shields: 0, shieldedDays: [] })
  })

  it('uses both shields on two missed days, then breaks on the third', () => {
    const missed = ['2026-10-15', '2026-10-16', '2026-10-17']
    const state = walk('2026-10-19', missed)
    expect(state.shieldedDays).toEqual(['2026-10-15', '2026-10-16'])
    expect(state).toMatchObject({ current: 2, best: 14, shields: 0 })
  })

  it('never counts today as missed before midnight', () => {
    expect(walk('2026-10-05', ['2026-10-05'])).toMatchObject({ current: 4, todayCounts: false })
    expect(walk('2026-10-05')).toMatchObject({ current: 5, todayCounts: true })
  })

  it('starts at the setup date', () => {
    expect(walk('2026-09-30')).toMatchObject({ current: 0, best: 0, todayCounts: false })
    expect(walk(START)).toMatchObject({ current: 1 })
  })
})

describe('streakFor', () => {
  function history(perfectDays: string[]): QuestHistory {
    const item = {
      foodId: 1,
      name: 'Egg',
      portion: 1,
      kcal: 70,
      proteinG: 30,
      countsAsProtein: true,
    }
    return {
      profile: { setupDate: START, birthDate: '2001-10-25', sleepTargetMin: 420, blockMin: 50 },
      targets: [{ startsOn: START, kcal: 2000, proteinQuestThresholdG: null }],
      days: [],
      meals: perfectDays.flatMap((date) =>
        (['breakfast', 'lunch', 'dinner'] as const).map((slot) => ({
          date,
          slot,
          items: [item, item],
        })),
      ),
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
    }
  }

  it('counts days with at least 5 quests done', () => {
    // All four food quests plus a study block: 5 quests.
    const days = datesInRange(START, '2026-10-03')
    const h = history(days)
    h.study = days.map((date) => ({ date, minutes: 50, completed: true, source: 'timer' as const }))
    expect(streakFor(h, '2026-10-03')).toMatchObject({
      current: 3,
      todayDone: 5,
      todayCounts: true,
    })
    // Food alone is only 4.
    expect(streakFor(history(days), '2026-10-03')).toMatchObject({ current: 0, todayDone: 4 })
    expect(streakFor(history([]), addDays(START, -1)).todayDone).toBe(0)
  })
})
