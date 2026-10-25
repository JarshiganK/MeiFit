import { Plus, Scale, Smartphone, Swords, Trophy, X } from 'lucide-react'
import { useState } from 'react'
import { en } from '../../copy/en'
import { ageBand, type FieldError } from '../../domain/setup'
import type { ActivityLevel, Goal, Pace, Sex } from '../../domain/targets'
import { Button, Card, ChoiceCards, IconButton, NumberStepper, TextField } from '../../ui'
import { ImportBackup } from '../settings/ImportBackup'
import type { Draft } from './draft'

export interface StepProps {
  draft: Draft
  update: (patch: Partial<Draft>) => void
  errors: Partial<Record<string, FieldError>>
  today: string
}

function errorText(error: FieldError | undefined): string | undefined {
  return error ? en.setup.errors[error] : undefined
}

/** Optional props must be omitted, not undefined (exactOptionalPropertyTypes). */
function withError(error: FieldError | undefined): { error?: string } {
  const text = errorText(error)
  return text ? { error: text } : {}
}

// ------------------------------------------------------------------ intro

const INTRO_ICONS = [Swords, Trophy, Scale]

export function IntroStep({ index }: { index: number }) {
  const slide = en.setup.intro[index]
  const Icon = INTRO_ICONS[index]
  if (!slide || !Icon) return null
  return (
    <div className="flex flex-col items-center py-8 text-center">
      <div className="hud-frame mb-6 flex size-28 items-center justify-center rounded-xl border border-border bg-surface text-accent shadow-card">
        <Icon aria-hidden="true" size={48} strokeWidth={1.5} />
      </div>
      <p className="max-w-sm text-lg text-muted">{slide.body}</p>
      <ol aria-hidden="true" className="mt-8 flex gap-2">
        {en.setup.intro.map((s, i) => (
          <li
            key={s.title}
            className={
              i === index ? 'h-2 w-6 rounded-full bg-accent' : 'size-2 rounded-full bg-border'
            }
          />
        ))}
      </ol>
    </div>
  )
}

// ---------------------------------------------------------------- install

