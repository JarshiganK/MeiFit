import { describe, expect, it } from 'vitest'
import {
  calibrationStatus,
  hasAllMainMeals,
  proposeThreshold,
  roundTo5,
  thresholdRange,
  type DayProtein,
} from './calibration'
import { addDays } from './date'
import type { LoggedMeal } from './food'

const meal = (slot: LoggedMeal['slot'], proteinG: number): LoggedMeal => ({
  slot,
  items: [{ foodId: 1, name: 'Food', portion: 1, kcal: 100, proteinG, countsAsProtein: true }],
})

/** A day with breakfast, lunch and dinner adding up to `protein`. */
function fullDay(date: string, protein: number): DayProtein {
  return {
    date,
    meals: [
      meal('breakfast', protein / 4),
      meal('lunch', protein / 2),
      meal('dinner', protein / 4),
    ],
  }
}

function partialDay(date: string, protein: number): DayProtein {
  return { date, meals: [meal('lunch', protein)] }
}

const SETUP = '2026-10-01'
const dates = Array.from({ length: 14 }, (_, i) => addDays(SETUP, i))

describe('calibrationStatus', () => {
  it('covers days 1–14 from the setup date', () => {
    expect(calibrationStatus(SETUP, SETUP)).toMatchObject({ calibrating: true, day: 1 })
    expect(calibrationStatus(SETUP, '2026-10-14')).toMatchObject({ calibrating: true, day: 14 })
    expect(calibrationStatus(SETUP, '2026-10-15')).toEqual({
      calibrating: false,
      day: null,
      proposalFrom: '2026-10-15',
    })
  })

  it('is not calibrating before setup', () => {
    expect(calibrationStatus(SETUP, '2026-09-30').calibrating).toBe(false)
  })
})

describe('hasAllMainMeals', () => {
  it('needs breakfast, lunch and dinner; snacks and drinks don’t count', () => {
    expect(hasAllMainMeals(fullDay(SETUP, 80).meals)).toBe(true)
    expect(hasAllMainMeals([meal('breakfast', 10), meal('lunch', 10), meal('snack', 10)])).toBe(
      false,
    )
    expect(
      hasAllMainMeals([meal('breakfast', 10), meal('lunch', 10), { slot: 'dinner', items: [] }]),
    ).toBe(false)
  })
})

describe('proposeThreshold (day 15)', () => {
  const weightKg = 69
  const targetG = 124

  it('uses the full-day average + 10 g, rounded to the nearest 5 g', () => {
    // Full days average 82 g → 92 → 90.
    const days = dates.map((date, i) =>
      i < 7 ? fullDay(date, i % 2 ? 80 : 84) : partialDay(date, 5),
    )
    const proposal = proposeThreshold(days, weightKg, targetG)
    expect(proposal.fullDays).toBe(7)
    expect(proposal.averageG).toBeCloseTo(82.3, 1)
    expect(proposal.thresholdG).toBe(90)
    expect(proposal.fallback).toBe(false)
  })

  it('ignores days without all three main meals (owner change 2)', () => {
    const full = dates.slice(0, 5).map((date) => fullDay(date, 100))
    const partial = dates.slice(5).map((date) => partialDay(date, 10))
    expect(proposeThreshold([...full, ...partial], weightKg, targetG).thresholdG).toBe(110)
  })

  it('falls back to 1.2 g/kg with fewer than 5 full days', () => {
    const days = dates.map((date, i) => (i < 4 ? fullDay(date, 120) : partialDay(date, 50)))
    const proposal = proposeThreshold(days, weightKg, targetG)
    expect(proposal).toMatchObject({ fallback: true, fullDays: 4, averageG: null })
    expect(proposal.thresholdG).toBe(83) // ⌈1.2 × 69⌉
  })

  it('never goes below 1.2 g/kg or above the target', () => {
    const low = dates.map((date) => fullDay(date, 40))
    expect(proposeThreshold(low, weightKg, targetG).thresholdG).toBe(83)
    const high = dates.map((date) => fullDay(date, 140))
    expect(proposeThreshold(high, weightKg, targetG).thresholdG).toBe(124)
  })

  it('keeps the range valid when 1.2 g/kg is above the target', () => {
    expect(thresholdRange(120, 130)).toEqual({ minG: 130, maxG: 130 })
  })

  it('rounds to the nearest 5 g', () => {
    expect(roundTo5(92)).toBe(90)
    expect(roundTo5(92.5)).toBe(95)
    expect(roundTo5(97.4)).toBe(95)
  })
})
