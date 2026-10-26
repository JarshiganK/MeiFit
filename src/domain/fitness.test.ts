import { describe, expect, it } from 'vitest'
import {
  bestE1rm,
  checkRewards,
  checkWindow,
  creditedWaistDates,
  e1rm,
  goalReached,
  improvedTests,
  nextDue,
  nudgeThreshold,
  saturdayOf,
  suggestCalories,
  trend,
} from './fitness'

describe('strength (plan §4)', () => {
  it('estimates a 1-rep max as weight × (1 + reps ÷ 30)', () => {
    expect(e1rm(60, 5)).toBe(70)
    expect(e1rm(42.5, 8)).toBe(54) // 53.83 → nearest 0.5
    expect(e1rm(0, 10)).toBe(0)
    expect(e1rm(50, 0)).toBe(0)
  })

  it('takes the best set of the last 4 weeks', () => {
    const sets = [
      { date: '2026-10-01', exerciseId: 1, reps: 5, weightKg: 100, done: true }, // too old
      { date: '2026-10-05', exerciseId: 1, reps: 5, weightKg: 60, done: true },
      { date: '2026-10-20', exerciseId: 1, reps: 8, weightKg: 60, done: true },
      { date: '2026-10-21', exerciseId: 1, reps: 10, weightKg: 70, done: false },
      { date: '2026-10-21', exerciseId: 2, reps: 10, weightKg: 90, done: true },
    ]
    expect(bestE1rm(sets, 1, '2026-11-01')).toBe(76)
    expect(bestE1rm(sets, 3, '2026-11-01')).toBeUndefined()
  })
})

describe('when a check is due (plan §4)', () => {
  it('starts with the booked baseline, then every interval after the last check, on a Saturday', () => {
    expect(nextDue('2026-10-31', undefined, 4, '2026-10-25')).toBe('2026-10-31')
    expect(nextDue(undefined, undefined, 4, '2026-10-25')).toBe('2026-10-31')
    expect(nextDue('2026-10-31', '2026-10-30', 4, '2026-10-25')).toBe('2026-11-28')
    expect(nextDue(undefined, '2026-10-30', 6, '2026-10-25')).toBe('2026-12-12')
    expect(saturdayOf('2026-11-02')).toBe('2026-11-07')
  })

  it('is open 3 days either side of the due day', () => {
    expect(checkWindow('2026-10-31', '2026-10-27')).toMatchObject({ open: false })
    expect(checkWindow('2026-10-31', '2026-10-28')).toEqual({
      due: '2026-10-31',
      opens: '2026-10-28',
      closes: '2026-11-03',
      open: true,
      moved: false,
    })
    expect(checkWindow('2026-10-31', '2026-11-03').open).toBe(true)
  })

  it('moves to the next weekend once a window is missed, with no penalty', () => {
    expect(checkWindow('2026-10-31', '2026-11-04')).toMatchObject({
      due: '2026-11-07',
      open: true,
      moved: true,
    })
    expect(checkWindow('2026-10-31', '2026-11-20')).toMatchObject({ due: '2026-11-21' })
  })
})

describe('results and rewards', () => {
  it('compares each measure with the last check', () => {
    expect(trend(30, 25)).toBe('up')
    expect(trend(20, 25)).toBe('down')
    expect(trend(25, 25)).toBe('same')
    expect(trend(25, undefined)).toBe('new')
    expect(trend(undefined, 25)).toBeUndefined()
  })

  it('gives 50 VIT and 10 STR per improved endurance test, up to 30', () => {
    const before = { pushups: 20, plankSec: 60, squats60s: 30 }
    expect(checkRewards({ pushups: 25, plankSec: 60, squats60s: 28 }, before)).toEqual({
      vit: 50,
      str: 10,
      xp: 60,
    })
    expect(checkRewards({ pushups: 21, plankSec: 61, squats60s: 31 }, before).str).toBe(30)
    expect(checkRewards({ pushups: 21 }, undefined)).toEqual({ vit: 50, str: 0, xp: 50 })
    expect(improvedTests({ pushups: 25 }, { pushups: 20, plankSec: 60 })).toEqual(['pushups'])
  })
})

describe('target review', () => {
  it('nudges the protein threshold halfway toward the target', () => {
    expect(nudgeThreshold(90, 124)).toBe(105) // 107 → 105
    expect(nudgeThreshold(120, 124)).toBe(124) // +5 at least, capped at the target
    expect(nudgeThreshold(124, 124)).toBe(124)
    expect(nudgeThreshold(null, 124)).toBeNull()
  })

  const week = (weekStart: string, averageKg: number) => ({ weekStart, averageKg, count: 3 })

  it('suggests cutting when the average hasn’t dropped over 2 weeks', () => {
    const weeks = [week('2026-10-05', 70), week('2026-10-12', 70.2), week('2026-10-19', 70.1)]
    expect(suggestCalories(weeks, 'lose', '2026-09-01')).toEqual({ kind: 'cut', kcal: 175 })
  })

  it('suggests adding back when losing more than 1% a week, after the first 2 weeks', () => {
    const weeks = [week('2026-10-12', 70), week('2026-10-19', 69.2)]
    expect(suggestCalories(weeks, 'lose', '2026-09-01')).toEqual({ kind: 'add', kcal: 175 })
    // In the first 2 weeks the loss is mostly water.
    expect(suggestCalories(weeks, 'lose', '2026-10-10')).toEqual({ kind: 'none' })
  })

  it('suggests nothing when on track, or for other goals', () => {
    const onTrack = [week('2026-10-05', 70), week('2026-10-12', 69.7), week('2026-10-19', 69.4)]
    expect(suggestCalories(onTrack, 'lose', '2026-09-01')).toEqual({ kind: 'none' })
    expect(suggestCalories(onTrack, 'maintain', '2026-09-01')).toEqual({ kind: 'none' })
    expect(suggestCalories(onTrack.slice(0, 1), 'lose', '2026-09-01')).toEqual({ kind: 'none' })
  })

  it('spots a reached goal weight or waist', () => {
    expect(goalReached('lose', { goalWeightKg: 64 }, { weightKg: 63.9 })).toBe(true)
    expect(goalReached('lose', { goalWaistCm: 80 }, { weightKg: 66, waistCm: 80 })).toBe(true)
    expect(goalReached('lose', { goalWeightKg: 64 }, { weightKg: 65 })).toBe(false)
    expect(goalReached('gain', { goalWeightKg: 70 }, { weightKg: 70.5 })).toBe(true)
    expect(goalReached('maintain', { goalWeightKg: 70 }, { weightKg: 70 })).toBe(false)
  })
})

describe('waist every 2 weeks (plan §7)', () => {
  it('credits a measurement when the last credited one is at least 13 days old', () => {
    expect(
      creditedWaistDates(['2026-10-01', '2026-10-05', '2026-10-14', '2026-10-20', '2026-10-27']),
    ).toEqual(['2026-10-01', '2026-10-14', '2026-10-27'])
    expect(creditedWaistDates([])).toEqual([])
  })
})
