import { useLiveQuery } from 'dexie-react-hooks'
import { Dumbbell } from 'lucide-react'
import { Link } from 'react-router'
import { ScreenFallback } from '../../app/ScreenFallback'
import { ScreenHeader } from '../../app/ScreenHeader'
import { useToday } from '../../app/useToday'
import { en } from '../../copy/en'
import { allExercises, getPlan } from '../../db/workout'
import { weekday } from '../../domain/date'
import { WEEKDAYS, planDayFor } from '../../domain/workout'
import { Card, EmptyState, buttonClass, cx } from '../../ui'
import { targetText, weekdayName } from './format'

/** Train: the week at a glance and today's planned exercises (plan §10). */
export function TrainScreen() {
  const today = useToday()
  const data = useLiveQuery(async () => ({
    plan: await getPlan('normal'),
    exercises: await allExercises(),
  }))

  if (!data) return <ScreenFallback />
  const { plan, exercises } = data
  const editLink = (
    <Link to="/train/plan" className={buttonClass({ variant: 'primary' })}>
      {plan && plan.days.length > 0 ? en.train.editPlan : en.train.build}
    </Link>
  )

  if (!plan || plan.days.length === 0) {
    return (
      <>
        <ScreenHeader title={en.train.title} />
        <EmptyState
          icon={Dumbbell}
          title={en.train.emptyTitle}
          body={en.train.emptyBody}
          action={editLink}
        />
      </>
    )
  }

  const todayNumber = weekday(today)
  const day = planDayFor(plan, today)
  const exercise = (id: number) => exercises.find((e) => e.id === id)

  return (
    <>
      <ScreenHeader title={en.train.title} />
      <div className="flex flex-col gap-4 pt-2">
        <Card title={en.train.week}>
          <ul className="grid grid-cols-7 gap-1">
            {WEEKDAYS.map((w) => {
              const training = plan.days.some((d) => d.weekday === w)
              return (
                <li
                  key={w}
                  aria-label={en.train.dayLabel(weekdayName(w), training)}
                  aria-current={w === todayNumber ? 'date' : undefined}
                  className={cx(
                    'flex min-h-14 flex-col items-center justify-center rounded-md border text-sm',
                    w === todayNumber ? 'border-accent' : 'border-border',
                    training ? 'bg-raised font-semibold' : 'bg-surface text-muted',
                  )}
                >
                  <span aria-hidden="true">{en.train.weekdays[w - 1]}</span>
                  <span aria-hidden="true" className="flex size-4 items-center justify-center">
                    {training && <Dumbbell size={14} className="text-str" />}
                  </span>
                </li>
              )
            })}
          </ul>
        </Card>

        <Card title={en.train.today(weekdayName(todayNumber))} framed>
          {!day ? (
            <p className="text-muted">{en.train.restToday}</p>
          ) : day.exercises.length === 0 ? (
            <p className="text-muted">{en.train.noExercises}</p>
          ) : (
            <>
              <p className="mb-2 text-sm text-muted">
                {en.train.exerciseCount(day.exercises.length)}
              </p>
              <ul className="divide-y divide-border">
                {day.exercises.map((target, index) => {
                  const ex = exercise(target.exerciseId)
                  return (
                    <li key={`${target.exerciseId}-${index}`} className="py-2">
                      <span className="block font-semibold">
                        {ex?.name ?? en.plan.unknownExercise}
                      </span>
                      <span className="block text-sm text-muted tabular-nums">
                        {targetText(target, ex?.type)}
                      </span>
                    </li>
                  )
                })}
              </ul>
            </>
          )}
        </Card>

        <div>{editLink}</div>
      </div>
    </>
  )
}
