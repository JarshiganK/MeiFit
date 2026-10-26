import { useLiveQuery } from 'dexie-react-hooks'
import { en } from '../../copy/en'
import { moodOn, setMood } from '../../db/mood'
import type { LocalDate } from '../../domain/date'
import { Card, SegmentedControl } from '../../ui'

const SCALE = ['1', '2', '3', '4', '5'] as const

/** One-tap energy and mood check-in (plan §6). Hidden in exam mode (plan §7). */
export function MoodCard({ today }: { today: LocalDate }) {
  const log = useLiveQuery(() => moodOn(today), [today], null)
  if (log === null) return <Card title={en.mood.title}>{null}</Card>
  const options = SCALE.map((value) => ({ value, label: value }))
  return (
    <Card title={en.mood.title} subtitle={log ? en.mood.saved : en.mood.hint}>
      <div className="flex flex-col gap-4">
        <SegmentedControl
          label={en.mood.energy}
          hint={en.mood.energyHint}
          options={options}
          value={log ? String(log.energy) : ''}
          onChange={(value) => void setMood(today, { energy: Number(value) })}
        />
        <SegmentedControl
          label={en.mood.mood}
          hint={en.mood.moodHint}
          options={options}
          value={log ? String(log.mood) : ''}
          onChange={(value) => void setMood(today, { mood: Number(value) })}
        />
      </div>
    </Card>
  )
}
