import { en } from '../../copy/en'
import { hoursAndMinutes } from '../../domain/sleep'

/** 438 → "7 h 18 min"; 420 → "7 h". */
export function formatDuration(minutes: number): string {
  const { hours, minutes: rest } = hoursAndMinutes(minutes)
  return en.sleep.duration(hours, rest)
}
