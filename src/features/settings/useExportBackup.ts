import { useState } from 'react'
import { backupFileName, forgetExport, prepareExport, serializeBackup } from '../../db/backup'
import { en } from '../../copy/en'
import { useToast } from '../../ui'
import { saveFile } from './saveFile'

/**
 * Creates a backup file and hands it to the share sheet or a download. The
 * export is logged as part of building the file, so the file carries its own
 * entry; the entry is removed again if saving is cancelled or fails.
 */
export function useExportBackup(): { exportBackup: () => Promise<void>; busy: boolean } {
  const toast = useToast()
  const [busy, setBusy] = useState(false)

  const exportBackup = async () => {
    setBusy(true)
    let logId: number | undefined
    try {
      const prepared = await prepareExport(Date.now())
      logId = prepared.logId
      const blob = new Blob([serializeBackup(prepared.backup)], { type: 'application/json' })
      const result = await saveFile(blob, backupFileName(prepared.backup))
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
