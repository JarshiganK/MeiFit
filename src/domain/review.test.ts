import { describe, expect, it } from 'vitest'
import type { QuestHistory } from './quests'
import { periodSummary } from './review'

function history(patch: Partial<QuestHistory> = {}): QuestHistory {
  return {
    profile: {
      setupDate: '2026-10-01',
      birthDate: '2001-10-25',
      sleepTargetMin: 420,
      blockMin: 50,
    },
    targets: [{ startsOn: '2026-10-01', kcal: 2000, proteinQuestThresholdG: 90 }],
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
    ...patch,
  }
}

const item = (kcal: number, proteinG: number) => ({
  foodId: 1,
  name: 'Food',
  portion: 1,
  kcal,
  proteinG,
  countsAsProtein: true,
})

describe('periodSummary', () => {
  it('averages sleep, food and study over the days logged', () => {
    const summary = periodSummary(
      history({
        sleeps: [
          { wakeDate: '2026-10-20', minutes: 400 },
          { wakeDate: '2026-10-20', minutes: 30 }, // a nap: the main sleep counts
          { wakeDate: '2026-10-21', minutes: 440 },
          { wakeDate: '2026-10-30', minutes: 600 }, // outside the period
        ],
        meals: [
          { date: '2026-10-20', slot: 'lunch', items: [item(1800, 80)] },
          { date: '2026-10-21', slot: 'lunch', items: [item(2200, 100)] },
        ],
        study: [
          { date: '2026-10-20', minutes: 50, completed: true, source: 'timer' },
          { date: '2026-10-22', minutes: 25, completed: false, source: 'timer' },
        ],
      }),
      '2026-10-19',
      '2026-10-25',
    )
    expect(summary).toEqual({
      days: 7,
      sleepAvgMin: 420,
      nightsLogged: 2,
      studyMinutes: 75,
      proteinAvgG: 90,
      kcalAvg: 2000,
      foodDays: 2,
      workoutsDone: 0,
      workoutsPlanned: 0,
    })
  })

  it('counts training days done against planned', () => {
    const plan = { days: [{ weekday: 1, exercises: [{ exerciseId: 1, sets: 1 }] }] }
    const summary = periodSummary(
      history({
        plan,
        sets: [{ date: '2026-10-19', exerciseId: 1, setNumber: 1, done: true }],
      }),
      '2026-10-19',
      '2026-10-27',
    )
    // Mondays the 19th (done) and the 26th (not done).
    expect([summary.workoutsDone, summary.workoutsPlanned]).toEqual([1, 2])
  })

  it('is empty for an empty or backwards period', () => {
    expect(periodSummary(history(), '2026-10-25', '2026-10-24')).toMatchObject({
      days: 0,
      sleepAvgMin: null,
      proteinAvgG: null,
      kcalAvg: null,
    })
  })
})
