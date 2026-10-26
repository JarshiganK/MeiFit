/** Mood check-ins (plan §6): energy and mood, 1–5, at most one a day. */
import type { LocalDate } from '../domain/date'
import { db } from './db'
import type { MoodLog } from './types'

export function moodOn(date: LocalDate): Promise<MoodLog | undefined> {
  return db.moodLogs.where('date').equals(date).first()
}

/** Saves one part of the day's check-in; the other keeps its value (or 3 until picked). */
export async function setMood(
  date: LocalDate,
  patch: Partial<Pick<MoodLog, 'energy' | 'mood'>>,
): Promise<void> {
  await db.transaction('rw', db.moodLogs, async () => {
    const existing = await db.moodLogs.where('date').equals(date).first()
    if (existing?.id !== undefined) await db.moodLogs.update(existing.id, patch)
    else await db.moodLogs.add({ date, energy: 3, mood: 3, ...patch })
  })
}

export function recentMoods(from: LocalDate): Promise<MoodLog[]> {
  return db.moodLogs.where('date').aboveOrEqual(from).sortBy('date')
}
