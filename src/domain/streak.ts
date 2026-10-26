/**
 * Streaks and shields (plan §7). A day counts if at least 5 of the 7 daily
 * quests are done. Every 7 counted days in a row earn a shield, up to 2, and
 * a shield is used automatically on a missed day. Worked out by walking the
 * days in order, so it always matches the logs. Today is never missed before
 * midnight.
 */
import { addDays, datesInRange, type LocalDate } from './date'
import { indexHistory, questsForDay, type QuestHistory } from './quests'

export const QUESTS_FOR_STREAK = 5
export const DAYS_PER_SHIELD = 7
export const MAX_SHIELDS = 2

export interface StreakState {
  /** Counted days in the current streak, today included once it counts. */
  current: number
  best: number
  shields: number
  /** Days a shield saved, oldest first. */
  shieldedDays: LocalDate[]
  /** Quests done today, and whether today already counts. */
  todayDone: number
  todayCounts: boolean
}

/** Walks the days from `from` to `today` with a "does this day count" test. */
export function walkStreak(
  counts: (date: LocalDate) => boolean,
  from: LocalDate,
  today: LocalDate,
): Omit<StreakState, 'todayDone'> {
  let current = 0
  let best = 0
  let shields = 0
  let run = 0 // counted days since the last shield was earned or the streak broke
  const shieldedDays: LocalDate[] = []

  const countDay = () => {
    current++
    run++
    best = Math.max(best, current)
    if (run >= DAYS_PER_SHIELD) {
      run = 0
      shields = Math.min(MAX_SHIELDS, shields + 1)
    }
  }

  const yesterday = addDays(today, -1)
  if (from <= yesterday) {
    for (const date of datesInRange(from, yesterday)) {
      if (counts(date)) {
        countDay()
      } else if (shields > 0) {
        shields--
        shieldedDays.push(date)
      } else {
        current = 0
        run = 0
      }
    }
  }

  // Today can only add to the streak; it isn't missed until midnight.
  const todayCounts = from <= today && counts(today)
  if (todayCounts) countDay()
  return { current, best, shields, shieldedDays, todayCounts }
}

export function streakFor(history: QuestHistory, today: LocalDate): StreakState {
  const index = indexHistory(history)
  const done = (date: LocalDate) => questsForDay(index, date).filter((q) => q.done).length
  const state = walkStreak(
    (date) => done(date) >= QUESTS_FOR_STREAK,
    history.profile.setupDate,
    today,
  )
  return { ...state, todayDone: history.profile.setupDate <= today ? done(today) : 0 }
}
