import { useId, type ReactNode } from 'react'
import { cx } from './cx'

export interface CardProps {
  title?: string
  /** Small line under the title. */
  subtitle?: string | undefined
  /** Adds the HUD corner brackets; use for the one or two cards that matter most on a screen. */
  framed?: boolean
  className?: string
  children?: ReactNode
}

export function Card({ title, subtitle, framed = false, className, children }: CardProps) {
  const titleId = useId()
  return (
    <section
      aria-labelledby={title ? titleId : undefined}
      className={cx(
        'rounded-lg border border-border bg-surface p-4 shadow-card',
        framed && 'hud-frame p-5',
        className,
      )}
    >
      {title && (
        <header className="mb-3">
          <h2 id={titleId} className="text-lg font-semibold">
            {title}
          </h2>
          {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
        </header>
      )}
      {children}
    </section>
  )
}
