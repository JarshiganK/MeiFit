import { ShieldCheck, ShieldAlert } from 'lucide-react'
import { useEffect, useState } from 'react'
import { en } from '../../copy/en'
import {
  getStorageStatus,
  requestPersistentStorage,
  type StorageStatus as Status,
} from '../../db/storage'
import { Button } from '../../ui'

export function StorageStatus() {
  const [status, setStatus] = useState<Status | null>(null)
  const [denied, setDenied] = useState(false)

  useEffect(() => {
    let active = true
    void getStorageStatus().then((next) => {
      if (active) setStatus(next)
    })
    return () => {
      active = false
    }
  }, [])

  if (!status) return null

  const protect = async () => {
    const granted = await requestPersistentStorage()
    setDenied(!granted)
    setStatus(await getStorageStatus())
  }

  const message = !status.supported
    ? en.data.storageUnsupported
    : status.persisted
      ? en.data.storageProtected
      : en.data.storageNotProtected
  const Icon = status.persisted ? ShieldCheck : ShieldAlert

  return (
    <div className="mt-5 border-t border-border pt-4">
      <h3 className="font-semibold">{en.data.storageTitle}</h3>
      <div className="mt-2 flex gap-3">
        <Icon
          aria-hidden="true"
          size={20}
          className={status.persisted ? 'mt-0.5 shrink-0 text-vit' : 'mt-0.5 shrink-0 text-muted'}
        />
        <div className="min-w-0 text-sm">
          <p className="text-muted">{message}</p>
          {status.usageBytes !== undefined && (
            <p className="mt-1 text-muted tabular-nums">
              {en.data.storageUsage(status.usageBytes)}
            </p>
          )}
          {denied && <p className="mt-2 text-muted">{en.data.storageDenied}</p>}
        </div>
      </div>
      {status.supported && !status.persisted && (
        <Button variant="secondary" block className="mt-3" onClick={() => void protect()}>
          {en.data.storageProtect}
        </Button>
      )}
    </div>
  )
}
