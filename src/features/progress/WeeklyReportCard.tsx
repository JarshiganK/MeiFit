import { useLiveQuery } from 'dexie-react-hooks'
import { Check, ChevronLeft, ChevronRight, Crown, X } from 'lucide-react'
import { useState } from 'react'
import { en } from '../../copy/en'
import { formatNumber } from '../../copy/format'
import { loadQuestHistory } from '../../db/history'
import { applyCalorieChange, currentTarget } from '../../db/profile'
import { roundWeight } from '../../domain/body'
import { addDays, ageOn, formatShortDate, weekStart, type LocalDate } from '../../domain/date'
import { suggestCalories } from '../../domain/fitness'
import { ADULT_AGE, roundKcal } from '../../domain/targets'
import { bossHistory, earnedTitles, weeklyReport, type BossResult } from '../../domain/weekly'
import { weeklyAverages } from '../../domain/body'
import { Button, Card, IconButton, useToast } from '../../ui'
import { formatDuration } from '../status/formatSleep'

const hours = (minutes: number) => formatNumber(Math.round((minutes / 60) * 10) / 10)

export function BossChecks({ boss }: { boss: BossResult }) {
  const copy = en.weekly
  const rows = [
    {
      key: 'weight',
      ok: boss.weight.ok,
      label: copy.bossWeight,
      detail:
        boss.weight.reason === 'fewWeighIns'
          ? copy.bossWeightFew(boss.weight.weighIns)
          : copy.bossWeightDetail(
              formatNumber(roundWeight(boss.weight.averageKg)),
              formatNumber(roundWeight(boss.weight.referenceKg)),
            ),
    },
    {
      key: 'workouts',
      ok: boss.workouts.ok,
      label: copy.bossWorkouts(boss.workouts.done, boss.workouts.target),
      detail: '',
    },
    {
      key: 'study',
      ok: boss.study.ok,
      label: copy.bossStudy(hours(boss.study.minutes), boss.study.goalMinutes / 60),
      detail: '',
    },
  ]
  return (
    <ul className="flex flex-col gap-2">
      {rows.map((row) => (
        <li key={row.key} className="flex items-start gap-2">
          {row.ok ? (
            <Check aria-hidden="true" size={20} className="mt-0.5 shrink-0 text-vit" />
          ) : (
            <X aria-hidden="true" size={20} className="mt-0.5 shrink-0 text-muted" />
          )}
          <span className="min-w-0 flex-1">
            <span className="block">
              {row.label} <span className="sr-only">{row.ok ? copy.met : copy.notMet}</span>
            </span>
            {row.detail && (
              <span className="block text-sm text-muted tabular-nums">{row.detail}</span>
            )}
          </span>
        </li>
      ))}
    </ul>
  )
}

