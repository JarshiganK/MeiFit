import { Flame, Shield, ShieldCheck } from 'lucide-react'
import { en } from '../../copy/en'
import { formatShortDate } from '../../domain/date'
import { MAX_SHIELDS, QUESTS_FOR_STREAK, type StreakState } from '../../domain/streak'
import { Card, cx } from '../../ui'

/** Streak and shields (plan §7, §10). Icons always come with words. */
export function StreakCard({ streak }: { streak: StreakState }) {
  const copy = en.streak
  const lastSaved = streak.shieldedDays.at(-1)
  return (
    <Card>
      <div className="flex items-center gap-3">
        <Flame
          aria-hidden="true"
          size={32}
          className={cx('shrink-0', streak.current > 0 ? 'text-str' : 'text-muted')}
        />
        <div className="min-w-0 flex-1">
          <p className="font-display text-xl font-bold tabular-nums">
            {streak.current > 0 ? copy.days(streak.current) : copy.none}
          </p>
          <p className="text-sm text-muted tabular-nums">
            {streak.todayCounts
              ? copy.todayCounts
              : copy.today(Math.min(streak.todayDone, QUESTS_FOR_STREAK), QUESTS_FOR_STREAK)}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end">
          <span className="flex gap-0.5" aria-hidden="true">
            {Array.from({ length: MAX_SHIELDS }, (_, i) =>
              i < streak.shields ? (
                <ShieldCheck key={i} size={22} className="text-accent" />
              ) : (
                <Shield key={i} size={22} className="text-muted" />
              ),
            )}
          </span>
          <span className="text-xs text-muted tabular-nums">
            {copy.shields(streak.shields, MAX_SHIELDS)}
          </span>
        </div>
      </div>
      <p className="mt-2 text-sm text-muted">
        {lastSaved ? copy.saved(formatShortDate(lastSaved)) : copy.shieldsHint}
        {streak.best > streak.current && ` ${copy.best(streak.best)}.`}
      </p>
    </Card>
  )
}
