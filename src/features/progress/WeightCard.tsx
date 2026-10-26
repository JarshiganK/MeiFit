import { useLiveQuery } from 'dexie-react-hooks'
import { lazy, Suspense, useState } from 'react'
import { nowMs, useToday } from '../../app/useToday'
import { en } from '../../copy/en'
import { formatNumber } from '../../copy/format'
import { allWeighIns, deleteWeighIn, restoreBodyLog, saveWeighIn } from '../../db/body'
import {
  roundWeight,
  validateWeight,
  weekAverageFor,
  weeklyAverages,
  weeklyChange,
} from '../../domain/body'
import { addDays, formatShortDate, weekStart, type LocalDate } from '../../domain/date'
import { parseNumber } from '../../domain/number'
import { Button, Card, Sheet, TextField, useToast } from '../../ui'
import { WaistForm } from './WaistForm'

const WeightChart = lazy(() => import('./WeightChart'))

const CHART_WEEKS = 12
const RECENT = 7

const kgText = (kg: number) => formatNumber(roundWeight(kg))

/** Weigh-ins, this week's average and the trend chart (plan §2, §10). */
export function WeightCard() {
  const today = useToday()
  const weighIns = useLiveQuery(allWeighIns)
  const [text, setText] = useState('')
  const [error, setError] = useState<'required' | 'outOfRange' | null>(null)
  const [editing, setEditing] = useState<{ date: LocalDate; weightKg: number } | null>(null)
  const toast = useToast()

  if (!weighIns) return <Card title={en.weight.title}>{null}</Card>

  const todays = weighIns.find((w) => w.date === today)
  const week = weekAverageFor(today, weighIns)
  const weeks = weeklyAverages(weighIns)
  const change = weeklyChange(weeks)
  const since = addDays(weekStart(today), -7 * (CHART_WEEKS - 1))
  const chartWeighIns = weighIns.filter((w) => w.date >= since)
  const chartWeeks = weeks.filter((w) => w.weekStart >= since)

  const save = async (date: LocalDate, value: string) => {
    const kg = parseNumber(value)
    const problem = validateWeight(kg)
    setError(problem)
    if (problem || kg === undefined) return false
    const before = await saveWeighIn(date, nowMs(), kg)
    toast.show({
      message: en.weight.saved(kgText(kg)),
      action: { label: en.common.undo, onAction: () => void restoreBodyLog(date, before) },
    })
    return true
  }

  return (
    <Card title={en.weight.title}>
      <div className="flex flex-col gap-4">
        <p className="text-sm text-muted">{en.weight.tip}</p>

        <form
          noValidate
          className="flex items-end gap-2"
          onSubmit={(event) => {
            event.preventDefault()
            void save(today, text).then((ok) => ok && setText(''))
          }}
        >
          <div className="min-w-0 flex-1">
            <TextField
              label={en.weight.today}
              inputMode="decimal"
              placeholder={todays ? kgText(todays.weightKg) : undefined}
              value={text}
              onChange={(event) => setText(event.target.value)}
              {...(error ? { error: en.weight.errors[error] } : {})}
            />
          </div>
          <Button type="submit" className={error ? 'mb-7' : undefined}>
            {en.weight.save}
          </Button>
        </form>
        {todays && (
          <p className="-mt-2 text-sm text-muted">
            {en.weight.todayValue(kgText(todays.weightKg))}
          </p>
        )}
        <WaistForm />

        <div>
          <h3 className="font-semibold">{en.weight.thisWeek}</h3>
          <p className="tabular-nums">
            {week ? en.weight.weekAverage(kgText(week.averageKg), week.count) : en.weight.noWeekYet}
          </p>
          {change && (
            <p className="text-sm text-muted tabular-nums">
              {en.weight.change(
                `${change.kg > 0 ? '+' : change.kg < 0 ? '−' : '±'}${formatNumber(Math.abs(change.kg))}`,
                `${change.percent > 0 ? '+' : change.percent < 0 ? '−' : '±'}${formatNumber(
                  Math.abs(Math.round(change.percent * 10) / 10),
                )}`,
              )}
            </p>
          )}
        </div>

        <figure>
          <figcaption className="mb-2">
            <span className="block font-semibold">{en.weight.chartTitle}</span>
            <span className="block text-sm text-muted">
              {chartWeeks.length > 0
                ? en.weight.chartSummary(
                    chartWeeks.length,
                    kgText(chartWeeks[0]!.averageKg),
                    kgText(chartWeeks.at(-1)!.averageKg),
                  )
                : en.weight.chartEmpty}
            </span>
          </figcaption>
          {chartWeighIns.length > 0 && (
            <>
              <Suspense
                fallback={
                  <p className="flex h-56 items-center justify-center text-sm text-muted">
                    {en.weight.chartLoading}
                  </p>
                }
              >
                <WeightChart weighIns={chartWeighIns} weeks={chartWeeks} />
              </Suspense>
              <p className="mt-2 text-sm text-muted">{en.weight.chartHint}</p>
              <table className="sr-only">
                <caption>{en.weight.chartTitle}</caption>
                <thead>
                  <tr>
                    <th scope="col">{en.weight.tableWeek}</th>
                    <th scope="col">{en.weight.tableAverage}</th>
                    <th scope="col">{en.weight.tableCount}</th>
                  </tr>
                </thead>
                <tbody>
                  {chartWeeks.map((w) => (
                    <tr key={w.weekStart}>
                      <td>{formatShortDate(w.weekStart)}</td>
                      <td>{kgText(w.averageKg)}</td>
                      <td>{w.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </figure>

        {weighIns.length > 0 && (
          <div>
            <h3 className="font-semibold">{en.weight.recent}</h3>
            <ul className="divide-y divide-border">
              {weighIns
                .slice(-RECENT)
                .reverse()
                .map((w) => (
                  <li key={w.date}>
                    <button
                      type="button"
                      onClick={() => {
                        setError(null)
                        setEditing(w)
                      }}
                      className="flex min-h-11 w-full items-center justify-between py-2 text-left tabular-nums focus-visible:outline-3 focus-visible:outline-accent"
                    >
                      {en.weight.entry(formatShortDate(w.date), kgText(w.weightKg))}
                    </button>
                  </li>
                ))}
            </ul>
          </div>
        )}
      </div>

      <Sheet
        open={editing !== null}
        onClose={() => {
          setError(null)
          setEditing(null)
        }}
        title={editing ? en.weight.editTitle(formatShortDate(editing.date)) : ''}
      >
        {editing && (
          <EditWeighIn
            key={editing.date}
            initial={editing}
            onSave={async (value) => {
              if (await save(editing.date, value)) setEditing(null)
            }}
            error={error}
            onDelete={() => {
              setEditing(null)
              void deleteWeighIn(editing.date).then((before) => {
                if (!before) return
                toast.show({
                  message: en.weight.deleted,
                  action: {
                    label: en.common.undo,
                    onAction: () => void restoreBodyLog(editing.date, before),
                  },
                })
              })
            }}
          />
        )}
      </Sheet>
    </Card>
  )
}

function EditWeighIn({
  initial,
  error,
  onSave,
  onDelete,
}: {
  initial: { weightKg: number }
  error: 'required' | 'outOfRange' | null
  onSave: (value: string) => Promise<void>
  onDelete: () => void
}) {
  const [value, setValue] = useState(String(initial.weightKg))
  return (
    <form
      noValidate
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault()
        void onSave(value)
      }}
    >
      <TextField
        label={en.weight.weight}
        inputMode="decimal"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        {...(error ? { error: en.weight.errors[error] } : {})}
      />
      <Button type="submit" block size="lg">
        {en.weight.save}
      </Button>
      <Button variant="ghost" block onClick={onDelete}>
        {en.weight.delete}
      </Button>
    </form>
  )
}
