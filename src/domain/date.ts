/**
 * Local dates (plan §5). A day runs from local midnight to the next midnight,
 * and weeks run Monday to Sunday. Dates are stored as `YYYY-MM-DD` strings in
 * the phone's local time; instants are epoch milliseconds.
 *
 * Every date in the app goes through this file. Nothing here reads the clock:
 * callers pass "now" in.
 */
import dayjs from 'dayjs'

/** A calendar date in local time, `YYYY-MM-DD`. */
export type LocalDate = string

/** Weekday number: 1 = Monday … 7 = Sunday. */
export type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7

const FORMAT = 'YYYY-MM-DD'
const SHAPE = /^\d{4}-\d{2}-\d{2}$/
const MS_PER_MINUTE = 60_000

/**
 * Parses a stored date as local midnight (Day.js reads date-only strings as
 * local, unlike `new Date('YYYY-MM-DD')`, which reads them as UTC).
 * Impossible dates such as 2026-02-30 roll over, which isLocalDate rejects.
 */
function parse(date: LocalDate) {
  return dayjs(date)
}

export function isLocalDate(value: unknown): value is LocalDate {
  if (typeof value !== 'string' || !SHAPE.test(value)) return false
  const parsed = parse(value)
  return parsed.isValid() && parsed.format(FORMAT) === value
}

/** The local calendar date of an instant. Never the UTC date. */
export function toLocalDate(instant: number | Date): LocalDate {
  return dayjs(instant).format(FORMAT)
}

/** Epoch ms of local midnight at the start of `date`. */
export function startOfLocalDay(date: LocalDate): number {
  return parse(date).startOf('day').valueOf()
}

/** The half-open range [start, end) of a local day. It can be 23 or 25 hours long. */
export function dayRange(date: LocalDate): { start: number; end: number } {
  return { start: startOfLocalDay(date), end: startOfLocalDay(addDays(date, 1)) }
}

/** Epoch ms for a wall-clock time on a local date, e.g. a manual 23:40 entry. */
export function atLocalTime(date: LocalDate, hours: number, minutes: number): number {
  return parse(date).hour(hours).minute(minutes).second(0).millisecond(0).valueOf()
}

export function addDays(date: LocalDate, days: number): LocalDate {
  return parse(date).add(days, 'day').format(FORMAT)
}

/** Calendar days from `from` to `to` (negative when `to` is earlier). DST-safe. */
export function daysBetween(from: LocalDate, to: LocalDate): number {
  return parse(to).diff(parse(from), 'day')
}

/** Every date from `from` to `to`, inclusive; empty when `to` is before `from`. */
export function datesInRange(from: LocalDate, to: LocalDate): LocalDate[] {
  const count = daysBetween(from, to)
  return Array.from({ length: Math.max(0, count + 1) }, (_, i) => addDays(from, i))
}

/** Sorts dates in calendar order (stored strings compare correctly as text). */
export function compareDates(a: LocalDate, b: LocalDate): number {
  return a < b ? -1 : a > b ? 1 : 0
}

/**
 * True once local midnight after `date` has passed. Today is never "over",
 * so a streak can't break partway through a day.
 */
export function isDayOver(date: LocalDate, now: number): boolean {
  return compareDates(toLocalDate(now), date) > 0
}

export function weekday(date: LocalDate): Weekday {
  const day = parse(date).day() // 0 = Sunday
  return day === 0 ? 7 : day
}

/** The Monday that starts the week containing `date`. */
export function weekStart(date: LocalDate): LocalDate {
  return addDays(date, 1 - weekday(date))
}

/** The Sunday that ends the week containing `date`. */
export function weekEnd(date: LocalDate): LocalDate {
  return addDays(weekStart(date), 6)
}

/** Monday to Sunday of the week containing `date`. */
export function weekDates(date: LocalDate): LocalDate[] {
  return datesInRange(weekStart(date), weekEnd(date))
}

/**
 * Age in whole years on `onDate`. A 29 February birthday is reached on
 * 1 March in non-leap years.
 */
export function ageOn(birthDate: LocalDate, onDate: LocalDate): number {
  const [by, bm, bd] = birthDate.split('-').map(Number) as [number, number, number]
  const [y, m, d] = onDate.split('-').map(Number) as [number, number, number]
  const hadBirthday = m > bm || (m === bm && d >= bd)
  return y - by - (hadBirthday ? 0 : 1)
}

/** A date for people to read, e.g. "25 Oct 2026". */
export function formatLongDate(date: LocalDate): string {
  return parse(date).format('D MMM YYYY')
}

/** Whole minutes from `start` to `end` (epoch ms), rounded. */
export function minutesBetween(start: number, end: number): number {
  return Math.round((end - start) / MS_PER_MINUTE)
}
