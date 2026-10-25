/**
 * Stored records (plan §9). Units are metric. Dates are local `YYYY-MM-DD`
 * strings from src/domain/date.ts; instants are epoch milliseconds, so a log's
 * date can always be rebuilt from its timestamp.
 *
 * Derived values (XP, levels, streaks, quest results…) are never stored.
 */
import type { LocalDate } from '../domain/date'

/** Epoch milliseconds. */
export type Instant = number

export type Sex = 'male' | 'female' | 'other'
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'very'
export type Goal = 'lose' | 'maintain' | 'gain'
export type Pace = 'slow' | 'standard'

/** One row, id `'me'`. Current weight lives in bodyLogs, not here. */
export interface Profile {
  id: 'me'
  nickname: string
  sex: Sex
  birthDate: LocalDate
  heightCm: number
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
  /** First day of the app; the protein calibration counts from here. */
  setupDate: LocalDate
}

export type TargetReason = 'setup' | 'fitness-check' | 'manual' | 'calibration'

/** Targets apply from `startsOn` until the next row starts. */
export interface TargetHistory {
  id?: number
  startsOn: LocalDate
  kcal: number
  kcalFloor: number
  proteinG: number
  /** Null during the 14-day calibration (the quest is "log all three meals"). */
  proteinQuestThresholdG: number | null
  reason: TargetReason
}

/** Rules that change how a day is judged, saved with the day. */
export interface DayRecord {
  date: LocalDate
  isFlexDay: boolean
  isPlannedRest: boolean
}

export interface ExamPeriod {
  id?: number
  startsOn: LocalDate
  endsOn: LocalDate
  source: 'auto' | 'manual'
}

export interface SettingRow {
  key: string
  value: unknown
}

export type FoodUnit = 'cups' | 'size' | 'count'
export type FoodCategory = 'staple' | 'curry' | 'side' | 'drink' | 'snack' | 'outside' | 'plate'

export interface Food {
  id?: number
  name: string
  category: FoodCategory
  /** Description of one serving, e.g. "1 cup cooked". */
  serving: string
  unit: FoodUnit
  kcal: number
  proteinG: number
  countsAsProtein: boolean
  /** Hidden from the menu but kept so old logs still make sense. */
  archived?: boolean
}

export type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'drink'

/** A logged item keeps the values it had when logged (plan §3). */
export interface MealItem {
  foodId: number
  name: string
  /** Multiplier: cups for rice, 0.75 / 1 / 1.5 for sizes, a count for pieces. */
  portion: number
  kcal: number
  proteinG: number
  countsAsProtein: boolean
}

export interface Meal {
  id?: number
  date: LocalDate
  at: Instant
  slot: MealSlot
  items: MealItem[]
  kcal: number
  proteinG: number
  source: 'tap' | 'combo' | 'custom' | 'import'
}

export interface Combo {
  id?: number
  name: string
  items: { foodId: number; portion: number }[]
}

export type ExerciseType = 'weight-reps' | 'reps' | 'seconds'

export interface Exercise {
  id?: number
  name: string
  muscleGroup: string
  type: ExerciseType
}

export interface PlannedExercise {
  exerciseId: number
  sets: number
  repMin?: number
  repMax?: number
  seconds?: number
  targetKg?: number
}

export interface WorkoutPlan {
  id?: number
  name: string
  kind: 'normal' | 'exam'
  /** Weekday 1 = Monday … 7 = Sunday; weekdays not listed are planned rest. */
  days: { weekday: number; exercises: PlannedExercise[] }[]
}

export interface WorkoutSet {
  id?: number
  date: LocalDate
  startedAt: Instant
  exerciseId: number
  setNumber: number
  reps?: number
  weightKg?: number
  seconds?: number
  done: boolean
}

export interface FitnessCheck {
  id?: number
  date: LocalDate
  waistCm?: number
  pushups?: number
  plankSec?: number
  squats60s?: number
  restingHr?: number
  lifts: { exerciseId: number; e1rmKg: number }[]
  notes?: string
}

/** Counts on the day you wake up (plan §5). */
export interface SleepLog {
  id?: number
  wakeDate: LocalDate
  bedAt: Instant
  wakeAt: Instant
  minutes: number
  source: 'tap' | 'manual' | 'import'
}

/** At most one row per date. */
export interface BodyLog {
  id?: number
  date: LocalDate
  at: Instant
  weightKg?: number
  waistCm?: number
}

export interface Subject {
  id?: number
  name: string
}

/** Counts on the day it starts (plan §5). */
export interface StudySession {
  id?: number
  date: LocalDate
  startedAt: Instant
  subjectId?: number
  minutes: number
  completed: boolean
  source: 'timer' | 'manual'
}

export interface CalendarEvent {
  id?: number
  date: LocalDate
  type: 'exam' | 'deadline'
  title: string
  subjectId?: number
}

export interface MoodLog {
  id?: number
  date: LocalDate
  energy: number
  mood: number
}

export interface StepsLog {
  id?: number
  date: LocalDate
  steps: number
  source: 'import' | 'manual'
}

/** One row per backup export, for the weekly "Export a backup" quest. */
export interface ExportLog {
  id?: number
  at: Instant
  date: LocalDate
}

/** The record type stored in each table (kept in step with STORES_V1 by schema.ts). */
export interface TableRows {
  profile: Profile
  targetHistory: TargetHistory
  days: DayRecord
  examPeriods: ExamPeriod
  settings: SettingRow
  foods: Food
  meals: Meal
  combos: Combo
  exercises: Exercise
  workoutPlans: WorkoutPlan
  workoutSets: WorkoutSet
  fitnessChecks: FitnessCheck
  sleepLogs: SleepLog
  bodyLogs: BodyLog
  subjects: Subject
  studySessions: StudySession
  events: CalendarEvent
  moodLogs: MoodLog
  stepsLogs: StepsLog
  exportLogs: ExportLog
}
