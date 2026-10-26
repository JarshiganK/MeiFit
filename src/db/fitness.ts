/**
 * Fitness checks (plan §4). Finishing a check saves it, the waist measured
 * with it, any confirmed target change and a switch to maintain, in one
 * transaction.
 */
import type { LocalDate } from '../domain/date'
import { db } from './db'
import type { FitnessCheck, Goal, TargetHistory } from './types'

export async function allChecks(): Promise<FitnessCheck[]> {
  return db.fitnessChecks.orderBy('date').toArray()
}

export interface FinishCheck {
  check: Omit<FitnessCheck, 'id'>
  at: number
  /** New targets from this date, if the user confirmed them. */
  targets?: Omit<TargetHistory, 'id' | 'startsOn' | 'reason'>
  /** The user chose to switch their goal (e.g. to maintain once it's reached). */
  goal?: Goal
}

export async function finishCheck({ check, at, targets, goal }: FinishCheck): Promise<number> {
  return db.transaction(
    'rw',
    [db.fitnessChecks, db.bodyLogs, db.targetHistory, db.profile, db.settings],
    async () => {
      const id = await db.fitnessChecks.add({ ...check })
      if (id === undefined) throw new Error('The check was not saved')
      const date: LocalDate = check.date

      // The waist measured at the check is the waist log for that day.
      if (check.waistCm !== undefined) {
        const row = await db.bodyLogs.where('date').equals(date).first()
        if (row?.id !== undefined) await db.bodyLogs.update(row.id, { waistCm: check.waistCm })
        else await db.bodyLogs.add({ date, at, waistCm: check.waistCm })
      }

      if (targets) {
        await db.targetHistory.where('startsOn').equals(date).delete()
        await db.targetHistory.add({ ...targets, startsOn: date, reason: 'fitness-check' })
      }

      if (goal) await db.profile.update('me', { goal })
      await db.settings.delete('fitnessDraft')
      return id
    },
  )
}
