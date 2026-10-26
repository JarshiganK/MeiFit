import { Check, Plus } from 'lucide-react'
import { useState } from 'react'
import { nowMs } from '../../app/useToday'
import { en } from '../../copy/en'
import { choosePlanDay, restoreSet, tickSet, untickSet } from '../../db/sessions'
import type { DayRecord, Exercise, WorkoutPlan, WorkoutSet } from '../../db/types'
import { weekday, type LocalDate } from '../../domain/date'
import {
  lastSessionSets,
  plannedSetCount,
  plannedSetsDone,
  prefill,
  valuesFor,
  type SetValues,
} from '../../domain/session'
import { PLAN_LIMITS, type ExerciseType, type PlannedExercise } from '../../domain/workout'
import { Button, Card, NumberStepper, ProgressBar, Sheet, cx, useToast } from '../../ui'
import { targetText, valuesText, weekdayName } from './format'

export interface SessionCardProps {
  date: LocalDate
  plan: WorkoutPlan
  day: DayRecord | undefined
  exercises: Exercise[]
  /** Sets logged in this session. */
  sets: WorkoutSet[]
  /** Every earlier set of the plan day's exercises, for pre-fill. */
  history: WorkoutSet[]
}

interface Editing {
  planned: PlannedExercise
  type: ExerciseType
  name: string
  setNumber: number
  values: SetValues
  logged: WorkoutSet | undefined
}

/** Today's planned sets with one-tap ticks, pre-filled from the last session (plan §6, §10). */
export function SessionCard({ date, plan, day, exercises, sets, history }: SessionCardProps) {
  const toast = useToast()
  const [editing, setEditing] = useState<Editing | null>(null)
  const [picking, setPicking] = useState(false)
  const [extra, setExtra] = useState<Record<number, number>>({})
  const ownWeekday = weekday(date)
  const activeWeekday = day?.planWeekday ?? ownWeekday
  const planDay = plan.days.find((d) => d.weekday === activeWeekday)
  const exercise = (id: number) => exercises.find((e) => e.id === id)

  const pickSheet = (
    <Sheet
      open={picking}
      onClose={() => setPicking(false)}
      title={en.session.pickDay}
      description={en.session.pickDayHint}
    >
      <ul className="flex flex-col gap-2">
        {plan.days.map((d) => (
          <li key={d.weekday}>
            <Button
              variant={d.weekday === activeWeekday ? 'primary' : 'secondary'}
              block
              onClick={() => {
                setPicking(false)
                void choosePlanDay(date, plan, d.weekday === ownWeekday ? undefined : d.weekday)
              }}
            >
              {en.session.dayOption(
                weekdayName(d.weekday),
                en.train.exerciseCount(d.exercises.length),
              )}
            </Button>
          </li>
        ))}
      </ul>
    </Sheet>
  )

  if (!planDay) {
    return (
      <Card title={en.session.title(weekdayName(ownWeekday))} framed>
        <p className="text-muted">{en.train.restToday}</p>
        <Button variant="secondary" className="mt-3" onClick={() => setPicking(true)}>
          {en.session.trainAnyway}
        </Button>
        {pickSheet}
      </Card>
    )
  }

  const planned = plannedSetCount(planDay.exercises)
  const done = plannedSetsDone(planDay.exercises, sets)
  const title =
    activeWeekday === ownWeekday
      ? en.session.title(weekdayName(ownWeekday))
      : en.session.otherDay(weekdayName(activeWeekday))

  const tick = async (item: Editing, values: SetValues) => {
    const { id, before } = await tickSet({
      exerciseId: item.planned.exerciseId,
      setNumber: item.setNumber,
      values: valuesFor(item.type, values),
      now: nowMs(),
    })
    toast.show({
      message: en.session.ticked(item.setNumber, item.name),
      action: { label: en.common.undo, onAction: () => void restoreSet(id, before) },
    })
  }

  const untick = async (logged: WorkoutSet, item: Editing) => {
    const removed = await untickSet(logged.id!)
    toast.show({
      message: en.session.unticked(item.setNumber, item.name),
      action: { label: en.common.undo, onAction: () => void restoreSet(logged.id!, removed) },
    })
  }

  return (
    <Card title={title} framed>
      <div className="flex flex-col gap-4">
        <div>
          <ProgressBar
            tone="str"
            label={en.session.progressLabel}
            value={done}
            max={Math.max(planned, 1)}
            valueText={en.session.progress(done, planned)}
          />
          <p className="mt-1 text-sm text-muted tabular-nums">
            {done >= planned && planned > 0
              ? en.session.allDone
              : en.session.progress(done, planned)}
          </p>
        </div>

        {planDay.exercises.length === 0 && <p className="text-muted">{en.train.noExercises}</p>}

        {planDay.exercises.map((target, index) => {
          const ex = exercise(target.exerciseId)
          const type = ex?.type ?? 'reps'
          const name = ex?.name ?? en.plan.unknownExercise
          const logged = sets.filter((s) => s.exerciseId === target.exerciseId)
          const previous = lastSessionSets(history, target.exerciseId, date)
          const count = Math.max(
            target.sets + (extra[index] ?? 0),
            ...logged.map((s) => s.setNumber),
          )
          return (
            <section key={`${target.exerciseId}-${index}`} aria-label={name}>
              <h3 className="font-semibold">{name}</h3>
              <p className="text-sm text-muted tabular-nums">{targetText(target, ex?.type)}</p>
              <ul className="mt-1 divide-y divide-border">
                {Array.from({ length: count }, (_, i) => i + 1).map((setNumber) => {
                  const row = logged.find((s) => s.setNumber === setNumber)
                  const values = row ?? prefill(target, type, setNumber, previous)
                  const item: Editing = {
                    planned: target,
                    type,
                    name,
                    setNumber,
                    values: valuesFor(type, values),
                    logged: row,
                  }
                  return (
                    <li key={setNumber} className="flex min-h-13 items-center gap-2">
                      <span className="w-12 shrink-0 text-sm text-muted">
                        {en.session.set(setNumber)}
                      </span>
                      <button
                        type="button"
                        onClick={() => setEditing(item)}
                        className={cx(
                          'min-h-11 min-w-0 flex-1 rounded-md px-2 text-left tabular-nums',
                          'focus-visible:outline-3 focus-visible:outline-accent',
                          row ? 'font-semibold' : 'text-muted',
                        )}
                      >
                        <span className="sr-only">{en.session.editSet(setNumber, name)}: </span>
                        {valuesText(type, values)}
                      </button>
                      <button
                        type="button"
                        aria-pressed={Boolean(row)}
                        aria-label={en.session.tick(setNumber, name)}
                        onClick={() => void (row ? untick(row, item) : tick(item, item.values))}
                        className={cx(
                          'inline-flex size-11 shrink-0 items-center justify-center rounded-full border-2',
                          'transition-transform duration-(--dur-fast) active:scale-90',
                          'focus-visible:outline-3 focus-visible:outline-accent',
                          row ? 'border-str bg-str text-bg' : 'border-border text-muted',
                        )}
                      >
                        <Check aria-hidden="true" size={22} strokeWidth={3} />
                      </button>
                    </li>
                  )
                })}
              </ul>
              <Button
                variant="ghost"
                icon={<Plus size={18} />}
                className="-ml-4"
                onClick={() => setExtra((e) => ({ ...e, [index]: (e[index] ?? 0) + 1 }))}
              >
                {en.session.addSet}
              </Button>
            </section>
          )
        })}

        <Button variant="ghost" className="-ml-4 self-start" onClick={() => setPicking(true)}>
          {en.session.otherWorkout}
        </Button>
        {day?.planWeekday !== undefined && (
          <Button
            variant="ghost"
            className="-ml-4 -mt-4 self-start"
            onClick={() => void choosePlanDay(date, plan, undefined)}
          >
            {en.session.backToPlan}
          </Button>
        )}
      </div>

      {pickSheet}

      <Sheet
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing ? `${editing.name}: ${en.session.set(editing.setNumber)}` : ''}
        description={editing && !editing.logged ? en.session.prefillNote : undefined}
      >
        {editing && (
          <SetForm
            key={`${editing.planned.exerciseId}-${editing.setNumber}`}
            item={editing}
            onSave={async (values) => {
              const item = editing
              setEditing(null)
              await tick(item, values)
            }}
            onUntick={
              editing.logged
                ? async () => {
                    const item = editing
                    setEditing(null)
                    await untick(item.logged!, item)
                  }
                : undefined
            }
          />
        )}
      </Sheet>
    </Card>
  )
}

