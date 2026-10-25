import { Download, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { ScreenHeader } from '../../app/ScreenHeader'
import { useTheme } from '../../app/useTheme'
import { en } from '../../copy/en'
import { deleteAllData } from '../../db/backup'
import { Button, Card, TextField, useToast } from '../../ui'
import { BackupStatusNote } from './BackupStatusNote'
import { useBackupStatus } from './useBackupStatus'
import { useExportBackup } from './useExportBackup'

/**
 * The one action that asks for a typed confirmation instead of offering undo
 * (CLAUDE.md §7). When data isn't backed up, "Back up first" is the main action.
 */
export function DeleteAllScreen() {
  const navigate = useNavigate()
  const toast = useToast()
  const { setPref } = useTheme()
  const { exportBackup, busy } = useExportBackup()
  const status = useBackupStatus()
  const [typed, setTyped] = useState('')
  const [deleting, setDeleting] = useState(false)
  const confirmed = typed.trim().toUpperCase() === en.deleteAll.confirmWord
  // Until the status loads, assume a backup is needed: the safe default.
  const needsBackup = status?.needsBackup ?? true

  const deleteEverything = async () => {
    setDeleting(true)
    try {
      await deleteAllData()
      setPref('system')
      toast.show({ message: en.deleteAll.done })
      void navigate('/', { replace: true })
    } catch {
      toast.show({ message: en.deleteAll.failed })
      setDeleting(false)
    }
  }

  const backUpButton = (
    <Button
      variant={needsBackup ? 'primary' : 'ghost'}
      block
      size={needsBackup ? 'lg' : 'md'}
      icon={<Download size={20} />}
      disabled={busy}
      onClick={() => void exportBackup()}
    >
      {busy ? en.data.exporting : needsBackup ? en.data.backUpFirst : en.deleteAll.backUpAgain}
    </Button>
  )

  return (
    <>
      <ScreenHeader title={en.deleteAll.title} backTo="/settings" />
      <div className="flex flex-col gap-4 pt-2">
        <Card>
          <p>{en.deleteAll.body}</p>
          <div className="mt-4">
            <BackupStatusNote status={status} />
          </div>
        </Card>
        <Card>
          <form
            onSubmit={(event) => {
              event.preventDefault()
              if (confirmed) void deleteEverything()
            }}
          >
            <TextField
              label={en.deleteAll.confirmLabel}
              value={typed}
              onChange={(event) => setTyped(event.target.value)}
              autoComplete="off"
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
            />
            <div className="mt-4 grid gap-2">
              {needsBackup && backUpButton}
              <Button
                type="submit"
                variant={needsBackup ? 'secondary' : 'danger'}
                block
                size={needsBackup ? 'md' : 'lg'}
                icon={<Trash2 size={20} />}
                disabled={!confirmed || deleting}
              >
                {en.deleteAll.button}
              </Button>
              {!needsBackup && backUpButton}
            </div>
          </form>
        </Card>
      </div>
    </>
  )
}
