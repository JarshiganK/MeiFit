import { describe, expect, it } from 'vitest'
import {
  addDays,
  ageOn,
  atLocalTime,
  compareDates,
  datesInRange,
  dayRange,
  daysBetween,
  isDayOver,
  isLocalDate,
  minutesBetween,
  startOfLocalDay,
  toLocalDate,
  weekDates,
  weekEnd,
  weekStart,
  weekday,
} from './date'

/** Local wall-clock instant (works the same in every time zone). */
const TZ = Intl.DateTimeFormat().resolvedOptions().timeZone

const local = (y: number, m: number, d: number, h = 0, min = 0) =>
  new Date(y, m - 1, d, h, min).getTime()

describe('toLocalDate', () => {
  it('splits days at local midnight: 23:59 and 00:00 are different days', () => {
    expect(toLocalDate(local(2026, 10, 25, 23, 59))).toBe('2026-10-25')
    expect(toLocalDate(local(2026, 10, 26, 0, 0))).toBe('2026-10-26')
    expect(toLocalDate(local(2026, 10, 25, 23, 55))).not.toBe(
      toLocalDate(local(2026, 10, 26, 0, 5)),
    )
  })

  it('accepts a Date or epoch milliseconds', () => {
    expect(toLocalDate(new Date(2026, 0, 1, 12))).toBe('2026-01-01')
    expect(toLocalDate(local(2026, 0 + 1, 1, 12))).toBe('2026-01-01')
  })

  it('uses the local date, not the UTC date', () => {
    // 20:00 UTC on 25 Oct is 01:30 on the 26th in Colombo but 13:00 on the 25th in Los Angeles.
    const instant = Date.UTC(2026, 9, 25, 20, 0)
    const expected = TZ === 'Asia/Colombo' ? '2026-10-26' : '2026-10-25'
    expect(toLocalDate(instant)).toBe(expected)
  })

  it('puts an early-morning Colombo snack on the new day (the toISOString trap)', () => {
    const snack = local(2026, 10, 26, 0, 30)
    expect(toLocalDate(snack)).toBe('2026-10-26')
  })

  it('assigns a night that crosses midnight to the wake-up day', () => {
    const bedAt = local(2026, 10, 25, 23, 30)
    const wakeAt = local(2026, 10, 26, 6, 30)
    expect(toLocalDate(wakeAt)).toBe('2026-10-26')
    expect(minutesBetween(bedAt, wakeAt)).toBe(420)
  })
})

describe('isLocalDate', () => {
  it.each(['2026-10-25', '2024-02-29', '2026-12-31'])('accepts %s', (value) => {
    expect(isLocalDate(value)).toBe(true)
  })

  it.each([
    '2026-02-29',
    '2026-13-01',
    '2026-10-32',
    '2026-1-5',
    '26-10-25',
    '2026-10-25T00:00',
    '',
    20261025,
    null,
    undefined,
  ])('rejects %s', (value) => {
    expect(isLocalDate(value)).toBe(false)
  })
})

describe('day arithmetic', () => {
  it('adds and subtracts days across month and year ends', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01')
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
    expect(addDays('2024-03-01', -1)).toBe('2024-02-29')
    expect(addDays('2026-10-25', 0)).toBe('2026-10-25')
  })

  it('counts calendar days, including across daylight-saving changes', () => {
    expect(daysBetween('2026-10-25', '2026-10-26')).toBe(1)
    expect(daysBetween('2026-10-26', '2026-10-25')).toBe(-1)
    // US clocks change on 8 March and 1 November 2026.
    expect(daysBetween('2026-03-07', '2026-03-09')).toBe(2)
    expect(daysBetween('2026-10-31', '2026-11-02')).toBe(2)
    expect(addDays('2026-03-07', 2)).toBe('2026-03-09')
    expect(daysBetween('2026-01-01', '2027-01-01')).toBe(365)
  })

  it('lists every date in an inclusive range', () => {
    expect(datesInRange('2026-12-30', '2027-01-02')).toEqual([
      '2026-12-30',
      '2026-12-31',
      '2027-01-01',
      '2027-01-02',
    ])
    expect(datesInRange('2026-10-25', '2026-10-25')).toEqual(['2026-10-25'])
    expect(datesInRange('2026-10-26', '2026-10-25')).toEqual([])
  })

  it('compares dates in calendar order', () => {
    expect(compareDates('2026-10-25', '2026-10-26')).toBeLessThan(0)
    expect(compareDates('2026-10-26', '2026-10-25')).toBeGreaterThan(0)
    expect(compareDates('2026-10-25', '2026-10-25')).toBe(0)
  })
})

