/**
 * Backup export and import (plan §9, §16). A backup is one JSON file holding
 * the app name, schema version, export time and every table. Import validates
 * the whole file and upgrades older versions before touching the database,
 * then replaces everything in one transaction, so a bad file changes nothing.
 */
import { toLocalDate, type LocalDate } from '../domain/date'
import { db } from './db'
import { SCHEMA_VERSION, TABLE_NAMES, type TableName } from './schema'
import type { SettingKey } from './settings'
import type { ExportLog, TableRows } from './types'
import {
  arrayOf,
  bool,
  date,
  defined,
  foodRef,
  id,
  int,
  isRecord,
  nonEmptyText,
  nonNegative,
  nullable,
  num,
  oneOf,
  optional,
  positive,
  shape,
  text,
  type Check,
} from './validate'

export const BACKUP_APP = 'daily-quest'

/** Settings that belong to this phone only: never exported or fingerprinted. */
export const DEVICE_ONLY_SETTINGS: readonly SettingKey[] = ['geminiKey', 'setupDraft']

/** Device-only settings an import keeps. A half-finished setup ends with the import. */
const KEPT_ON_RESTORE: readonly SettingKey[] = ['geminiKey']

export type BackupTables = { [K in TableName]: TableRows[K][] }

export interface BackupFile {
  app: typeof BACKUP_APP
  schemaVersion: number
  /** Epoch ms. */
  exportedAt: number
  exportedOn: LocalDate
  tables: BackupTables
}

export type BackupProblem = 'not-json' | 'not-backup' | 'newer-version' | 'bad-version' | 'bad-data'

export class BackupError extends Error {
  constructor(
    readonly problem: BackupProblem,
    detail: string = problem,
  ) {
    super(detail)
    this.name = 'BackupError'
  }
}

/** Turns a raw backup object of version n into version n + 1. */
export type BackupUpgrade = (file: Record<string, unknown>) => Record<string, unknown>

/**
 * Upgrades keyed by the version they upgrade from. When schema version 2 is
 * added, add `1: (file) => …` here so version 1 backups still import.
 */
export const BACKUP_UPGRADES: Readonly<Record<number, BackupUpgrade>> = {}

const instant = num
const mealItem = shape({
  foodId: foodRef,
  name: text,
  portion: positive,
  kcal: nonNegative,
  proteinG: nonNegative,
  countsAsProtein: bool,
})

/** What a valid row looks like in each table (current schema version). */
const ROW_CHECKS: Record<TableName, Check> = {
  profile: shape({
    id: oneOf('me'),
    nickname: text,
    sex: oneOf('male', 'female', 'other'),
    birthDate: date,
    heightCm: positive,
    activityLevel: oneOf('sedentary', 'light', 'moderate', 'very'),
    goal: oneOf('lose', 'maintain', 'gain'),
    pace: oneOf('slow', 'standard'),
    goalWeightKg: optional(positive),
    goalWaistCm: optional(positive),
    workoutsPerWeek: nonNegative,
    flexDaysPerWeek: nonNegative,
    sleepTargetMin: positive,
    studyGoalHours: nonNegative,
    blockMin: positive,
    setupDate: date,
  }),
  targetHistory: shape({
    id,
    startsOn: date,
    kcal: positive,
    kcalFloor: positive,
    proteinG: positive,
    proteinQuestThresholdG: nullable(positive),
    reason: oneOf('setup', 'fitness-check', 'manual', 'calibration'),
  }),
  days: shape({ date, isFlexDay: bool, isPlannedRest: bool }),
  examPeriods: shape({ id, startsOn: date, endsOn: date, source: oneOf('auto', 'manual') }),
  settings: shape({ key: nonEmptyText, value: defined }),
  foods: shape({
    id,
    name: nonEmptyText,
    category: oneOf('staple', 'curry', 'side', 'drink', 'snack', 'outside', 'plate'),
    serving: text,
    unit: oneOf('cups', 'size', 'count'),
    kcal: nonNegative,
    proteinG: nonNegative,
    countsAsProtein: bool,
    archived: optional(bool),
  }),
  meals: shape({
    id,
    date,
    at: instant,
    slot: oneOf('breakfast', 'lunch', 'dinner', 'snack', 'drink'),
    items: arrayOf(mealItem),
    kcal: nonNegative,
    proteinG: nonNegative,
    source: oneOf('tap', 'combo', 'custom', 'import'),
  }),
  combos: shape({
    id,
    name: nonEmptyText,
    items: arrayOf(shape({ foodId: id, portion: positive })),
  }),
  exercises: shape({
    id,
    name: nonEmptyText,
    muscleGroup: text,
    type: oneOf('weight-reps', 'reps', 'seconds'),
  }),
  workoutPlans: shape({
    id,
    name: text,
    kind: oneOf('normal', 'exam'),
    days: arrayOf(
      shape({
        weekday: oneOf(1, 2, 3, 4, 5, 6, 7),
        exercises: arrayOf(
          shape({
            exerciseId: id,
            sets: positive,
            repMin: optional(nonNegative),
            repMax: optional(nonNegative),
            seconds: optional(nonNegative),
            targetKg: optional(nonNegative),
          }),
        ),
      }),
    ),
  }),
  workoutSets: shape({
    id,
    date,
    startedAt: instant,
    exerciseId: id,
    setNumber: int,
    reps: optional(nonNegative),
    weightKg: optional(nonNegative),
    seconds: optional(nonNegative),
    done: bool,
  }),
  fitnessChecks: shape({
    id,
    date,
    waistCm: optional(positive),
    pushups: optional(nonNegative),
    plankSec: optional(nonNegative),
    squats60s: optional(nonNegative),
    restingHr: optional(positive),
    lifts: arrayOf(shape({ exerciseId: id, e1rmKg: nonNegative })),
    notes: optional(text),
  }),
  sleepLogs: shape({
    id,
    wakeDate: date,
    bedAt: instant,
    wakeAt: instant,
    minutes: nonNegative,
    source: oneOf('tap', 'manual', 'import'),
  }),
  bodyLogs: shape({
    id,
    date,
    at: instant,
    weightKg: optional(positive),
    waistCm: optional(positive),
  }),
  subjects: shape({ id, name: nonEmptyText }),
  studySessions: shape({
    id,
    date,
    startedAt: instant,
    subjectId: optional(id),
    minutes: nonNegative,
    completed: bool,
    source: oneOf('timer', 'manual'),
  }),
  events: shape({
    id,
    date,
    type: oneOf('exam', 'deadline'),
    title: text,
    subjectId: optional(id),
  }),
  moodLogs: shape({ id, date, energy: num, mood: num }),
  stepsLogs: shape({ id, date, steps: nonNegative, source: oneOf('import', 'manual') }),
  exportLogs: shape({ id, at: instant, date, fingerprint: optional(text) }),
}