function SetForm({
  item,
  onSave,
  onUntick,
}: {
  item: Editing
  onSave: (values: SetValues) => Promise<void>
  onUntick: (() => Promise<void>) | undefined
}) {
  const [values, setValues] = useState<SetValues>(item.values)
  const update = (patch: SetValues) => setValues((v) => ({ ...v, ...patch }))
  return (
    <form
      noValidate
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault()
        void onSave(values)
      }}
    >
      {item.type === 'seconds' ? (
        <NumberStepper
          label={en.session.seconds}
          value={values.seconds ?? 0}
          onChange={(seconds) => update({ seconds })}
          min={0}
          max={PLAN_LIMITS.seconds.max}
          step={PLAN_LIMITS.seconds.step}
          unit="s"
        />
      ) : (
        <NumberStepper
          label={en.session.reps}
          value={values.reps ?? 0}
          onChange={(reps) => update({ reps })}
          min={0}
          max={PLAN_LIMITS.reps.max}
        />
      )}
      {item.type === 'weight-reps' && (
        <NumberStepper
          label={en.session.weight}
          value={values.weightKg ?? 0}
          onChange={(weightKg) => update({ weightKg })}
          unit="kg"
          {...PLAN_LIMITS.kg}
        />
      )}
      <Button type="submit" block size="lg">
        {en.session.saveAndTick}
      </Button>
      {onUntick && (
        <Button variant="ghost" block onClick={() => void onUntick()}>
          {en.session.untick}
        </Button>
      )}
    </form>
  )
}