describe('day boundaries', () => {
  it('starts each day at local midnight', () => {
    expect(startOfLocalDay('2026-10-25')).toBe(local(2026, 10, 25))
  })

  it('gives a half-open range from midnight to the next midnight', () => {
    const { start, end } = dayRange('2026-10-25')
    expect(start).toBe(local(2026, 10, 25))
    expect(end).toBe(local(2026, 10, 26))
    expect(toLocalDate(end - 1)).toBe('2026-10-25')
    expect(toLocalDate(end)).toBe('2026-10-26')
  })

  it('handles 23- and 25-hour days without drifting', () => {
    const spring = dayRange('2026-03-08')
    const autumn = dayRange('2026-11-01')
    const hours = (r: { start: number; end: number }) => (r.end - r.start) / 3_600_000
    if (TZ === 'America/Los_Angeles') {
      expect(hours(spring)).toBe(23)
      expect(hours(autumn)).toBe(25)
    } else {
      expect(hours(spring)).toBe(24)
      expect(hours(autumn)).toBe(24)
    }
  })

  it('builds a local time on a given date', () => {
    expect(atLocalTime('2026-10-25', 23, 40)).toBe(local(2026, 10, 25, 23, 40))
    expect(toLocalDate(atLocalTime('2026-10-25', 23, 59))).toBe('2026-10-25')
  })

  it('never treats today as over until midnight passes', () => {
    expect(isDayOver('2026-10-25', local(2026, 10, 25, 23, 59))).toBe(false)
    expect(isDayOver('2026-10-25', local(2026, 10, 26, 0, 0))).toBe(true)
    expect(isDayOver('2026-10-26', local(2026, 10, 25, 12, 0))).toBe(false)
  })
})

describe('weeks run Monday to Sunday', () => {
  it('numbers weekdays from Monday (1) to Sunday (7)', () => {
    expect(weekday('2026-10-26')).toBe(1) // Monday
    expect(weekday('2026-10-25')).toBe(7) // Sunday
    expect(weekday('2026-10-31')).toBe(6) // Saturday
  })

  it('finds the Monday and Sunday of the week', () => {
    expect(weekStart('2026-10-25')).toBe('2026-10-19') // Sunday belongs to the week before
    expect(weekEnd('2026-10-25')).toBe('2026-10-25')
    expect(weekStart('2026-10-26')).toBe('2026-10-26')
    expect(weekEnd('2026-10-26')).toBe('2026-11-01')
  })

  it('handles weeks that cross a month or year end', () => {
    expect(weekStart('2027-01-01')).toBe('2026-12-28')
    expect(weekEnd('2026-12-28')).toBe('2027-01-03')
  })

  it('lists the seven dates of the week in order', () => {
    expect(weekDates('2026-10-29')).toEqual([
      '2026-10-26',
      '2026-10-27',
      '2026-10-28',
      '2026-10-29',
      '2026-10-30',
      '2026-10-31',
      '2026-11-01',
    ])
  })
})

describe('ageOn', () => {
  it('counts whole years and only ticks over on the birthday', () => {
    expect(ageOn('2001-10-25', '2026-10-25')).toBe(25)
    expect(ageOn('2001-10-26', '2026-10-25')).toBe(24)
    expect(ageOn('2008-12-31', '2026-01-01')).toBe(17)
  })

  it('treats a 29 February birthday as reached on 1 March in other years', () => {
    expect(ageOn('2008-02-29', '2026-02-28')).toBe(17)
    expect(ageOn('2008-02-29', '2026-03-01')).toBe(18)
    expect(ageOn('2008-02-29', '2028-02-29')).toBe(20)
  })
})

describe('minutesBetween', () => {
  it('rounds to whole minutes and is negative when reversed', () => {
    expect(minutesBetween(0, 90_000)).toBe(2)
    expect(minutesBetween(60_000, 0)).toBe(-1)
  })
})
