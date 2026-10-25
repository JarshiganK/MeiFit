/**
 * Sleep (plan §5): saved as full bedtime and wake-up times, and counted on
 * the day you wake up. A night from 23:30 on the 25th to 06:30 on the 26th is
 * the 26th's sleep.
 */
import { minutesBetween, toLocalDate, type LocalDate } from './date'

const HOUR_MS = 3_600_000

/** An open sleep older than this asks for the real wake time (owner change 4). */
export const ASK_WAKE_AFTER_MS = 16 * HOUR_MS
/** No single sleep is longer than this. */
export const MAX_SLEEP_MS = 24 * HOUR_MS

export interface SleepTimes {
  bedAt: number
  wakeAt: number
}

export interface SleepEntry extends SleepTimes {
  wakeDate: LocalDate
  minutes: number
}

export function sleepEntry({ bedAt, wakeAt }: SleepTimes): SleepEntry {
  return { bedAt, wakeAt, wakeDate: toLocalDate(wakeAt), minutes: minutesBetween(bedAt, wakeAt) }
}

/** True when "I'm awake" was probably forgotten, so `now` isn't the wake time. */
export function needsWakeTime(bedAt: number, now: number): boolean {
  return now - bedAt > ASK_WAKE_AFTER_MS
}

export type SleepError = 'wakeBeforeBed' | 'tooLong' | 'inFuture' | 'missing'

/** Checks a sleep entered or edited by hand. */
export function validateSleep(
  bedAt: number | undefined,
  wakeAt: number | undefined,
  now: number,
): SleepError | null {
  if (bedAt === undefined || wakeAt === undefined) return 'missing'
  if (wakeAt <= bedAt) return 'wakeBeforeBed'
  if (wakeAt - bedAt > MAX_SLEEP_MS) return 'tooLong'
  if (wakeAt > now) return 'inFuture'
  return null
}

/** The main sleep of a day is the longest one ending that day (naps don't replace it). */
export function mainSleep<T extends { minutes: number }>(logs: readonly T[]): T | undefined {
  return logs.reduce<T | undefined>(
    (best, log) => (best === undefined || log.minutes > best.minutes ? log : best),
    undefined,
  )
}

/** The sleep quest (plan §7): the sleep that ended today meets the target. */
export function meetsSleepTarget(minutes: number | undefined, targetMin: number): boolean {
  return minutes !== undefined && minutes >= targetMin
}

/** Splits minutes into hours and minutes for display. */
export function hoursAndMinutes(minutes: number): { hours: number; minutes: number } {
  const whole = Math.max(0, Math.round(minutes))
  return { hours: Math.floor(whole / 60), minutes: whole % 60 }
}
