import { useLiveQuery } from 'dexie-react-hooks'
import { Dumbbell } from 'lucide-react'
import { Link } from 'react-router'
import { ScreenFallback } from '../../app/ScreenFallback'
import { ScreenHeader } from '../../app/ScreenHeader'
import { useToday } from '../../app/useToday'
import { en } from '../../copy/en'
import { db } from '../../db/db'
import { daysInWeek, getDay } from '../../db/days'
import { sessionDate, setsFor, setsOn } from '../../db/sessions'
import { allExercises, planOn } from '../../db/workout'
import { weekDates, weekday } from '../../domain/date'
import { missedSessions } from '../../domain/session'
import { WEEKDAYS, dayRule } from '../../domain/workout'
import { Card, EmptyState, buttonClass, cx } from '../../ui'
import { weekdayName } from './format'
import { RestTimerBar } from './RestTimerBar'
import { SessionCard } from './SessionCard'

/** Train: the week at a glance and today's planned exercises (plan §10). */
export function TrainScreen() {
  const today = useToday()
  const data = useLiveQuery(async () => {
    // A session that started before midnight is still "today's" workout (plan §5).
    const date = await sessionDate(Date.now())
    // In exam mode the exam plan is used, if it has training days (plan §7).
    const plan = await planOn(date)
    const day = await getDay(date)
    const planDay = plan?.days.find((d) => d.weekday === (day?.planWeekday ?? weekday(date)))
    // Training days earlier this week that went by without a set (plan §6: reschedule).
    const week = weekDates(date).filter((d) => d < date)
    const plans = new Map(await Promise.all(week.map(async (d) => [d, await planOn(d)] as const)))
    const weekSets = await db.workoutSets.where('date').anyOf(week).toArray()
    const missed = missedSessions(
      date,
      await daysInWeek(date),
      new Set(weekSets.filter((s) => s.done).map((s) => s.date)),
      (d) => ({ date: d, ...dayRule(plans.get(d), d) }),
    )
    return {
      plan,
      date,
      day,
      missed: missed[0],
      exercises: await allExercises(),
      sets: await setsOn(date),
      history: await setsFor(planDay?.exercises.map((e) => e.exerciseId) ?? []),
    }
  }, [today])

  if (!data) return <ScreenFallback />
  const { plan, exercises } = data
  const examPlanInUse = plan?.kind === 'exam'
  const editLink = (
    <Link
      to={examPlanInUse ? '/train/plan?kind=exam' : '/train/plan'}
      className={buttonClass({ variant: plan && plan.days.length > 0 ? 'secondary' : 'primary' })}
    >
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

        {examPlanInUse && <p className="text-sm font-semibold text-int">{en.exams.trainNote}</p>}
        <RestTimerBar />
        <SessionCard
          date={data.date}
          plan={plan}
          day={data.day}
          exercises={exercises}
          sets={data.sets}
          history={data.history}
          missed={data.missed}
        />

        <div>{editLink}</div>
      </div>
    </>
  )
}
