import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowDown, ArrowUp, ChevronLeft, Equal, Sparkles, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router'
import { ScreenFallback } from '../../app/ScreenFallback'
import { nowMs } from '../../app/useToday'
import { en } from '../../copy/en'
import { formatNumber } from '../../copy/format'
import { db } from '../../db/db'
import { allWeighIns } from '../../db/body'
import { allChecks, finishCheck } from '../../db/fitness'
import { loadQuestHistory } from '../../db/history'
import { currentTarget, getProfile } from '../../db/profile'
import { getSetting, setSetting } from '../../db/settings'
import { allExercises } from '../../db/workout'
import { WAIST_LIMITS, roundWeight, weekAverageFor, weeklyAverages } from '../../domain/body'
import { addDays, ageOn, toLocalDate } from '../../domain/date'
import {
  MAX_MAIN_LIFTS,
  bestE1rm,
  checkRewards,
  goalReached,
  nudgeThreshold,
  suggestCalories,
  trend,
  type CheckResults,
  type Trend,
} from '../../domain/fitness'
import { parseNumber } from '../../domain/number'
import { periodSummary } from '../../domain/review'
import { ADULT_AGE, calculateTargets, roundKcal } from '../../domain/targets'
import { Button, Card, Stepper, Switch, TextField, cx, iconButtonClass, useToast } from '../../ui'
import { formatDuration } from '../status/formatSleep'

type StepId = 'intro' | 'body' | 'strength' | 'endurance' | 'recovery' | 'review'
const STEPS: StepId[] = ['intro', 'body', 'strength', 'endurance', 'recovery', 'review']

interface Draft {
  step: StepId
  waist: string
  pushups: string
  plank: string
  squats: string
  hr: string
  lifts: number[]
  useTargets: boolean
  raiseThreshold: boolean
  switchGoal: boolean
}

const EMPTY: Draft = {
  step: 'intro',
  waist: '',
  pushups: '',
  plank: '',
  squats: '',
  hr: '',
  lifts: [],
  useTargets: false,
  raiseThreshold: false,
  switchGoal: false,
}

function parseDraft(value: unknown): Draft | null {
  if (typeof value !== 'object' || value === null) return null
  const d = value as Partial<Draft>
  const texts = [d.waist, d.pushups, d.plank, d.squats, d.hr]
  if (!STEPS.includes(d.step as StepId) || texts.some((t) => typeof t !== 'string')) return null
  if (!Array.isArray(d.lifts) || !d.lifts.every((n) => Number.isInteger(n))) return null
  return { ...EMPTY, ...d }
}

const LIMITS = {
  waist: WAIST_LIMITS,
  pushups: { min: 0, max: 500 },
  plank: { min: 0, max: 1200 },
  squats: { min: 0, max: 200 },
  hr: { min: 30, max: 220 },
} as const

type Field = keyof typeof LIMITS

function fieldValue(draft: Draft, field: Field): number | undefined {
  const value = parseNumber(draft[field])
  return value === undefined || Number.isNaN(value) ? undefined : value
}

function fieldError(draft: Draft, field: Field): boolean {
  const value = parseNumber(draft[field])
  if (value === undefined) return false
  const { min, max } = LIMITS[field]
  return !Number.isFinite(value) || value < min || value > max
}

/** Everything the check needs, read when it opens. Null when there's no profile yet. */
async function loadCheckData() {
  const today = toLocalDate(Date.now())
  const profile = await getProfile()
  if (!profile) return null
  return {
    today,
    profile,
    target: await currentTarget(today),
    checks: await allChecks(),
    weighIns: await allWeighIns(),
    exercises: (await allExercises()).filter((e) => e.type === 'weight-reps'),
    sets: await db.workoutSets.where('date').aboveOrEqual(addDays(today, -27)).toArray(),
    lifts: await getSetting('fitnessLifts', []),
    draft: parseDraft(await getSetting('fitnessDraft', null)),
    history: await loadQuestHistory(),
  }
}

type Loaded = NonNullable<Awaited<ReturnType<typeof loadCheckData>>>

/** Full-screen fitness check (plan §4, §10). */
export function FitnessCheckFlow() {
  const data = useLiveQuery(loadCheckData, [])
  if (data === undefined) return <ScreenFallback />
  if (data === null) return <Navigate to="/setup" replace />
  return <CheckWizard data={data} />
}

