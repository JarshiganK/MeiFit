/**
 * Sleep logs (plan §5, §10). "Going to sleep" saves the bedtime as an open
 * sleep; "I'm awake" turns it into a log on the wake-up date.
 */
import type { LocalDate } from '../domain/date'
import { sleepEntry, type SleepTimes } from '../domain/sleep'
import { db } from './db'
import { deleteSetting, getSetting, setSetting } from './settings'
import type { SleepLog } from './types'

export async function openSleep(): Promise<number | undefined> {
  const bedAt = await getSetting('openSleep', 0)
  return bedAt > 0 ? bedAt : undefined
}

export async function startSleep(bedAt: number): Promise<void> {
  await setSetting('openSleep', bedAt)
}

export async function cancelSleep(): Promise<void> {
  await deleteSetting('openSleep')
}

/** Ends the open sleep (or saves one entered by hand) in one transaction; returns the log id. */
export async function saveSleep(
  times: SleepTimes,
  source: SleepLog['source'],
  { closeOpen = false }: { closeOpen?: boolean } = {},
): Promise<number> {
  return db.transaction('rw', db.sleepLogs, db.settings, async () => {
    const id = await db.sleepLogs.add({ ...sleepEntry(times), source })
    if (id === undefined) throw new Error('The sleep was not saved')
    if (closeOpen) await db.settings.delete('openSleep')
    return id
  })
}

/** Changes the times of a saved sleep; its wake-up date follows the new wake time. */
export async function updateSleep(id: number, times: SleepTimes): Promise<void> {
  await db.sleepLogs.update(id, { ...sleepEntry(times), source: 'manual' })
}

/** Deletes a sleep and returns it for Undo. */
export async function deleteSleep(id: number): Promise<SleepLog | undefined> {
  const log = await db.sleepLogs.get(id)
  await db.sleepLogs.delete(id)
  return log
}

export async function restoreSleep(log: SleepLog): Promise<void> {
  await db.sleepLogs.put(log)
}

/** The most recently ended sleep. */
export async function latestSleep(): Promise<SleepLog | undefined> {
  return db.sleepLogs.orderBy('wakeAt').last()
}

export async function sleepsOn(wakeDate: LocalDate): Promise<SleepLog[]> {
  return db.sleepLogs.where('wakeDate').equals(wakeDate).toArray()
}
