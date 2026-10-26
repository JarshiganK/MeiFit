import { describe, expect, it } from 'vitest'
import { autoPeriods, isExamDay, nextPeriod, periodOn, syncAutoPeriods } from './exams'

describe('exam periods (plan §7)', () => {
  it('starts 14 days before an exam and ends the day after it', () => {
    expect(autoPeriods(['2026-12-01'])).toEqual([{ startsOn: '2026-11-17', endsOn: '2026-12-02' }])
  })

  it('merges exams whose periods overlap or touch', () => {
    expect(autoPeriods(['2026-12-10', '2026-12-01', '2026-12-17', '2026-12-01'])).toEqual([
      { startsOn: '2026-11-17', endsOn: '2026-12-18' },
    ])
    // 1 Dec ends 2 Dec; an exam on 18 Dec starts its lead-in on 4 Dec: separate.
    expect(autoPeriods(['2026-12-01', '2026-12-18'])).toEqual([
      { startsOn: '2026-11-17', endsOn: '2026-12-02' },
      { startsOn: '2026-12-04', endsOn: '2026-12-19' },
    ])
    // A lead-in starting the day after the last period ends: merged.
    expect(autoPeriods(['2026-12-01', '2026-12-17'])).toEqual([
      { startsOn: '2026-11-17', endsOn: '2026-12-18' },
    ])
    expect(autoPeriods([])).toEqual([])
  })

  it('knows which days are exam days', () => {
    const periods = autoPeriods(['2026-12-01'])
    expect(isExamDay('2026-11-16', periods)).toBe(false)
    expect(isExamDay('2026-11-17', periods)).toBe(true)
    expect(isExamDay('2026-12-02', periods)).toBe(true)
    expect(isExamDay('2026-12-03', periods)).toBe(false)
    expect(periodOn('2026-11-20', periods)?.endsOn).toBe('2026-12-02')
    expect(periodOn('2026-11-01', periods)).toBeUndefined()
  })

  it('finds the next period', () => {
    const periods = autoPeriods(['2027-01-20', '2026-12-01'])
    expect(nextPeriod('2026-10-26', periods)?.startsOn).toBe('2026-11-17')
    expect(nextPeriod('2026-11-20', periods)?.startsOn).toBe('2027-01-06')
    expect(nextPeriod('2027-01-30', periods)).toBeUndefined()
  })
})

describe('syncAutoPeriods', () => {
  it('keeps finished periods and replaces the rest from the calendar', () => {
    const saved = [
      { startsOn: '2026-09-01', endsOn: '2026-09-16' }, // over
      { startsOn: '2026-11-17', endsOn: '2026-12-02' }, // its exam moved
    ]
    expect(syncAutoPeriods(saved, ['2026-09-15', '2026-12-05'], '2026-10-26')).toEqual({
      keep: [{ startsOn: '2026-09-01', endsOn: '2026-09-16' }],
      add: [{ startsOn: '2026-11-21', endsOn: '2026-12-06' }],
    })
  })

  it('drops an upcoming period when its exam is deleted', () => {
    const saved = [{ startsOn: '2026-11-17', endsOn: '2026-12-02' }]
    expect(syncAutoPeriods(saved, [], '2026-10-26')).toEqual({ keep: [], add: [] })
  })
})
