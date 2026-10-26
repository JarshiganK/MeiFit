import { useLiveQuery } from 'dexie-react-hooks'
import { Trophy } from 'lucide-react'
import { en } from '../../copy/en'
import { formatNumber } from '../../copy/format'
import { db } from '../../db/db'
import { formatShortDate } from '../../domain/date'
import { bestScores, personalRecords } from '../../domain/records'
import { Card } from '../../ui'

/** Personal records (plan §10): the best for each exercise, and how many records so far. */
export function RecordsCard() {
  const data = useLiveQuery(async () => ({
    exercises: await db.exercises.toArray(),
    sets: await db.workoutSets.toArray(),
  }))
  if (!data) return <Card title={en.records.title}>{null}</Card>

  const types = new Map(data.exercises.map((e) => [e.id, e.type]))
  const typeOf = (id: number) => types.get(id)
  const records = personalRecords(data.sets, typeOf)
  const best = [...bestScores(data.sets, typeOf)]
    .map(([id, value]) => ({ exercise: data.exercises.find((e) => e.id === id)!, ...value }))
    .sort((a, b) => a.exercise.name.localeCompare(b.exercise.name))
  const copy = en.records

  return (
    <Card title={copy.title} subtitle={records.length > 0 ? copy.count(records.length) : undefined}>
      {records.length === 0 ? (
        <p className="text-sm text-muted">{copy.none}</p>
      ) : (
        <ul className="-my-1 divide-y divide-border">
          {best.map(({ exercise, value, date }) => {
            const shown =
              exercise.type === 'weight-reps'
                ? copy.e1rm(formatNumber(value))
                : exercise.type === 'reps'
                  ? copy.reps(value)
                  : copy.seconds(value)
            return (
              <li key={exercise.id} className="flex min-h-12 items-center gap-3 py-2">
                <Trophy aria-hidden="true" size={20} className="shrink-0 text-accent" />
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{exercise.name}</span>
                  <span className="block text-sm text-muted tabular-nums">
                    {copy.on(shown, formatShortDate(date))}
                  </span>
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}
