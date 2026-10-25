import { useLiveQuery } from 'dexie-react-hooks'
import { Pencil } from 'lucide-react'
import { Link } from 'react-router'
import { ScreenHeader } from '../../app/ScreenHeader'
import { en } from '../../copy/en'
import { formatNumber } from '../../copy/format'
import { currentTarget, getProfile, latestWeighIn } from '../../db/profile'
import { ageOn, formatLongDate, toLocalDate } from '../../domain/date'
import { ADULT_AGE, roundKcal } from '../../domain/targets'
import { Card, buttonClass } from '../../ui'

/** Settings → Profile: the answers from setup and the targets that apply today. */
export function ProfileScreen() {
  const data = useLiveQuery(async () => {
    const today = toLocalDate(Date.now())
    return {
      today,
      profile: await getProfile(),
      weighIn: await latestWeighIn(),
      target: await currentTarget(today),
    }
  }, [])

  const profile = data?.profile
  const about = en.setup.about
  const rows: [string, string][] = profile
    ? [
        [en.profile.rows.nickname, profile.nickname],
        [en.profile.rows.age, en.profile.age(ageOn(profile.birthDate, data.today))],
        [en.profile.rows.height, en.profile.heightCm(profile.heightCm)],
        ...(data.weighIn?.weightKg !== undefined
          ? [
              [en.profile.rows.weight, en.profile.weightKg(data.weighIn.weightKg)] as [
                string,
                string,
              ],
            ]
          : []),
        [en.profile.rows.activity, about.activityOptions[profile.activityLevel].label],
        [en.profile.rows.goal, en.setup.goal.options[profile.goal].label],
        [
          en.profile.rows.routine,
          en.profile.routine({
            workouts: profile.workoutsPerWeek,
            flex: profile.flexDaysPerWeek,
            sleepH: profile.sleepTargetMin / 60,
            study: profile.studyGoalHours,
            block: profile.blockMin,
          }),
        ],
      ]
    : []
  const isMinor = profile ? ageOn(profile.birthDate, data.today) < ADULT_AGE : false

  return (
    <>
      <ScreenHeader title={en.profile.title} backTo="/settings" />
      {profile && (
        <div className="flex flex-col gap-4 pt-2">
          {data.target && (
            <Card
              title={en.setup.review.title}
              subtitle={en.profile.targetsFrom(formatLongDate(data.target.startsOn))}
              framed
            >
              <dl className="grid grid-cols-2 gap-4">
                {!isMinor && (
                  <div>
                    <dt className="text-sm text-muted">{en.profile.rows.calories}</dt>
                    <dd className="font-display text-2xl font-bold tabular-nums">
                      {en.setup.review.kcal(formatNumber(roundKcal(data.target.kcal)))}
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="text-sm text-muted">{en.profile.rows.protein}</dt>
                  <dd className="font-display text-2xl font-bold tabular-nums">
                    {en.setup.review.grams(data.target.proteinG)}
                  </dd>
                </div>
              </dl>
            </Card>
          )}
          <Card>
            <dl className="flex flex-col divide-y divide-border">
              {rows.map(([label, value]) => (
                <div key={label} className="flex gap-4 py-3 first:pt-0 last:pb-0">
                  <dt className="w-28 shrink-0 text-sm text-muted">{label}</dt>
                  <dd className="min-w-0 flex-1">{value}</dd>
                </div>
              ))}
            </dl>
          </Card>
          <Link
            to="/setup?mode=change"
            className={buttonClass({ variant: 'secondary', block: true })}
          >
            <Pencil aria-hidden="true" size={20} />
            {en.profile.change}
          </Link>
        </div>
      )}
    </>
  )
}
