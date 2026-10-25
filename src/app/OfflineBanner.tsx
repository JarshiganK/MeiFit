import { CloudOff } from 'lucide-react'
import { en } from '../copy/en'
import { useOnline } from './useOnline'

/** A calm note, not an error: the app is built to work offline. */
export function OfflineBanner() {
  const online = useOnline()
  if (online) return null
  return (
    <div
      role="status"
      className="flex items-center gap-2 border-b border-border bg-raised px-safe py-2 text-sm text-muted"
    >
      <CloudOff aria-hidden="true" size={16} className="shrink-0" />
      <p>{en.offline.banner}</p>
    </div>
  )
}
