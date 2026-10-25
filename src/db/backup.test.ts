import { describe, expect, it } from 'vitest'
import { sampleTables, type SampleTables } from '../test/fixtures'
import {
  BACKUP_APP,
  BackupError,
  backupFileName,
  createBackup,
  deleteAllData,
  fingerprintTables,
  forgetExport,
  getBackupStatus,
  parseBackup,
  prepareExport,
  restoreBackup,
  serializeBackup,
  summarizeBackup,
  type BackupFile,
} from './backup'
import { db } from './db'
import { SCHEMA_VERSION, TABLE_NAMES } from './schema'
import { getSetting, setSetting } from './settings'

const NOW = new Date(2026, 9, 25, 21, 15).getTime()

async function seed(tables: SampleTables = sampleTables()): Promise<void> {
  await db.transaction('rw', db.tables, async () => {
    for (const name of TABLE_NAMES) await db.table(name).bulkAdd(tables[name])
  })
}

async function dump(): Promise<Record<string, unknown[]>> {
  const entries = await Promise.all(
    TABLE_NAMES.map(async (name) => [name, await db.table(name).toArray()] as const),
  )
  return Object.fromEntries(entries)
}

function fileFrom(overrides: Record<string, unknown> = {}, tables = sampleTables()): string {
  return JSON.stringify({
    app: BACKUP_APP,
    schemaVersion: SCHEMA_VERSION,
    exportedAt: NOW,
    exportedOn: '2026-10-25',
    tables,
    ...overrides,
  })
}

function problemOf(fn: () => unknown): string | undefined {
  try {
    fn()
  } catch (error) {
    if (error instanceof BackupError) return error.problem
    throw error
  }
  return undefined
}

describe('createBackup', () => {
  it('holds the app name, schema version, export time and every table', async () => {
    await seed()
    const backup = await createBackup(NOW)
    expect(backup.app).toBe('daily-quest')
    expect(backup.schemaVersion).toBe(SCHEMA_VERSION)
    expect(backup.exportedAt).toBe(NOW)
    expect(backup.exportedOn).toBe('2026-10-25')
    expect(Object.keys(backup.tables).sort()).toEqual([...TABLE_NAMES].sort())
    expect(backup.tables.meals[0]?.items).toHaveLength(2)
  })

  it('never includes the Gemini API key', async () => {
    await seed()
    await setSetting('geminiKey', 'secret-key')
    const text = serializeBackup(await createBackup(NOW))
    expect(text).not.toContain('secret-key')
    expect(text).not.toContain('geminiKey')
  })

  it('names the file after the local export date', async () => {
    expect(backupFileName(await createBackup(NOW))).toBe('daily-quest-backup-2026-10-25.json')
  })
})

describe('backup round trip', () => {
  it('export → wipe → import gives back identical data', async () => {
    await seed()
    const before = await dump()
    const text = serializeBackup(await createBackup(NOW))

    await deleteAllData()
    expect(Object.values(await dump()).every((rows) => rows.length === 0)).toBe(true)

    await restoreBackup(parseBackup(text))
    expect(await dump()).toEqual(before)
  })

  it('replaces existing data instead of merging', async () => {
    await seed()
    const text = serializeBackup(await createBackup(NOW))
    await db.meals.add({ ...sampleTables().meals[0]!, id: 99 })
    await restoreBackup(parseBackup(text))
    expect(await db.meals.count()).toBe(1)
  })

  it('keeps the API key already on this device', async () => {
    await seed()
    const text = serializeBackup(await createBackup(NOW))
    await setSetting('geminiKey', 'device-key')
    await restoreBackup(parseBackup(text))
    expect(await getSetting('geminiKey', '')).toBe('device-key')
    expect(await getSetting('debug', false)).toBe(true)
  })
})

