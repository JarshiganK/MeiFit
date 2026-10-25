import { cx } from './cx'

export type ProgressTone = 'accent' | 'str' | 'vit' | 'int'

const FILL: Record<ProgressTone, string> = {
  accent: 'bg-accent',
  str: 'bg-str',
  vit: 'bg-vit',
  int: 'bg-int',
}

export interface ProgressBarProps {
  label: string
  value: number
  max: number
  tone?: ProgressTone
  /** Read by screen readers instead of the raw numbers, e.g. "82 of 110 grams". */
  valueText?: string
  size?: 'sm' | 'md'
  className?: string
}

/** Fills with a transform (not width) so the animation stays on the compositor. */
export function ProgressBar({
  label,
  value,
  max,
  tone = 'accent',
  valueText,
  size = 'md',
  className,
}: ProgressBarProps) {
  const ratio = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={Math.min(value, max)}
      aria-valuetext={valueText}
      className={cx(
        'w-full overflow-hidden rounded-full bg-raised ring-1 ring-border ring-inset',
        size === 'sm' ? 'h-1.5' : 'h-3',
        className,
      )}
    >
      <div
        className={cx(
          'h-full w-full origin-left rounded-full transition-transform duration-(--dur-slow) ease-out',
          FILL[tone],
        )}
        style={{ transform: `scaleX(${ratio})` }}
      />
    </div>
  )
}
