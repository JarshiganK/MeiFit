/**
 * First-launch setup (plan §2): checks the answers and turns them into the
 * records setup saves. Pure: "now" is passed in.
 */
import { addDays, ageOn, isLocalDate, toLocalDate, weekday, type LocalDate } from './date'
import {
  calculateTargets,
  type ActivityLevel,
  type Goal,
  type Pace,
  type Sex,
  type Targets,
} from './targets'

export const MIN_AGE = 13
const MAX_AGE = 100
const NICKNAME_MAX = 30

export const LIMITS = {
  heightCm: { min: 120, max: 230 },
  weightKg: { min: 30, max: 250 },
  goalWeightKg: { min: 30, max: 250 },
  goalWaistCm: { min: 40, max: 200 },
  workoutsPerWeek: { min: 0, max: 7 },
  flexDaysPerWeek: { min: 0, max: 4 },
  sleepTargetMin: { min: 300, max: 600 },
  studyGoalHours: { min: 0, max: 80 },
  blockMin: { min: 15, max: 120 },
} as const

/** Starting values for the routine step: plan §2 defaults, nothing personal. */
export const DEFAULT_ROUTINE = {
  workoutsPerWeek: 3,
  flexDaysPerWeek: 1,
  sleepTargetMin: 420,
  studyGoalHours: 10,
  blockMin: 50,
} as const

export interface SetupAnswers {
  nickname: string
  sex: Sex
  birthDate: LocalDate
  heightCm: number
  weightKg: number
  activityLevel: ActivityLevel
  goal: Goal
  pace: Pace
  goalWeightKg?: number
  goalWaistCm?: number
  workoutsPerWeek: number
  flexDaysPerWeek: number
  sleepTargetMin: number
  studyGoalHours: number
  blockMin: number
}

export type FieldError =
  | 'required'
  | 'too-low'
  | 'too-high'
  | 'too-long'
  | 'invalid'
  | 'future'
  | 'too-young'
  | 'not-for-minors'

type Errors<K extends string> = Partial<Record<K, FieldError>>

export type AgeBand = 'too-young' | 'minor' | 'adult'

export function ageBand(birthDate: LocalDate, today: LocalDate): AgeBand {
  const age = ageOn(birthDate, today)
  if (age < MIN_AGE) return 'too-young'
  return age < 18 ? 'minor' : 'adult'
}

function rangeError(
  value: number | undefined,
  limits: { min: number; max: number },
): FieldError | undefined {
  if (value === undefined || !Number.isFinite(value)) return 'required'
  if (value < limits.min) return 'too-low'
  if (value > limits.max) return 'too-high'
  return undefined
}

function collect<K extends string>(entries: [K, FieldError | undefined][]): Errors<K> {
  const errors: Errors<K> = {}
  for (const [key, error] of entries) if (error) errors[key] = error
  return errors
}

export function validateAboutYou(
  a: Partial<SetupAnswers>,
  today: LocalDate,
): Errors<'nickname' | 'sex' | 'birthDate' | 'heightCm' | 'weightKg' | 'activityLevel'> {
  const nickname = a.nickname?.trim() ?? ''
  let birthDate: FieldError | undefined
  if (!a.birthDate) birthDate = 'required'
  else if (!isLocalDate(a.birthDate)) birthDate = 'invalid'
  else if (a.birthDate > today) birthDate = 'future'
  else if (ageOn(a.birthDate, today) > MAX_AGE) birthDate = 'too-high'
  else if (ageBand(a.birthDate, today) === 'too-young') birthDate = 'too-young'

  return collect([
    [
      'nickname',
      nickname === '' ? 'required' : nickname.length > NICKNAME_MAX ? 'too-long' : undefined,
    ],
    ['sex', a.sex ? undefined : 'required'],
    ['birthDate', birthDate],
    ['heightCm', rangeError(a.heightCm, LIMITS.heightCm)],
    ['weightKg', rangeError(a.weightKg, LIMITS.weightKg)],
    ['activityLevel', a.activityLevel ? undefined : 'required'],
  ])
}

