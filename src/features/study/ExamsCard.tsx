import { useLiveQuery } from 'dexie-react-hooks'
import { CalendarClock, GraduationCap, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { en } from '../../copy/en'
import {
  addEvent,
  allEvents,
  allPeriods,
  deleteEvent,
  restoreEvent,
  startManualExamMode,
  stopManualExamMode,
} from '../../db/exams'
import type { Subject } from '../../db/types'
import { daysBetween, formatShortDate, type LocalDate } from '../../domain/date'
import { OPEN_END, nextPeriod, periodOn } from '../../domain/exams'
import {
  Button,
  Card,
  IconButton,
  SegmentedControl,
  SelectField,
  Sheet,
  Switch,
  TextField,
  useToast,
} from '../../ui'

/** The exam and deadline calendar, and exam mode (plan §7, §10). */
export function ExamsCard({ today, subjects }: { today: LocalDate; subjects: Subject[] }) {
  const data = useLiveQuery(async () => ({
    events: await allEvents(),
    periods: await allPeriods(),
  }))
  const [adding, setAdding] = useState(false)
  const toast = useToast()
  if (!data) return <Card title={en.exams.title}>{null}</Card>

  const copy = en.exams
  const current = periodOn(today, data.periods)
  const manualOn = data.periods.some(
    (p) => p.source === 'manual' && p.startsOn <= today && today <= p.endsOn,
  )
  const upcoming = data.events.filter((e) => e.date >= today)
  const next = nextPeriod(today, data.periods)
  const subjectName = (id: number | undefined) => subjects.find((s) => s.id === id)?.name

  return (
    <Card title={copy.title}>
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <GraduationCap
            aria-hidden="true"
            size={26}
            className={current ? 'mt-0.5 shrink-0 text-int' : 'mt-0.5 shrink-0 text-muted'}
          />
          <div className="min-w-0 flex-1">
            <p className="font-semibold">
              {current
                ? current.endsOn === OPEN_END
                  ? copy.modeOnOpen
                  : copy.modeOn(formatShortDate(current.endsOn))
                : next
                  ? copy.modeNext(formatShortDate(next.startsOn))
                  : copy.modeOff}
            </p>
            {current && <p className="text-sm text-muted">{copy.modeEffects}</p>}
          </div>
        </div>
        <Switch
          label={copy.manual}
          hint={copy.manualHint}
          checked={manualOn}
          onChange={(on) => void (on ? startManualExamMode(today) : stopManualExamMode(today))}
        />

        <div>
          <h3 className="font-semibold">{copy.upcoming}</h3>
          {upcoming.length === 0 ? (
            <p className="text-sm text-muted">{copy.none}</p>
          ) : (
            <ul className="divide-y divide-border">
              {upcoming.map((event) => {
                const subject = subjectName(event.subjectId)
                return (
                  <li key={event.id} className="flex min-h-13 items-center gap-3 py-1">
                    <CalendarClock aria-hidden="true" size={20} className="shrink-0 text-muted" />
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold">
                        {event.title}
                        {subject && ` · ${subject}`}
                      </span>
                      <span className="block text-sm text-muted tabular-nums">
                        {copy.entry(copy.types[event.type], formatShortDate(event.date))} ·{' '}
                        {copy.daysLeft(daysBetween(today, event.date))}
                      </span>
                    </span>
                    <IconButton
                      label={copy.deleteEvent(event.title)}
                      icon={<Trash2 size={20} />}
                      onClick={() => {
                        void deleteEvent(event.id!, today).then((removed) => {
                          if (!removed) return
                          toast.show({
                            message: copy.deleted(removed.title),
                            action: {
                              label: en.common.undo,
                              onAction: () => void restoreEvent(removed, today),
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
        </div>
        <Button
          variant="secondary"
          icon={<Plus size={20} />}
          className="self-start"
          onClick={() => setAdding(true)}
        >
          {copy.add}
        </Button>
      </div>

      <Sheet open={adding} onClose={() => setAdding(false)} title={copy.addTitle}>
        {adding && (
          <EventForm
            today={today}
            subjects={subjects}
            onSaved={(title) => {
              setAdding(false)
              toast.show({ message: copy.saved(title) })
            }}
          />
        )}
      </Sheet>
    </Card>
  )
}

function EventForm({
  today,
  subjects,
  onSaved,
}: {
  today: LocalDate
  subjects: Subject[]
  onSaved: (title: string) => void
}) {
  const copy = en.exams
  const [title, setTitle] = useState('')
  const [type, setType] = useState<'exam' | 'deadline'>('exam')
  const [date, setDate] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [errors, setErrors] = useState<{ title?: string; date?: string }>({})

  const save = async () => {
    const next: { title?: string; date?: string } = {}
    if (title.trim() === '') next.title = copy.errors.title
    if (date === '' || date < today) next.date = copy.errors.date
    setErrors(next)
    if (next.title || next.date) return
    await addEvent(
      {
        title,
        type,
        date,
        ...(subjectId === '' ? {} : { subjectId: Number(subjectId) }),
      },
      today,
    )
    onSaved(title.trim())
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
        label={copy.name}
        value={title}
        maxLength={60}
        autoComplete="off"
        onChange={(event) => setTitle(event.target.value)}
        {...(errors.title ? { error: errors.title } : {})}
      />
      <SegmentedControl
        label={copy.type}
        options={(['exam', 'deadline'] as const).map((value) => ({
          value,
          label: copy.types[value],
        }))}
        value={type}
        onChange={setType}
      />
      <TextField
        label={copy.date}
        type="date"
        min={today}
        value={date}
        onChange={(event) => setDate(event.target.value)}
        {...(errors.date ? { error: errors.date } : {})}
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
