import { CalendarCheck, Check, Circle, Lock } from 'lucide-react'
import { en } from '../../copy/en'
import { formatNumber } from '../../copy/format'
import { displayProtein } from '../../domain/food'
import type { QuestResult, WeeklyResult } from '../../domain/quests'
import { roundKcal } from '../../domain/targets'
import { Card, ProgressBar, STAT_STYLE, cx } from '../../ui'
import { formatDuration } from './formatSleep'

const q = en.status.quests
const d = en.status.details

function questName(quest: QuestResult, sleepTargetMin: number): string {
  switch (quest.id) {
    case 'dinner':
      return quest.variant === 'flexDinner' ? q.flexDinner : q.dinner
    case 'dailyProtein':
      return quest.variant === 'calibration' ? q.calibration : q.dailyProtein(quest.progress.max)
    case 'workout':
      return quest.variant === 'restDay' ? q.restDay : q.workout
    case 'sleep':
      return q.sleep(formatDuration(sleepTargetMin))
    case 'proteinBreakfast':
    case 'lunchProteins':
    case 'study':
      return q[quest.id]
  }
}

function questDetail(quest: QuestResult): string {
  const { value, max } = quest.progress
  switch (quest.id) {
    case 'proteinBreakfast':
    case 'lunchProteins':
      return d.proteinItems(value, max)
    case 'dinner':
      return quest.variant === 'flexDinner'
        ? d.dinnerBudget(formatNumber(roundKcal(value)), formatNumber(roundKcal(max)))
        : d.proteinItems(value, max)
    case 'dailyProtein':
      return quest.variant === 'calibration'
        ? d.mainMeals(value)
        : d.protein(displayProtein(value), max)
    case 'workout':
      if (quest.variant === 'restDay') return d.restDay
      if (quest.variant === 'noPlan') return d.noPlan
      return d.sets(value, max)
    case 'study':
      return d.blocks(value)
    case 'sleep':
      return value > 0 ? d.sleep(formatDuration(value)) : d.noSleep
  }
}

function StatusMark({ done, available }: { done: boolean; available: boolean }) {
  if (!available) {
    return (
      <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-border text-muted">
        <Lock aria-hidden="true" size={16} />
        <span className="sr-only">{en.status.unavailable}</span>
      </span>
    )
  }
  return done ? (
    <span className="inline-flex size-8 shrink-0 animate-pop items-center justify-center rounded-full bg-accent text-on-accent">
      <Check aria-hidden="true" size={18} strokeWidth={3} />
      <span className="sr-only">{en.status.done}</span>
    </span>
  ) : (
    <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-muted">
      <Circle aria-hidden="true" size={26} />
      <span className="sr-only">{en.status.notYet}</span>
    </span>
  )
}

export interface QuestBoardProps {
  quests: QuestResult[]
  weekly: WeeklyResult[]
  sleepTargetMin: number
}

/** Today's seven quests and this week's quests (plan §7, §10). */
export function QuestBoard({ quests, weekly, sleepTargetMin }: QuestBoardProps) {
  const earned = quests.reduce((sum, quest) => sum + quest.xp, 0)
  const max = quests.reduce((sum, quest) => sum + (quest.available ? quest.maxXp : 0), 0)
  return (
    <>
      <Card title={en.status.today} subtitle={en.status.todayXp(earned, max)}>
        <ul className="-my-1 divide-y divide-border">
          {quests.map((quest) => {
            const style = STAT_STYLE[quest.stat]
            const Icon = style.icon
            const label = en.stats[quest.stat]
            const xp =
              quest.id === 'study' && quest.xp > 0
                ? en.status.xpChip(quest.xp, label)
                : en.status.xpChip(quest.maxXp, label)
            return (
              <li key={quest.id} className="flex min-h-14 items-center gap-3 py-2">
                <StatusMark done={quest.done} available={quest.available} />
                <span className="min-w-0 flex-1">
                  <span className={cx('block font-semibold', !quest.available && 'text-muted')}>
                    {questName(quest, sleepTargetMin)}
                  </span>
                  <span className="block text-sm text-muted tabular-nums">
                    {questDetail(quest)}
                  </span>
                </span>
                <span
                  className={cx(
                    'inline-flex shrink-0 items-center gap-1 rounded-full border border-border px-2 py-1 text-sm font-semibold tabular-nums',
                    quest.done ? style.text : 'text-muted',
                  )}
                >
                  <Icon aria-hidden="true" size={14} />
                  {xp}
                </span>
              </li>
            )
          })}
        </ul>
      </Card>

      <Card title={en.status.week} subtitle={en.status.weekNote}>
        <ul className="-my-1 divide-y divide-border">
          {weekly.map((quest) => (
            <li key={quest.id} className="flex min-h-14 items-center gap-3 py-2">
              <StatusMark done={quest.done} available />
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">{q[quest.id]}</span>
                <span className="block text-sm text-muted tabular-nums">
                  {quest.id === 'weighIns'
                    ? d.weighIns(quest.progress.value)
                    : d[quest.id](quest.done)}
                </span>
                {quest.id === 'weighIns' && !quest.done && (
                  <ProgressBar
                    size="sm"
                    className="mt-1"
                    label={q.weighIns}
                    value={quest.progress.value}
                    max={quest.progress.max}
                  />
                )}
              </span>
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-border px-2 py-1 text-sm font-semibold text-muted tabular-nums">
                <CalendarCheck aria-hidden="true" size={14} />
                {en.status.xpPlain(quest.maxXp)}
              </span>
            </li>
          ))}
        </ul>
      </Card>
    </>
  )
}
