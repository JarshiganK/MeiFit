import { describe, expect, it } from 'vitest'
import { atLocalTime } from '../domain/date'
import { allWeighIns, deleteWeighIn, restoreBodyLog, saveWeighIn } from './body'
import { db } from './db'

const DAY = '2026-10-25'
const at = atLocalTime(DAY, 7, 0)

describe('weigh-ins', () => {
  it('keeps one per day; a later one replaces it', async () => {
    await saveWeighIn(DAY, at, 69.44)
    const before = await saveWeighIn(DAY, at + 60_000, 69.2)
    expect(before?.weightKg).toBe(69.4)
    expect(await allWeighIns()).toEqual([{ date: DAY, at: at + 60_000, weightKg: 69.2 }])
  })

  it('lists weigh-ins oldest first and skips waist-only rows', async () => {
    await saveWeighIn(DAY, at, 69)
    await saveWeighIn('2026-10-20', at, 70)
    await db.bodyLogs.add({ date: '2026-10-22', at, waistCm: 84 })
    expect((await allWeighIns()).map((w) => w.date)).toEqual(['2026-10-20', DAY])
  })

  it('deletes a weight but keeps a waist on the same day, and undoes', async () => {
    await db.bodyLogs.add({ date: DAY, at, weightKg: 69, waistCm: 84 })
    const before = await deleteWeighIn(DAY)
    expect(await db.bodyLogs.where('date').equals(DAY).first()).toMatchObject({ waistCm: 84 })
    expect((await db.bodyLogs.where('date').equals(DAY).first())?.weightKg).toBeUndefined()
    await restoreBodyLog(DAY, before)
    expect((await db.bodyLogs.where('date').equals(DAY).first())?.weightKg).toBe(69)
  })

  it('deletes a weight-only row and undoes a first weigh-in', async () => {
    await saveWeighIn(DAY, at, 69)
    await deleteWeighIn(DAY)
    expect(await db.bodyLogs.count()).toBe(0)
    expect(await deleteWeighIn(DAY)).toBeUndefined()

    const before = await saveWeighIn(DAY, at, 68)
    await restoreBodyLog(DAY, before)
    expect(await db.bodyLogs.count()).toBe(0)
  })
})
