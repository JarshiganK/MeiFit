/**
 * Weigh-ins (plan §2): at most one per day; a later one the same day
 * replaces it (approved default). Waist (Phase 2) shares the row.
 */
import type { LocalDate } from '../domain/date'
import { roundWeight, type WeighIn } from '../domain/body'
import { db } from './db'
import type { BodyLog } from './types'

/** Every weigh-in, oldest first. */
export async function allWeighIns(): Promise<(WeighIn & { at: number })[]> {
  const rows = await db.bodyLogs.orderBy('date').toArray()
  return rows.flatMap((row) =>
    row.weightKg === undefined ? [] : [{ date: row.date, at: row.at, weightKg: row.weightKg }],
  )
}

/** Saves the day's weight, replacing an earlier one that day. Returns the row as it was, for Undo. */
export async function saveWeighIn(
  date: LocalDate,
  at: number,
  weightKg: number,
): Promise<BodyLog | undefined> {
  return db.transaction('rw', db.bodyLogs, async () => {
    const existing = await db.bodyLogs.where('date').equals(date).first()
    const kg = roundWeight(weightKg)
    if (existing?.id !== undefined) await db.bodyLogs.update(existing.id, { at, weightKg: kg })
    else await db.bodyLogs.add({ date, at, weightKg: kg })
    return existing
  })
}

/** Removes the day's weight (keeping a waist measurement). Returns the row as it was, for Undo. */
export async function deleteWeighIn(date: LocalDate): Promise<BodyLog | undefined> {
  return db.transaction('rw', db.bodyLogs, async () => {
    const existing = await db.bodyLogs.where('date').equals(date).first()
    if (existing?.id === undefined) return undefined
    if (existing.waistCm !== undefined) {
      const rest: BodyLog = { ...existing }
      delete rest.weightKg
      await db.bodyLogs.put(rest)
    } else {
      await db.bodyLogs.delete(existing.id)
    }
    return existing
  })
}

/** Puts a day's row back exactly as it was (Undo), or removes it if there was none. */
export async function restoreBodyLog(date: LocalDate, before: BodyLog | undefined): Promise<void> {
  await db.transaction('rw', db.bodyLogs, async () => {
    await db.bodyLogs.where('date').equals(date).delete()
    if (before) await db.bodyLogs.put(before)
  })
}
