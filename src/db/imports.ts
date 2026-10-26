/**
 * Saving lines imported from Shortcuts (plan §11). Sleep and steps for a date
 * that already has them replace the old entry instead of adding a second one.
 */
import type { LocalDate } from '../domain/date'
import { sumItems, type MealItem, type MealSlot } from '../domain/food'
import { sleepEntry, type SleepTimes } from '../domain/sleep'
import { db } from './db'

export async function importSleep(times: SleepTimes): Promise<void> {
  const entry = sleepEntry(times)
  await db.transaction('rw', db.sleepLogs, async () => {
    await db.sleepLogs.where('wakeDate').equals(entry.wakeDate).delete()
    await db.sleepLogs.add({ ...entry, source: 'import' })
  })
}

export async function importSteps(date: LocalDate, steps: number): Promise<void> {
  await db.transaction('rw', db.stepsLogs, async () => {
    const existing = await db.stepsLogs.where('date').equals(date).first()
    if (existing?.id !== undefined)
      await db.stepsLogs.update(existing.id, { steps, source: 'import' })
    else await db.stepsLogs.add({ date, steps, source: 'import' })
  })
}

/** Saves a meal after its review (plan §11: every imported meal is reviewed first). */
export async function importMeal(input: {
  date: LocalDate
  at: number
  slot: MealSlot
  items: MealItem[]
}): Promise<number> {
  const id = await db.meals.add({ ...input, ...sumItems(input.items), source: 'import' })
  if (id === undefined) throw new Error('The meal was not saved')
  return id
}

export async function recentSteps(from: LocalDate): Promise<{ date: LocalDate; steps: number }[]> {
  return db.stepsLogs.where('date').aboveOrEqual(from).sortBy('date')
}
