import { describe, expect, it } from 'vitest'
import {
  DEFAULT_ROUTINE,
  ageBand,
  baselineDateRange,
  buildSetup,
  defaultBaselineDate,
  validateAboutYou,
  validateGoal,
  validateRoutine,
  type SetupAnswers,
} from './setup'

const TODAY = '2026-10-25' // a Sunday
const NOW = new Date(2026, 9, 25, 9, 30).getTime()

const ANSWERS: SetupAnswers = {
  nickname: 'Sam',
  sex: 'male',
  birthDate: '2001-10-25',
  heightCm: 169,
  weightKg: 69,
  activityLevel: 'moderate',
  goal: 'lose',
  pace: 'standard',
  ...DEFAULT_ROUTINE,
}

describe('ageBand', () => {
  it('stops under 13, marks 13–17 as minors and 18+ as adults', () => {
    expect(ageBand('2013-10-26', TODAY)).toBe('too-young') // 12, turns 13 tomorrow
    expect(ageBand('2013-10-25', TODAY)).toBe('minor') // 13 today
    expect(ageBand('2008-10-26', TODAY)).toBe('minor') // 17
    expect(ageBand('2008-10-25', TODAY)).toBe('adult') // 18 today
  })
})

describe('validateAboutYou', () => {
  it('accepts sensible answers', () => {
    expect(validateAboutYou(ANSWERS, TODAY)).toEqual({})
  })

  it('needs every field', () => {
    expect(validateAboutYou({}, TODAY)).toEqual({
      nickname: 'required',
      sex: 'required',
      birthDate: 'required',
      heightCm: 'required',
      weightKg: 'required',
      activityLevel: 'required',
    })
  })

  it('trims the nickname and limits its length', () => {
    expect(validateAboutYou({ ...ANSWERS, nickname: '   ' }, TODAY).nickname).toBe('required')
    expect(validateAboutYou({ ...ANSWERS, nickname: 'x'.repeat(31) }, TODAY).nickname).toBe(
      'too-long',
    )
  })

  it('rejects dates of birth that are invalid, in the future or under 13', () => {
    expect(validateAboutYou({ ...ANSWERS, birthDate: '2001-02-30' }, TODAY).birthDate).toBe(
      'invalid',
    )
    expect(validateAboutYou({ ...ANSWERS, birthDate: '2026-10-26' }, TODAY).birthDate).toBe(
      'future',
    )
    expect(validateAboutYou({ ...ANSWERS, birthDate: '2015-01-01' }, TODAY).birthDate).toBe(
      'too-young',
    )
    expect(validateAboutYou({ ...ANSWERS, birthDate: '1900-01-01' }, TODAY).birthDate).toBe(
      'too-high',
    )
  })

  it.each([
    ['heightCm', 119, 'too-low'],
    ['heightCm', 231, 'too-high'],
    ['weightKg', 29.9, 'too-low'],
    ['weightKg', 250.1, 'too-high'],
    ['heightCm', Number.NaN, 'required'],
  ] as const)('checks %s = %s', (field, value, error) => {
    expect(validateAboutYou({ ...ANSWERS, [field]: value }, TODAY)[field]).toBe(error)
  })

  it('accepts the edges of each range', () => {
    expect(validateAboutYou({ ...ANSWERS, heightCm: 120, weightKg: 250 }, TODAY)).toEqual({})
  })
})

describe('validateGoal', () => {
  it('accepts no goal weight or waist (both optional)', () => {
    expect(validateGoal(ANSWERS, TODAY)).toEqual({})
  })

  it('checks optional goal weight and waist ranges', () => {
    expect(validateGoal({ ...ANSWERS, goalWeightKg: 20, goalWaistCm: 300 }, TODAY)).toEqual({
      goalWeightKg: 'too-low',
      goalWaistCm: 'too-high',
    })
  })

  it('does not allow fat loss under 18', () => {
    expect(validateGoal({ ...ANSWERS, birthDate: '2010-01-01' }, TODAY)).toEqual({
      goal: 'not-for-minors',
    })
  })
})

