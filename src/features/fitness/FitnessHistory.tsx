import { Link } from 'react-router'
import { en } from '../../copy/en'
import { formatNumber } from '../../copy/format'
import { formatShortDate, type LocalDate } from '../../domain/date'
import { Card, buttonClass } from '../../ui'
import { useCheckDue } from './useCheckDue'

/** Progress: past fitness checks and when the next is due (plan §10). */
export function FitnessHistory({ today }: { today: LocalDate }) {
  const due = useCheckDue(today)
  if (!due) return null
  const copy = en.fitness.history
  const canStart = due.window.open && !due.doneThisWindow
  return (
    <Card title={copy.title} subtitle={copy.next(formatShortDate(due.window.due))}>
      {due.checks.length === 0 ? (
        <p className="text-sm text-muted">{copy.none}</p>
      ) : (
        <ul className="-my-1 divide-y divide-border">
          {[...due.checks].reverse().map((check) => {
            const parts = [
              check.waistCm !== undefined && copy.waist(formatNumber(check.waistCm)),
              check.pushups !== undefined && copy.pushups(check.pushups),
              check.plankSec !== undefined && copy.plank(check.plankSec),
              check.squats60s !== undefined && copy.squats(check.squats60s),
            ].filter(Boolean)
            return (
              <li key={check.id} className="py-2">
                <span className="block font-semibold">{formatShortDate(check.date)}</span>
                <span className="block text-sm text-muted tabular-nums">{parts.join(' · ')}</span>
              </li>
            )
          })}
        </ul>
      )}
      {canStart && (
        <Link to="/fitness-check" className={`${buttonClass({ variant: 'secondary' })} mt-3`}>
          {copy.start}
        </Link>
      )}
    </Card>
  )
}
