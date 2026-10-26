import { AlarmClock, Play, Square } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { nowMs } from '../../app/useToday'
import { en } from '../../copy/en'
import { addSubject, cancelTimer, saveSession, startTimer } from '../../db/study'
import type { Subject } from '../../db/types'
import { formatTime } from '../../domain/date'
import {
  TIMER_LIMITS,
  finishTimer,
  formatCountdown,
  timerStatus,
  type FocusTimer,
} from '../../domain/study'
import {
  Button,
  Card,
  NumberStepper,
  ProgressBar,
  SelectField,
  Sheet,
  TextField,
  buttonClass,
  cx,
  useToast,
} from '../../ui'

const NEW_SUBJECT = 'new'

/** Re-renders every second while a timer runs; time always comes from the saved start. */
function useNow(active: boolean): number {
  const [now, setNow] = useState(nowMs)
  useEffect(() => {
    if (!active) return
    const tick = () => setNow(nowMs())
    tick()
    const id = setInterval(tick, 1000)
    document.addEventListener('visibilitychange', tick)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [active])
  return now
}

export interface FocusTimerCardProps {
  timer: FocusTimer | undefined
  blockMin: number
  subjects: Subject[]
}

/** The focus timer (plan §10, §12). */
export function FocusTimerCard({ timer, blockMin, subjects }: FocusTimerCardProps) {
  const copy = en.study
  const [minutes, setMinutes] = useState(blockMin)
  const [subjectId, setSubjectId] = useState('')
  const [addingSubject, setAddingSubject] = useState(false)
  const now = useNow(timer !== undefined)
  const toast = useToast()
  const finishing = useRef(false)
  const status = timer ? timerStatus(timer, now) : null

  // When the time is up (also after coming back to the app), the block completes at its end time.
  useEffect(() => {
    if (!timer || !status?.done || finishing.current) return
    finishing.current = true
    void saveSession(finishTimer(timer, nowMs()), 'timer', { endTimer: true })
      .then(() => toast.show({ message: copy.blockDone }))
      .finally(() => {
        finishing.current = false
      })
  }, [timer, status?.done, toast, copy.blockDone])

  const start = async () => {
    const chosen = subjectId === '' ? undefined : Number(subjectId)
    await startTimer({
      startedAt: nowMs(),
      plannedMin: minutes,
      ...(chosen !== undefined ? { subjectId: chosen } : {}),
    })
  }

  const stop = async () => {
    if (!timer) return
    const session = finishTimer(timer, nowMs())
    if (session.minutes < 1) {
      await cancelTimer()
      toast.show({ message: copy.stoppedTooSoon })
      return
    }
    await saveSession(session, 'timer', { endTimer: true })
    toast.show({
      message: session.completed ? copy.blockDone : copy.stoppedEarly(session.minutes),
    })
  }

  const subjectName = (id: number | undefined) => subjects.find((s) => s.id === id)?.name

  if (timer && status) {
    const name = subjectName(timer.subjectId)
    return (
      <Card title={copy.timer} framed>
        <div className="flex flex-col items-center gap-3 text-center">
          <p className="font-semibold">{name ? copy.running(name) : copy.runningNoSubject}</p>
          <p className="sr-only">{copy.timeLeft}</p>
          <p
            role="timer"
            aria-live="off"
            className="font-display text-display font-bold tabular-nums text-int"
          >
            {formatCountdown(status.remainingMs)}
          </p>
          <p className="text-sm text-muted tabular-nums">
            {copy.endsAt(formatTime(status.endsAt))}
          </p>
          <ProgressBar
            tone="int"
            label={copy.timeLeft}
            value={status.elapsedMs}
            max={timer.plannedMin * 60_000}
            valueText={formatCountdown(status.remainingMs)}
          />
          <p className="text-sm text-muted">{copy.keepsTime}</p>
          <div className="flex w-full gap-2">
            <Button
              variant="secondary"
              icon={<Square size={18} />}
              className="flex-1"
              onClick={() => void stop()}
            >
              {copy.stop}
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                void cancelTimer().then(() => toast.show({ message: copy.cancelled }))
              }}
            >
              {copy.cancel}
            </Button>
          </div>
        </div>
      </Card>
    )
  }

  const shortcut = copy.shortcutName(minutes)
  return (
    <Card title={copy.timer} subtitle={copy.timerIntro} framed>
      <div className="flex flex-col gap-4">
        <NumberStepper
          label={copy.minutes}
          value={minutes}
          onChange={setMinutes}
          min={TIMER_LIMITS.min}
          max={TIMER_LIMITS.max}
          step={TIMER_LIMITS.step}
          unit="min"
        />
        <SelectField
          label={copy.subject}
          value={subjectId}
          options={[
            { value: '', label: copy.noSubject },
            ...subjects.map((s) => ({ value: String(s.id), label: s.name })),
            { value: NEW_SUBJECT, label: copy.addSubjectOption },
          ]}
          onChange={(value) => {
            if (value === NEW_SUBJECT) setAddingSubject(true)
            else setSubjectId(value)
          }}
        />
        <Button size="lg" block icon={<Play size={20} />} onClick={() => void start()}>
          {copy.start}
        </Button>
        <div>
          <a
            href={`shortcuts://run-shortcut?name=${encodeURIComponent(shortcut)}`}
            className={cx(buttonClass({ variant: 'ghost' }), '-ml-4')}
          >
            <AlarmClock aria-hidden="true" size={20} />
            {copy.alarm}
          </a>
          <p className="text-sm text-muted">{copy.alarmHint(shortcut)}</p>
        </div>
      </div>

      <Sheet
        open={addingSubject}
        onClose={() => setAddingSubject(false)}
        title={copy.addSubjectTitle}
      >
        {addingSubject && (
          <SubjectForm
            onSave={async (name) => {
              const id = await addSubject(name)
              setSubjectId(String(id))
              setAddingSubject(false)
            }}
          />
        )}
      </Sheet>
    </Card>
  )
}

export function SubjectForm({ onSave }: { onSave: (name: string) => Promise<void> }) {
  const [name, setName] = useState('')
  const [error, setError] = useState(false)
  return (
    <form
      noValidate
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault()
        if (name.trim() === '') {
          setError(true)
          return
        }
        void onSave(name)
      }}
    >
      <TextField
        label={en.study.subjectName}
        value={name}
        maxLength={40}
        autoComplete="off"
        onChange={(event) => setName(event.target.value)}
        {...(error ? { error: en.study.errors.subjectRequired } : {})}
      />
      <Button type="submit" block size="lg">
        {en.study.save}
      </Button>
    </form>
  )
}
