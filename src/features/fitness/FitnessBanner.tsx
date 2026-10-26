import { HeartPulse } from 'lucide-react'
import { Link } from 'react-router'
import { en } from '../../copy/en'
import { formatShortDate, type LocalDate } from '../../domain/date'
import { Card, buttonClass } from '../../ui'
import { useCheckDue } from './useCheckDue'

/** Shown on Status while a fitness check's window is open (plan §4). */
export function FitnessBanner({ today }: { today: LocalDate }) {
  const due = useCheckDue(today)
  if (!due || !due.window.open || due.doneThisWindow) return null
  const { window } = due
  return (
    <Card framed title={en.fitness.banner.title}>
      <div className="flex items-start gap-3">
        <HeartPulse aria-hidden="true" size={28} className="mt-1 shrink-0 text-vit" />
        <div className="min-w-0 flex-1">
          <p>
            {en.fitness.banner.body(formatShortDate(window.due), formatShortDate(window.closes))}
          </p>
          {window.moved && <p className="text-sm text-muted">{en.fitness.banner.moved}</p>}
          <Link to="/fitness-check" className={`${buttonClass()} mt-3`}>
            {en.fitness.banner.start}
          </Link>
        </div>
      </div>
    </Card>
  )
}
