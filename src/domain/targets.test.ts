import { describe, expect, it } from 'vitest'
import {
  ADULT_AGE,
  calculateTargets,
  calorieFloor,
  kcalRange,
  minProteinG,
  proteinBasisKg,
  roundKcal,
  validateTargetEdits,
  type TargetInput,
} from './targets'

/** Plan §15: male, 25, 169 cm, 69 kg, moderate activity, losing fat at standard pace. */
const PLAN_CASE: TargetInput = {
  sex: 'male',
  age: 25,
  heightCm: 169,
  weightKg: 69,
  activityLevel: 'moderate',
  goal: 'lose',
  pace: 'standard',
}

describe('plan §15 known answers', () => {
  const t = calculateTargets(PLAN_CASE)

  it('BMR is 1,626 kcal', () => {
    expect(t.bmr).toBe(1626)
  })

  it('maintenance is 2,521 kcal', () => {
    expect(t.tdee).toBe(2521)
  })

  it('the calorie target is about 2,020 kcal, shown as 1,970–2,070', () => {
    expect(t.kcal).toBe(2021)
    expect(roundKcal(t.kcal)).toBe(2020)
    expect(kcalRange(t.kcal)).toEqual({ low: 1970, high: 2070 })
  })

  it('the floor is 1,626 kcal (the BMR, higher than 1,500)', () => {
    expect(t.kcalFloor).toBe(1626)
  })

  it('protein is 124 g', () => {
    expect(t.proteinG).toBe(124)
  })
})

describe('BMR by sex', () => {
  const base = { ...PLAN_CASE, goal: 'maintain' as const }

  it('uses +5 for male, −161 for female and the midpoint −78 for other', () => {
    expect(calculateTargets({ ...base, sex: 'male' }).bmr).toBe(1626)
    expect(calculateTargets({ ...base, sex: 'female' }).bmr).toBe(1460)
    expect(calculateTargets({ ...base, sex: 'other' }).bmr).toBe(1543)
  })
})

describe('calorie floor', () => {
  it('is the higher of BMR and 1,500 (male), 1,200 (female) or 1,350 (other)', () => {
    expect(calorieFloor('male', 1400)).toBe(1500)
    expect(calorieFloor('female', 1100)).toBe(1200)
    expect(calorieFloor('other', 1300)).toBe(1350)
    expect(calorieFloor('female', 1460)).toBe(1460)
  })

  it('is never undercut by the target', () => {
    // A small, sedentary person losing fat: TDEE − 500 lands below the floor.
    const t = calculateTargets({
      sex: 'female',
      age: 40,
      heightCm: 150,
      weightKg: 45,
      activityLevel: 'sedentary',
      goal: 'lose',
      pace: 'standard',
    })
    expect(t.tdee - 500).toBeLessThan(t.kcalFloor)
    expect(t.kcal).toBe(t.kcalFloor)
    expect(t.floorApplied).toBe(true)
  })
})

describe('calorie target by goal and pace', () => {
  it('slow fat loss is maintenance − 250', () => {
    expect(calculateTargets({ ...PLAN_CASE, pace: 'slow' }).kcal).toBe(2271)
  })

  it('maintain is maintenance', () => {
    expect(calculateTargets({ ...PLAN_CASE, goal: 'maintain' }).kcal).toBe(2521)
  })

  it('build muscle is maintenance + 250', () => {
    expect(calculateTargets({ ...PLAN_CASE, goal: 'gain' }).kcal).toBe(2771)
  })

  it.each([
    ['sedentary', 1952], // 1,626.25 × 1.2 = 1,951.5
    ['light', 2236],
    ['very', 2805],
  ] as const)('uses the %s activity factor', (activityLevel, tdee) => {
    expect(calculateTargets({ ...PLAN_CASE, activityLevel }).tdee).toBe(tdee)
  })
})

describe('under 18', () => {
  const teen = { ...PLAN_CASE, age: 16 }

  it('keeps calories at maintenance even when fat loss is asked for', () => {
    const t = calculateTargets(teen)
    expect(t.isMinor).toBe(true)
    expect(t.kcal).toBe(t.tdee)
  })

  it('keeps calories at maintenance for build muscle too', () => {
    const t = calculateTargets({ ...teen, goal: 'gain' })
    expect(t.kcal).toBe(t.tdee)
  })

  it('treats 18 as an adult', () => {
    expect(ADULT_AGE).toBe(18)
    expect(calculateTargets({ ...PLAN_CASE, age: 18 }).isMinor).toBe(false)
    expect(calculateTargets({ ...PLAN_CASE, age: 17 }).isMinor).toBe(true)
  })
})

describe('protein', () => {
  it('uses body weight when BMI is under 30', () => {
    expect(proteinBasisKg({ heightCm: 169, weightKg: 85.6 })).toBe(85.6) // BMI 29.97
  })

  it('uses the goal weight when BMI is 30 or more', () => {
    expect(proteinBasisKg({ heightCm: 170, weightKg: 100, goalWeightKg: 80 })).toBe(80)
  })

  it('uses the weight at BMI 25 when BMI is 30 or more and there is no goal weight', () => {
    expect(proteinBasisKg({ heightCm: 170, weightKg: 100 })).toBeCloseTo(72.25, 2)
    expect(calculateTargets({ ...PLAN_CASE, heightCm: 170, weightKg: 100 }).proteinG).toBe(130)
  })

  it('never lets an edit go below 1.6 g per kg', () => {
    expect(minProteinG(69)).toBe(111)
  })
})

describe('validateTargetEdits', () => {
  const t = calculateTargets(PLAN_CASE)

  it('accepts edits at or above the floor and 1.6 g/kg', () => {
    expect(validateTargetEdits(t, { kcal: 1800, proteinG: 111 })).toEqual({})
  })

  it('rejects calories below the floor', () => {
    expect(validateTargetEdits(t, { kcal: 1600, proteinG: 124 })).toEqual({ kcal: 'below-floor' })
  })

  it('rejects protein below 1.6 g/kg', () => {
    expect(validateTargetEdits(t, { kcal: 2021, proteinG: 110 })).toEqual({
      proteinG: 'below-minimum',
    })
  })

  it('rejects numbers that are not sensible', () => {
    expect(validateTargetEdits(t, { kcal: Number.NaN, proteinG: 9999 })).toEqual({
      kcal: 'invalid',
      proteinG: 'invalid',
    })
  })
})

describe('kcal display helpers', () => {
  it('rounds to the nearest 10', () => {
    expect(roundKcal(2014)).toBe(2010)
    expect(roundKcal(2015)).toBe(2020)
  })

  it('gives a ±50 range around the rounded target', () => {
    expect(kcalRange(1626)).toEqual({ low: 1580, high: 1680 })
  })
})
