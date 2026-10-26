import { describe, expect, it } from 'vitest'
import { achievements } from './achievements'
import { addDays, datesInRange } from './date'
import type { QuestHistory } from './quests'

const SETUP = '2026-10-01'

function history(patch: Partial<QuestHistory> = {}): QuestHistory {
  return {
    profile: { setupDate: SETUP, birthDate: '2001-10-25', sleepTargetMin: 420, blockMin: 50 },
    targets: [{ startsOn: SETUP, kcal: 2000, proteinQuestThresholdG: 60 }],
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
    ...patch,
  }
}

const byId = (h: QuestHistory, today: string) =>
  Object.fromEntries(achievements(h, today).map((a) => [a.id, a]))

describe('achievements (plan §7)', () => {
  it('starts with everything locked', () => {
    expect(
      achievements(history(), '2026-10-05').every((a) => !a.unlocked && a.progress === 0),
    ).toBe(true)
    expect(achievements(history(), '2026-09-01')).toHaveLength(5)
  })

  it('unlocks Scholar at 100 study blocks and Protein Hunter at 30 protein days', () => {
    const dates = datesInRange(SETUP, addDays(SETUP, 29))
    const item = {
      foodId: 1,
      name: 'Egg',
      portion: 1,
      kcal: 100,
      proteinG: 70,
      countsAsProtein: true,
    }
    const h = history({
      study: dates.map((date) => ({
        date,
        minutes: 250,
        completed: true,
        source: 'timer' as const,
      })),
      meals: dates.map((date) => ({ date, slot: 'lunch' as const, items: [item] })),
    })
    const all = byId(h, addDays(SETUP, 29))
    expect(all.scholar).toMatchObject({ progress: 100, unlocked: true }) // 5 a day × 20 days
    // Days 1–14 are calibration, so threshold days start on day 15: 16 of 30 so far.
    expect(all.proteinHunter).toMatchObject({ progress: 16, unlocked: false })
  })

  it('counts records, checks and the best streak', () => {
    const h = history({
      exercises: [{ id: 1, type: 'reps' }],
      sets: [1, 2, 3].map((n, i) => ({
        date: addDays(SETUP, i),
        exerciseId: 1,
        setNumber: 1,
        done: true,
        reps: n * 5,
      })),
      checks: [{ date: '2026-10-03' }, { date: '2026-10-20' }, { date: '2026-11-20' }],
    })
    const all = byId(h, '2026-10-25')
    expect(all.prBreaker).toMatchObject({ progress: 2, goal: 10 })
    expect(all.checkpoint).toMatchObject({ progress: 2, unlocked: false })
    expect(byId(h, '2026-11-20').checkpoint?.unlocked).toBe(true)
    expect(all.ironWeek).toMatchObject({ progress: 0, goal: 7 })
  })
})
