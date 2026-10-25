import { Download } from 'lucide-react'
import { en } from '../../copy/en'
import { Button, Card } from '../../ui'
import { ImportBackup } from './ImportBackup'
import { StorageStatus } from './StorageStatus'
import { useBackupStatus } from './useBackupStatus'
import { useExportBackup } from './useExportBackup'

/** Days without a backup before the gentle reminder shows. */
const NUDGE_AFTER_DAYS = 7

export function DataCard() {
  const { exportBackup, busy } = useExportBackup()
  const daysAgo = useBackupStatus()?.daysAgo

  return (
    <Card title={en.data.title} framed>
      <p className="text-sm text-muted">{en.data.intro}</p>
      {daysAgo !== undefined && (
        <p className="mt-3 font-semibold tabular-nums">{en.data.lastBackup(daysAgo)}</p>
      )}
      {(daysAgo === null || (daysAgo !== undefined && daysAgo > NUDGE_AFTER_DAYS)) && (
        <p className="mt-1 text-sm text-muted">{en.data.nudge}</p>
      )}

      <div className="mt-4 grid gap-2">
        <Button
          block
          icon={<Download size={20} />}
          disabled={busy}
          onClick={() => void exportBackup()}
        >
          {busy ? en.data.exporting : en.data.export}
        </Button>
        <ImportBackup />
      </div>

      <StorageStatus />
    </Card>
  )
}
