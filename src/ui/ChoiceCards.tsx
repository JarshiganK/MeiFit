import { Check } from 'lucide-react'
import { useId } from 'react'
import { cx } from './cx'

export interface Choice<T extends string> {
  value: T
  label: string
  hint?: string
}

export interface ChoiceCardsProps<T extends string> {
  label: string
  choices: Choice<T>[]
  value: T | undefined
  onChange: (value: T) => void
  hint?: string
  error?: string
  /** Two columns for short options. */
  columns?: 1 | 2
}

/** A single choice shown as large tappable cards, built on native radio buttons. */
export function ChoiceCards<T extends string>({
  label,
  choices,
  value,
  onChange,
  hint,
  error,
  columns = 1,
}: ChoiceCardsProps<T>) {
  const name = useId()
  const hintId = useId()
  const errorId = useId()
  const describedBy = [hint && hintId, error && errorId].filter(Boolean).join(' ') || undefined
  return (
    <fieldset aria-describedby={describedBy}>
      <legend className="mb-2 text-sm font-semibold">{label}</legend>
      {hint && (
        <p id={hintId} className="-mt-1 mb-2 text-sm text-muted">
          {hint}
        </p>
      )}
      <div className={cx('grid gap-2', columns === 2 && 'grid-cols-2')}>
        {choices.map((choice, index) => {
          const checked = choice.value === value
          return (
            <label
              key={choice.value}
              className={cx(
                'flex min-h-13 cursor-pointer items-center gap-3 rounded-md border px-4 py-3',
                'has-focus-visible:outline-3 has-focus-visible:outline-accent',
                checked ? 'border-accent bg-raised' : 'border-border bg-surface',
              )}
            >
              <input
                type="radio"
                name={name}
                value={choice.value}
                checked={checked}
                onChange={() => onChange(choice.value)}
                aria-invalid={error && index === 0 ? true : undefined}
                className="sr-only"
              />
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">{choice.label}</span>
                {choice.hint && <span className="block text-sm text-muted">{choice.hint}</span>}
              </span>
              <span
                aria-hidden="true"
                className={cx(
                  'inline-flex size-6 shrink-0 items-center justify-center rounded-full border',
                  checked ? 'border-accent bg-accent text-on-accent' : 'border-border',
                )}
              >
                {checked && <Check size={16} strokeWidth={3} />}
              </span>
            </label>
          )
        })}
      </div>
      {error && (
        <p id={errorId} className="mt-2 text-sm text-error">
          {error}
        </p>
      )}
    </fieldset>
  )
}