describe('parseBackup rejects bad files', () => {
  it.each([
    ['not JSON', '{"app": "daily-quest", ', 'not-json'],
    ['an empty file', '', 'not-json'],
    ['a JSON array', '[]', 'not-backup'],
    ['another app', fileFrom({ app: 'other-app' }), 'not-backup'],
    ['a newer schema', fileFrom({ schemaVersion: SCHEMA_VERSION + 1 }), 'newer-version'],
    ['a missing version', fileFrom({ schemaVersion: undefined }), 'bad-version'],
    ['a fractional version', fileFrom({ schemaVersion: 0.5 }), 'bad-version'],
    ['a bad export time', fileFrom({ exportedAt: 'yesterday' }), 'bad-data'],
    ['missing tables', fileFrom({ tables: undefined }), 'bad-data'],
  ])('rejects %s', (_label, text, problem) => {
    expect(problemOf(() => parseBackup(text))).toBe(problem)
  })

  it('rejects a file with a table missing', () => {
    const tables: Partial<SampleTables> = sampleTables()
    delete tables.meals
    expect(problemOf(() => parseBackup(fileFrom({}, tables as SampleTables)))).toBe('bad-data')
  })

  it('rejects a file with an unknown table', () => {
    const text = fileFrom({ tables: { ...sampleTables(), hacks: [] } })
    expect(problemOf(() => parseBackup(text))).toBe('bad-data')
  })

  it.each([
    ['an impossible date', (t: SampleTables) => (t.meals[0]!.date = '2026-02-30')],
    ['a UTC timestamp as a date', (t: SampleTables) => (t.bodyLogs[0]!.date = '2026-10-25T00:00Z')],
    [
      'a text weight',
      (t: SampleTables) => ((t.bodyLogs[0] as { weightKg: unknown }).weightKg = '69'),
    ],
    [
      'an unknown meal slot',
      (t: SampleTables) => ((t.meals[0] as { slot: string }).slot = 'brunch'),
    ],
    ['a meal item without a food', (t: SampleTables) => (t.meals[0]!.items = [{} as never])],
    ['a negative calorie value', (t: SampleTables) => (t.foods[0]!.kcal = -5)],
    ['a missing id', (t: SampleTables) => delete t.subjects[0]!.id],
    ['a row that is not an object', (t: SampleTables) => (t.days[0] = 'oops' as never)],
    ['an infinite timestamp', (t: SampleTables) => (t.exportLogs[0]!.at = Number.NaN)],
  ])('rejects %s and names the table', (_label, corrupt) => {
    const tables = sampleTables()
    corrupt(tables)
    let error: unknown
    try {
      parseBackup(fileFrom({}, tables))
    } catch (e) {
      error = e
    }
    expect(error).toBeInstanceOf(BackupError)
    expect((error as BackupError).problem).toBe('bad-data')
    expect((error as BackupError).message).toMatch(/row \d+/)
  })

  it('accepts a valid file', () => {
    const backup = parseBackup(fileFrom())
    expect(backup.tables.foods).toHaveLength(2)
  })
})

describe('a rejected import leaves existing data untouched', () => {
  it('when the file fails validation', async () => {
    await seed()
    const before = await dump()
    expect(() => parseBackup('{ corrupted')).toThrow(BackupError)
    expect(await dump()).toEqual(before)
  })

  it('when the database refuses a row partway through (duplicate weigh-in date)', async () => {
    await seed()
    const before = await dump()
    const tables = sampleTables()
    tables.bodyLogs.push({ id: 2, date: '2026-10-25', at: NOW, weightKg: 68.5 })
    const backup = parseBackup(fileFrom({}, tables))

    await expect(restoreBackup(backup)).rejects.toThrow()
    expect(await dump()).toEqual(before)
  })
})

describe('upgrading older backups', () => {
  it('runs each upgrade step from the file version up to the current one', () => {
    const v0 = JSON.stringify({
      app: BACKUP_APP,
      schemaVersion: 0,
      exportedAt: NOW,
      exportedOn: '2026-10-25',
      tables: { ...sampleTables(), exportLogs: undefined },
    })
    const upgrades = {
      0: (file: Record<string, unknown>) => ({
        ...file,
        tables: { ...(file.tables as object), exportLogs: [] },
      }),
    }
    const backup = parseBackup(v0, upgrades)
    expect(backup.schemaVersion).toBe(SCHEMA_VERSION)
    expect(backup.tables.exportLogs).toEqual([])
  })

  it('rejects an old version with no upgrade path', () => {
    const text = fileFrom({ schemaVersion: 0 })
    expect(problemOf(() => parseBackup(text, {}))).toBe('bad-version')
  })
})

