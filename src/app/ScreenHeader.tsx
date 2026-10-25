import { ChevronLeft, Settings } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { en } from '../copy/en'
import { iconButtonClass } from '../ui'

export interface ScreenHeaderProps {
  title: string
  /** Shows a back link instead of the Settings gear. */
  backTo?: string
  /** Extra actions shown before the gear. */
  actions?: ReactNode
}

export function ScreenHeader({ title, backTo, actions }: ScreenHeaderProps) {
  return (
    <header className="flex min-h-14 items-center gap-1 pt-2">
      {backTo && (
        <Link to={backTo} aria-label={en.common.back} className={iconButtonClass()}>
          <ChevronLeft aria-hidden="true" size={26} />
        </Link>
      )}
      <h1 className="min-w-0 flex-1 truncate font-display text-2xl font-bold">{title}</h1>
      {actions}
      {!backTo && (
        <Link to="/settings" aria-label={en.nav.settings} className={iconButtonClass()}>
          <Settings aria-hidden="true" size={24} />
        </Link>
      )}
    </header>
  )
}
