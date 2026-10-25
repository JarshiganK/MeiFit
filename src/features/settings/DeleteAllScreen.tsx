import { Download, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { ScreenHeader } from '../../app/ScreenHeader'
import { useTheme } from '../../app/useTheme'
import { en } from '../../copy/en'
import { deleteAllData } from '../../db/backup'
import { Button, Card, TextField, useToast } from '../../ui'
import { useExportBackup } from './useExportBackup'

/** The one action that asks for a typed confirmation instead of offering undo (CLAUDE.md §7). */
export function DeleteAllScreen() {
  const navigate = useNavigate()
  const toast = useToast()
  const { setPref } = useTheme()
  const { exportBackup, busy } = useExportBackup()
  const [typed, setTyped] = useState('')
  const [deleting, setDeleting] = useState(false)
  const confirmed = typed.trim().toUpperCase() === en.deleteAll.confirmWord

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

  return (
    <>
      <ScreenHeader title={en.deleteAll.title} backTo="/settings" />
      <div className="flex flex-col gap-4 pt-2">
        <Card>
          <p>{en.deleteAll.body}</p>
          <Button
            variant="secondary"
            block
            className="mt-4"
            icon={<Download size={20} />}
            disabled={busy}
            onClick={() => void exportBackup()}
          >
            {en.deleteAll.exportFirst}
          </Button>
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
            <Button
              type="submit"
              variant="danger"
              block
              size="lg"
              className="mt-4"
              icon={<Trash2 size={20} />}
              disabled={!confirmed || deleting}
            >
              {en.deleteAll.button}
            </Button>
          </form>
        </Card>
      </div>
    </>
  )
}
