import { ShieldAlert, ShieldCheck } from 'lucide-react'
import { en } from '../../copy/en'
import type { BackupStatusView } from './useBackupStatus'

/** "Last backup: …" plus whether anything has changed since, before a replace or delete. */
export function BackupStatusNote({ status }: { status: BackupStatusView | undefined }) {
  if (!status) return null
  const Icon = status.needsBackup ? ShieldAlert : ShieldCheck
  return (
    <div className="flex gap-3 rounded-md border border-border bg-raised p-3 text-sm">
      <Icon
        aria-hidden="true"
        size={20}
        className={status.needsBackup ? 'mt-0.5 shrink-0 text-muted' : 'mt-0.5 shrink-0 text-vit'}
      />
      <div className="min-w-0">
        <p className="font-semibold tabular-nums">{en.data.lastBackup(status.daysAgo)}</p>
        {status.last && status.hasData && (
          <p className="mt-0.5 text-muted">
            {status.changedSinceLast ? en.data.backupChanged : en.data.backupCurrent}
          </p>
        )}
        {status.needsBackup && <p className="mt-0.5 text-muted">{en.data.backupWhy}</p>}
      </div>
    </div>
  )
}
