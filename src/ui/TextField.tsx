import { useId, type InputHTMLAttributes } from 'react'
import { cx } from './cx'

export interface TextFieldProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'id' | 'className'
> {
  label: string
  hint?: string
  error?: string
}

/** A labelled text input at 16 px or larger, so iOS doesn't zoom in. */
export function TextField({ label, hint, error, ...rest }: TextFieldProps) {
  const inputId = useId()
  const hintId = useId()
  const errorId = useId()
  const describedBy = [hint && hintId, error && errorId].filter(Boolean).join(' ') || undefined
  return (
    <div>
      <label htmlFor={inputId} className="mb-2 block text-sm font-semibold">
        {label}
      </label>
      <input
        id={inputId}
        aria-describedby={describedBy}
        aria-invalid={error ? true : undefined}
        className={cx(
          'min-h-11 w-full rounded-md border bg-raised px-3 text-base text-text outline-none',
          'focus-visible:outline-3 focus-visible:outline-accent',
          error ? 'border-error' : 'border-border',
        )}
        {...rest}
      />
      {hint && (
        <p id={hintId} className="mt-2 text-sm text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="mt-2 text-sm text-error">
          {error}
        </p>
      )}
    </div>
  )
}
