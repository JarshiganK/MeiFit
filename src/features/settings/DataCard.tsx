import { useLiveQuery } from 'dexie-react-hooks'
import { Download, Upload } from 'lucide-react'
import { useRef, useState, type ChangeEvent } from 'react'
import { en } from '../../copy/en'
import {
  BackupError,
  createBackup,
  lastExport,
  parseBackup,
  restoreBackup,
  summarizeBackup,
  type BackupFile,
} from '../../db/backup'
import { daysBetween, formatLongDate, toLocalDate } from '../../domain/date'
import { Button, Card, Sheet, useToast } from '../../ui'
import { StorageStatus } from './StorageStatus'
import { useExportBackup } from './useExportBackup'

/** Days without a backup before the gentle reminder shows. */
const NUDGE_AFTER_DAYS = 7

export function DataCard() {
  const toast = useToast()
  const { exportBackup, busy } = useExportBackup()
  const fileInput = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState<BackupFile | null>(null)
  const [restoring, setRestoring] = useState(false)

  // Days since the last export: null = never exported; undefined = still loading.
  const daysAgo = useLiveQuery(async () => {
    const last = await lastExport()
    return last ? daysBetween(last.date, toLocalDate(Date.now())) : null
  }, [])

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
      // A snapshot of the current data makes the import undoable.
      const snapshot = await createBackup(Date.now())
      await restoreBackup(pending)
      toast.show({
        message: en.data.imported,
        action: { label: en.common.undo, onAction: () => void restoreBackup(snapshot) },
        durationMs: 10_000,
      })
    } catch {
      setError(en.data.importErrors['write-failed'])
    } finally {
      setRestoring(false)
      setPending(null)
    }
  }

  const summary = pending ? summarizeBackup(pending) : null

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
        <Button
          block
          variant="secondary"
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
      </div>
      {error && (
        <p role="alert" className="mt-3 text-sm text-error">
          {error}
        </p>
      )}

      <StorageStatus />

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
            <div className="mt-6 grid gap-2">
              <Button block disabled={restoring} onClick={() => void confirmImport()}>
                {en.data.reviewConfirm}
              </Button>
              <Button block variant="ghost" onClick={() => setPending(null)}>
                {en.data.reviewCancel}
              </Button>
            </div>
          </>
        )}
      </Sheet>
    </Card>
  )
}
