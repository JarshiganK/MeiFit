/**
 * Study sessions, subjects and the running focus timer (plan §10, §12). The
 * timer is one setting holding its start time, so it survives the app being
 * closed; ending it writes a session in the same transaction.
 */
import type { LocalDate } from '../domain/date'
import type { FocusTimer, SessionValues } from '../domain/study'
import { db } from './db'
import { getSetting, setSetting } from './settings'
import type { StudySession, Subject } from './types'

export async function runningTimer(): Promise<FocusTimer | undefined> {
  const timer = await getSetting('focusTimer', null)
  return timer ?? undefined
}

export async function startTimer(timer: FocusTimer): Promise<void> {
  await setSetting('focusTimer', timer)
}

/** Saves a session; with `endTimer`, also clears the running timer. Returns its id. */
export async function saveSession(
  session: SessionValues,
  source: StudySession['source'],
  { endTimer = false }: { endTimer?: boolean } = {},
): Promise<number> {
  return db.transaction('rw', db.studySessions, db.settings, async () => {
    const id = await db.studySessions.add({ ...session, source })
    if (id === undefined) throw new Error('The study session was not saved')
    if (endTimer) await db.settings.delete('focusTimer')
    return id
  })
}

export async function cancelTimer(): Promise<void> {
  await db.settings.delete('focusTimer')
}

export async function sessionsBetween(from: LocalDate, to: LocalDate): Promise<StudySession[]> {
  return db.studySessions.where('date').between(from, to, true, true).sortBy('startedAt')
}

export async function deleteSession(id: number): Promise<StudySession | undefined> {
  const session = await db.studySessions.get(id)
  await db.studySessions.delete(id)
  return session
}

export async function restoreSession(session: StudySession): Promise<void> {
  await db.studySessions.put(session)
}

export async function allSubjects(): Promise<Subject[]> {
  const subjects = await db.subjects.toArray()
  return subjects.sort((a, b) => a.name.localeCompare(b.name))
}

/** Adds a subject, or returns the existing one with the same name (ignoring case). */
export async function addSubject(name: string): Promise<number> {
  const clean = name.trim()
  const existing = (await db.subjects.toArray()).find(
    (s) => s.name.toLowerCase() === clean.toLowerCase(),
  )
  if (existing?.id !== undefined) return existing.id
  const id = await db.subjects.add({ name: clean })
  if (id === undefined) throw new Error('The subject was not saved')
  return id
}
