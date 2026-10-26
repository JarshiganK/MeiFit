import { describe, expect, it } from 'vitest'
import { db } from './db'
import {
  addEvent,
  allEvents,
  allPeriods,
  deleteEvent,
  restoreEvent,
  startManualExamMode,
  stopManualExamMode,
  syncExamPeriods,
} from './exams'

const TODAY = '2026-10-26'

describe('exam calendar', () => {
  it('turns exam dates into exam-mode periods, and follows changes', async () => {
    const id = await addEvent({ date: '2026-12-01', type: 'exam', title: ' Maths ' }, TODAY)
    await addEvent({ date: '2026-11-20', type: 'deadline', title: 'Lab report' }, TODAY)
    expect((await allEvents()).map((e) => e.title)).toEqual(['Lab report', 'Maths'])
    expect(await allPeriods()).toMatchObject([
      { startsOn: '2026-11-17', endsOn: '2026-12-02', source: 'auto' },
    ])

    const removed = await deleteEvent(id, TODAY)
    expect(await allPeriods()).toEqual([])
    await restoreEvent(removed!, TODAY)
    expect(await allPeriods()).toHaveLength(1)
  })

  it('keeps finished periods and doesn’t rewrite unchanged ones', async () => {
    await db.examPeriods.add({ startsOn: '2026-09-01', endsOn: '2026-09-16', source: 'auto' })
    await addEvent({ date: '2026-12-01', type: 'exam', title: 'Maths' }, TODAY)
    const before = await allPeriods()
    await syncExamPeriods(TODAY)
    expect(await allPeriods()).toEqual(before)
    expect(before.map((p) => p.startsOn)).toEqual(['2026-09-01', '2026-11-17'])
  })
})

describe('manual exam mode', () => {
  it('runs from today until switched off; switching off the same day removes it', async () => {
    await startManualExamMode(TODAY)
    expect(await allPeriods()).toMatchObject([
      { startsOn: TODAY, endsOn: '9999-12-31', source: 'manual' },
    ])
    await stopManualExamMode(TODAY)
    expect(await allPeriods()).toEqual([])
  })

  it('ends yesterday when switched off on a later day', async () => {
    await startManualExamMode('2026-10-20')
    await stopManualExamMode(TODAY)
    expect(await allPeriods()).toMatchObject([{ startsOn: '2026-10-20', endsOn: '2026-10-25' }])
  })
})
