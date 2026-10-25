import { Minus, Plus } from 'lucide-react'
import { useId, useState } from 'react'
import { en } from '../copy/en'
import { IconButton } from './IconButton'
import { clampToStep } from './styles'

export interface NumberStepperProps {
  label: string
  value: number
  onChange: (value: number) => void
  min: number
  max: number
  step?: number
  /** Shown after the number, e.g. "kg". */
  unit?: string
  hint?: string
}

/** A labelled number field with − and + buttons. Typing is allowed; the value snaps on blur. */
export function NumberStepper({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  unit,
  hint,
}: NumberStepperProps) {
  const inputId = useId()
  const hintId = useId()
  const [draft, setDraft] = useState<string | null>(null)

  const commit = (next: number) => {
    setDraft(null)
    if (Number.isFinite(next)) onChange(clampToStep(next, min, max, step))
  }

  return (
    <div>
      <label htmlFor={inputId} className="mb-2 block text-sm font-semibold">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <IconButton
          label={en.common.decrease(label)}
          icon={<Minus size={20} />}
          tone="raised"
          disabled={value <= min}
          onClick={() => commit(value - step)}
        />
        <div className="flex min-h-11 flex-1 items-center rounded-md border border-border bg-raised px-3 focus-within:outline-3 focus-within:outline-accent">
          <input
            id={inputId}
            inputMode="decimal"
            autoComplete="off"
            aria-describedby={hint ? hintId : undefined}
            value={draft ?? String(value)}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={() => {
              if (draft !== null) commit(Number(draft.replace(',', '.')))
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') event.currentTarget.blur()
            }}
            className="w-full min-w-0 bg-transparent text-center font-display font-semibold tabular-nums outline-none"
          />
          {unit && <span className="text-sm text-muted">{unit}</span>}
        </div>
        <IconButton
          label={en.common.increase(label)}
          icon={<Plus size={20} />}
          tone="raised"
          disabled={value >= max}
          onClick={() => commit(value + step)}
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
