import { useLiveQuery } from 'dexie-react-hooks'
import { ChevronDown, ChevronUp, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { ScreenFallback } from '../../app/ScreenFallback'
import { ScreenHeader } from '../../app/ScreenHeader'
import { en } from '../../copy/en'
import { getProfile } from '../../db/profile'
import type { Exercise } from '../../db/types'
import {
  addExercise,
  addToDay,
  allExercises,
  ensurePlan,
  getPlan,
  moveInDay,
  removeFromDay,
  restorePlan,
  setTrainingDay,
  updateTarget,
} from '../../db/workout'
import { DEFAULT_ROUTINE } from '../../domain/setup'
import {
  PLAN_LIMITS,
  WEEKDAYS,
  defaultTarget,
  validateTarget,
  type ExerciseType,
  type PlannedExercise,
} from '../../domain/workout'
import {
  Button,
  Card,
  IconButton,
  NumberStepper,
  SegmentedControl,
  Sheet,
  TextField,
  cx,
  useToast,
} from '../../ui'
import { targetText, weekdayName } from './format'

type Editing = { weekday: number; index: number; target: PlannedExercise }

/** Train → Edit plan: training days and the exercises on each (plan §6). */
export function PlanEditorScreen() {
  // The plan is created (with starter exercises) the first time this opens.
  useEffect(() => {
    void ensurePlan()
  }, [])
  const data = useLiveQuery(async () => ({
    plan: await getPlan('normal'),
    exercises: await allExercises(),
    goal: (await getProfile())?.workoutsPerWeek ?? DEFAULT_ROUTINE.workoutsPerWeek,
  }))
  const [adding, setAdding] = useState<number | null>(null)
  const [editing, setEditing] = useState<Editing | null>(null)
  const toast = useToast()

  if (!data?.plan) return <ScreenFallback />
  const plan = data.plan
  const planId = plan.id!
  const exercise = (id: number) => data.exercises.find((e) => e.id === id)
  const name = (id: number) => exercise(id)?.name ?? en.plan.unknownExercise

  const toggleDay = async (weekday: number) => {
    const on = !plan.days.some((d) => d.weekday === weekday)
    const before = plan
    await setTrainingDay(planId, weekday, on)
    const day = before.days.find((d) => d.weekday === weekday)
    if (!on && day && day.exercises.length > 0) {
      toast.show({
        message: en.plan.dayRemoved(weekdayName(weekday)),
        action: { label: en.common.undo, onAction: () => void restorePlan(before) },
      })
    }
  }

  return (
    <>
      <ScreenHeader title={en.plan.title} backTo="/train" />
      <div className="flex flex-col gap-4 pt-2">
        <p className="text-muted">{en.plan.intro}</p>

        <Card title={en.plan.days} subtitle={en.plan.daysHint(plan.days.length, data.goal)}>
          <ul className="grid grid-cols-7 gap-1">
            {WEEKDAYS.map((weekday) => {
              const on = plan.days.some((d) => d.weekday === weekday)
              return (
                <li key={weekday}>
                  <button
                    type="button"
                    aria-pressed={on}
                    onClick={() => void toggleDay(weekday)}
                    className={cx(
                      'flex min-h-12 w-full items-center justify-center rounded-md border text-sm font-semibold',
                      'focus-visible:outline-3 focus-visible:outline-accent',
                      on ? 'border-accent bg-accent text-on-accent' : 'border-border bg-surface',
                    )}
                  >
                    {en.train.weekdays[weekday - 1]}
                  </button>
                </li>
              )
            })}
          </ul>
        </Card>

        {plan.days.map((day) => {
          const dayName = weekdayName(day.weekday)
          return (
            <Card key={day.weekday} title={dayName}>
              {day.exercises.length === 0 && (
                <p className="text-sm text-muted">{en.train.noExercises}</p>
              )}
              <ul className="divide-y divide-border">
                {day.exercises.map((target, index) => {
                  const exName = name(target.exerciseId)
                  return (
                    <li
                      key={`${target.exerciseId}-${index}`}
                      className="flex min-h-13 items-center gap-1"
                    >
                      <button
                        type="button"
                        onClick={() => setEditing({ weekday: day.weekday, index, target })}
                        className="min-w-0 flex-1 py-2 text-left focus-visible:outline-3 focus-visible:outline-accent"
                      >
                        <span className="sr-only">{en.food.change} </span>
                        <span className="block font-semibold">{exName}</span>
                        <span className="block text-sm text-muted tabular-nums">
                          {targetText(target, exercise(target.exerciseId)?.type)}
                        </span>
                      </button>
                      <IconButton
                        label={en.plan.moveUp(exName)}
                        icon={<ChevronUp size={20} />}
                        disabled={index === 0}
                        onClick={() => void moveInDay(planId, day.weekday, index, -1)}
                      />
                      <IconButton
                        label={en.plan.moveDown(exName)}
                        icon={<ChevronDown size={20} />}
                        disabled={index === day.exercises.length - 1}
                        onClick={() => void moveInDay(planId, day.weekday, index, 1)}
                      />
                    </li>
                  )
                })}
              </ul>
              <Button
                variant="secondary"
                icon={<Plus size={20} />}
                className="mt-3"
                onClick={() => setAdding(day.weekday)}
              >
                {en.plan.addExercise}
              </Button>
            </Card>
          )
        })}
      </div>

      <Sheet
        open={adding !== null}
        onClose={() => setAdding(null)}
        title={adding ? en.plan.addTo(weekdayName(adding)) : ''}
      >
        {adding !== null && (
          <ExercisePicker
            exercises={data.exercises}
            onPick={async (picked) => {
              const day = adding
              setAdding(null)
              await addToDay(planId, day, defaultTarget(picked.id!, picked.type))
              toast.show({ message: en.plan.added(picked.name, weekdayName(day)) })
            }}
          />
        )}
      </Sheet>

      <Sheet
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing ? name(editing.target.exerciseId) : ''}
      >
        {editing && (
          <TargetForm
            key={`${editing.weekday}-${editing.index}`}
            initial={editing.target}
            type={exercise(editing.target.exerciseId)?.type ?? 'reps'}
            onSave={async (target) => {
              setEditing(null)
              await updateTarget(planId, editing.weekday, editing.index, target)
            }}
            onRemove={async () => {
              const before = plan
              setEditing(null)
              await removeFromDay(planId, editing.weekday, editing.index)
              toast.show({
                message: en.plan.removed(name(editing.target.exerciseId)),
                action: { label: en.common.undo, onAction: () => void restorePlan(before) },
              })
            }}
          />
        )}
      </Sheet>
    </>
  )
}