describe('summarizeBackup', () => {
  it('counts what the backup will restore', () => {
    const summary = summarizeBackup(parseBackup(fileFrom()) satisfies BackupFile)
    expect(summary).toEqual({
      exportedOn: '2026-10-25',
      nickname: 'Sam',
      meals: 1,
      weighIns: 1,
      sleeps: 1,
      studySessions: 1,
      workoutSets: 1,
    })
  })
})

describe('export log', () => {
  it('records each export and finds the latest', async () => {
    expect((await getBackupStatus()).last).toBeNull()
    await prepareExport(new Date(2026, 9, 19, 9).getTime())
    await prepareExport(NOW)
    expect((await getBackupStatus()).last?.date).toBe('2026-10-25')
    expect(await db.exportLogs.count()).toBe(2)
  })

  it('forgets an export that was cancelled', async () => {
    const { logId } = await prepareExport(NOW)
    await forgetExport(logId)
    expect((await getBackupStatus()).last).toBeNull()
  })
})

describe('deleteAllData', () => {
  it('empties every table', async () => {
    await seed()
    await deleteAllData()
    for (const name of TABLE_NAMES) expect(await db.table(name).count()).toBe(0)
  })
})

describe('backup status', () => {
  async function seedWithoutExports() {
    const tables = sampleTables()
    tables.exportLogs = []
    await seed(tables)
  }

  it('needs no backup on a phone with no data', async () => {
    await setSetting('debug', true) // settings alone aren't "data"
    expect(await getBackupStatus()).toMatchObject({
      last: null,
      hasData: false,
      needsBackup: false,
    })
  })

  it('needs a backup when there is data but no backup', async () => {
    await seedWithoutExports()
    expect(await getBackupStatus()).toMatchObject({
      last: null,
      hasData: true,
      changedSinceLast: true,
      needsBackup: true,
    })
  })

  it('is up to date right after an export, and the file carries its own entry', async () => {
    await seedWithoutExports()
    const { backup, logId } = await prepareExport(NOW)
    expect(backup.tables.exportLogs).toEqual([
      { id: logId, at: NOW, date: '2026-10-25', fingerprint: expect.any(String) },
    ])
    const status = await getBackupStatus()
    expect(status.last?.id).toBe(logId)
    expect(status).toMatchObject({ changedSinceLast: false, needsBackup: false })
  })

  it.each([
    ['a new weigh-in', () => db.bodyLogs.add({ date: '2026-10-26', at: NOW, weightKg: 68.8 })],
    ['a deleted meal', () => db.meals.clear()],
    ['an edited food', () => db.foods.update(1, { kcal: 210 })],
    ['a changed setting', () => setSetting('fitnessCheckIntervalWeeks', 6)],
  ])('notices %s after the export', async (_label, change) => {
    await seedWithoutExports()
    await prepareExport(NOW)
    await change()
    expect(await getBackupStatus()).toMatchObject({ changedSinceLast: true, needsBackup: true })
  })

  it('ignores the export log itself and device-only settings', async () => {
    await seedWithoutExports()
    await prepareExport(NOW)
    await setSetting('geminiKey', 'new-key')
    expect((await getBackupStatus()).needsBackup).toBe(false)
  })

  it('treats an older export entry without a fingerprint as changed', async () => {
    await seed() // the fixture's export entry predates fingerprints
    expect(await getBackupStatus()).toMatchObject({ changedSinceLast: true, needsBackup: true })
  })

  it('is up to date after that backup is restored on another phone', async () => {
    await seedWithoutExports()
    const { backup } = await prepareExport(NOW)
    const text = serializeBackup(backup)
    await deleteAllData()
    await restoreBackup(parseBackup(text))
    expect((await getBackupStatus()).needsBackup).toBe(false)
  })

  it('fingerprints the same data the same way every time', async () => {
    await seedWithoutExports()
    const a = fingerprintTables((await createBackup(NOW)).tables)
    const b = fingerprintTables((await createBackup(NOW + 60_000)).tables)
    expect(a).toBe(b)
    expect(a).toMatch(/^[0-9a-f]+$/)
  })
})
