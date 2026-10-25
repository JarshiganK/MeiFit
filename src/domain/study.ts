/**
 * Study (plan §5, §7, §12). The focus timer saves its start time and works
 * out elapsed time from it, so it's right after iOS pauses the app. A study
 * block counts on the day it starts.
 */
import { toLocalDate, weekDates, type LocalDate } from './date'

export const MAX_BLOCKS_PER_DAY = 5
export const TIMER_LIMITS = { min: 5, max: 180, step: 5 } as const
export const MANUAL_LIMITS = { min: 1, max: 600 } as const

const MINUTE_MS = 60_000

export interface FocusTimer {
  startedAt: number
  plannedMin: number
  subjectId?: number | undefined
}

export interface TimerStatus {
  endsAt: number
  remainingMs: number
  elapsedMs: number
  done: boolean
}

export function timerStatus(timer: FocusTimer, now: number): TimerStatus {
  const endsAt = timer.startedAt + timer.plannedMin * MINUTE_MS
  return {
    endsAt,
    remainingMs: Math.max(0, endsAt - now),
    elapsedMs: Math.min(Math.max(0, now - timer.startedAt), endsAt - timer.startedAt),
    done: now >= endsAt,
  }
}

export interface SessionValues {
  date: LocalDate
  startedAt: number
  minutes: number
  completed: boolean
  subjectId?: number
}

/**
 * Ends a timer. At or after the end time the block is complete, at its
 * scheduled length (approved default); stopped early, it keeps the whole
 * minutes studied and counts toward hours only.
 */
export function finishTimer(timer: FocusTimer, now: number): SessionValues {
  const { done, elapsedMs } = timerStatus(timer, now)
  return {
    date: toLocalDate(timer.startedAt),
    startedAt: timer.startedAt,
    minutes: done ? timer.plannedMin : Math.floor(elapsedMs / MINUTE_MS),
    completed: done,
    ...(timer.subjectId !== undefined ? { subjectId: timer.subjectId } : {}),
  }
}

export interface LoggedSession {
  date: LocalDate
  minutes: number
  completed: boolean
  source: 'timer' | 'manual'
}

/**
 * Blocks a session earns (plan §7): a completed timer session or a manual
 * entry earns one per full block length; a timer stopped early earns none.
 */
export function sessionBlocks(session: LoggedSession, blockMin: number): number {
  if (blockMin <= 0) return 0
  if (session.source === 'timer' && !session.completed) return 0
  return Math.floor(session.minutes / blockMin)
}

/** Blocks on one day, capped at 5. */
export function blocksOn(
  date: LocalDate,
  sessions: readonly LoggedSession[],
  blockMin: number,
): number {
  const total = sessions
    .filter((s) => s.date === date)
    .reduce((sum, s) => sum + sessionBlocks(s, blockMin), 0)
  return Math.min(MAX_BLOCKS_PER_DAY, total)
}

/** All study minutes, counted or not, in the Monday–Sunday week of `date`. */
export function weekMinutes(date: LocalDate, sessions: readonly LoggedSession[]): number {
  const week = new Set(weekDates(date))
  return sessions.filter((s) => week.has(s.date)).reduce((sum, s) => sum + s.minutes, 0)
}

export function validateManualMinutes(
  minutes: number | undefined,
): 'required' | 'outOfRange' | null {
  if (minutes === undefined) return 'required'
  if (!Number.isInteger(minutes) || minutes < MANUAL_LIMITS.min || minutes > MANUAL_LIMITS.max) {
    return 'outOfRange'
  }
  return null
}

/** "mm:ss", or "h:mm:ss" past an hour, for the countdown. */
export function formatCountdown(ms: number): string {
  const total = Math.ceil(Math.max(0, ms) / 1000)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`
}