function ExercisePicker({
  exercises,
  onPick,
}: {
  exercises: Exercise[]
  onPick: (exercise: Exercise) => Promise<void>
}) {
  const [query, setQuery] = useState('')
  const [creating, setCreating] = useState(false)
  const matches = exercises.filter((e) => e.name.toLowerCase().includes(query.trim().toLowerCase()))

  if (creating) {
    return (
      <NewExerciseForm
        initialName={query.trim()}
        onCreate={async (values) => {
          const id = await addExercise(values)
          await onPick({ ...values, id })
        }}
      />
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <TextField
        label={en.plan.search}
        type="search"
        value={query}
        autoComplete="off"
        onChange={(event) => setQuery(event.target.value)}
      />
      <Button variant="secondary" icon={<Plus size={20} />} onClick={() => setCreating(true)}>
        {en.plan.newExercise}
      </Button>
      {matches.length === 0 ? (
        <p className="text-sm text-muted">{en.plan.noMatch}</p>
      ) : (
        <ul className="divide-y divide-border">
          {matches.map((e) => (
            <li key={e.id}>
              <button
                type="button"
                onClick={() => void onPick(e)}
                className="flex min-h-12 w-full items-center gap-3 py-2 text-left focus-visible:outline-3 focus-visible:outline-accent"
              >
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{e.name}</span>
                  <span className="block text-sm text-muted">
                    {[e.muscleGroup, en.plan.types[e.type]].filter(Boolean).join(' · ')}
                  </span>
                </span>
                <Plus aria-hidden="true" size={20} className="text-accent" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function NewExerciseForm({
  initialName,
  onCreate,
}: {
  initialName: string
  onCreate: (values: Omit<Exercise, 'id'>) => Promise<void>
}) {
  const [name, setName] = useState(initialName)
  const [muscleGroup, setMuscleGroup] = useState('')
  const [type, setType] = useState<ExerciseType>('weight-reps')
  const [error, setError] = useState(false)
  return (
    <form
      noValidate
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault()
        if (name.trim() === '') {
          setError(true)
          return
        }
        void onCreate({ name, muscleGroup, type })
      }}
    >
      <h3 className="font-semibold">{en.plan.newExerciseTitle}</h3>
      <TextField
        label={en.plan.exerciseName}
        value={name}
        maxLength={40}
        autoComplete="off"
        onChange={(event) => setName(event.target.value)}
        {...(error ? { error: en.plan.errors.nameRequired } : {})}
      />
      <TextField
        label={en.plan.muscleGroup}
        hint={en.plan.muscleGroupHint}
        value={muscleGroup}
        maxLength={30}
        autoComplete="off"
        onChange={(event) => setMuscleGroup(event.target.value)}
      />
      <SegmentedControl
        label={en.plan.type}
        hint={en.plan.typeHints[type]}
        options={(['weight-reps', 'reps', 'seconds'] as const).map((value) => ({
          value,
          label: en.plan.types[value],
        }))}
        value={type}
        onChange={setType}
      />
      <Button type="submit" block size="lg">
        {en.plan.create}
      </Button>
    </form>
  )
}

function TargetForm({
  initial,
  type,
  onSave,
  onRemove,
}: {
  initial: PlannedExercise
  type: ExerciseType
  onSave: (target: PlannedExercise) => Promise<void>
  onRemove: () => Promise<void>
}) {
  const [target, setTarget] = useState<PlannedExercise>(() => ({
    ...defaultTarget(initial.exerciseId, type),
    ...initial,
  }))
  const [showErrors, setShowErrors] = useState(false)
  const errors = validateTarget(target, type)
  const update = (patch: Partial<PlannedExercise>) => setTarget((t) => ({ ...t, ...patch }))

  /** Only the fields that apply to this type are saved. */
  const clean = (): PlannedExercise => {
    const base = { exerciseId: target.exerciseId, sets: target.sets }
    if (type === 'seconds') return { ...base, seconds: target.seconds ?? 30 }
    const reps = { repMin: target.repMin ?? 8, repMax: target.repMax ?? 12 }
    return type === 'weight-reps'
      ? { ...base, ...reps, targetKg: target.targetKg ?? 0 }
      : { ...base, ...reps }
  }

  return (
    <form
      noValidate
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault()
        if (errors.length > 0) {
          setShowErrors(true)
          return
        }
        void onSave(clean())
      }}
    >
      <NumberStepper
        label={en.plan.sets}
        value={target.sets}
        onChange={(sets) => update({ sets })}
        {...PLAN_LIMITS.sets}
      />
      {type === 'seconds' ? (
        <NumberStepper
          label={en.plan.seconds}
          value={target.seconds ?? 30}
          onChange={(seconds) => update({ seconds })}
          unit="s"
          {...PLAN_LIMITS.seconds}
        />
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <NumberStepper
            label={en.plan.repMin}
            value={target.repMin ?? 8}
            onChange={(repMin) => update({ repMin })}
            {...PLAN_LIMITS.reps}
          />
          <NumberStepper
            label={en.plan.repMax}
            value={target.repMax ?? 12}
            onChange={(repMax) => update({ repMax })}
            {...PLAN_LIMITS.reps}
          />
        </div>
      )}
      {type === 'weight-reps' && (
        <NumberStepper
          label={en.plan.targetKg}
          value={target.targetKg ?? 0}
          onChange={(targetKg) => update({ targetKg })}
          unit="kg"
          {...PLAN_LIMITS.kg}
        />
      )}
      {showErrors && errors.length > 0 && (
        <ul role="alert" className="text-sm text-error">
          {errors.map((e) => (
            <li key={e}>{en.plan.errors[e]}</li>
          ))}
        </ul>
      )}
      <Button type="submit" block size="lg">
        {en.plan.save}
      </Button>
      <Button variant="ghost" block onClick={() => void onRemove()}>
        {en.plan.remove}
      </Button>
    </form>
  )
}
