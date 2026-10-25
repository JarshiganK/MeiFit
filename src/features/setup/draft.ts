import { DEFAULT_ROUTINE, type SetupAnswers } from '../../domain/setup'
import type { ActivityLevel, Goal, Pace, Sex } from '../../domain/targets'
import type { Profile } from '../../db/types'

/** What the setup form holds while it's being filled in. Typed fields stay as text. */
export interface Draft {
  nickname: string
  sex: Sex | undefined
  birthDate: string
  height: string
  weight: string
  activityLevel: ActivityLevel | undefined
  goal: Goal | undefined
  pace: Pace
  goalWeight: string
  goalWaist: string
  workoutsPerWeek: number
  flexDaysPerWeek: number
  sleepHours: number
  studyGoalHours: number
  blockMin: number
}

export const EMPTY_DRAFT: Draft = {
  nickname: '',
  sex: undefined,
  birthDate: '',
  height: '',
  weight: '',
  activityLevel: undefined,
  goal: undefined,
  pace: 'standard',
  goalWeight: '',
  goalWaist: '',
  workoutsPerWeek: DEFAULT_ROUTINE.workoutsPerWeek,
  flexDaysPerWeek: DEFAULT_ROUTINE.flexDaysPerWeek,
  sleepHours: DEFAULT_ROUTINE.sleepTargetMin / 60,
  studyGoalHours: DEFAULT_ROUTINE.studyGoalHours,
  blockMin: DEFAULT_ROUTINE.blockMin,
}

/** "69,5" → 69.5; empty → undefined; anything else that isn't a number → NaN. */
export function parseNumber(text: string): number | undefined {
  const trimmed = text.trim().replace(',', '.')
  return trimmed === '' ? undefined : Number(trimmed)
}

export function draftToAnswers(draft: Draft): Partial<SetupAnswers> {
  const answers: Partial<SetupAnswers> = {
    nickname: draft.nickname,
    birthDate: draft.birthDate,
    pace: draft.pace,
    workoutsPerWeek: draft.workoutsPerWeek,
    flexDaysPerWeek: draft.flexDaysPerWeek,
    sleepTargetMin: Math.round(draft.sleepHours * 60),
    studyGoalHours: draft.studyGoalHours,
    blockMin: draft.blockMin,
  }
  if (draft.sex) answers.sex = draft.sex
  if (draft.activityLevel) answers.activityLevel = draft.activityLevel
  if (draft.goal) answers.goal = draft.goal
  const height = parseNumber(draft.height)
  const weight = parseNumber(draft.weight)
  const goalWeight = parseNumber(draft.goalWeight)
  const goalWaist = parseNumber(draft.goalWaist)
  if (height !== undefined) answers.heightCm = height
  if (weight !== undefined) answers.weightKg = weight
  if (goalWeight !== undefined) answers.goalWeightKg = goalWeight
  if (goalWaist !== undefined) answers.goalWaistCm = goalWaist
  return answers
}

/** Prefills the form when the user changes their answers from Settings → Profile. */
export function draftFromProfile(profile: Profile, weightKg: number | undefined): Draft {
  return {
    nickname: profile.nickname,
    sex: profile.sex,
    birthDate: profile.birthDate,
    height: String(profile.heightCm),
    weight: weightKg === undefined ? '' : String(weightKg),
    activityLevel: profile.activityLevel,
    goal: profile.goal,
    pace: profile.pace,
    goalWeight: profile.goalWeightKg === undefined ? '' : String(profile.goalWeightKg),
    goalWaist: profile.goalWaistCm === undefined ? '' : String(profile.goalWaistCm),
    workoutsPerWeek: profile.workoutsPerWeek,
    flexDaysPerWeek: profile.flexDaysPerWeek,
    sleepHours: profile.sleepTargetMin / 60,
    studyGoalHours: profile.studyGoalHours,
    blockMin: profile.blockMin,
  }
}
