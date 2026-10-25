import { describe, expect, it } from 'vitest'
import { atLocalTime } from '../domain/date'
import { finishTimer } from '../domain/study'
import { db } from './db'
import {
  addSubject,
  allSubjects,
  cancelTimer,
  deleteSession,
  restoreSession,
  runningTimer,
  saveSession,
  sessionsBetween,
  startTimer,
} from './study'

const start = atLocalTime('2026-10-25', 23, 40)

describe('focus timer and sessions', () => {
  it('keeps a running timer, then ends it into a session in one step', async () => {
    expect(await runningTimer()).toBeUndefined()
    const timer = { startedAt: start, plannedMin: 50 }
    await startTimer(timer)
    expect(await runningTimer()).toEqual(timer)

    const id = await saveSession(finishTimer(timer, start + 3_600_000), 'timer', {
      endTimer: true,
    })
    expect(await runningTimer()).toBeUndefined()
    expect(await db.studySessions.get(id)).toMatchObject({
      date: '2026-10-25',
      minutes: 50,
      completed: true,
      source: 'timer',
    })
  })

  it('cancels a timer without saving anything', async () => {
    await startTimer({ startedAt: start, plannedMin: 25 })
    await cancelTimer()
    expect(await runningTimer()).toBeUndefined()
    expect(await db.studySessions.count()).toBe(0)
  })

  it('lists sessions between dates, deletes and restores them', async () => {
    const base = { startedAt: start, minutes: 50, completed: true }
    await saveSession({ ...base, date: '2026-10-24' }, 'manual')
    const id = await saveSession({ ...base, date: '2026-10-25' }, 'timer')
    await saveSession({ ...base, date: '2026-10-27' }, 'timer')
    expect((await sessionsBetween('2026-10-24', '2026-10-26')).map((s) => s.date)).toEqual([
      '2026-10-24',
      '2026-10-25',
    ])
    const removed = await deleteSession(id)
    expect(await sessionsBetween('2026-10-25', '2026-10-25')).toEqual([])
    await restoreSession(removed!)
    expect(await sessionsBetween('2026-10-25', '2026-10-25')).toHaveLength(1)
  })
})

describe('subjects', () => {
  it('adds subjects once, ignoring case and spaces, sorted by name', async () => {
    const maths = await addSubject(' Maths ')
    expect(await addSubject('maths')).toBe(maths)
    await addSubject('Chemistry')
    expect((await allSubjects()).map((s) => s.name)).toEqual(['Chemistry', 'Maths'])
  })
})
