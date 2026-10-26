import { useLiveQuery } from 'dexie-react-hooks'
import { Award, Lock } from 'lucide-react'
import { en } from '../../copy/en'
import { loadQuestHistory } from '../../db/history'
import { achievements } from '../../domain/achievements'
import type { LocalDate } from '../../domain/date'
import { Card, ProgressBar, cx } from '../../ui'

/** Achievements (plan §7, §10). */
export function AchievementsCard({ today }: { today: LocalDate }) {
  const history = useLiveQuery(loadQuestHistory, [], null)
  if (history === null) return <Card title={en.achievements.title}>{null}</Card>
  if (!history) return null
  const list = achievements(history, today)
  const copy = en.achievements
  return (
    <Card
      title={copy.title}
      subtitle={copy.unlocked(list.filter((a) => a.unlocked).length, list.length)}
    >
      <ul className="-my-1 divide-y divide-border">
        {list.map((a) => (
          <li key={a.id} className="flex items-start gap-3 py-3">
            <span
              className={cx(
                'inline-flex size-10 shrink-0 items-center justify-center rounded-full border',
                a.unlocked ? 'border-accent bg-accent text-on-accent' : 'border-border text-muted',
              )}
            >
              {a.unlocked ? (
                <Award aria-hidden="true" size={22} />
              ) : (
                <Lock aria-hidden="true" size={18} />
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">{copy.names[a.id]}</span>
              <span className="block text-sm text-muted">{copy.descriptions[a.id]}</span>
              {a.unlocked ? (
                <span className="block text-sm font-semibold text-accent">{copy.done}</span>
              ) : (
                <ProgressBar
                  size="sm"
                  className="mt-2"
                  label={copy.names[a.id]}
                  value={a.progress}
                  max={a.goal}
                  valueText={copy.progress(a.progress, a.goal)}
                />
              )}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  )
}
