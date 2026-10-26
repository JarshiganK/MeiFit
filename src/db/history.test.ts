import { describe, expect, it } from 'vitest'
import { totalXp } from '../domain/quests'
import { db } from './db'
import { loadQuestHistory } from './history'
import { sampleTables } from '../test/fixtures'

describe('loadQuestHistory', () => {
  it('is empty before setup', async () => {
    expect(await loadQuestHistory()).toBeUndefined()
  })

  it('reads the logs since setup, ready for the quest rules', async () => {
    const tables = sampleTables()
    await db.profile.put(tables.profile[0]!) // set up on 2026-10-01
    await db.targetHistory.bulkAdd(tables.targetHistory)
    await db.sleepLogs.bulkAdd([
      { wakeDate: '2026-09-30', bedAt: 0, wakeAt: 0, minutes: 480, source: 'tap' },
      { wakeDate: '2026-10-02', bedAt: 0, wakeAt: 0, minutes: 480, source: 'tap' },
    ])
    await db.bodyLogs.bulkAdd([
      { date: '2026-10-01', at: 0, weightKg: 69 },
      { date: '2026-10-02', at: 0, waistCm: 84 },
    ])
    const history = await loadQuestHistory()
    expect(history?.sleeps.map((s) => s.wakeDate)).toEqual(['2026-10-02'])
    expect(history?.weighIns).toHaveLength(1)
    expect(history?.plan).toBeUndefined()
    // One sleep quest (20 XP) on the 2nd.
    expect(totalXp(history!, '2026-10-02')).toBe(20)
  })
})
