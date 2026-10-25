import { useLiveQuery } from 'dexie-react-hooks'
import type { ReactNode } from 'react'
import { Navigate } from 'react-router'
import { getProfile } from '../db/profile'
import { ScreenFallback } from './ScreenFallback'

/** Sends a phone with no profile to first-launch setup. Loaded lazily, with the database. */
export function ProfileGate({ children }: { children: ReactNode }) {
  const hasProfile = useLiveQuery(async () => (await getProfile()) !== undefined, [])
  if (hasProfile === undefined) return <ScreenFallback />
  if (!hasProfile) return <Navigate to="/setup" replace />
  return children
}
