import { en } from '../copy/en'
import { cx } from './cx'

export interface StepperProps {
  /** 1-based current step. */
  current: number
  total: number
}

/** Progress through a step-by-step flow such as setup or a fitness check. */
export function Stepper({ current, total }: StepperProps) {
  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-muted tabular-nums">
        {en.common.stepOf(current, total)}
      </p>
      <ol aria-hidden="true" className="flex gap-1">
        {Array.from({ length: total }, (_, i) => (
          <li
            key={i}
            className={cx('h-1 flex-1 rounded-full', i < current ? 'bg-accent' : 'bg-border')}
          />
        ))}
      </ol>
    </div>
  )
}
