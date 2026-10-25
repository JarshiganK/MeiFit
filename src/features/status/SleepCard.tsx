import { useLiveQuery } from 'dexie-react-hooks'
import { Moon, Pencil, Plus, Sun } from 'lucide-react'
import { useState } from 'react'
import { nowMs, useToday } from '../../app/useToday'
import { en } from '../../copy/en'
import { getProfile } from '../../db/profile'
import {
  cancelSleep,
  deleteSleep,
  latestSleep,
  openSleep,
  restoreSleep,
  saveSleep,
  startSleep,
  updateSleep,
} from '../../db/sleep'
import type { SleepLog } from '../../db/types'
import {
  addDays,
  atLocalTime,
  formatShortDate,
  formatTime,
  fromDateTimeInput,
  toDateTimeInput,
  toLocalDate,
} from '../../domain/date'
import { DEFAULT_ROUTINE } from '../../domain/setup'
import { meetsSleepTarget, needsWakeTime, validateSleep } from '../../domain/sleep'
import { Button, Card, Sheet, TextField, useToast } from '../../ui'
import { formatDuration } from './formatSleep'

type Editing =
  | { kind: 'edit'; log: SleepLog }
  | { kind: 'add' }
  /** "I'm awake" more than 16 hours after "Going to sleep" (owner change 4). */
  | { kind: 'wake'; bedAt: number }

/** Two taps a day: "Going to sleep" at night and "I'm awake" in the morning (plan §10). */
export function SleepCard() {
  const data = useLiveQuery(async () => ({
    open: await openSleep(),
    last: await latestSleep(),
    targetMin: (await getProfile())?.sleepTargetMin ?? DEFAULT_ROUTINE.sleepTargetMin,
  }))
  const [editing, setEditing] = useState<Editing | null>(null)
  const toast = useToast()
  const today = useToday()

  if (!data) return <Card title={en.sleep.title}>{null}</Card>
  const { open, last, targetMin } = data
  const target = formatDuration(targetMin)

  const goToSleep = async () => {
    await startSleep(nowMs())
    toast.show({ message: en.sleep.goodNight })
  }

  const wakeUp = async (bedAt: number) => {
    const now = nowMs()
    if (needsWakeTime(bedAt, now)) {
      setEditing({ kind: 'wake', bedAt })
      return
    }
    const id = await saveSleep({ bedAt, wakeAt: now }, 'tap', { closeOpen: true })
    toast.show({
      message: en.sleep.goodMorning(formatDuration(Math.round((now - bedAt) / 60_000))),
      action: {
        label: en.common.undo,
        onAction: () => {
          void deleteSleep(id).then(() => startSleep(bedAt))
        },
      },
    })
  }

  const openSince = (bedAt: number) => {
    return toLocalDate(bedAt) === today
      ? en.sleep.sleepingSince(formatTime(bedAt))
      : en.sleep.sleepingSinceDay(formatShortDate(toLocalDate(bedAt)), formatTime(bedAt))
  }

  return (
    <Card title={en.sleep.title}>
      <div className="flex flex-col gap-4">
        {open !== undefined ? (
          <>
            <p className="font-semibold">{openSince(open)}</p>
            <div className="flex flex-wrap gap-2">
              <Button icon={<Sun size={20} />} className="flex-1" onClick={() => void wakeUp(open)}>
                {en.sleep.awake}
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  void cancelSleep().then(() => toast.show({ message: en.sleep.cancelled }))
                }}
              >
                {en.sleep.cancel}
              </Button>
            </div>
          </>
        ) : (
          <Button icon={<Moon size={20} />} onClick={() => void goToSleep()}>
            {en.sleep.goingToSleep}
          </Button>
        )}

        {last ? (
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm text-muted">{en.sleep.last}</p>
              <p className="font-display text-xl font-bold tabular-nums">
                {formatDuration(last.minutes)}
              </p>
              <p className="text-sm text-muted tabular-nums">
                {en.sleep.range(
                  formatTime(last.bedAt),
                  formatTime(last.wakeAt),
                  formatShortDate(last.wakeDate),
                )}
              </p>
              <p className="mt-1 text-sm">
                {meetsSleepTarget(last.minutes, targetMin)
                  ? en.sleep.targetMet(target)
                  : en.sleep.targetShort(target)}
              </p>
            </div>
            <Button
              variant="secondary"
              icon={<Pencil size={18} />}
              onClick={() => setEditing({ kind: 'edit', log: last })}
            >
              {en.sleep.edit}
            </Button>
          </div>
        ) : (
          <p className="text-sm text-muted">{en.sleep.none}</p>
        )}

        <Button
          variant="ghost"
          icon={<Plus size={20} />}
          className="-ml-4 self-start"
          onClick={() => setEditing({ kind: 'add' })}
        >
          {en.sleep.add}
        </Button>
      </div>

      <Sheet
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={
          editing?.kind === 'wake'
            ? en.sleep.wakeTitle
            : editing?.kind === 'edit'
              ? en.sleep.editTitle
              : en.sleep.addTitle
        }
        description={editing?.kind === 'wake' ? en.sleep.wakeIntro : undefined}
      >
        {editing && (
          <SleepForm
            key={editing.kind === 'edit' ? editing.log.id : editing.kind}
            editing={editing}
            targetMin={targetMin}
            onDone={(message) => {
              setEditing(null)
              toast.show({ message })
            }}
            onDelete={
              editing.kind === 'edit'
                ? () => {
                    setEditing(null)
                    void deleteSleep(editing.log.id!).then((removed) => {
                      if (!removed) return
                      toast.show({
                        message: en.sleep.deleted,
                        action: {
                          label: en.common.undo,
                          onAction: () => void restoreSleep(removed),
                        },
                      })
                    })
                  }
                : undefined
            }
          />
        )}
      </Sheet>
    </Card>
  )
}

