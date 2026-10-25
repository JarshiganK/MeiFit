import { useLiveQuery } from 'dexie-react-hooks'
import { ChevronLeft, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router'
import { isStandalone } from '../../app/platform'
import { ScreenFallback } from '../../app/ScreenFallback'
import { en } from '../../copy/en'
import { formatNumber } from '../../copy/format'
import { db } from '../../db/db'
import { currentTarget, getProfile, latestWeighIn, saveSetup } from '../../db/profile'
import { requestPersistentStorage } from '../../db/storage'
import type { BodyLog, Profile, TargetHistory } from '../../db/types'
import { toLocalDate } from '../../domain/date'
import {
  baselineDateRange,
  buildSetup,
  defaultBaselineDate,
  targetsForAnswers,
  validateAboutYou,
  validateGoal,
  validateRoutine,
  type SetupAnswers,
} from '../../domain/setup'
import { roundKcal, validateTargetEdits } from '../../domain/targets'
import { Button, IconButton, Stepper, iconButtonClass, useToast } from '../../ui'
import { EMPTY_DRAFT, draftFromProfile, draftToAnswers, type Draft } from './draft'
import { ReviewStep, type TargetEdits } from './ReviewStep'
import {
  AboutStep,
  ExamsStep,
  FoodStep,
  GoalStep,
  InstallStep,
  IntroStep,
  RoutineStep,
  type ExamDraft,
} from './steps'

type StepId =
  | 'intro-0'
  | 'intro-1'
  | 'intro-2'
  | 'install'
  | 'about'
  | 'goal'
  | 'routine'
  | 'food'
  | 'exams'
  | 'review'

/** First launch: up to 3 intro screens (CLAUDE.md §7), then the 7 steps of plan §2. */
const FIRST_RUN: StepId[] = [
  'intro-0',
  'intro-1',
  'intro-2',
  'install',
  'about',
  'goal',
  'routine',
  'food',
  'exams',
  'review',
]
/** Settings → Profile → Change answers. */
const CHANGE: StepId[] = ['about', 'goal', 'routine', 'review']

interface Loaded {
  profile: Profile | null
  weighIn: BodyLog | null
  target: TargetHistory | null
  foodCount: number
}

/** Read from event handlers only (the purity rule can't tell they aren't render code). */
function nowMs(): number {
  return Date.now()
}

function todayLocal(): string {
  return toLocalDate(Date.now())
}

export function SetupFlow() {
  const [params] = useSearchParams()
  const changing = params.get('mode') === 'change'
  const loaded = useLiveQuery(async (): Promise<Loaded> => {
    const profile = (await getProfile()) ?? null
    return {
      profile,
      weighIn: (await latestWeighIn()) ?? null,
      target: profile ? ((await currentTarget(todayLocal())) ?? null) : null,
      foodCount: await db.foods.count(),
    }
  }, [])

  if (!loaded) return <ScreenFallback />
  if (!changing && loaded.profile) return <Navigate to="/" replace />
  if (changing && !loaded.profile) return <Navigate to="/setup" replace />
  return <SetupWizard key={changing ? 'change' : 'first'} changing={changing} initial={loaded} />
}

function SetupWizard({ changing, initial }: { changing: boolean; initial: Loaded }) {
  const navigate = useNavigate()
  const toast = useToast()
  const [today] = useState(todayLocal)
  const [standalone] = useState(isStandalone)
  const steps = changing ? CHANGE : FIRST_RUN
  const [index, setIndex] = useState(0)
  const [draft, setDraft] = useState<Draft>(() =>
    initial.profile ? draftFromProfile(initial.profile, initial.weighIn?.weightKg) : EMPTY_DRAFT,
  )
  const [loadStarterMenu, setLoadStarterMenu] = useState(true)
  const [exams, setExams] = useState<ExamDraft[]>([])
  const [baselineDate, setBaselineDate] = useState(() => defaultBaselineDate(today))
  const [edits, setEdits] = useState<TargetEdits | null>(null)
  const [showErrors, setShowErrors] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveFailed, setSaveFailed] = useState(false)
  const heading = useRef<HTMLHeadingElement>(null)
  const firstRender = useRef(true)

  const step = steps[index] ?? 'review'
  const answers = draftToAnswers(draft)
  const fieldErrors =
    step === 'about'
      ? validateAboutYou(answers, today)
      : step === 'goal'
        ? validateGoal(answers, today)
        : step === 'routine'
          ? validateRoutine(answers)
          : {}
  const targets = step === 'review' ? targetsForAnswers(answers as SetupAnswers, today) : null
  const editErrors = targets && edits ? validateTargetEdits(targets, edits) : {}

  // Screen readers hear the new step's title; skip the very first render.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    heading.current?.focus()
  }, [index])

  const update = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }))

  const go = (next: number) => {
    setShowErrors(false)
    setIndex(next)
    window.scrollTo(0, 0)
  }

  const finish = async () => {
    setSaving(true)
    setSaveFailed(false)
    try {
      const result = buildSetup(answers as SetupAnswers, nowMs(), {
        ...(edits ? { edits } : {}),
        ...(initial.profile
          ? {
              previous: {
                setupDate: initial.profile.setupDate,
                proteinQuestThresholdG: initial.target?.proteinQuestThresholdG ?? null,
              },
            }
          : {}),
      })
      await saveSetup(result, {
        loadStarterMenu: !changing && loadStarterMenu,
        exams: changing ? [] : exams,
        ...(changing ? {} : { baselineCheckDue: baselineDate }),
        recordWeighIn: !changing || answers.weightKg !== initial.weighIn?.weightKg,
      })
      toast.show({
        message: changing ? en.setup.saved : en.setup.welcome(result.profile.nickname),
      })
      void navigate(changing ? '/settings/profile' : '/', { replace: true })
    } catch {
      setSaveFailed(true)
      setSaving(false)
    }
  }

  const next = () => {
    if (Object.keys(fieldErrors).length > 0 || Object.keys(editErrors).length > 0) {
      setShowErrors(true)
      // Take the user to the first problem once the errors have rendered.
      requestAnimationFrame(() => {
        document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
      })
      return
    }
    if (step === 'install') void requestPersistentStorage()
    if (step === 'review') {
      void finish()
      return
    }
    go(index + 1)
  }

  const isIntro = step.startsWith('intro')
  const numbered = steps.filter((s) => !s.startsWith('intro'))
  const stepNumber = numbered.indexOf(step) + 1
  const introIndex = Number(step.split('-')[1])

  const title = isIntro
    ? (en.setup.intro[introIndex]?.title ?? '')
    : {
        install: standalone ? en.setup.install.installedTitle : en.setup.install.title,
        about: en.setup.about.title,
        goal: en.setup.goal.title,
        routine: en.setup.routine.title,
        food: en.setup.food.title,
        exams: en.setup.exams.title,
        review: en.setup.review.title,
      }[step as Exclude<StepId, `intro-${number}`>]

  const primaryLabel =
    step === 'review'
      ? saving
        ? en.setup.saving
        : changing
          ? en.setup.saveChanges
          : en.setup.finish
      : step === 'install' && !standalone
        ? en.setup.install.continueInBrowser
        : step === 'install'
          ? en.setup.install.continue
          : en.setup.next

  const stepProps = {
    draft,
    update,
    errors: showErrors ? fieldErrors : {},
    today,
  }

  const kcalError = editErrors.kcal
  const proteinError = editErrors.proteinG

  return (
    <div className="flex min-h-dvh flex-col pt-safe">
      <main className="mx-auto w-full max-w-lg flex-1 px-safe pb-36">
        <header className="flex min-h-14 items-center gap-2 pt-2">
          {index > 0 ? (
            <IconButton
              label={en.setup.back}
              icon={<ChevronLeft size={26} />}
              onClick={() => go(index - 1)}
            />
          ) : (
            <span aria-hidden="true" className="size-11 shrink-0" />
          )}
          <div className="min-w-0 flex-1">
            {!isIntro && <Stepper current={stepNumber} total={numbered.length} />}
          </div>
          {isIntro && (
            <button
              type="button"
              onClick={() => go(steps.indexOf('install'))}
              className="min-h-11 rounded-md px-3 text-sm font-semibold text-muted"
            >
              {en.setup.skip}
            </button>
          )}
          {changing && (
            <Link to="/settings/profile" aria-label={en.common.close} className={iconButtonClass()}>
              <X aria-hidden="true" size={24} />
            </Link>
          )}
        </header>

        <h1
          ref={heading}
          tabIndex={-1}
          className="mt-4 font-display text-2xl font-bold outline-none"
        >
          {title}
        </h1>

        <div className="mt-4">
          {isIntro && <IntroStep index={introIndex} />}
          {step === 'install' && (
            <InstallStep
              standalone={standalone}
              onRestored={() => void navigate('/', { replace: true })}
            />
          )}
          {step === 'about' && <AboutStep {...stepProps} />}
          {step === 'goal' && <GoalStep {...stepProps} />}
          {step === 'routine' && <RoutineStep {...stepProps} />}
          {step === 'food' && (
            <FoodStep
              loadStarterMenu={loadStarterMenu}
              onChange={setLoadStarterMenu}
              existingCount={initial.foodCount}
            />
          )}
          {step === 'exams' && <ExamsStep exams={exams} onChange={setExams} today={today} />}
          {step === 'review' && targets && (
            <ReviewStep
              targets={targets}
              edits={edits}
              onEdit={setEdits}
              errors={{
                ...(kcalError
                  ? {
                      kcal: en.setup.review.belowFloor(formatNumber(roundKcal(targets.kcalFloor))),
                    }
                  : {}),
                ...(proteinError
                  ? { proteinG: en.setup.review.belowMinimum(targets.proteinMinG) }
                  : {}),
              }}
              {...(changing
                ? {}
                : {
                    baseline: {
                      value: baselineDate,
                      ...baselineDateRange(today),
                      onChange: setBaselineDate,
                    },
                  })}
            />
          )}
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface pb-safe">
        <div className="mx-auto max-w-lg px-safe py-3">
          {saveFailed && (
            <p role="alert" className="mb-2 text-sm text-error">
              {en.setup.saveFailed}
            </p>
          )}
          <Button
            block
            size="lg"
            // In a Safari tab, installing is the recommended path; continuing is the fallback.
            variant={step === 'install' && !standalone ? 'secondary' : 'primary'}
            disabled={saving}
            onClick={next}
          >
            {primaryLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
