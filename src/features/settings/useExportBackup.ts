import { useState } from 'react'
import {
  backupFileName,
  createBackup,
  forgetExport,
  recordExport,
  serializeBackup,
} from '../../db/backup'
import { en } from '../../copy/en'
import { useToast } from '../../ui'
import { saveFile } from './saveFile'

/**
 * Creates a backup file and hands it to the share sheet or a download. The
 * export is logged first so the file carries its own entry (and the weekly
 * quest survives a restore); the entry is removed again if saving is cancelled.
 */
export function useExportBackup(): { exportBackup: () => Promise<void>; busy: boolean } {
  const toast = useToast()
  const [busy, setBusy] = useState(false)

  const exportBackup = async () => {
    setBusy(true)
    let logId: number | undefined
    try {
      const now = Date.now()
      logId = await recordExport(now)
      const backup = await createBackup(now)
      const blob = new Blob([serializeBackup(backup)], { type: 'application/json' })
      const result = await saveFile(blob, backupFileName(backup))
      if (result === 'cancelled') await forgetExport(logId)
      else toast.show({ message: en.data.exported })
    } catch {
      if (logId !== undefined) await forgetExport(logId).catch(() => undefined)
      toast.show({ message: en.data.exportFailed })
    } finally {
      setBusy(false)
    }
  }

  return { exportBackup, busy }
}
