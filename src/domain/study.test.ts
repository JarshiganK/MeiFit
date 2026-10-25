import { describe, expect, it } from 'vitest'
import { atLocalTime } from './date'
import {
  blocksOn,
  finishTimer,
  formatCountdown,
  sessionBlocks,
  timerStatus,
  validateManualMinutes,
  weekMinutes,
  type LoggedSession,
} from './study'

const start = atLocalTime('2026-10-25', 23, 40)
const MIN = 60_000

describe('focus timer (plan §12)', () => {
  const timer = { startedAt: start, plannedMin: 50, subjectId: 3 }

  it('works out the time left from the start timestamp', () => {
    expect(timerStatus(timer, start + 10 * MIN)).toEqual({
      endsAt: start + 50 * MIN,
      remainingMs: 40 * MIN,
      elapsedMs: 10 * MIN,
      done: false,
    })
    expect(timerStatus(timer, start + 3 * 60 * MIN)).toMatchObject({
      remainingMs: 0,
      elapsedMs: 50 * MIN,
      done: true,
    })
    expect(timerStatus(timer, start - MIN).elapsedMs).toBe(0)
  })

  it('completes a block at its scheduled length, even when you come back hours later', () => {
    expect(finishTimer(timer, start + 5 * 60 * MIN)).toEqual({
      date: '2026-10-25',
      startedAt: start,
      minutes: 50,
      completed: true,
      subjectId: 3,
    })
  })

  it('counts a block started at 23:40 on the day it started (plan §5)', () => {
    expect(finishTimer(timer, start + 50 * MIN).date).toBe('2026-10-25')
  })

  it('keeps whole minutes when stopped early', () => {
    expect(finishTimer({ startedAt: start, plannedMin: 50 }, start + 20.9 * MIN)).toEqual({
      date: '2026-10-25',
      startedAt: start,
      minutes: 20,
      completed: false,
    })
  })
})

describe('study blocks (plan §7)', () => {
  const s = (
    minutes: number,
    completed: boolean,
    source: 'timer' | 'manual',
    date = '2026-10-25',
  ): LoggedSession => ({ date, minutes, completed, source })

  it('earns one block per full block length for completed timers and manual entries', () => {
    expect(sessionBlocks(s(50, true, 'timer'), 50)).toBe(1)
    expect(sessionBlocks(s(100, true, 'timer'), 50)).toBe(2)
    expect(sessionBlocks(s(49, true, 'manual'), 50)).toBe(0)
    expect(sessionBlocks(s(120, true, 'manual'), 50)).toBe(2)
    expect(sessionBlocks(s(45, false, 'timer'), 25)).toBe(0)
    expect(sessionBlocks(s(45, true, 'timer'), 0)).toBe(0)
  })

  it('caps a day at 5 blocks and leaves other days out', () => {
    const sessions = [
      s(150, true, 'timer'),
      s(100, true, 'manual'),
      s(50, true, 'timer'),
      s(50, true, 'timer', '2026-10-24'),
    ]
    expect(blocksOn('2026-10-25', sessions, 50)).toBe(5)
    expect(blocksOn('2026-10-24', sessions, 50)).toBe(1)
  })

  it('adds up the Monday–Sunday week, partial sessions included', () => {
    const sessions = [
      s(50, true, 'timer', '2026-10-19'),
      s(20, false, 'timer', '2026-10-25'),
      s(60, true, 'manual', '2026-10-26'),
    ]
    expect(weekMinutes('2026-10-22', sessions)).toBe(70)
  })
})

describe('manual entries and the countdown', () => {
  it('accepts 1–600 whole minutes', () => {
    expect(validateManualMinutes(50)).toBeNull()
    expect(validateManualMinutes(undefined)).toBe('required')
    expect(validateManualMinutes(0)).toBe('outOfRange')
    expect(validateManualMinutes(601)).toBe('outOfRange')
    expect(validateManualMinutes(12.5)).toBe('outOfRange')
  })

  it('shows mm:ss, and hours past an hour', () => {
    expect(formatCountdown(50 * MIN)).toBe('50:00')
    expect(formatCountdown(59_001)).toBe('01:00')
    expect(formatCountdown(0)).toBe('00:00')
    expect(formatCountdown(90 * MIN)).toBe('1:30:00')
  })
})
