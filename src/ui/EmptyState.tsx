import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

export interface EmptyStateProps {
  icon: LucideIcon
  title: string
  body: string
  action?: ReactNode
}

/** Every empty, first-use or error screen gets one of these; no screen is ever blank. */
export function EmptyState({ icon: Icon, title, body, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center px-4 py-12 text-center">
      <div className="hud-frame mb-5 flex size-20 items-center justify-center rounded-xl border border-border bg-surface text-accent shadow-card">
        <Icon aria-hidden="true" size={32} strokeWidth={1.75} />
      </div>
      <h2 className="font-display text-xl font-semibold">{title}</h2>
      <p className="mt-2 max-w-xs text-muted">{body}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