// ---------------------------------------------------------------- export

/** Every table as it would appear in a backup (device-only settings removed). */
async function readTables(): Promise<BackupTables> {
  const entries = await Promise.all(
    TABLE_NAMES.map(async (name) => [name, await db.table(name).toArray()] as const),
  )
  const tables = Object.fromEntries(entries) as BackupTables
  tables.settings = tables.settings.filter(
    (row) => !DEVICE_ONLY_SETTINGS.includes(row.key as SettingKey),
  )
  return tables
}

function wrap(tables: BackupTables, now: number): BackupFile {
  return {
    app: BACKUP_APP,
    schemaVersion: SCHEMA_VERSION,
    exportedAt: now,
    exportedOn: toLocalDate(now),
    tables,
  }
}

export async function createBackup(now: number): Promise<BackupFile> {
  return db.transaction('r', db.tables, async () => wrap(await readTables(), now))
}

/**
 * A short hash of everything a backup would hold, except the export log itself.
 * Two phones with the same data get the same fingerprint, so it survives a
 * restore. Not cryptographic: it only answers "has anything changed?".
 */
export function fingerprintTables(tables: BackupTables): string {
  const content = JSON.stringify({
    ...tables,
    exportLogs: [],
    // Opening the app writes each day's planned-rest flag from the plan; that
    // alone isn't a change worth backing up. Flex days are the user's choice.
    days: tables.days.filter((day) => day.isFlexDay),
  })
  // cyrb53: a fast 53-bit string hash with good spread.
  let h1 = 0xdeadbeef
  let h2 = 0x41c6ce57
  for (let i = 0; i < content.length; i++) {
    const ch = content.charCodeAt(i)
    h1 = Math.imul(h1 ^ ch, 2654435761)
    h2 = Math.imul(h2 ^ ch, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16)
}

/**
 * Logs the export and builds the file in one transaction, so the file carries
 * its own log entry (the weekly quest survives a restore) along with the
 * fingerprint of the data it holds.
 */
export async function prepareExport(now: number): Promise<{ backup: BackupFile; logId: number }> {
  return db.transaction('rw', db.tables, async () => {
    const tables = await readTables()
    const entry: ExportLog = {
      at: now,
      date: toLocalDate(now),
      fingerprint: fingerprintTables(tables),
    }
    const logId = await db.exportLogs.add(entry)
    if (logId === undefined) throw new Error('The export log entry was not saved')
    tables.exportLogs.push({ ...entry, id: logId })
    return { backup: wrap(tables, now), logId }
  })
}

export interface BackupStatus {
  last: ExportLog | null
  /** Anything worth protecting: settings alone don't count. */
  hasData: boolean
  changedSinceLast: boolean
  /** True when replacing or deleting now would lose something not in a backup. */
  needsBackup: boolean
}

const UNTRACKED_FOR_HAS_DATA: readonly TableName[] = ['exportLogs', 'settings']

export async function getBackupStatus(): Promise<BackupStatus> {
  return db.transaction('r', db.tables, async () => {
    const tables = await readTables()
    const last = tables.exportLogs.reduce<ExportLog | null>(
      (latest, row) => (latest === null || row.at >= latest.at ? row : latest),
      null,
    )
    const hasData = TABLE_NAMES.some(
      (name) => !UNTRACKED_FOR_HAS_DATA.includes(name) && tables[name].length > 0,
    )
    const changedSinceLast = last?.fingerprint !== fingerprintTables(tables)
    return { last, hasData, changedSinceLast, needsBackup: hasData && changedSinceLast }
  })
}

export function serializeBackup(backup: BackupFile): string {
  return JSON.stringify(backup)
}

export function backupFileName(backup: BackupFile): string {
  return `daily-quest-backup-${backup.exportedOn}.json`
}

/** Removes an export log entry, e.g. when the user cancelled the share sheet. */
export async function forgetExport(id: number): Promise<void> {
  await db.exportLogs.delete(id)
}

// ---------------------------------------------------------------- import

/** Parses, upgrades and validates a backup file. Throws BackupError; never touches the database. */
export function parseBackup(
  textContent: string,
  upgrades: Readonly<Record<number, BackupUpgrade>> = BACKUP_UPGRADES,
): BackupFile {
  let raw: unknown
  try {
    raw = JSON.parse(textContent)
  } catch {
    throw new BackupError('not-json')
  }
  if (!isRecord(raw) || raw.app !== BACKUP_APP) throw new BackupError('not-backup')

  let version = raw.schemaVersion
  if (!Number.isInteger(version) || (version as number) < 0) throw new BackupError('bad-version')
  if ((version as number) > SCHEMA_VERSION) throw new BackupError('newer-version')

  let file: Record<string, unknown> = raw
  while ((version as number) < SCHEMA_VERSION) {
    const upgrade = upgrades[version as number]
    if (!upgrade) throw new BackupError('bad-version', `No upgrade from version ${String(version)}`)
    file = upgrade(file)
    version = (version as number) + 1
  }

  if (!num(file.exportedAt) || !date(file.exportedOn)) {
    throw new BackupError('bad-data', 'Missing export time')
  }
  return {
    app: BACKUP_APP,
    schemaVersion: SCHEMA_VERSION,
    exportedAt: file.exportedAt as number,
    exportedOn: file.exportedOn as LocalDate,
    tables: validateTables(file.tables),
  }
}

function validateTables(tables: unknown): BackupTables {
  if (!isRecord(tables)) throw new BackupError('bad-data', 'Missing tables')
  for (const name of Object.keys(tables)) {
    if (!(TABLE_NAMES as string[]).includes(name)) {
      throw new BackupError('bad-data', `Unknown table ${name}`)
    }
  }
  for (const name of TABLE_NAMES) {
    const rows = tables[name]
    if (!Array.isArray(rows)) throw new BackupError('bad-data', `Missing table ${name}`)
    const bad = rows.findIndex((row) => !ROW_CHECKS[name](row))
    if (bad >= 0) throw new BackupError('bad-data', `Invalid ${name} row ${bad + 1}`)
  }
  return tables as BackupTables
}

/** Replaces everything with the backup. All or nothing: on any error, nothing changes. */
export async function restoreBackup(backup: BackupFile): Promise<void> {
  await db.transaction('rw', db.tables, async () => {
    const kept = (await db.settings.bulkGet([...KEPT_ON_RESTORE])).filter(
      (row) => row !== undefined,
    )
    await Promise.all(db.tables.map((table) => table.clear()))
    for (const name of TABLE_NAMES) {
      const rows =
        name === 'settings'
          ? backup.tables.settings.filter(
              (row) => !DEVICE_ONLY_SETTINGS.includes(row.key as SettingKey),
            )
          : backup.tables[name]
      await db.table(name).bulkAdd(rows)
    }
    await db.settings.bulkPut(kept)
  })
}

export interface BackupSummary {
  exportedOn: LocalDate
  nickname: string | undefined
  meals: number
  weighIns: number
  sleeps: number
  studySessions: number
  workoutSets: number
}

/** What the review sheet shows before an import replaces the current data. */
export function summarizeBackup(backup: BackupFile): BackupSummary {
  const t = backup.tables
  return {
    exportedOn: backup.exportedOn,
    nickname: t.profile[0]?.nickname,
    meals: t.meals.length,
    weighIns: t.bodyLogs.filter((row) => row.weightKg !== undefined).length,
    sleeps: t.sleepLogs.length,
    studySessions: t.studySessions.length,
    workoutSets: t.workoutSets.length,
  }
}

/** Settings → Delete all data. Empties every table in one transaction. */
export async function deleteAllData(): Promise<void> {
  await db.transaction('rw', db.tables, async () => {
    await Promise.all(db.tables.map((table) => table.clear()))
  })
}