function initialTimes(editing: Editing, targetMin: number): { bed: string; wake: string } {
  if (editing.kind === 'edit') {
    return { bed: toDateTimeInput(editing.log.bedAt), wake: toDateTimeInput(editing.log.wakeAt) }
  }
  if (editing.kind === 'wake') {
    return {
      bed: toDateTimeInput(editing.bedAt),
      wake: toDateTimeInput(editing.bedAt + targetMin * 60_000),
    }
  }
  // A typical night that has already ended: this morning's, or before 07:00 last night's.
  const now = nowMs()
  let wakeDay = toLocalDate(now)
  if (atLocalTime(wakeDay, 7, 0) > now) wakeDay = addDays(wakeDay, -1)
  return {
    bed: toDateTimeInput(atLocalTime(addDays(wakeDay, -1), 23, 0)),
    wake: toDateTimeInput(atLocalTime(wakeDay, 7, 0)),
  }
}

function SleepForm({
  editing,
  targetMin,
  onDone,
  onDelete,
}: {
  editing: Editing
  targetMin: number
  onDone: (message: string) => void
  onDelete: (() => void) | undefined
}) {
  const [times, setTimes] = useState(() => initialTimes(editing, targetMin))
  const [error, setError] = useState<keyof typeof en.sleep.errors | null>(null)

  const save = async () => {
    const bedAt = fromDateTimeInput(times.bed)
    const wakeAt = fromDateTimeInput(times.wake)
    const problem = validateSleep(bedAt, wakeAt, nowMs())
    setError(problem)
    if (problem || bedAt === undefined || wakeAt === undefined) return
    if (editing.kind === 'edit') await updateSleep(editing.log.id!, { bedAt, wakeAt })
    else
      await saveSleep({ bedAt, wakeAt }, editing.kind === 'wake' ? 'tap' : 'manual', {
        closeOpen: editing.kind === 'wake',
      })
    onDone(en.sleep.saved)
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
        label={en.sleep.bedAt}
        type="datetime-local"
        value={times.bed}
        onChange={(event) => setTimes((t) => ({ ...t, bed: event.target.value }))}
      />
      <TextField
        label={en.sleep.wakeAt}
        type="datetime-local"
        value={times.wake}
        onChange={(event) => setTimes((t) => ({ ...t, wake: event.target.value }))}
        {...(error ? { error: en.sleep.errors[error] } : {})}
      />
      <Button type="submit" block size="lg">
        {en.sleep.save}
      </Button>
      {onDelete && (
        <Button variant="ghost" block onClick={onDelete}>
          {en.sleep.delete}
        </Button>
      )}
    </form>
  )
}
