import { useEffect, useRef, useState } from 'react'
import { en } from '../../copy/en'
import { formatNumber } from '../../copy/format'
import type { LevelProgress } from '../../domain/levels'
import { nextRankLevel, rankFor, type statLevels } from '../../domain/stats'
import { Button, Card, ProgressBar, StatBadge } from '../../ui'

const SEEN_KEY = 'dq.seenLevel'

function readSeen(): number | null {
  try {
    const value = Number(localStorage.getItem(SEEN_KEY))
    return Number.isInteger(value) && value > 0 ? value : null
  } catch {
    return null
  }
}

function writeSeen(level: number): void {
  try {
    localStorage.setItem(SEEN_KEY, String(level))
  } catch {
    // Private mode or blocked storage: the celebration may show again, which is harmless.
  }
}

export interface LevelCardProps {
  progress: LevelProgress
  totalXp: number
  stats: ReturnType<typeof statLevels>
}

/** Level, rank, XP bar, total XP and stats (plan §7, §10), plus the level-up moment. */
export function LevelCard({ progress, totalXp, stats }: LevelCardProps) {
  const { level, intoLevel, needed } = progress
  const rank = rankFor(level)
  const nextLevel = nextRankLevel(level)
  // The highest level already celebrated on this phone. The first visit just records it.
  const [seen, setSeen] = useState(() => readSeen() ?? level)
  const celebrate = level > seen

  useEffect(() => {
    if (readSeen() === null) writeSeen(level)
  }, [level])

  const dismiss = () => {
    writeSeen(level)
    setSeen(level)
  }

  return (
    <Card framed>
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-muted">{en.status.level}</p>
          <p className="font-display text-display font-bold leading-none text-accent tabular-nums">
            {level}
          </p>
        </div>
        <div className="text-right">
          <p className="inline-flex rounded-md border border-accent px-2 py-0.5 font-display text-lg font-bold text-accent">
            {en.status.rank(rank)}
          </p>
          <p className="text-sm text-muted tabular-nums">
            {nextLevel === undefined
              ? en.status.topRank
              : en.status.nextRank(rankFor(nextLevel), nextLevel)}
          </p>
          <p className="text-sm text-muted tabular-nums">
            {en.status.totalXp(formatNumber(totalXp))}
          </p>
        </div>
      </div>
      <ProgressBar
        className="mt-3"
        label={en.status.xpBar}
        value={intoLevel}
        max={needed}
        valueText={en.status.xpValue(formatNumber(intoLevel), formatNumber(needed))}
      />
      <p className="mt-1 text-sm text-muted tabular-nums">
        {en.status.xpToNext(formatNumber(needed - intoLevel), level + 1)}
      </p>
      <section aria-label={en.status.stats} className="mt-4 grid grid-cols-3 gap-3">
        {(['str', 'vit', 'int'] as const).map((stat) => (
          <div key={stat} className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center justify-between gap-x-1">
              <StatBadge stat={stat} />
              <span className="text-sm font-semibold tabular-nums">
                {en.status.statLevel(stats[stat].level)}
              </span>
            </div>
            <ProgressBar
              size="sm"
              tone={stat}
              label={`${en.stats[`${stat}Name`]} ${en.status.statLevel(stats[stat].level)}`}
              value={stats[stat].intoLevel}
              max={stats[stat].needed}
              valueText={en.status.statValue(stats[stat].intoLevel, stats[stat].needed)}
            />
          </div>
        ))}
      </section>
      {celebrate && <LevelUp level={level} onClose={dismiss} />}
    </Card>
  )
}

/** A short, skippable celebration (CLAUDE.md §7: 1.5 s or less, off under reduced motion). */
function LevelUp({ level, onClose }: { level: number; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const dialog = ref.current
    if (dialog && !dialog.open) dialog.showModal()
  }, [])
  return (
    // A tap anywhere skips it; keyboard users have Escape and the button.
    // eslint-disable-next-line jsx-a11y-x/click-events-have-key-events, jsx-a11y-x/no-noninteractive-element-interactions
    <dialog
      ref={ref}
      aria-labelledby="level-up-title"
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onClick={onClose}
      className="m-auto w-[min(22rem,calc(100vw-2rem))] rounded-xl border border-accent bg-surface p-6 text-center text-text shadow-sheet backdrop:bg-scrim backdrop:animate-fade-in"
    >
      <div className="animate-level-up">
        <p id="level-up-title" className="font-display text-3xl font-bold text-accent">
          {en.status.levelUp}
        </p>
        <p className="mt-2 font-display text-display font-bold tabular-nums">{level}</p>
        <p className="mt-2 text-muted">{en.status.levelUpBody(level)}</p>
      </div>
      <Button className="mt-5" block onClick={onClose}>
        {en.status.continue}
      </Button>
    </dialog>
  )
}
