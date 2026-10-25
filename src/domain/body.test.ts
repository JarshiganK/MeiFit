import { describe, expect, it } from 'vitest'
import {
  roundWeight,
  validateWeight,
  weekAverageFor,
  weeklyAverages,
  weeklyChange,
  weighInsInWeek,
} from './body'

const weighIns = [
  { date: '2026-10-12', weightKg: 70 }, // Monday
  { date: '2026-10-14', weightKg: 69.6 },
  { date: '2026-10-18', weightKg: 69.8 }, // Sunday, same week
  { date: '2026-10-19', weightKg: 69.4 }, // next Monday
  { date: '2026-10-22', weightKg: 69 },
  { date: '2026-10-05', weightKg: 70.5 }, // an earlier week, out of order
]

describe('weekly averages (Monday–Sunday)', () => {
  it('averages each week, oldest first', () => {
    expect(weeklyAverages(weighIns)).toEqual([
      { weekStart: '2026-10-05', averageKg: 70.5, count: 1 },
      { weekStart: '2026-10-12', averageKg: 69.8, count: 3 },
      { weekStart: '2026-10-19', averageKg: 69.2, count: 2 },
    ])
  })

  it('finds the week of a date', () => {
    expect(weekAverageFor('2026-10-25', weighIns)).toMatchObject({ averageKg: 69.2 })
    expect(weekAverageFor('2026-10-26', weighIns)).toBeUndefined()
  })

  it('counts weigh-ins in a week', () => {
    expect(weighInsInWeek('2026-10-15', weighIns)).toBe(3)
    expect(weighInsInWeek('2026-10-26', weighIns)).toBe(0)
  })

  it('compares the last two weeks with weigh-ins', () => {
    expect(weeklyChange(weeklyAverages(weighIns))).toEqual({ kg: -0.6, percent: -0.86 })
    expect(weeklyChange(weeklyAverages(weighIns.slice(0, 1)))).toBeUndefined()
  })
})

describe('weight entry', () => {
  it('accepts sensible weights only', () => {
    expect(validateWeight(69.4)).toBeNull()
    expect(validateWeight(undefined)).toBe('required')
    expect(validateWeight(24.9)).toBe('outOfRange')
    expect(validateWeight(301)).toBe('outOfRange')
    expect(validateWeight(Number.NaN)).toBe('outOfRange')
  })

  it('keeps 0.1 kg', () => {
    expect(roundWeight(69.44)).toBe(69.4)
    expect(roundWeight(69.45)).toBe(69.5)
  })
})
