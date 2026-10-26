import { useLiveQuery } from 'dexie-react-hooks'
import { Footprints } from 'lucide-react'
import { en } from '../../copy/en'
import { formatNumber } from '../../copy/format'
import { recentSteps } from '../../db/imports'
import { addDays, formatShortDate, type LocalDate } from '../../domain/date'
import { Card } from '../../ui'

/** Steps imported through Health Sync (plan §6, §11). Hidden until there are any. */
export function StepsCard({ today }: { today: LocalDate }) {
  const days = useLiveQuery(() => recentSteps(addDays(today, -6)), [today])
  if (!days || days.length === 0) return null
  const latest = days.at(-1)!
  const average = Math.round(days.reduce((sum, d) => sum + d.steps, 0) / days.length)
  return (
    <Card title={en.steps.title}>
      <p className="flex items-center gap-2 font-semibold tabular-nums">
        <Footprints aria-hidden="true" size={20} className="text-str" />
        {en.steps.latest(formatNumber(latest.steps), formatShortDate(latest.date))}
      </p>
      <p className="text-sm text-muted tabular-nums">{en.steps.average(formatNumber(average))}</p>
      <p className="mt-2 text-sm text-muted">{en.steps.how}</p>
    </Card>
  )
}
