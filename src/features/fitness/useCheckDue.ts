import { useLiveQuery } from 'dexie-react-hooks'
import { allChecks } from '../../db/fitness'
import { getProfile } from '../../db/profile'
import { getSetting } from '../../db/settings'
import type { FitnessCheck } from '../../db/types'
import type { LocalDate } from '../../domain/date'
import {
  DEFAULT_INTERVAL_WEEKS,
  checkWindow,
  nextDue,
  type CheckWindow,
} from '../../domain/fitness'

export interface CheckDue {
  window: CheckWindow
  checks: FitnessCheck[]
  /** True when a check was already done in the current window. */
  doneThisWindow: boolean
}

/** When the next fitness check is due and whether its window is open (plan §4). */
export function useCheckDue(today: LocalDate): CheckDue | null | undefined {
  return useLiveQuery(async () => {
    const profile = await getProfile()
    if (!profile) return null
    const checks = await allChecks()
    const last = checks.at(-1)
    const due = nextDue(
      (await getSetting('baselineCheckDue', '')) || undefined,
      last?.date,
      await getSetting('fitnessCheckIntervalWeeks', DEFAULT_INTERVAL_WEEKS),
      profile.setupDate,
    )
    const window = checkWindow(due, today)
    return {
      window,
      checks,
      doneThisWindow: last !== undefined && last.date >= window.opens && last.date <= window.closes,
    }
  }, [today])
}
