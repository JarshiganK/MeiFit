/**
 * Dexie schema. Released versions are append-only (CLAUDE.md §5): never edit a
 * STORES_Vn object or its version block. To change the schema, add STORES_Vn+1,
 * a new `this.version(n + 1)` block with an upgrade function, bump
 * SCHEMA_VERSION, and add a migration test.
 */
import Dexie, { type EntityTable, type Table } from 'dexie'
import type {
  BodyLog,
  CalendarEvent,
  Combo,
  DayRecord,
  Exercise,
  ExamPeriod,
  ExportLog,
  FitnessCheck,
  Food,
  Meal,
  MoodLog,
  Profile,
  SettingRow,
  SleepLog,
  StepsLog,
  StudySession,
  Subject,
  TargetHistory,
  WorkoutPlan,
  WorkoutSet,
} from './types'

export const DB_NAME = 'daily-quest'

/** Written into every backup so older files can be upgraded on import. */
export const SCHEMA_VERSION = 1

/** Version 1 (released with Phase 1 item 1). Frozen: see schema.test.ts. */
export const STORES_V1 = {
  profile: 'id',
  targetHistory: '++id, startsOn',
  days: 'date',
  examPeriods: '++id, startsOn, endsOn',
  settings: 'key',
  foods: '++id, name, category',
  meals: '++id, date, at, slot',
  combos: '++id, name',
  exercises: '++id, name',
  workoutPlans: '++id, kind',
  workoutSets: '++id, date, exerciseId, startedAt',
  fitnessChecks: '++id, date',
  sleepLogs: '++id, wakeDate, wakeAt',
  bodyLogs: '++id, &date',
  subjects: '++id, name',
  studySessions: '++id, date, subjectId, startedAt',
  events: '++id, date, type',
  moodLogs: '++id, &date',
  stepsLogs: '++id, &date',
  exportLogs: '++id, at',
} as const

export type TableName = keyof typeof STORES_V1
export const TABLE_NAMES = Object.keys(STORES_V1) as TableName[]

export class DailyQuestDB extends Dexie {
  profile!: Table<Profile, 'me'>
  targetHistory!: EntityTable<TargetHistory, 'id'>
  days!: Table<DayRecord, string>
  examPeriods!: EntityTable<ExamPeriod, 'id'>
  settings!: Table<SettingRow, string>
  foods!: EntityTable<Food, 'id'>
  meals!: EntityTable<Meal, 'id'>
  combos!: EntityTable<Combo, 'id'>
  exercises!: EntityTable<Exercise, 'id'>
  workoutPlans!: EntityTable<WorkoutPlan, 'id'>
  workoutSets!: EntityTable<WorkoutSet, 'id'>
  fitnessChecks!: EntityTable<FitnessCheck, 'id'>
  sleepLogs!: EntityTable<SleepLog, 'id'>
  bodyLogs!: EntityTable<BodyLog, 'id'>
  subjects!: EntityTable<Subject, 'id'>
  studySessions!: EntityTable<StudySession, 'id'>
  events!: EntityTable<CalendarEvent, 'id'>
  moodLogs!: EntityTable<MoodLog, 'id'>
  stepsLogs!: EntityTable<StepsLog, 'id'>
  exportLogs!: EntityTable<ExportLog, 'id'>

  constructor(name: string = DB_NAME) {
    super(name)
    this.version(1).stores(STORES_V1)
  }
}
