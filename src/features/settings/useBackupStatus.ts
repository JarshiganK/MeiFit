import { useLiveQuery } from 'dexie-react-hooks'
import { getBackupStatus, type BackupStatus } from '../../db/backup'
import { daysBetween, toLocalDate } from '../../domain/date'

export interface BackupStatusView extends BackupStatus {
  /** Days since the last backup; null when there has never been one. */
  daysAgo: number | null
}

/** Live backup status. Undefined while loading. */
export function useBackupStatus(): BackupStatusView | undefined {
  return useLiveQuery(async () => {
    const status = await getBackupStatus()
    const daysAgo = status.last ? daysBetween(status.last.date, toLocalDate(Date.now())) : null
    return { ...status, daysAgo }
  }, [])
}
