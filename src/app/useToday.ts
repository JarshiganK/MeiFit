import { useEffect, useState } from 'react'
import { toLocalDate, type LocalDate } from '../domain/date'

const CHECK_EVERY_MS = 30_000

function readToday(): LocalDate {
  return toLocalDate(Date.now())
}

/**
 * Today's local date. It moves on at midnight while the app is open, and when
 * the app comes back from the background (iOS pauses timers there).
 */
export function useToday(): LocalDate {
  const [today, setToday] = useState(readToday)
  useEffect(() => {
    const sync = () => setToday(readToday())
    const timer = setInterval(sync, CHECK_EVERY_MS)
    document.addEventListener('visibilitychange', sync)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', sync)
    }
  }, [])
  return today
}

/** Read from event handlers only (the purity rule can't tell they aren't render code). */
export function nowMs(): number {
  return Date.now()
}
