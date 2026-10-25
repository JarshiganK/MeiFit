import type { LocalDate } from '../domain/date'
import type { SetupResult } from '../domain/setup'
import { db } from './db'
import { STARTER_MENU } from './seed/starterMenu'
import type { BodyLog, Meal, Profile, TargetHistory } from './types'

export function getProfile(): Promise<Profile | undefined> {
  return db.profile.get('me')
}

/** The targets that apply on `date`: the latest row starting on or before it. */
export async function currentTarget(date: LocalDate): Promise<TargetHistory | undefined> {
  const rows = await db.targetHistory.where('startsOn').belowOrEqual(date).sortBy('startsOn')
  return rows.at(-1)
}

/** The most recent weigh-in. */
export async function latestWeighIn(): Promise<BodyLog | undefined> {
  const rows = await db.bodyLogs.orderBy('date').reverse().toArray()
  return rows.find((row) => row.weightKg !== undefined)
}

export interface SaveSetupOptions {
  loadStarterMenu: boolean
  exams: { date: LocalDate; title: string }[]
  /** Only on first launch; changing answers later keeps the booked check. */
  baselineCheckDue?: LocalDate
  /** False when changing answers without a new weight, so no weigh-in is invented. */
  recordWeighIn?: boolean
}

/**
 * Saves everything setup collected, in one transaction. Rerunning setup on the
 * same day replaces that day's targets and weigh-in; earlier targets are kept so
 * past days are still judged by the targets they had (plan §2).
 */
export async function saveSetup(result: SetupResult, options: SaveSetupOptions): Promise<void> {
  await db.transaction(
    'rw',
    [db.profile, db.targetHistory, db.bodyLogs, db.foods, db.events, db.settings],
    async () => {
      await db.profile.put({ id: 'me', ...result.profile })

      await db.targetHistory.where('startsOn').equals(result.target.startsOn).delete()
      await db.targetHistory.add(result.target)

      if (options.recordWeighIn !== false) {
        const existing = await db.bodyLogs.where('date').equals(result.weighIn.date).first()
        if (existing?.id !== undefined) {
          await db.bodyLogs.update(existing.id, {
            at: result.weighIn.at,
            weightKg: result.weighIn.weightKg,
          })
        } else {
          await db.bodyLogs.add(result.weighIn)
        }
      }

      if (options.loadStarterMenu && (await db.foods.count()) === 0) {
        await db.foods.bulkAdd(STARTER_MENU.map((food) => ({ ...food })))
      }

      if (options.exams.length > 0) {
        await db.events.bulkAdd(options.exams.map((exam) => ({ ...exam, type: 'exam' as const })))
      }

      if (options.baselineCheckDue) {
        await db.settings.put({ key: 'baselineCheckDue', value: options.baselineCheckDue })
      }

      // Setup is finished, so there's nothing left to resume.
      await db.settings.delete('setupDraft')
    },
  )
}

/**
 * Saves the calibrated protein quest threshold from `date` on (plan §3, day 15).
 * The other targets carry over; a row already starting that day is updated.
 */
export async function acceptProteinThreshold(date: LocalDate, thresholdG: number): Promise<void> {
  await db.transaction('rw', db.targetHistory, async () => {
    const current = await currentTarget(date)
    if (!current) throw new Error('No targets to calibrate')
    const row: TargetHistory = {
      startsOn: date,
      kcal: current.kcal,
      kcalFloor: current.kcalFloor,
      proteinG: current.proteinG,
      proteinQuestThresholdG: thresholdG,
      reason: 'calibration',
    }
    if (current.startsOn === date && current.id !== undefined) {
      await db.targetHistory.update(current.id, { proteinQuestThresholdG: thresholdG })
    } else {
      await db.targetHistory.add(row)
    }
  })
}

/** Meals for each date from `from` to `to`, for the protein calibration. */
export async function mealsBetween(from: LocalDate, to: LocalDate): Promise<Meal[]> {
  return db.meals.where('date').between(from, to, true, true).toArray()
}
