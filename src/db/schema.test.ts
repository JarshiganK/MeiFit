import type Dexie from 'dexie'
import { afterEach, describe, expect, it } from 'vitest'
import { DailyQuestDB, SCHEMA_VERSION, STORES_V1, TABLE_NAMES } from './schema'

/**
 * A frozen copy of version 1. Released versions must never change (CLAUDE.md §5):
 * add a new version with an upgrade function instead. If this test fails, undo
 * the edit to STORES_V1.
 */
const RELEASED_V1 = {
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
}

const opened: Dexie[] = []
function freshDb(): DailyQuestDB {
  const db = new DailyQuestDB(`dq-test-${crypto.randomUUID()}`)
  opened.push(db)
  return db
}

afterEach(async () => {
  await Promise.all(opened.splice(0).map((db) => db.delete()))
})

describe('schema version 1', () => {
  it('is never edited after release', () => {
    expect(STORES_V1).toEqual(RELEASED_V1)
  })

  it('is the current schema version', () => {
    expect(SCHEMA_VERSION).toBe(1)
    expect(freshDb().verno).toBe(SCHEMA_VERSION)
  })

  it('creates every table from plan §9 plus exportLogs on a new device', async () => {
    const db = freshDb()
    await db.open()
    expect(db.tables.map((t) => t.name).sort()).toEqual([...TABLE_NAMES].sort())
    expect(TABLE_NAMES).toHaveLength(Object.keys(RELEASED_V1).length)
  })

  it('declares the indexes the app queries by', async () => {
    const db = freshDb()
    await db.open()
    const indexes = (table: string) => db.table(table).schema.indexes.map((i) => i.name)
    expect(indexes('meals')).toEqual(['date', 'at', 'slot'])
    expect(indexes('sleepLogs')).toEqual(['wakeDate', 'wakeAt'])
    expect(db.table('days').schema.primKey.name).toBe('date')
    expect(db.table('settings').schema.primKey.name).toBe('key')
  })

  it('keeps one weigh-in, mood and steps entry per date', async () => {
    const db = freshDb()
    await db.bodyLogs.add({ date: '2026-10-25', at: 1, weightKg: 69 })
    await expect(db.bodyLogs.add({ date: '2026-10-25', at: 2, weightKg: 68.8 })).rejects.toThrow(
      /ConstraintError|unique/i,
    )
    await db.stepsLogs.add({ date: '2026-10-25', steps: 8234, source: 'import' })
    await expect(
      db.stepsLogs.add({ date: '2026-10-25', steps: 1, source: 'import' }),
    ).rejects.toThrow()
    await db.moodLogs.add({ date: '2026-10-25', energy: 3, mood: 4 })
    await expect(db.moodLogs.add({ date: '2026-10-25', energy: 1, mood: 1 })).rejects.toThrow()
  })

  it('allows several sleeps on one wake date (naps)', async () => {
    const db = freshDb()
    await db.sleepLogs.bulkAdd([
      { wakeDate: '2026-10-26', bedAt: 1, wakeAt: 2, minutes: 420, source: 'tap' },
      { wakeDate: '2026-10-26', bedAt: 3, wakeAt: 4, minutes: 30, source: 'manual' },
    ])
    expect(await db.sleepLogs.where('wakeDate').equals('2026-10-26').count()).toBe(2)
  })

  it('round-trips a meal with its snapshot items and queries it by date', async () => {
    const db = freshDb()
    const id = await db.meals.add({
      date: '2026-10-25',
      at: 1_761_390_000_000,
      slot: 'lunch',
      items: [
        {
          foodId: 1,
          name: 'Rice',
          portion: 1.5,
          kcal: 300,
          proteinG: 6,
          countsAsProtein: false,
        },
      ],
      kcal: 300,
      proteinG: 6,
      source: 'tap',
    })
    const [meal] = await db.meals.where('date').equals('2026-10-25').toArray()
    expect(meal?.id).toBe(id)
    expect(meal?.items[0]?.name).toBe('Rice')
  })

  it('keeps a single profile row', async () => {
    const db = freshDb()
    const profile = {
      id: 'me' as const,
      nickname: 'Test',
      sex: 'other' as const,
      birthDate: '2001-10-25',
      heightCm: 170,
      activityLevel: 'moderate' as const,
      goal: 'maintain' as const,
      pace: 'standard' as const,
      workoutsPerWeek: 3,
      flexDaysPerWeek: 1,
      sleepTargetMin: 420,
      studyGoalHours: 15,
      blockMin: 50,
      setupDate: '2026-10-25',
    }
    await db.profile.put(profile)
    await db.profile.put({ ...profile, nickname: 'Renamed' })
    expect(await db.profile.count()).toBe(1)
    expect((await db.profile.get('me'))?.nickname).toBe('Renamed')
  })
})
