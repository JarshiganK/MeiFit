import { describe, expect, it } from 'vitest'
import { canMakeFlexDay, flexBudget, flexDaysInWeek, FLEX_TOLERANCE_KCAL } from './flex'
import type { LoggedMeal, MealItem } from './food'

const item = (kcal: number): MealItem => ({
  foodId: 1,
  name: 'Food',
  portion: 1,
  kcal,
  proteinG: 0,
  countsAsProtein: false,
})
const meal = (slot: LoggedMeal['slot'], ...kcal: number[]): LoggedMeal => ({
  slot,
  items: kcal.map(item),
})

describe('flexBudget (plan §3)', () => {
  it('gives dinner the target minus everything else logged that day', () => {
    const result = flexBudget(2000, [
      meal('breakfast', 300),
      meal('lunch', 400, 100),
      meal('snack', 150),
      meal('drink', 50),
    ])
    expect(result).toEqual({
      budget: 1000,
      dinnerKcal: 0,
      remaining: 1000,
      dinnerLogged: false,
      withinBudget: false,
    })
  })

  it('counts down as dinner is logged', () => {
    const result = flexBudget(2000, [meal('lunch', 800), meal('dinner', 700), meal('dinner', 200)])
    expect(result).toMatchObject({ budget: 1200, dinnerKcal: 900, remaining: 300 })
    expect(result.withinBudget).toBe(true)
  })

  it(`allows dinner up to ${FLEX_TOLERANCE_KCAL} kcal over, and not more`, () => {
    expect(flexBudget(2000, [meal('lunch', 1000), meal('dinner', 1050)]).withinBudget).toBe(true)
    const over = flexBudget(2000, [meal('lunch', 1000), meal('dinner', 1051)])
    expect(over.withinBudget).toBe(false)
    expect(over.remaining).toBe(-51)
  })

  it('never shows a negative budget when breakfast and lunch already used it up', () => {
    expect(flexBudget(1500, [meal('lunch', 1800)]).budget).toBe(0)
  })

  it('needs a dinner item, not an empty dinner row', () => {
    expect(flexBudget(2000, [meal('dinner')]).dinnerLogged).toBe(false)
  })
})

describe('flex days per week (Monday–Sunday)', () => {
  const days = [
    { date: '2026-10-19', isFlexDay: true }, // Monday
    { date: '2026-10-25', isFlexDay: true }, // Sunday, same week
    { date: '2026-10-26', isFlexDay: true }, // Monday, next week
    { date: '2026-10-21', isFlexDay: false },
  ]

  it('lists the flex days in the same week', () => {
    expect(flexDaysInWeek('2026-10-22', days)).toEqual(['2026-10-19', '2026-10-25'])
    expect(flexDaysInWeek('2026-10-27', days)).toEqual(['2026-10-26'])
  })

  it('allows another flex day only while the week has one to spare', () => {
    expect(canMakeFlexDay('2026-10-22', 2, days)).toBe(false)
    expect(canMakeFlexDay('2026-10-22', 3, days)).toBe(true)
    expect(canMakeFlexDay('2026-10-28', 1, days)).toBe(false)
    expect(canMakeFlexDay('2026-10-28', 0, [])).toBe(false)
  })

  it('does not count the day itself, so it can be switched off and on again', () => {
    expect(canMakeFlexDay('2026-10-25', 2, days)).toBe(true)
  })
})
