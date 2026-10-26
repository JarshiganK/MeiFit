/**
 * The exam and deadline calendar, and exam-mode periods (plan §7, §10).
 * Automatic periods follow the exam dates; a manual period runs from the day
 * it's switched on until it's switched off.
 */
import { addDays, type LocalDate } from '../domain/date'
import { OPEN_END, syncAutoPeriods } from '../domain/exams'
import { db } from './db'
import type { CalendarEvent, ExamPeriod } from './types'

export async function allEvents(): Promise<CalendarEvent[]> {
  return db.events.orderBy('date').toArray()
}

export async function allPeriods(): Promise<ExamPeriod[]> {
  return db.examPeriods.orderBy('startsOn').toArray()
}

/** Rewrites the automatic periods from the exam dates; finished ones stay as they were. */
export async function syncExamPeriods(today: LocalDate): Promise<void> {
  await db.transaction('rw', db.events, db.examPeriods, async () => {
    const exams = await db.events.where('type').equals('exam').toArray()
    const saved = await db.examPeriods.filter((p) => p.source === 'auto').toArray()
    const { keep, add } = syncAutoPeriods(
      saved,
      exams.map((e) => e.date),
      today,
    )
    // Only touch what changed, so opening the app doesn't rewrite the same periods.
    const same = (
      x: { startsOn: string; endsOn: string },
      y: { startsOn: string; endsOn: string },
    ) => x.startsOn === y.startsOn && x.endsOn === y.endsOn
    const current = saved.filter((p) => !keep.includes(p))
    const remove = current.filter((p) => !add.some((a) => same(a, p))).map((p) => p.id!)
    const create = add.filter((a) => !current.some((p) => same(a, p)))
    if (remove.length > 0) await db.examPeriods.bulkDelete(remove)
    if (create.length > 0) {
      await db.examPeriods.bulkAdd(create.map((p) => ({ ...p, source: 'auto' as const })))
    }
  })
}

export async function addEvent(
  event: Omit<CalendarEvent, 'id'>,
  today: LocalDate,
): Promise<number> {
  const id = await db.events.add({ ...event, title: event.title.trim() })
  if (id === undefined) throw new Error('The event was not saved')
  await syncExamPeriods(today)
  return id
}

export async function deleteEvent(
  id: number,
  today: LocalDate,
): Promise<CalendarEvent | undefined> {
  const event = await db.events.get(id)
  await db.events.delete(id)
  await syncExamPeriods(today)
  return event
}

export async function restoreEvent(event: CalendarEvent, today: LocalDate): Promise<void> {
  await db.events.put(event)
  await syncExamPeriods(today)
}

/** Turns exam mode on by hand from today, until it's switched off. */
export async function startManualExamMode(today: LocalDate): Promise<void> {
  await db.examPeriods.add({ startsOn: today, endsOn: OPEN_END, source: 'manual' })
}

/**
 * Switches manual exam mode off: a period that started today is removed;
 * an older one ends yesterday, so today is back to normal rules.
 */
export async function stopManualExamMode(today: LocalDate): Promise<void> {
  await db.transaction('rw', db.examPeriods, async () => {
    const open = await db.examPeriods
      .filter((p) => p.source === 'manual' && p.startsOn <= today && today <= p.endsOn)
      .toArray()
    for (const period of open) {
      if (period.startsOn === today) await db.examPeriods.delete(period.id)
      else await db.examPeriods.update(period.id, { endsOn: addDays(today, -1) })
    }
  })
}
