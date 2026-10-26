/**
 * Exam mode (plan §7). It turns on 14 days before the next exam, or by hand,
 * and ends the day after the last exam. Each period is saved with its dates,
 * so past days keep the rules they had.
 */
import { addDays, type LocalDate } from './date'

export const LEAD_IN_DAYS = 14
export const STUDY_MULTIPLIER = 1.5
/** An open-ended manual period ends on this date until it's switched off. */
export const OPEN_END: LocalDate = '9999-12-31'

export interface Period {
  startsOn: LocalDate
  endsOn: LocalDate
}

/**
 * Exam periods from exam dates: each starts 14 days before an exam and ends
 * the day after it; periods that overlap or touch are merged into one.
 */
export function autoPeriods(examDates: readonly LocalDate[]): Period[] {
  const periods: Period[] = []
  for (const date of [...new Set(examDates)].sort()) {
    const startsOn = addDays(date, -LEAD_IN_DAYS)
    const endsOn = addDays(date, 1)
    const last = periods.at(-1)
    if (last && startsOn <= addDays(last.endsOn, 1))
      last.endsOn = endsOn > last.endsOn ? endsOn : last.endsOn
    else periods.push({ startsOn, endsOn })
  }
  return periods
}

export function isExamDay(date: LocalDate, periods: readonly Period[]): boolean {
  return periods.some((p) => p.startsOn <= date && date <= p.endsOn)
}

/** The period covering `date`, if any. */
export function periodOn(date: LocalDate, periods: readonly Period[]): Period | undefined {
  return periods.find((p) => p.startsOn <= date && date <= p.endsOn)
}

/** The next period starting after `date`. */
export function nextPeriod(date: LocalDate, periods: readonly Period[]): Period | undefined {
  return [...periods]
    .filter((p) => p.startsOn > date)
    .sort((a, b) => a.startsOn.localeCompare(b.startsOn))[0]
}

/**
 * Brings the saved automatic periods in line with the exam calendar. Periods
 * that have already ended stay as they are (their days were judged by them);
 * the rest are replaced by the ones the calendar gives now.
 */
export function syncAutoPeriods(
  saved: readonly Period[],
  examDates: readonly LocalDate[],
  today: LocalDate,
): { keep: Period[]; add: Period[] } {
  const keep = saved.filter((p) => p.endsOn < today)
  const add = autoPeriods(examDates).filter(
    (p) => p.endsOn >= today && !keep.some((k) => k.startsOn === p.startsOn),
  )
  return { keep, add }
}
