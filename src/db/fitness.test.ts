import { describe, expect, it } from 'vitest'
import { allWaists, saveWaist } from './body'
import { db } from './db'
import { allChecks, finishCheck } from './fitness'
import { currentTarget, getProfile } from './profile'
import { getSetting, setSetting } from './settings'
import { sampleTables } from '../test/fixtures'

const at = 1_761_000_000_000

describe('fitness checks', () => {
  it('saves the check, its waist, confirmed targets and a goal switch together', async () => {
    const tables = sampleTables()
    await db.profile.put(tables.profile[0]!)
    await db.targetHistory.bulkAdd(tables.targetHistory)
    await db.bodyLogs.add({ date: '2026-10-31', at, weightKg: 68 })
    await setSetting('fitnessDraft', { step: 'review' })

    await finishCheck({
      check: {
        date: '2026-10-31',
        waistCm: 82,
        pushups: 25,
        lifts: [{ exerciseId: 1, e1rmKg: 70 }],
      },
      at,
      targets: { kcal: 1980, kcalFloor: 1600, proteinG: 122, proteinQuestThresholdG: 105 },
      goal: 'maintain',
    })

    expect(await allChecks()).toMatchObject([{ date: '2026-10-31', pushups: 25 }])
    expect(await db.bodyLogs.where('date').equals('2026-10-31').first()).toMatchObject({
      weightKg: 68,
      waistCm: 82,
    })
    expect(await currentTarget('2026-10-31')).toMatchObject({
      kcal: 1980,
      proteinQuestThresholdG: 105,
      reason: 'fitness-check',
    })
    expect((await currentTarget('2026-10-30'))?.reason).toBe('setup')
    expect((await getProfile())?.goal).toBe('maintain')
    expect(await getSetting('fitnessDraft', null)).toBeNull()
  })

  it('leaves targets and goal alone unless confirmed', async () => {
    const tables = sampleTables()
    await db.profile.put(tables.profile[0]!)
    await finishCheck({ check: { date: '2026-10-31', lifts: [] }, at })
    expect(await db.targetHistory.count()).toBe(0)
    expect((await getProfile())?.goal).toBe('lose')
    expect(await db.bodyLogs.count()).toBe(0)
  })
})

describe('waist log', () => {
  it('keeps one waist a day beside the weight, newest replacing', async () => {
    await db.bodyLogs.add({ date: '2026-10-25', at, weightKg: 69 })
    await saveWaist('2026-10-25', at, 84.04)
    await saveWaist('2026-10-25', at, 83.5)
    await saveWaist('2026-10-12', at, 85)
    expect(await allWaists()).toEqual([
      { date: '2026-10-12', waistCm: 85 },
      { date: '2026-10-25', waistCm: 83.5 },
    ])
    expect((await db.bodyLogs.where('date').equals('2026-10-25').first())?.weightKg).toBe(69)
  })
})
