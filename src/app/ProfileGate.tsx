import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, type ReactNode } from 'react'
import { Navigate } from 'react-router'
import { getProfile } from '../db/profile'
import { recordPlannedRest } from '../db/workout'
import { ScreenFallback } from './ScreenFallback'
import { useToday } from './useToday'

/** Sends a phone with no profile to first-launch setup. Loaded lazily, with the database. */
export function ProfileGate({ children }: { children: ReactNode }) {
  const hasProfile = useLiveQuery(async () => (await getProfile()) !== undefined, [])
  const today = useToday()

  // Each day's planned-rest flag is saved from the plan when the day is first opened.
  useEffect(() => {
    if (hasProfile) void recordPlannedRest(today)
  }, [hasProfile, today])

  if (hasProfile === undefined) return <ScreenFallback />
  if (!hasProfile) return <Navigate to="/setup" replace />
  return children
}
