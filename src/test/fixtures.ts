import { db } from '../db/db'
import type { TableName } from '../db/schema'
import type { TableRows } from '../db/types'

export type SampleTables = { [K in TableName]: TableRows[K][] }

/** One or two realistic rows for every table, used by backup tests. */
export function sampleTables(): SampleTables {
  return {
    profile: [
      {
        id: 'me',
        nickname: 'Sam',
        sex: 'male',
        birthDate: '2001-10-25',
        heightCm: 169,
        activityLevel: 'moderate',
        goal: 'lose',
        pace: 'standard',
        goalWeightKg: 64,
        workoutsPerWeek: 4,
        flexDaysPerWeek: 1,
        sleepTargetMin: 420,
        studyGoalHours: 20,
        blockMin: 50,
        setupDate: '2026-10-01',
      },
    ],
    targetHistory: [
      {
        id: 1,
        startsOn: '2026-10-01',
        kcal: 2021,
        kcalFloor: 1626,
        proteinG: 124,
        proteinQuestThresholdG: null,
        reason: 'setup',
      },
    ],
    days: [{ date: '2026-10-25', isFlexDay: true, isPlannedRest: false }],
    // The exam on 20 Nov gives exam mode from 6 Nov to 21 Nov (plan §7).
    examPeriods: [{ id: 1, startsOn: '2026-11-06', endsOn: '2026-11-21', source: 'auto' }],
    settings: [
      { key: 'debug', value: true },
      { key: 'fitnessCheckIntervalWeeks', value: 4 },
    ],
    foods: [
      {
        id: 1,
        name: 'Rice',
        category: 'staple',
        serving: '1 cup cooked',
        unit: 'cups',
        kcal: 200,
        proteinG: 4,
        countsAsProtein: false,
      },
      {
        id: 2,
        name: 'Chicken curry',
        category: 'curry',
        serving: '1 serving',
        unit: 'size',
        kcal: 200,
        proteinG: 20,
        countsAsProtein: true,
      },
    ],
    meals: [
      {
        id: 1,
        date: '2026-10-25',
        at: new Date(2026, 9, 25, 13, 5).getTime(),
        slot: 'lunch',
        items: [
          { foodId: 1, name: 'Rice', portion: 2, kcal: 400, proteinG: 8, countsAsProtein: false },
          {
            foodId: 2,
            name: 'Chicken curry',
            portion: 1,
            kcal: 200,
            proteinG: 20,
            countsAsProtein: true,
          },
        ],
        kcal: 600,
        proteinG: 28,
        source: 'tap',
      },
    ],
    combos: [{ id: 1, name: 'Usual lunch', items: [{ foodId: 1, portion: 2 }] }],
    exercises: [{ id: 1, name: 'Squat', muscleGroup: 'Legs', type: 'weight-reps' }],
    workoutPlans: [
      {
        id: 1,
        name: 'Full body',
        kind: 'normal',
        days: [{ weekday: 1, exercises: [{ exerciseId: 1, sets: 3, repMin: 6, repMax: 10 }] }],
      },
    ],
    workoutSets: [
      {
        id: 1,
        date: '2026-10-26',
        startedAt: new Date(2026, 9, 26, 18).getTime(),
        exerciseId: 1,
        setNumber: 1,
        reps: 8,
        weightKg: 60,
        done: true,
      },
    ],
    fitnessChecks: [
      {
        id: 1,
        date: '2026-10-03',
        waistCm: 84,
        pushups: 20,
        lifts: [{ exerciseId: 1, e1rmKg: 76 }],
      },
    ],
    sleepLogs: [
      {
        id: 1,
        wakeDate: '2026-10-26',
        bedAt: new Date(2026, 9, 25, 23, 30).getTime(),
        wakeAt: new Date(2026, 9, 26, 6, 30).getTime(),
        minutes: 420,
        source: 'tap',
      },
    ],
    bodyLogs: [{ id: 1, date: '2026-10-25', at: new Date(2026, 9, 25, 7).getTime(), weightKg: 69 }],
    subjects: [{ id: 1, name: 'Maths' }],
    studySessions: [
      {
        id: 1,
        date: '2026-10-25',
        startedAt: new Date(2026, 9, 25, 23, 40).getTime(),
        subjectId: 1,
        minutes: 50,
        completed: true,
        source: 'timer',
      },
    ],
    events: [{ id: 1, date: '2026-11-20', type: 'exam', title: 'Maths paper', subjectId: 1 }],
    moodLogs: [{ id: 1, date: '2026-10-25', energy: 4, mood: 3 }],
    stepsLogs: [{ id: 1, date: '2026-10-24', steps: 8234, source: 'import' }],
    exportLogs: [{ id: 1, at: new Date(2026, 9, 19, 9).getTime(), date: '2026-10-19' }],
  }
}

/** Saves the sample profile, so screens behind the setup gate can render. */
export async function seedProfile(): Promise<void> {
  await db.profile.put(sampleTables().profile[0]!)
}
