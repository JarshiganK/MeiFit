import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, type ReactNode } from 'react'
import { Navigate } from 'react-router'
import { syncExamPeriods } from '../db/exams'
import { getProfile } from '../db/profile'
import { recordPlannedRest } from '../db/workout'
import { ScreenFallback } from './ScreenFallback'
import { useToday } from './useToday'

/** Sends a phone with no profile to first-launch setup. Loaded lazily, with the database. */
export function ProfileGate({ children }: { children: ReactNode }) {
  const hasProfile = useLiveQuery(async () => (await getProfile()) !== undefined, [])
  const today = useToday()

  // Exam periods follow the calendar; then each day's planned rest is saved from
  // the plan in use that day, when the day is first opened.
  useEffect(() => {
    if (hasProfile) void syncExamPeriods(today).then(() => recordPlannedRest(today))
  }, [hasProfile, today])

  if (hasProfile === undefined) return <ScreenFallback />
  if (!hasProfile) return <Navigate to="/setup" replace />
  return children
}