/** Progress: the weekly report for each finished week (plan §6), with the boss and calorie check. */
export function WeeklyReportCard({ today }: { today: LocalDate }) {
  const toast = useToast()
  const data = useLiveQuery(async () => {
    const history = await loadQuestHistory()
    return history ? { history, target: await currentTarget(today) } : null
  }, [today])
  const [offset, setOffset] = useState(0)
  if (data === undefined) return <Card title={en.weekly.report}>{null}</Card>
  if (data === null) return null

  const copy = en.weekly
  const { history, target } = data
  const results = bossHistory(history, today)
  const lastMonday = addDays(weekStart(today), -7)
  if (results.length === 0) {
    return (
      <Card title={copy.report}>
        <p className="text-sm text-muted">{copy.noWeeks}</p>
      </Card>
    )
  }
  const index = Math.max(0, results.length - 1 - offset)
  const monday = results[index]!.weekStart
  const report = weeklyReport(history, monday)
  const titles = earnedTitles(results)
  const winsBefore = results.slice(0, index).filter((r) => r.won).length
  const title = titles[winsBefore]
  const isMinor = ageOn(history.profile.birthDate, today) < ADULT_AGE
  const latest = monday === lastMonday
  const weights = history.weighIns.filter(
    (w): w is { date: LocalDate; weightKg: number } => w.weightKg !== undefined,
  )
  const suggestion =
    latest && !isMinor && history.profile.goal
      ? suggestCalories(
          weeklyAverages(weights).filter((w) => w.weekStart <= monday),
          history.profile.goal,
          history.profile.setupDate,
        )
      : { kind: 'none' as const }
  const { summary } = report

  return (
    <Card title={copy.report}>
      <div className="flex flex-col gap-4">
        <nav aria-label={copy.report} className="flex items-center justify-between gap-2">
          <IconButton
            label={copy.previousWeek}
            icon={<ChevronLeft size={22} />}
            disabled={index === 0}
            onClick={() => setOffset((o) => o + 1)}
          />
          <p aria-live="polite" className="font-semibold tabular-nums">
            {copy.weekOf(formatShortDate(monday), formatShortDate(addDays(monday, 6)))}
          </p>
          <IconButton
            label={copy.nextWeek}
            icon={<ChevronRight size={22} />}
            disabled={offset === 0}
            onClick={() => setOffset((o) => Math.max(0, o - 1))}
          />
        </nav>

        <ul className="flex flex-col gap-1 tabular-nums">
          <li>
            {report.averageKg !== undefined
              ? copy.weight(formatNumber(roundWeight(report.averageKg)), report.weighIns)
              : copy.noWeight}
            {report.changeKg !== undefined && (
              <span className="block text-sm text-muted">
                {copy.weightChange(
                  `${report.changeKg > 0 ? '+' : report.changeKg < 0 ? '−' : '±'}${formatNumber(Math.abs(report.changeKg))}`,
                )}
              </span>
            )}
          </li>
          {summary.workoutsPlanned > 0 && (
            <li>{copy.workouts(summary.workoutsDone, summary.workoutsPlanned)}</li>
          )}
          <li>{copy.study(hours(summary.studyMinutes), history.profile.studyGoalHours ?? 0)}</li>
          {summary.sleepAvgMin !== null && (
            <li>{copy.sleep(formatDuration(summary.sleepAvgMin))}</li>
          )}
          {summary.proteinAvgG !== null && <li>{copy.protein(summary.proteinAvgG)}</li>}
          {!isMinor && summary.kcalAvg !== null && (
            <li>{copy.calories(formatNumber(roundKcal(summary.kcalAvg)))}</li>
          )}
          <li>{copy.questDays(report.questDays)}</li>
        </ul>

        <section aria-label={copy.boss} className="rounded-md border border-border p-3">
          <h3 className="flex items-center gap-2 font-semibold">
            <Crown aria-hidden="true" size={18} className="text-accent" />
            {copy.boss}
          </h3>
          <p className="mb-2 mt-1">
            {report.boss.won && title ? copy.bossWon(title) : copy.bossLost}
          </p>
          <BossChecks boss={report.boss} />
        </section>

        {suggestion.kind !== 'none' &&
          target &&
          // Applied once today already: don't stack another change.
          !(target.startsOn === today && target.reason === 'manual') && (
            <section aria-label={copy.suggestion} className="rounded-md border border-accent p-3">
              <h3 className="font-semibold">{copy.suggestion}</h3>
              <p className="mb-3 mt-1 text-sm">
                {suggestion.kind === 'cut'
                  ? copy.suggestionCut(suggestion.kcal)
                  : copy.suggestionAdd(suggestion.kcal)}
              </p>
              <Button
                variant="secondary"
                onClick={() => {
                  const delta = suggestion.kind === 'cut' ? -suggestion.kcal : suggestion.kcal
                  void applyCalorieChange(today, delta).then(() =>
                    toast.show({
                      message: copy.applied(
                        formatNumber(roundKcal(Math.max(target.kcalFloor, target.kcal + delta))),
                      ),
                    }),
                  )
                }}
              >
                {copy.apply}
              </Button>
            </section>
          )}

        {titles.length > 0 && (
          <p className="text-sm text-muted">
            {copy.titles}: {titles.join(', ')}
          </p>
        )}
      </div>
    </Card>
  )
}
