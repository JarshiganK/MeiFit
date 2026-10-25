import { ChevronDown } from 'lucide-react'
import { useId } from 'react'
import { cx } from './cx'

export interface SelectFieldProps<T extends string> {
  label: string
  options: { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
  hint?: string
}

/** A labelled native select (the system picker on iOS), 16 px so iOS doesn't zoom in. */
export function SelectField<T extends string>({
  label,
  options,
  value,
  onChange,
  hint,
}: SelectFieldProps<T>) {
  const selectId = useId()
  const hintId = useId()
  return (
    <div>
      <label htmlFor={selectId} className="mb-2 block text-sm font-semibold">
        {label}
      </label>
      <div className="relative">
        <select
          id={selectId}
          value={value}
          aria-describedby={hint ? hintId : undefined}
          onChange={(event) => onChange(event.target.value as T)}
          className={cx(
            'min-h-11 w-full appearance-none rounded-md border border-border bg-raised py-2 pl-3 pr-10 text-base text-text outline-none',
            'focus-visible:outline-3 focus-visible:outline-accent',
          )}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden="true"
          size={20}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted"
        />
      </div>
      {hint && (
        <p id={hintId} className="mt-2 text-sm text-muted">
          {hint}
        </p>
      )}
    </div>
  )
}
