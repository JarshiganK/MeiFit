import { en } from '../../copy/en'
import { portionsFor, type FoodUnit } from '../../domain/food'
import { cx } from '../../ui'
import { approxKcal, portionLabel } from './format'

export interface PortionPickerProps {
  unit: FoodUnit
  /** Calories and protein for one serving (portion 1). */
  perServing: { kcal: number; proteinG: number }
  /** The portion already logged, when changing an entry. */
  current?: number | undefined
  hideKcal: boolean
  onPick: (portion: number) => void
}

/** One button per portion, so logging is a single tap once the sheet is open. */
export function PortionPicker({ unit, perServing, current, hideKcal, onPick }: PortionPickerProps) {
  const portions = portionsFor(unit)
  return (
    <ul
      aria-label={en.food.portion}
      className={cx('grid gap-2', unit === 'count' ? 'grid-cols-5' : 'grid-cols-3')}
    >
      {portions.map((portion) => {
        const selected = portion === current
        return (
          <li key={portion}>
            <button
              type="button"
              aria-pressed={current === undefined ? undefined : selected}
              onClick={() => onPick(portion)}
              className={cx(
                'flex min-h-14 w-full flex-col items-center justify-center rounded-md border px-1 py-2 text-center',
                'focus-visible:outline-3 focus-visible:outline-accent',
                selected ? 'border-accent bg-raised' : 'border-border bg-surface',
              )}
            >
              <span className="font-semibold tabular-nums">{portionLabel(unit, portion)}</span>
              {!hideKcal && unit !== 'count' && (
                <span className="text-sm text-muted tabular-nums">
                  ≈{approxKcal(perServing.kcal * portion)}
                </span>
              )}
            </button>
          </li>
        )
      })}
    </ul>
  )
}
