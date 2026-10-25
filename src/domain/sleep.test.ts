import { describe, expect, it } from 'vitest'
import { atLocalTime, fromDateTimeInput, toDateTimeInput, formatTime } from './date'
import {
  ASK_WAKE_AFTER_MS,
  hoursAndMinutes,
  mainSleep,
  meetsSleepTarget,
  needsWakeTime,
  sleepEntry,
  validateSleep,
} from './sleep'

const bed = atLocalTime('2026-10-25', 23, 30)
const wake = atLocalTime('2026-10-26', 6, 30)

describe('sleepEntry (plan §5)', () => {
  it('counts a night across midnight on the day you wake up', () => {
    expect(sleepEntry({ bedAt: bed, wakeAt: wake })).toEqual({
      bedAt: bed,
      wakeAt: wake,
      wakeDate: '2026-10-26',
      minutes: 420,
    })
  })

  it('keeps a sleep that ends at 23:59 on that day', () => {
    const late = sleepEntry({
      bedAt: atLocalTime('2026-10-25', 22, 0),
      wakeAt: atLocalTime('2026-10-25', 23, 59),
    })
    expect(late.wakeDate).toBe('2026-10-25')
    expect(late.minutes).toBe(119)
  })

  it('puts a wake-up at 00:00 on the new day', () => {
    expect(
      sleepEntry({
        bedAt: atLocalTime('2026-10-25', 22, 0),
        wakeAt: atLocalTime('2026-10-26', 0, 0),
      }).wakeDate,
    ).toBe('2026-10-26')
  })
})

describe('needsWakeTime (owner change 4)', () => {
  it('asks for the real wake time after 16 hours', () => {
    expect(needsWakeTime(bed, bed + ASK_WAKE_AFTER_MS)).toBe(false)
    expect(needsWakeTime(bed, bed + ASK_WAKE_AFTER_MS + 1)).toBe(true)
  })
})

describe('validateSleep', () => {
  const now = atLocalTime('2026-10-26', 9, 0)
  it('accepts a normal night', () => {
    expect(validateSleep(bed, wake, now)).toBeNull()
  })
  it('rejects missing, backwards, over-long and future times', () => {
    expect(validateSleep(undefined, wake, now)).toBe('missing')
    expect(validateSleep(wake, bed, now)).toBe('wakeBeforeBed')
    expect(validateSleep(bed, bed, now)).toBe('wakeBeforeBed')
    expect(validateSleep(bed - 86_400_000, wake, now)).toBe('tooLong')
    expect(validateSleep(bed, now + 60_000, now)).toBe('inFuture')
  })
})

describe('mainSleep and the sleep target', () => {
  it('uses the longest sleep of the day', () => {
    const night = { id: 1, minutes: 400 }
    const nap = { id: 2, minutes: 40 }
    expect(mainSleep([nap, night])).toBe(night)
    expect(mainSleep([])).toBeUndefined()
  })

  it('meets the target at or above it', () => {
    expect(meetsSleepTarget(420, 420)).toBe(true)
    expect(meetsSleepTarget(419, 420)).toBe(false)
    expect(meetsSleepTarget(undefined, 420)).toBe(false)
  })

  it('splits minutes into hours and minutes', () => {
    expect(hoursAndMinutes(438)).toEqual({ hours: 7, minutes: 18 })
    expect(hoursAndMinutes(-5)).toEqual({ hours: 0, minutes: 0 })
  })
})

describe('datetime inputs', () => {
  it('round-trips local date and time', () => {
    expect(toDateTimeInput(bed)).toBe('2026-10-25T23:30')
    expect(fromDateTimeInput('2026-10-25T23:30')).toBe(bed)
    expect(formatTime(wake)).toBe('06:30')
  })

  it('rejects anything else', () => {
    expect(fromDateTimeInput('')).toBeUndefined()
    expect(fromDateTimeInput('2026-10-25 23:30')).toBeUndefined()
    expect(fromDateTimeInput('2026-02-30T10:00')).toBeUndefined()
  })
})
