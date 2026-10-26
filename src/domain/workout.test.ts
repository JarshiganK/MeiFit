import { describe, expect, it } from 'vitest'
import {
  activePlan,
  dayRule,
  defaultTarget,
  isPlannedRest,
  planDayFor,
  restDaysToWrite,
  sortDays,
  validateTarget,
  workoutsInPlan,
  type PlanShape,
} from './workout'

// Monday, Wednesday and Friday.
const plan: PlanShape = {
  days: [
    { weekday: 5, exercises: [defaultTarget(3, 'seconds')] },
    { weekday: 1, exercises: [defaultTarget(1, 'weight-reps')] },
    { weekday: 3, exercises: [defaultTarget(2, 'reps')] },
  ],
}

describe('plan days', () => {
  it('maps plan days to weekdays; other days are planned rest', () => {
    expect(planDayFor(plan, '2026-10-26')?.weekday).toBe(1) // Monday
    expect(isPlannedRest(plan, '2026-10-26')).toBe(false)
    expect(isPlannedRest(plan, '2026-10-27')).toBe(true) // Tuesday
    expect(isPlannedRest(plan, '2026-10-25')).toBe(true) // Sunday
  })

  it('has no planned rest without a plan', () => {
    expect(isPlannedRest(undefined, '2026-10-27')).toBe(false)
    expect(isPlannedRest({ days: [] }, '2026-10-27')).toBe(false)
    expect(planDayFor(undefined, '2026-10-27')).toBeUndefined()
  })

  it('counts workouts and sorts days Monday to Sunday', () => {
    expect(workoutsInPlan(plan)).toBe(3)
    expect(workoutsInPlan(undefined)).toBe(0)
    expect(sortDays(plan.days).map((d) => d.weekday)).toEqual([1, 3, 5])
  })
})

describe('restDaysToWrite (approved default)', () => {
  it('writes every missing day since the last saved one, from the plan as it is now', () => {
    expect(
      restDaysToWrite('2026-10-22', '2026-10-26', () => plan, new Set(['2026-10-22'])),
    ).toEqual([
      { date: '2026-10-23', isFlexDay: false, isPlannedRest: false, plannedSets: 3 }, // Friday
      { date: '2026-10-24', isFlexDay: false, isPlannedRest: true },
      { date: '2026-10-25', isFlexDay: false, isPlannedRest: true },
      { date: '2026-10-26', isFlexDay: false, isPlannedRest: false, plannedSets: 3 }, // Monday
    ])
  })

  it('writes only today the first time, and never overwrites a saved day', () => {
    expect(restDaysToWrite(undefined, '2026-10-27', () => plan, new Set())).toEqual([
      { date: '2026-10-27', isFlexDay: false, isPlannedRest: true },
    ])
    expect(
      restDaysToWrite('2026-10-27', '2026-10-27', () => plan, new Set(['2026-10-27'])),
    ).toEqual([])
    expect(
      restDaysToWrite(
        '2026-10-24',
        '2026-10-26',
        () => plan,
        new Set(['2026-10-24', '2026-10-25']),
      ),
    ).toEqual([{ date: '2026-10-26', isFlexDay: false, isPlannedRest: false, plannedSets: 3 }])
  })
})

describe('dayRule', () => {
  it('saves the planned sets on training days', () => {
    expect(dayRule(plan, '2026-10-26')).toEqual({ isPlannedRest: false, plannedSets: 3 })
    expect(dayRule(plan, '2026-10-27')).toEqual({ isPlannedRest: true })
    expect(dayRule(undefined, '2026-10-27')).toEqual({ isPlannedRest: false })
  })
})

describe('activePlan', () => {
  const exam = { days: [{ weekday: 2, exercises: [] }] }
  it('uses the exam plan on exam days when it has training days', () => {
    expect(activePlan(true, plan, exam)).toBe(exam)
    expect(activePlan(false, plan, exam)).toBe(plan)
    expect(activePlan(true, plan, { days: [] })).toBe(plan)
    expect(activePlan(true, plan, undefined)).toBe(plan)
  })
})

describe('targets', () => {
  it('starts each exercise type with sensible targets', () => {
    expect(defaultTarget(1, 'weight-reps')).toEqual({
      exerciseId: 1,
      sets: 3,
      repMin: 8,
      repMax: 12,
      targetKg: 20,
    })
    expect(defaultTarget(2, 'reps')).toEqual({ exerciseId: 2, sets: 3, repMin: 8, repMax: 12 })
    expect(defaultTarget(3, 'seconds')).toEqual({ exerciseId: 3, sets: 3, seconds: 30 })
  })

  it('accepts the defaults', () => {
    for (const type of ['weight-reps', 'reps', 'seconds'] as const) {
      expect(validateTarget(defaultTarget(1, type), type)).toEqual([])
    }
  })

  it('checks sets, reps, their order, seconds and weight', () => {
    expect(validateTarget({ exerciseId: 1, sets: 0, repMin: 8, repMax: 12 }, 'reps')).toEqual([
      'sets',
    ])
    expect(validateTarget({ exerciseId: 1, sets: 3, repMin: 12, repMax: 8 }, 'reps')).toEqual([
      'repOrder',
    ])
    expect(validateTarget({ exerciseId: 1, sets: 3, repMin: 8 }, 'reps')).toEqual(['reps'])
    expect(validateTarget({ exerciseId: 1, sets: 3, repMin: 8.5, repMax: 9 }, 'reps')).toEqual([
      'reps',
    ])
    expect(validateTarget({ exerciseId: 1, sets: 2.5, seconds: 2 }, 'seconds')).toEqual([
      'sets',
      'seconds',
    ])
    expect(
      validateTarget(
        { exerciseId: 1, sets: 3, repMin: 5, repMax: 5, targetKg: 501 },
        'weight-reps',
      ),
    ).toEqual(['kg'])
  })
})
