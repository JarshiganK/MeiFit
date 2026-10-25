/**
 * Calorie and protein targets (plan §2, CLAUDE.md §8, owner answers B and C).
 * All numbers are estimates; the UI always shows calories with "≈".
 */

export type Sex = 'male' | 'female' | 'other'
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'very'
export type Goal = 'lose' | 'maintain' | 'gain'
export type Pace = 'slow' | 'standard'

export const ADULT_AGE = 18

export const ACTIVITY_FACTOR: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  very: 1.725,
}

/** Mifflin-St Jeor constant. "Other" uses the midpoint of the male and female values. */
const SEX_CONSTANT: Record<Sex, number> = { male: 5, female: -161, other: -78 }

/** The lowest the calorie target may go, besides the BMR. */
const FLOOR_MINIMUM: Record<Sex, number> = { male: 1500, female: 1200, other: 1350 }

const DEFICIT: Record<Pace, number> = { slow: 250, standard: 500 }
const SURPLUS = 250

const PROTEIN_G_PER_KG = 1.8
const MIN_PROTEIN_G_PER_KG = 1.6
/** At or above this BMI, protein is based on a goal weight instead of body weight. */
const HIGH_BMI = 30
/** The weight used when BMI is high and there's no goal weight. */
const REFERENCE_BMI = 25

/** Calories are shown as a ±50 range, rounded to 10, because hostel estimates are rough. */
const KCAL_RANGE = 50

export interface TargetInput {
  sex: Sex
  age: number
  heightCm: number
  weightKg: number
  activityLevel: ActivityLevel
  goal: Goal
  pace: Pace
  goalWeightKg?: number | undefined
}

export interface Targets {
  bmr: number
  tdee: number
  kcal: number
  kcalFloor: number
  /** True when the goal's deficit would have gone below the floor. */
  floorApplied: boolean
  proteinG: number
  /** Lowest protein a manual edit may set (1.6 g/kg). */
  proteinMinG: number
  proteinBasisKg: number
  isMinor: boolean
}

export function calorieFloor(sex: Sex, bmr: number): number {
  return Math.round(Math.max(bmr, FLOOR_MINIMUM[sex]))
}

/** Body weight, unless BMI ≥ 30: then the goal weight, or the weight at BMI 25. */
export function proteinBasisKg(input: {
  heightCm: number
  weightKg: number
  goalWeightKg?: number | undefined
}): number {
  const heightM = input.heightCm / 100
  const bmi = input.weightKg / (heightM * heightM)
  if (bmi < HIGH_BMI) return input.weightKg
  return input.goalWeightKg ?? REFERENCE_BMI * heightM * heightM
}

export function minProteinG(basisKg: number): number {
  return Math.ceil(MIN_PROTEIN_G_PER_KG * basisKg)
}

export function calculateTargets(input: TargetInput): Targets {
  const rawBmr =
    10 * input.weightKg + 6.25 * input.heightCm - 5 * input.age + SEX_CONSTANT[input.sex]
  const rawTdee = rawBmr * ACTIVITY_FACTOR[input.activityLevel]
  const isMinor = input.age < ADULT_AGE
  const kcalFloor = calorieFloor(input.sex, rawBmr)

  // Under 18: no deficit and no surplus (CLAUDE.md §8).
  let goalKcal = rawTdee
  if (!isMinor && input.goal === 'lose') goalKcal = rawTdee - DEFICIT[input.pace]
  if (!isMinor && input.goal === 'gain') goalKcal = rawTdee + SURPLUS
  const rounded = Math.round(goalKcal)

  const basis = proteinBasisKg(input)
  return {
    bmr: Math.round(rawBmr),
    tdee: Math.round(rawTdee),
    kcal: Math.max(rounded, kcalFloor),
    kcalFloor,
    floorApplied: rounded < kcalFloor,
    proteinG: Math.round(PROTEIN_G_PER_KG * basis),
    proteinMinG: minProteinG(basis),
    proteinBasisKg: basis,
    isMinor,
  }
}

export type TargetEditError = 'below-floor' | 'below-minimum' | 'invalid'

const MAX_KCAL = 6000
const MAX_PROTEIN_G = 400

/** Checks the user's own calorie and protein numbers on the review screen. */
export function validateTargetEdits(
  targets: Pick<Targets, 'kcalFloor' | 'proteinMinG'>,
  edits: { kcal: number; proteinG: number },
): { kcal?: TargetEditError; proteinG?: TargetEditError } {
  const errors: { kcal?: TargetEditError; proteinG?: TargetEditError } = {}
  if (!Number.isFinite(edits.kcal) || edits.kcal > MAX_KCAL) errors.kcal = 'invalid'
  else if (edits.kcal < targets.kcalFloor) errors.kcal = 'below-floor'
  if (!Number.isFinite(edits.proteinG) || edits.proteinG > MAX_PROTEIN_G)
    errors.proteinG = 'invalid'
  else if (edits.proteinG < targets.proteinMinG) errors.proteinG = 'below-minimum'
  return errors
}

/** Calories rounded to the nearest 10 for display (always with "≈"). */
export function roundKcal(kcal: number): number {
  return Math.round(kcal / 10) * 10
}

export function kcalRange(kcal: number): { low: number; high: number } {
  const centre = roundKcal(kcal)
  return { low: centre - KCAL_RANGE, high: centre + KCAL_RANGE }
}