export function validateGoal(
  a: Partial<SetupAnswers>,
  today: LocalDate,
): Errors<'goal' | 'goalWeightKg' | 'goalWaistCm'> {
  const isMinor = a.birthDate !== undefined && ageBand(a.birthDate, today) !== 'adult'
  const optional = (value: number | undefined, limits: { min: number; max: number }) =>
    value === undefined ? undefined : rangeError(value, limits)
  return collect([
    ['goal', !a.goal ? 'required' : isMinor && a.goal === 'lose' ? 'not-for-minors' : undefined],
    ['goalWeightKg', optional(a.goalWeightKg, LIMITS.goalWeightKg)],
    ['goalWaistCm', optional(a.goalWaistCm, LIMITS.goalWaistCm)],
  ])
}

export function validateRoutine(
  a: Partial<SetupAnswers>,
): Errors<
  'workoutsPerWeek' | 'flexDaysPerWeek' | 'sleepTargetMin' | 'studyGoalHours' | 'blockMin'
> {
  return collect([
    ['workoutsPerWeek', rangeError(a.workoutsPerWeek, LIMITS.workoutsPerWeek)],
    ['flexDaysPerWeek', rangeError(a.flexDaysPerWeek, LIMITS.flexDaysPerWeek)],
    ['sleepTargetMin', rangeError(a.sleepTargetMin, LIMITS.sleepTargetMin)],
    ['studyGoalHours', rangeError(a.studyGoalHours, LIMITS.studyGoalHours)],
    ['blockMin', rangeError(a.blockMin, LIMITS.blockMin)],
  ])
}

/** The baseline check is due within 7 days of setup: default the next Saturday (plan §4). */
export function defaultBaselineDate(today: LocalDate): LocalDate {
  const daysToSaturday = (6 - weekday(today) + 7) % 7 || 7
  return addDays(today, daysToSaturday)
}

export function baselineDateRange(today: LocalDate): { min: LocalDate; max: LocalDate } {
  return { min: today, max: addDays(today, 7) }
}

export interface SetupResult {
  profile: Omit<SetupAnswers, 'weightKg'> & { setupDate: LocalDate }
  target: {
    startsOn: LocalDate
    kcal: number
    kcalFloor: number
    proteinG: number
    proteinQuestThresholdG: number | null
    reason: 'setup'
  }
  weighIn: { date: LocalDate; at: number; weightKg: number }
  targets: Targets
}

export interface BuildSetupOptions {
  /** The user's own calorie and protein numbers from the review step. */
  edits?: { kcal: number; proteinG: number }
  /** When setup is rerun: keep the first setup date and the calibrated protein threshold. */
  previous?: { setupDate: LocalDate; proteinQuestThresholdG: number | null }
}

/** Under-18s get maintenance calories, no flex days and no fat-loss goal (owner answer B). */
export function targetsForAnswers(answers: SetupAnswers, today: LocalDate): Targets {
  return calculateTargets({
    sex: answers.sex,
    age: ageOn(answers.birthDate, today),
    heightCm: answers.heightCm,
    weightKg: answers.weightKg,
    activityLevel: answers.activityLevel,
    goal: answers.goal,
    pace: answers.pace,
    goalWeightKg: answers.goalWeightKg,
  })
}

export function buildSetup(
  answers: SetupAnswers,
  now: number,
  options: BuildSetupOptions = {},
): SetupResult {
  const today = toLocalDate(now)
  const targets = targetsForAnswers(answers, today)
  const { weightKg, ...rest } = answers

  const profile: SetupResult['profile'] = {
    ...rest,
    nickname: answers.nickname.trim(),
    setupDate: options.previous?.setupDate ?? today,
  }
  if (targets.isMinor) {
    if (profile.goal === 'lose') profile.goal = 'maintain'
    profile.flexDaysPerWeek = 0
  }

  // Edits are checked in the UI; clamping here makes the floor impossible to undercut.
  const kcal = Math.max(Math.round(options.edits?.kcal ?? targets.kcal), targets.kcalFloor)
  const proteinG = Math.max(
    Math.round(options.edits?.proteinG ?? targets.proteinG),
    targets.proteinMinG,
  )

  return {
    profile,
    target: {
      startsOn: today,
      kcal,
      kcalFloor: targets.kcalFloor,
      proteinG,
      proteinQuestThresholdG: options.previous?.proteinQuestThresholdG ?? null,
      reason: 'setup',
    },
    weighIn: { date: today, at: now, weightKg },
    targets,
  }
}
