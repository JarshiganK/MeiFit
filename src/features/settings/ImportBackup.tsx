import { Download, Upload } from 'lucide-react'
import { useRef, useState, type ChangeEvent } from 'react'
import { en } from '../../copy/en'
import {
  BackupError,
  createBackup,
  parseBackup,
  restoreBackup,
  summarizeBackup,
  type BackupFile,
} from '../../db/backup'
import { formatLongDate } from '../../domain/date'
import { Button, Sheet, useToast, type ButtonVariant } from '../../ui'
import { BackupStatusNote } from './BackupStatusNote'
import { useBackupStatus } from './useBackupStatus'
import { useExportBackup } from './useExportBackup'

export interface ImportBackupProps {
  variant?: ButtonVariant
  /** Runs after a successful restore, e.g. to leave setup. */
  onRestored?: () => void
  restoredMessage?: string
}

/**
 * "Import backup": pick a file, review what it holds, then replace this phone's
 * data. When this phone has data that isn't backed up, "Back up first" leads.
 */
export function ImportBackup({
  variant = 'secondary',
  onRestored,
  restoredMessage = en.data.imported,
}: ImportBackupProps) {
  const toast = useToast()
  const { exportBackup, busy } = useExportBackup()
  const status = useBackupStatus()
  const fileInput = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState<BackupFile | null>(null)
  const [restoring, setRestoring] = useState(false)
  // Until the status loads, assume a backup is needed: the safe default.
  const needsBackup = status?.needsBackup ?? true

  const onFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = '' // lets the same file be picked again
    if (!file) return
    setError(null)
    let content: string
    try {
      content = await file.text()
    } catch {
      setError(en.data.importErrors['read-failed'])
      return
    }
    try {
      setPending(parseBackup(content))
    } catch (e) {
      setError(
        e instanceof BackupError
          ? en.data.importErrors[e.problem]
          : en.data.importErrors['bad-data'],
      )
    }
  }

  const confirmImport = async () => {
    if (!pending) return
    setRestoring(true)
    try {
      // A snapshot of the current data makes the import undoable for a moment.
      const snapshot = await createBackup(Date.now())
      await restoreBackup(pending)
      toast.show({
        message: restoredMessage,
        action: { label: en.common.undo, onAction: () => void restoreBackup(snapshot) },
        durationMs: 10_000,
      })
      onRestored?.()
    } catch {
      setError(en.data.importErrors['write-failed'])
    } finally {
      setRestoring(false)
      setPending(null)
    }
  }

  const summary = pending ? summarizeBackup(pending) : null

  return (
    <>
      <Button
        block
        variant={variant}
        icon={<Upload size={20} />}
        onClick={() => fileInput.current?.click()}
      >
        {en.data.import}
      </Button>
      <input
        ref={fileInput}
        type="file"
        accept="application/json,.json"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        data-testid="backup-file-input"
        onChange={(event) => void onFile(event)}
      />
      {error && (
        <p role="alert" className="text-sm text-error">
          {error}
        </p>
      )}

      <Sheet
        open={pending !== null}
        onClose={() => setPending(null)}
        title={en.data.reviewTitle}
        description={summary ? en.data.reviewBody(formatLongDate(summary.exportedOn)) : ''}
      >
        {summary && (
          <>
            {summary.nickname && (
              <p className="font-semibold">{en.data.reviewFor(summary.nickname)}</p>
            )}
            <ul className="mt-2 list-disc pl-5 text-sm text-muted tabular-nums">
              {en.data.reviewCounts(summary).map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
            <div className="mt-4">
              <BackupStatusNote status={status} />
            </div>
            <div className="mt-6 grid gap-2">
              {needsBackup && (
                <Button
                  block
                  icon={<Download size={20} />}
                  disabled={busy}
                  onClick={() => void exportBackup()}
                >
                  {busy ? en.data.exporting : en.data.backUpFirst}
                </Button>
              )}
              <Button
                block
                variant={needsBackup ? 'secondary' : 'primary'}
                disabled={restoring}
                onClick={() => void confirmImport()}
              >
                {en.data.reviewConfirm}
              </Button>
              <Button block variant="ghost" onClick={() => setPending(null)}>
                {en.data.reviewCancel}
              </Button>
            </div>
          </>
        )}
      </Sheet>
    </>
  )
}
