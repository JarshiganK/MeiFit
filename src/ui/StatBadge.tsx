import { en } from '../copy/en'
import { cx } from './cx'
import { STAT_STYLE, type Stat } from './styles'

export interface StatBadgeProps {
  stat: Stat
  /** Optional value after the label, e.g. "+30". */
  value?: string
  className?: string
}

export function StatBadge({ stat, value, className }: StatBadgeProps) {
  const { icon: Icon, text } = STAT_STYLE[stat]
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 rounded-full border border-border bg-raised px-2 py-0.5 text-xs font-bold tabular-nums',
        text,
        className,
      )}
    >
      <Icon aria-hidden="true" size={14} strokeWidth={2.25} />
      {en.stats[stat]}
      {value && <span>{value}</span>}
    </span>
  )
}
