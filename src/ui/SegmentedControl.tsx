import { useId, type ReactNode } from 'react'
import { cx } from './cx'

export interface SegmentOption<T extends string> {
  value: T
  label: string
  icon?: ReactNode
}

export interface SegmentedControlProps<T extends string> {
  label: string
  options: SegmentOption<T>[]
  value: T
  onChange: (value: T) => void
  hint?: string
}

/** A single choice from a few options, built on native radio buttons. */
export function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
  hint,
}: SegmentedControlProps<T>) {
  const name = useId()
  const hintId = useId()
  return (
    <fieldset aria-describedby={hint ? hintId : undefined}>
      <legend className="mb-2 text-sm font-semibold">{label}</legend>
      <div className="flex gap-1 rounded-md border border-border bg-bg p-1">
        {options.map((option) => {
          const checked = option.value === value
          return (
            <label
              key={option.value}
              className={cx(
                'flex min-h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-sm px-2 text-sm font-semibold',
                'has-focus-visible:outline-3 has-focus-visible:outline-accent',
                checked ? 'bg-raised text-text shadow-card ring-1 ring-border' : 'text-muted',
              )}
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={checked}
                onChange={() => onChange(option.value)}
                className="sr-only"
              />
              {option.icon && (
                <span aria-hidden="true" className="inline-flex">
                  {option.icon}
                </span>
              )}
              {option.label}
            </label>
          )
        })}
      </div>
      {hint && (
        <p id={hintId} className="mt-2 text-sm text-muted">
          {hint}
        </p>
      )}
    </fieldset>
  )
}
