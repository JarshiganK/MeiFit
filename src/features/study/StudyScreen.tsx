import { useLiveQuery } from 'dexie-react-hooks'
import { Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { ScreenFallback } from '../../app/ScreenFallback'
import { ScreenHeader } from '../../app/ScreenHeader'
import { nowMs, useToday } from '../../app/useToday'
import { en } from '../../copy/en'
import { formatNumber } from '../../copy/format'
import { getProfile } from '../../db/profile'
import {
  allSubjects,
  deleteSession,
  restoreSession,
  runningTimer,
  saveSession,
  sessionsBetween,
} from '../../db/study'
import type { Subject } from '../../db/types'
import {
  atLocalTime,
  formatTime,
  startOfLocalDay,
  toLocalDate,
  weekEnd,
  weekStart,
  type LocalDate,
} from '../../domain/date'
import { parseNumber } from '../../domain/number'
import { DEFAULT_ROUTINE } from '../../domain/setup'
import {
  MAX_BLOCKS_PER_DAY,
  blocksOn,
  validateManualMinutes,
  weekMinutes,
} from '../../domain/study'
import {
  Button,
  Card,
  IconButton,
  ProgressBar,
  SelectField,
  Sheet,
  TextField,
  useToast,
} from '../../ui'
import { ExamsCard } from './ExamsCard'
import { FocusTimerCard } from './FocusTimerCard'

export function StudyScreen() {
  const today = useToday()
  const data = useLiveQuery(async () => {
    const profile = await getProfile()
    return {
      blockMin: profile?.blockMin ?? DEFAULT_ROUTINE.blockMin,
      goalHours: profile?.studyGoalHours ?? DEFAULT_ROUTINE.studyGoalHours,
      timer: await runningTimer(),
      subjects: await allSubjects(),
      week: await sessionsBetween(weekStart(today), weekEnd(today)),
    }
  }, [today])
  const [adding, setAdding] = useState(false)
  const toast = useToast()

  if (!data) return <ScreenFallback />
  const copy = en.study
  const todays = data.week.filter((s) => s.date === today)
  const blocks = blocksOn(today, data.week, data.blockMin)
  const hours = Math.round((weekMinutes(today, data.week) / 60) * 10) / 10
  const subjectName = (id: number | undefined) => data.subjects.find((s) => s.id === id)?.name

  return (
    <>
      <ScreenHeader title={copy.title} />
      <div className="flex flex-col gap-4 pt-2">
        <FocusTimerCard timer={data.timer} blockMin={data.blockMin} subjects={data.subjects} />

        <Card title={copy.today}>
          <div className="flex flex-col gap-3">
            <ProgressBar
              tone="int"
              label={copy.blocksLabel}
              value={blocks}
              max={MAX_BLOCKS_PER_DAY}
              valueText={copy.blocks(blocks, MAX_BLOCKS_PER_DAY)}
            />
            <p className="font-semibold tabular-nums">{copy.blocks(blocks, MAX_BLOCKS_PER_DAY)}</p>
            {todays.length === 0 ? (
              <p className="text-sm text-muted">{copy.nothingToday}</p>
            ) : (
              <ul className="divide-y divide-border">
                {todays.map((session) => {
                  const time = formatTime(session.startedAt)
                  const subject = subjectName(session.subjectId)
                  return (
                    <li key={session.id} className="flex min-h-11 items-center gap-3 py-1">
                      <span className="min-w-0 flex-1">
                        <span className="block tabular-nums">
                          {copy.session(time, session.minutes)}
                          {subject && ` · ${subject}`}
                        </span>
                        {(session.source === 'manual' || !session.completed) && (
                          <span className="block text-sm text-muted">
                            {session.source === 'manual' ? copy.manualTag : copy.partial}
                          </span>
                        )}
                      </span>
                      <IconButton
                        label={copy.deleteSession(time)}
                        icon={<Trash2 size={20} />}
                        onClick={() => {
                          void deleteSession(session.id!).then((removed) => {
                            if (!removed) return
                            toast.show({
                              message: copy.sessionDeleted,
                              action: {
                                label: en.common.undo,
                                onAction: () => void restoreSession(removed),
                              },
                            })
                          })
                        }}
                      />
                    </li>
                  )
                })}
              </ul>
            )}
            <Button
              variant="ghost"
              icon={<Plus size={20} />}
              className="-ml-4 self-start"
              onClick={() => setAdding(true)}
            >
              {copy.add}
            </Button>
          </div>
        </Card>

        <Card title={copy.week}>
          <ProgressBar
            tone="int"
            label={copy.week}
            value={hours}
            max={Math.max(data.goalHours, 1)}
            valueText={copy.weekValue(formatNumber(hours), data.goalHours)}
          />
          <p className="mt-2 tabular-nums">{copy.weekHours(formatNumber(hours), data.goalHours)}</p>
        </Card>

        <ExamsCard today={today} subjects={data.subjects} />
      </div>

      <Sheet
        open={adding}
        onClose={() => setAdding(false)}
        title={copy.addTitle}
        description={copy.addIntro}
      >
        {adding && (
          <ManualSession
            today={today}
            defaultMinutes={data.blockMin}
            subjects={data.subjects}
            onSaved={() => {
              setAdding(false)
              toast.show({ message: copy.saved })
            }}
          />
        )}
      </Sheet>
    </>
  )
}

/**
 * The start of a hand-entered session: the time given, or else one that ends
 * now (today) or at midday (an earlier day), never before the day began, so
 * the date can always be rebuilt from the timestamp (plan §5).
 */
function startTimeFor(date: LocalDate, time: string, minutes: number): number {
  if (time) {
    const [h, m] = time.split(':').map(Number) as [number, number]
    return atLocalTime(date, h, m)
  }
  const now = nowMs()
  const fallback = date === toLocalDate(now) ? now - minutes * 60_000 : atLocalTime(date, 12, 0)
  return Math.max(startOfLocalDay(date), fallback)
}

function ManualSession({
  today,
  defaultMinutes,
  subjects,
  onSaved,
}: {
  today: LocalDate
  defaultMinutes: number
  subjects: Subject[]
  onSaved: () => void
}) {
  const copy = en.study
  const [date, setDate] = useState(today)
  const [time, setTime] = useState('')
  const [minutesText, setMinutes] = useState(String(defaultMinutes))
  const [subjectId, setSubjectId] = useState('')
  const [errors, setErrors] = useState<{ minutes?: string; time?: string }>({})

  const save = async () => {
    const minutes = parseNumber(minutesText)
    const minutesError = validateManualMinutes(minutes)
    const startedAt = startTimeFor(date, time, minutes ?? 0)
    const next: { minutes?: string; time?: string } = {}
    if (minutesError) next.minutes = copy.errors[minutesError]
    if (date === '' || startedAt > nowMs()) next.time = copy.errors.future
    setErrors(next)
    if (next.minutes || next.time || minutes === undefined) return
    await saveSession(
      {
        date,
        startedAt,
        minutes,
        completed: true,
        ...(subjectId === '' ? {} : { subjectId: Number(subjectId) }),
      },
      'manual',
    )
    onSaved()
  }

  return (
    <form
      noValidate
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault()
        void save()
      }}
    >
      <TextField
        label={copy.date}
        type="date"
        max={today}
        value={date}
        onChange={(event) => setDate(event.target.value)}
      />
      <TextField
        label={copy.startTime}
        type="time"
        value={time}
        onChange={(event) => setTime(event.target.value)}
        {...(errors.time ? { error: errors.time } : {})}
      />
      <TextField
        label={copy.duration}
        inputMode="numeric"
        value={minutesText}
        onChange={(event) => setMinutes(event.target.value)}
        {...(errors.minutes ? { error: errors.minutes } : {})}
      />
      {subjects.length > 0 && (
        <SelectField
          label={copy.subject}
          value={subjectId}
          options={[
            { value: '', label: copy.noSubject },
            ...subjects.map((s) => ({ value: String(s.id), label: s.name })),
          ]}
          onChange={setSubjectId}
        />
      )}
      <Button type="submit" block size="lg">
        {copy.save}
      </Button>
    </form>
  )
}