describe('validateRoutine', () => {
  it('accepts the defaults', () => {
    expect(validateRoutine(ANSWERS)).toEqual({})
    expect(DEFAULT_ROUTINE.sleepTargetMin).toBe(420) // plan §2: 7 h
    expect(DEFAULT_ROUTINE.blockMin).toBe(50) // plan §2: 50 min
  })

  it('keeps each answer in range', () => {
    expect(
      validateRoutine({
        ...ANSWERS,
        workoutsPerWeek: 8,
        flexDaysPerWeek: 5,
        sleepTargetMin: 200,
        studyGoalHours: -1,
        blockMin: 10,
      }),
    ).toEqual({
      workoutsPerWeek: 'too-high',
      flexDaysPerWeek: 'too-high',
      sleepTargetMin: 'too-low',
      studyGoalHours: 'too-low',
      blockMin: 'too-low',
    })
  })
})

describe('baseline fitness check date', () => {
  it('defaults to the next Saturday, within 7 days', () => {
    expect(defaultBaselineDate('2026-10-25')).toBe('2026-10-31') // Sunday → Saturday
    expect(defaultBaselineDate('2026-10-30')).toBe('2026-10-31') // Friday → tomorrow
    expect(defaultBaselineDate('2026-10-31')).toBe('2026-11-07') // Saturday → next week
  })

  it('can be booked from today up to 7 days ahead', () => {
    expect(baselineDateRange(TODAY)).toEqual({ min: '2026-10-25', max: '2026-11-01' })
  })
})

describe('buildSetup', () => {
  it('turns the answers into a profile, a target row and a first weigh-in', () => {
    const result = buildSetup({ ...ANSWERS, nickname: '  Sam  ' }, NOW)
    expect(result.profile).toEqual({
      nickname: 'Sam',
      sex: 'male',
      birthDate: '2001-10-25',
      heightCm: 169,
      activityLevel: 'moderate',
      goal: 'lose',
      pace: 'standard',
      ...DEFAULT_ROUTINE,
      setupDate: TODAY,
    })
    expect(result.target).toEqual({
      startsOn: TODAY,
      kcal: 2021,
      kcalFloor: 1626,
      proteinG: 124,
      proteinQuestThresholdG: null,
      reason: 'setup',
    })
    expect(result.weighIn).toEqual({ date: TODAY, at: NOW, weightKg: 69 })
  })

  it('uses the user’s edited targets', () => {
    const result = buildSetup(ANSWERS, NOW, { edits: { kcal: 1900, proteinG: 130 } })
    expect(result.target).toMatchObject({ kcal: 1900, proteinG: 130 })
  })

  it('keeps optional goals only when given', () => {
    const result = buildSetup({ ...ANSWERS, goalWeightKg: 64, goalWaistCm: 80 }, NOW)
    expect(result.profile).toMatchObject({ goalWeightKg: 64, goalWaistCm: 80 })
    expect('goalWeightKg' in buildSetup(ANSWERS, NOW).profile).toBe(false)
  })

  it('keeps the first setup date and the protein threshold when setup is rerun', () => {
    const result = buildSetup(ANSWERS, NOW, {
      previous: { setupDate: '2026-10-01', proteinQuestThresholdG: 95 },
    })
    expect(result.profile.setupDate).toBe('2026-10-01')
    expect(result.target.proteinQuestThresholdG).toBe(95)
  })

  it('keeps under-18s at maintenance with no flex days and no fat-loss goal', () => {
    const result = buildSetup(
      { ...ANSWERS, birthDate: '2010-01-01', goal: 'lose', flexDaysPerWeek: 2 },
      NOW,
    )
    expect(result.profile.goal).toBe('maintain')
    expect(result.profile.flexDaysPerWeek).toBe(0)
    expect(result.target.kcal).toBe(result.targets.tdee)
    expect(result.targets.isMinor).toBe(true)
  })

  it('never stores an edited calorie target below the floor', () => {
    const result = buildSetup(ANSWERS, NOW, { edits: { kcal: 1000, proteinG: 50 } })
    expect(result.target.kcal).toBe(1626)
    expect(result.target.proteinG).toBe(111)
  })
})