function CheckWizard({ data }: { data: Loaded }) {
  const navigate = useNavigate()
  const toast = useToast()
  const { today, profile, target, checks, weighIns } = data
  const [draft, setDraft] = useState<Draft>(
    () => data.draft ?? { ...EMPTY, lifts: data.lifts.slice(0, MAX_MAIN_LIFTS) },
  )
  const [saving, setSaving] = useState(false)
  const [failed, setFailed] = useState(false)
  const heading = useRef<HTMLHeadingElement>(null)
  const first = useRef(true)
  const index = STEPS.indexOf(draft.step)
  const step = draft.step
  const isMinor = ageOn(profile.birthDate, today) < ADULT_AGE

  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    heading.current?.focus()
  }, [step])

  const update = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }))
  const go = (to: StepId) => {
    const next = { ...draft, step: to }
    setDraft(next)
    window.scrollTo(0, 0)
    // Saved after each step: the check takes about 20 minutes, and iOS may close the app.
    void setSetting('fitnessDraft', next)
  }

  // ---- figures for the body step and the review
  const thisWeek = weekAverageFor(today, weighIns)
  const latest = weighIns.at(-1)
  const weightNow = thisWeek?.averageKg ?? latest?.weightKg
  const lastCheck = checks.at(-1)
  const lastWeight = lastCheck ? weekAverageFor(lastCheck.date, weighIns)?.averageKg : undefined
  const results: CheckResults = {
    waistCm: fieldValue(draft, 'waist'),
    pushups: fieldValue(draft, 'pushups'),
    plankSec: fieldValue(draft, 'plank'),
    squats60s: fieldValue(draft, 'squats'),
    restingHr: fieldValue(draft, 'hr'),
  }
  const rewards = checkRewards(results, lastCheck)
  const weeks = weeklyAverages(weighIns)
  const newTargets =
    weightNow !== undefined
      ? calculateTargets({
          sex: profile.sex,
          age: ageOn(profile.birthDate, today),
          heightCm: profile.heightCm,
          weightKg: weightNow,
          activityLevel: profile.activityLevel,
          goal: profile.goal,
          pace: profile.pace,
          goalWeightKg: profile.goalWeightKg,
        })
      : undefined
  const suggestion = isMinor
    ? { kind: 'none' as const }
    : suggestCalories(weeks, profile.goal, profile.setupDate)
  const adjustedKcal = newTargets
    ? Math.max(
        newTargets.kcalFloor,
        newTargets.kcal +
          (suggestion.kind === 'cut'
            ? -suggestion.kcal
            : suggestion.kind === 'add'
              ? suggestion.kcal
              : 0),
      )
    : undefined
  const proteinGoal = draft.useTargets && newTargets ? newTargets.proteinG : (target?.proteinG ?? 0)
  const threshold = target?.proteinQuestThresholdG ?? null
  const nudged = nudgeThreshold(threshold, proteinGoal)
  const reached = goalReached(profile.goal, profile, {
    weightKg: weightNow,
    waistCm: results.waistCm,
  })

  const errors = (['waist', 'pushups', 'plank', 'squats', 'hr'] as Field[]).filter((f) =>
    fieldError(draft, f),
  )
  const stepFields: Record<StepId, Field[]> = {
    intro: [],
    body: ['waist'],
    strength: [],
    endurance: ['pushups', 'plank', 'squats'],
    recovery: ['hr'],
    review: [],
  }
  const blocked = stepFields[step].some((f) => errors.includes(f))

  const finish = async () => {
    setSaving(true)
    setFailed(false)
    try {
      const lifts = draft.lifts.flatMap((exerciseId) => {
        const kg = bestE1rm(data.sets, exerciseId, today)
        return kg === undefined ? [] : [{ exerciseId, e1rmKg: kg }]
      })
      const changeTargets =
        target &&
        ((draft.useTargets && newTargets) || (draft.raiseThreshold && nudged !== threshold))
      await finishCheck({
        check: {
          date: today,
          lifts,
          ...Object.fromEntries(Object.entries(results).filter(([, v]) => v !== undefined)),
        },
        at: nowMs(),
        ...(changeTargets && target
          ? {
              targets: {
                kcal: draft.useTargets && adjustedKcal !== undefined ? adjustedKcal : target.kcal,
                kcalFloor: draft.useTargets && newTargets ? newTargets.kcalFloor : target.kcalFloor,
                proteinG: proteinGoal,
                proteinQuestThresholdG: draft.raiseThreshold ? nudged : threshold,
              },
            }
          : {}),
        ...(reached && draft.switchGoal ? { goal: 'maintain' as const } : {}),
      })
      await setSetting('fitnessLifts', draft.lifts)
      toast.show({ message: en.fitness.saved(rewards.xp) })
      void navigate('/progress', { replace: true })
    } catch {
      setFailed(true)
      setSaving(false)
    }
  }

  const copy = en.fitness
  const titles: Record<StepId, string> = {
    intro: copy.intro.title,
    body: copy.body.title,
    strength: copy.strength.title,
    endurance: copy.endurance.title,
    recovery: copy.recovery.title,
    review: copy.review.title,
  }
  const numberField = (field: Field, label: string, hint?: string) => (
    <TextField
      label={label}
      inputMode={field === 'waist' ? 'decimal' : 'numeric'}
      value={draft[field]}
      onChange={(event) => update({ [field]: event.target.value })}
      {...(hint ? { hint } : {})}
      {...(errors.includes(field) ? { error: copy.errors.outOfRange } : {})}
    />
  )

  return (
    <div className="flex min-h-dvh flex-col pt-safe">
      <main className="mx-auto w-full max-w-lg flex-1 px-safe pb-36">
        <header className="flex min-h-14 items-center gap-2 pt-2">
          {index > 0 ? (
            <button
              type="button"
              aria-label={en.common.back}
              className={iconButtonClass()}
              onClick={() => go(STEPS[index - 1]!)}
            >
              <ChevronLeft aria-hidden="true" size={26} />
            </button>
          ) : (
            <span aria-hidden="true" className="size-11 shrink-0" />
          )}
          <div className="min-w-0 flex-1">
            <Stepper current={index + 1} total={STEPS.length} />
          </div>
          <Link to="/" aria-label={copy.close} className={iconButtonClass()}>
            <X aria-hidden="true" size={24} />
          </Link>
        </header>

        <h1
          ref={heading}
          tabIndex={-1}
          className="mt-4 font-display text-2xl font-bold outline-none"
        >
          {titles[step]}
        </h1>

        <div className="mt-4 flex flex-col gap-4">
          {step === 'intro' && (
            <>
              <p>{copy.intro.body}</p>
              {!lastCheck && <p className="text-muted">{copy.intro.baseline}</p>}
              <p className="text-sm text-muted">{copy.intro.tip}</p>
            </>
          )}

          {step === 'body' && (
            <>
              <Card title={copy.body.weight}>
                <p className="tabular-nums">
                  {thisWeek
                    ? copy.body.weightValue(
                        formatNumber(roundWeight(thisWeek.averageKg)),
                        thisWeek.count,
                      )
                    : copy.body.noWeight}
                </p>
              </Card>
              {numberField('waist', copy.body.waist, copy.body.waistHint)}
              <p className="text-sm text-muted">{copy.body.photo}</p>
            </>
          )}

          {step === 'strength' && (
            <>
              <p className="text-muted">{copy.strength.intro}</p>
              {data.exercises.length === 0 ? (
                <p className="text-sm text-muted">{copy.strength.none}</p>
              ) : (
                <fieldset className="flex flex-col gap-2">
                  <legend className="sr-only">{copy.strength.title}</legend>
                  {data.exercises.map((exercise) => {
                    const checked = draft.lifts.includes(exercise.id!)
                    const full = !checked && draft.lifts.length >= MAX_MAIN_LIFTS
                    const kg = bestE1rm(data.sets, exercise.id!, today)
                    return (
                      // The label's text is the exercise name below; the rule can't see text from expressions.
                      // eslint-disable-next-line jsx-a11y-x/label-has-associated-control
                      <label
                        key={exercise.id}
                        className={cx(
                          'flex min-h-13 items-center gap-3 rounded-md border px-4 py-2',
                          checked ? 'border-accent bg-raised' : 'border-border bg-surface',
                          full && 'opacity-60',
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={full}
                          onChange={() =>
                            update({
                              lifts: checked
                                ? draft.lifts.filter((id) => id !== exercise.id)
                                : [...draft.lifts, exercise.id!],
                            })
                          }
                          className="size-5 accent-accent"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block font-semibold">{exercise.name}</span>
                          <span className="block text-sm text-muted tabular-nums">
                            {kg === undefined
                              ? copy.strength.noSets
                              : copy.strength.e1rm(formatNumber(kg))}
                          </span>
                        </span>
                      </label>
                    )
                  })}
                  <p className="text-sm text-muted">{copy.strength.limit}</p>
                </fieldset>
              )}
            </>
          )}

          {step === 'endurance' && (
            <>
              {numberField('pushups', copy.endurance.pushups, copy.endurance.pushupsHint)}
              {numberField('plank', copy.endurance.plank, copy.endurance.plankHint)}
              {numberField('squats', copy.endurance.squats, copy.endurance.squatsHint)}
              <p className="text-sm text-muted">{copy.endurance.skip}</p>
            </>
          )}

          {step === 'recovery' && numberField('hr', copy.recovery.hr, copy.recovery.hrHint)}

          {step === 'review' && (
            <Review
              results={results}
              weightNow={weightNow}
              lastWeight={lastWeight}
              lastCheck={lastCheck}
              rewards={rewards}
              summary={
                data.history ? periodSummary(data.history, addDays(today, -27), today) : undefined
              }
              weightChange={
                weightNow !== undefined
                  ? (() => {
                      const before = weekAverageFor(addDays(today, -28), weighIns)?.averageKg
                      return before === undefined ? undefined : roundWeight(weightNow - before)
                    })()
                  : undefined
              }
              isMinor={isMinor}
              target={target}
              newTargets={
                newTargets && adjustedKcal !== undefined
                  ? { ...newTargets, kcal: adjustedKcal }
                  : undefined
              }
              suggestion={suggestion}
              threshold={threshold}
              nudged={nudged}
              reached={reached}
              draft={draft}
              update={update}
            />
          )}
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface pb-safe">
        <div className="mx-auto max-w-lg px-safe py-3">
          {failed && (
            <p role="alert" className="mb-2 text-sm text-error">
              {copy.saveFailed}
            </p>
          )}
          <Button
            block
            size="lg"
            disabled={saving || blocked}
            onClick={() => (step === 'review' ? void finish() : go(STEPS[index + 1]!))}
          >
            {step === 'review' ? (saving ? copy.saving : copy.finish) : copy.next}
          </Button>
        </div>
      </div>
    </div>
  )
}

const TREND_ICON: Record<Trend, typeof ArrowUp> = {
  up: ArrowUp,
  down: ArrowDown,
  same: Equal,
  new: Sparkles,
}

function Review({
  results,
  weightNow,
  lastWeight,
  lastCheck,
  rewards,
  summary,
  weightChange,
  isMinor,
  target,
  newTargets,
  suggestion,
  threshold,
  nudged,
  reached,
  draft,
  update,
}: {
  results: CheckResults
  weightNow: number | undefined
  lastWeight: number | undefined
  lastCheck: CheckResults | undefined
  rewards: { vit: number; str: number }
  summary: ReturnType<typeof periodSummary> | undefined
  weightChange: number | undefined
  isMinor: boolean
  target: { kcal: number; proteinG: number } | undefined
  newTargets: { kcal: number; proteinG: number } | undefined
  suggestion: ReturnType<typeof suggestCalories>
  threshold: number | null
  nudged: number | null
  reached: boolean
  draft: Draft
  update: (patch: Partial<Draft>) => void
}) {
  const copy = en.fitness.review
  const rows: {
    key: keyof typeof copy.measures
    now: number | undefined
    before: number | undefined
  }[] = [
    { key: 'weight', now: weightNow, before: lastWeight },
    { key: 'waistCm', now: results.waistCm, before: lastCheck?.waistCm },
    { key: 'pushups', now: results.pushups, before: lastCheck?.pushups },
    { key: 'plankSec', now: results.plankSec, before: lastCheck?.plankSec },
    { key: 'squats60s', now: results.squats60s, before: lastCheck?.squats60s },
    { key: 'restingHr', now: results.restingHr, before: lastCheck?.restingHr },
  ]
  const show = (value: number, key: keyof typeof copy.units) =>
    `${formatNumber(key === 'weight' ? roundWeight(value) : value)}${copy.units[key] ? ` ${copy.units[key]}` : ''}`

  return (
    <>
      <Card title={copy.results} subtitle={lastCheck ? copy.vsLast : copy.first}>
        <ul className="-my-1 divide-y divide-border">
          {rows
            .filter((row) => row.now !== undefined)
            .map((row) => {
              const t = trend(row.now, row.before) ?? 'new'
              const Icon = TREND_ICON[t]
              return (
                <li key={row.key} className="flex min-h-12 items-center gap-3 py-2">
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">{copy.measures[row.key]}</span>
                    {row.before !== undefined && (
                      <span className="block text-sm text-muted tabular-nums">
                        {copy.previous(show(row.before, row.key))}
                      </span>
                    )}
                  </span>
                  <span className="tabular-nums">{show(row.now!, row.key)}</span>
                  <span className="inline-flex items-center gap-1 text-sm text-muted">
                    <Icon aria-hidden="true" size={16} />
                    {copy.trend[t]}
                  </span>
                </li>
              )
            })}
        </ul>
        <p className="mt-3 font-semibold">{copy.rewards(rewards.vit, rewards.str)}</p>
      </Card>

      <Card title={copy.averages}>
        {summary ? (
          <ul className="flex flex-col gap-1 tabular-nums">
            <li>
              {summary.sleepAvgMin !== null
                ? copy.sleep(formatDuration(summary.sleepAvgMin))
                : `${en.sleep.title}: ${copy.noData}`}
            </li>
            <li>
              {copy.study(formatNumber(Math.round((summary.studyMinutes / 60 / 4) * 10) / 10))}
            </li>
            {summary.proteinAvgG !== null && <li>{copy.protein(summary.proteinAvgG)}</li>}
            {!isMinor && summary.kcalAvg !== null && (
              <li>{copy.calories(formatNumber(roundKcal(summary.kcalAvg)))}</li>
            )}
            {summary.workoutsPlanned > 0 && (
              <li>{copy.workouts(summary.workoutsDone, summary.workoutsPlanned)}</li>
            )}
            {weightChange !== undefined && (
              <li>
                {copy.weightChange(
                  `${weightChange > 0 ? '+' : weightChange < 0 ? '−' : '±'}${formatNumber(Math.abs(weightChange))}`,
                )}
              </li>
            )}
          </ul>
        ) : (
          <p className="text-muted">{copy.noData}</p>
        )}
      </Card>

      {target && newTargets && (
        <Card title={copy.targets} subtitle={copy.targetsIntro}>
          <div className="flex flex-col gap-3">
            {!isMinor && (
              <p className="tabular-nums">
                {copy.kcalChange(
                  formatNumber(roundKcal(target.kcal)),
                  formatNumber(roundKcal(newTargets.kcal)),
                )}
              </p>
            )}
            <p className="tabular-nums">
              {copy.proteinChange(target.proteinG, newTargets.proteinG)}
            </p>
            {suggestion.kind === 'cut' && (
              <p className="text-sm text-muted">{copy.suggestionCut(suggestion.kcal)}</p>
            )}
            {suggestion.kind === 'add' && (
              <p className="text-sm text-muted">{copy.suggestionAdd(suggestion.kcal)}</p>
            )}
            <Switch
              label={copy.useTargets}
              checked={draft.useTargets}
              onChange={(useTargets) => update({ useTargets })}
            />
            {threshold !== null && nudged !== null && nudged !== threshold && (
              <Switch
                label={copy.threshold(threshold, nudged)}
                hint={copy.thresholdHint}
                checked={draft.raiseThreshold}
                onChange={(raiseThreshold) => update({ raiseThreshold })}
              />
            )}
          </div>
        </Card>
      )}

      {reached && (
        <Card title={copy.goalReached} subtitle={copy.goalReachedHint}>
          <Switch
            label={copy.switchGoal}
            checked={draft.switchGoal}
            onChange={(switchGoal) => update({ switchGoal })}
          />
        </Card>
      )}
    </>
  )
}