export function InstallStep({
  standalone,
  onRestored,
}: {
  standalone: boolean
  onRestored: () => void
}) {
  const copy = en.setup.install
  return (
    <div className="flex flex-col gap-4">
      {standalone ? (
        <Card>
          <p>{copy.installed}</p>
        </Card>
      ) : (
        <Card>
          <div className="flex gap-3">
            <Smartphone aria-hidden="true" size={24} className="mt-0.5 shrink-0 text-accent" />
            <p>{copy.why}</p>
          </div>
          <ol className="mt-4 flex list-decimal flex-col gap-2 pl-5 text-muted">
            {copy.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </Card>
      )}
      <Card title={copy.restoreTitle}>
        <p className="mb-3 text-sm text-muted">{copy.restoreBody}</p>
        <div className="grid gap-2">
          <ImportBackup onRestored={onRestored} restoredMessage={copy.restored} />
        </div>
      </Card>
    </div>
  )
}

// ------------------------------------------------------------------ about

export function AboutStep({ draft, update, errors, today }: StepProps) {
  const copy = en.setup.about
  const band = draft.birthDate && !errors.birthDate ? ageBand(draft.birthDate, today) : null
  const sexChoices = (Object.keys(copy.sexOptions) as Sex[]).map((value) => ({
    value,
    label: copy.sexOptions[value],
  }))
  const activityChoices = (Object.keys(copy.activityOptions) as ActivityLevel[]).map((value) => ({
    value,
    ...copy.activityOptions[value],
  }))

  return (
    <div className="flex flex-col gap-6">
      <p className="text-muted">{copy.intro}</p>
      <TextField
        label={copy.nickname}
        value={draft.nickname}
        onChange={(e) => update({ nickname: e.target.value })}
        autoComplete="nickname"
        maxLength={40}
        {...withError(errors.nickname)}
      />
      <ChoiceCards
        label={copy.sex}
        hint={copy.sexHint}
        choices={sexChoices}
        value={draft.sex}
        onChange={(sex) => update({ sex })}
        {...withError(errors.sex)}
      />
      <div>
        <TextField
          label={copy.birthDate}
          type="date"
          value={draft.birthDate}
          max={today}
          onChange={(e) => update({ birthDate: e.target.value })}
          {...withError(errors.birthDate === 'too-young' ? undefined : errors.birthDate)}
        />
        {errors.birthDate === 'too-young' && (
          <p role="alert" className="mt-3 rounded-md border border-border bg-raised p-3">
            {copy.tooYoung}
          </p>
        )}
        {band === 'minor' && (
          <p className="mt-3 rounded-md border border-border bg-raised p-3 text-sm">
            {copy.minorNote}
          </p>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <TextField
          label={copy.height}
          inputMode="decimal"
          value={draft.height}
          onChange={(e) => update({ height: e.target.value })}
          {...withError(errors.heightCm)}
        />
        <TextField
          label={copy.weight}
          inputMode="decimal"
          value={draft.weight}
          onChange={(e) => update({ weight: e.target.value })}
          {...withError(errors.weightKg)}
        />
      </div>
      <p className="-mt-4 text-sm text-muted">{copy.weightHint}</p>
      <ChoiceCards
        label={copy.activity}
        choices={activityChoices}
        value={draft.activityLevel}
        onChange={(activityLevel) => update({ activityLevel })}
        {...withError(errors.activityLevel)}
      />
    </div>
  )
}

// ------------------------------------------------------------------- goal

export function GoalStep({ draft, update, errors, today }: StepProps) {
  const copy = en.setup.goal
  const isMinor = draft.birthDate !== '' && ageBand(draft.birthDate, today) !== 'adult'
  const goals = (Object.keys(copy.options) as Goal[])
    .filter((goal) => !(isMinor && goal === 'lose'))
    .map((value) => ({ value, ...copy.options[value] }))
  const paces = (Object.keys(copy.paceOptions) as Pace[]).map((value) => ({
    value,
    ...copy.paceOptions[value],
  }))

  return (
    <div className="flex flex-col gap-6">
      <ChoiceCards
        label={copy.goal}
        choices={goals}
        value={draft.goal}
        onChange={(goal) => update({ goal })}
        {...withError(errors.goal)}
      />
      {draft.goal === 'lose' && (
        <ChoiceCards
          label={copy.pace}
          choices={paces}
          value={draft.pace}
          onChange={(pace) => update({ pace })}
          columns={2}
        />
      )}
      <TextField
        label={copy.goalWeight}
        inputMode="decimal"
        value={draft.goalWeight}
        onChange={(e) => update({ goalWeight: e.target.value })}
        {...withError(errors.goalWeightKg)}
      />
      <TextField
        label={copy.goalWaist}
        hint={copy.goalWaistHint}
        inputMode="decimal"
        value={draft.goalWaist}
        onChange={(e) => update({ goalWaist: e.target.value })}
        {...withError(errors.goalWaistCm)}
      />
    </div>
  )
}

// ---------------------------------------------------------------- routine

export function RoutineStep({ draft, update, today }: StepProps) {
  const copy = en.setup.routine
  const isMinor = draft.birthDate !== '' && ageBand(draft.birthDate, today) !== 'adult'
  return (
    <div className="flex flex-col gap-6">
      <NumberStepper
        label={copy.workouts}
        value={draft.workoutsPerWeek}
        min={0}
        max={7}
        onChange={(workoutsPerWeek) => update({ workoutsPerWeek })}
      />
      {!isMinor && (
        <NumberStepper
          label={copy.flexDays}
          hint={copy.flexHint}
          value={draft.flexDaysPerWeek}
          min={0}
          max={4}
          onChange={(flexDaysPerWeek) => update({ flexDaysPerWeek })}
        />
      )}
      <NumberStepper
        label={copy.sleep}
        value={draft.sleepHours}
        min={5}
        max={10}
        step={0.5}
        onChange={(sleepHours) => update({ sleepHours })}
      />
      <NumberStepper
        label={copy.study}
        value={draft.studyGoalHours}
        min={0}
        max={80}
        onChange={(studyGoalHours) => update({ studyGoalHours })}
      />
      <NumberStepper
        label={copy.block}
        value={draft.blockMin}
        min={15}
        max={120}
        step={5}
        onChange={(blockMin) => update({ blockMin })}
      />
    </div>
  )
}

// ------------------------------------------------------------------- food

export function FoodStep({
  loadStarterMenu,
  onChange,
  existingCount,
}: {
  loadStarterMenu: boolean
  onChange: (load: boolean) => void
  existingCount: number
}) {
  const copy = en.setup.food
  if (existingCount > 0) {
    return (
      <Card>
        <p>{copy.keep(existingCount)}</p>
      </Card>
    )
  }
  return (
    <div className="flex flex-col gap-4">
      <p className="text-muted">{copy.intro}</p>
      <ChoiceCards
        label={copy.title}
        choices={[
          { value: 'starter', label: copy.starter, hint: copy.starterHint },
          { value: 'empty', label: copy.empty, hint: copy.emptyHint },
        ]}
        value={loadStarterMenu ? 'starter' : 'empty'}
        onChange={(value) => onChange(value === 'starter')}
      />
    </div>
  )
}

// ------------------------------------------------------------------ exams

export interface ExamDraft {
  title: string
  date: string
}

export function ExamsStep({
  exams,
  onChange,
  today,
}: {
  exams: ExamDraft[]
  onChange: (exams: ExamDraft[]) => void
  today: string
}) {
  const copy = en.setup.exams
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [errors, setErrors] = useState<{ title?: string; date?: string }>({})

  const add = () => {
    const next: { title?: string; date?: string } = {}
    if (title.trim() === '') next.title = copy.titleRequired
    if (date === '' || date < today) next.date = copy.dateRequired
    setErrors(next)
    if (next.title || next.date) return
    onChange([...exams, { title: title.trim(), date }].sort((a, b) => a.date.localeCompare(b.date)))
    setTitle('')
    setDate('')
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-muted">{copy.intro}</p>
      {exams.length === 0 ? (
        <p className="text-sm text-muted">{copy.none}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {exams.map((exam, i) => (
            <li
              key={`${exam.date}-${exam.title}`}
              className="flex items-center gap-3 rounded-md border border-border bg-surface py-1 pl-4 pr-1"
            >
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">{exam.title}</span>
                <span className="block text-sm text-muted tabular-nums">{exam.date}</span>
              </span>
              <IconButton
                label={copy.remove(exam.title)}
                icon={<X size={20} />}
                onClick={() => onChange(exams.filter((_, j) => j !== i))}
              />
            </li>
          ))}
        </ul>
      )}
      <Card>
        <div className="flex flex-col gap-3">
          <TextField
            label={copy.examTitle}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            {...(errors.title ? { error: errors.title } : {})}
          />
          <TextField
            label={copy.examDate}
            type="date"
            min={today}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            {...(errors.date ? { error: errors.date } : {})}
          />
          <Button variant="secondary" icon={<Plus size={20} />} onClick={add}>
            {copy.add}
          </Button>
        </div>
      </Card>
      <p className="text-sm text-muted">{copy.later}</p>
    </div>
  )
}
