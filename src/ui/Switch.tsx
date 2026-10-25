import { useId } from 'react'
import { cx } from './cx'

export interface SwitchProps {
  label: string
  hint?: string
  checked: boolean
  onChange: (checked: boolean) => void
}

/** An on/off setting. The whole row is the touch target. */
export function Switch({ label, hint, checked, onChange }: SwitchProps) {
  const labelId = useId()
  const hintId = useId()
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-labelledby={labelId}
      aria-describedby={hint ? hintId : undefined}
      onClick={() => onChange(!checked)}
      className="flex min-h-11 w-full items-center gap-4 text-left"
    >
      <span className="min-w-0 flex-1">
        <span id={labelId} className="block font-semibold">
          {label}
        </span>
        {hint && (
          <span id={hintId} className="mt-0.5 block text-sm text-muted">
            {hint}
          </span>
        )}
      </span>
      <span
        aria-hidden="true"
        className={cx(
          'relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border',
          checked ? 'border-accent bg-accent' : 'border-border bg-raised',
        )}
      >
        <span
          className={cx(
            'size-5 rounded-full shadow-card transition-transform duration-(--dur-fast) ease-out',
            checked ? 'translate-x-6 bg-on-accent' : 'translate-x-1 bg-muted',
          )}
        />
      </span>
    </button>
  )
}
