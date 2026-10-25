import { describe, expect, it } from 'vitest'
import { atLocalTime } from '../domain/date'
import { db } from './db'
import {
  cancelSleep,
  deleteSleep,
  latestSleep,
  openSleep,
  restoreSleep,
  saveSleep,
  sleepsOn,
  startSleep,
  updateSleep,
} from './sleep'

const bed = atLocalTime('2026-10-25', 23, 10)
const wake = atLocalTime('2026-10-26', 6, 28)

describe('sleep log', () => {
  it('opens a sleep, then closes it into a log on the wake-up date', async () => {
    expect(await openSleep()).toBeUndefined()
    await startSleep(bed)
    expect(await openSleep()).toBe(bed)

    const id = await saveSleep({ bedAt: bed, wakeAt: wake }, 'tap', { closeOpen: true })
    expect(await openSleep()).toBeUndefined()
    expect(await db.sleepLogs.get(id)).toMatchObject({
      wakeDate: '2026-10-26',
      minutes: 438,
      source: 'tap',
    })
    expect(await sleepsOn('2026-10-26')).toHaveLength(1)
    expect(await sleepsOn('2026-10-25')).toHaveLength(0)
  })

  it('cancels an open sleep', async () => {
    await startSleep(bed)
    await cancelSleep()
    expect(await openSleep()).toBeUndefined()
  })

  it('edits both times, moving the sleep to its new wake-up date', async () => {
    const id = await saveSleep({ bedAt: bed, wakeAt: wake }, 'tap')
    const newWake = atLocalTime('2026-10-25', 23, 50)
    await updateSleep(id, { bedAt: atLocalTime('2026-10-25', 22, 0), wakeAt: newWake })
    expect(await db.sleepLogs.get(id)).toMatchObject({
      wakeDate: '2026-10-25',
      minutes: 110,
      source: 'manual',
    })
  })

  it('deletes with an undo copy and finds the latest sleep', async () => {
    await saveSleep({ bedAt: bed - 86_400_000, wakeAt: wake - 86_400_000 }, 'tap')
    const id = await saveSleep({ bedAt: bed, wakeAt: wake }, 'manual')
    expect((await latestSleep())?.id).toBe(id)
    const removed = await deleteSleep(id)
    expect((await latestSleep())?.id).not.toBe(id)
    await restoreSleep(removed!)
    expect((await latestSleep())?.id).toBe(id)
  })
})
