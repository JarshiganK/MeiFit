import { describe, expect, it } from 'vitest'
import { atLocalTime, toLocalDate } from './date'
import {
  CUP_PORTIONS,
  changePortion,
  dayTotals,
  defaultSlot,
  displayProtein,
  isValidPortion,
  mealItem,
  portionsFor,
  sizeName,
  slotForFood,
  sumItems,
  validateFood,
  type FoodValues,
} from './food'

const rice: FoodValues & { id: number } = {
  id: 1,
  name: 'Rice',
  unit: 'cups',
  category: 'staple',
  kcal: 200,
  proteinG: 4,
  countsAsProtein: false,
}
const chicken: FoodValues & { id: number } = {
  id: 2,
  name: 'Chicken curry',
  unit: 'size',
  category: 'curry',
  kcal: 200,
  proteinG: 20,
  countsAsProtein: true,
}
const stringHopper: FoodValues & { id: number } = {
  id: 3,
  name: 'String hoppers',
  unit: 'count',
  category: 'staple',
  kcal: 35,
  proteinG: 0.7,
  countsAsProtein: false,
}
const tea: FoodValues & { id: number } = {
  id: 4,
  name: 'Plain tea',
  unit: 'count',
  category: 'drink',
  kcal: 20,
  proteinG: 0,
  countsAsProtein: false,
}

describe('portions (plan §3)', () => {
  it('logs rice in cups from ½ to 3', () => {
    expect(portionsFor('cups')).toEqual([0.5, 1, 1.5, 2, 2.5, 3])
  })

  it('logs other items as small, normal or large (0.75×, 1×, 1.5×)', () => {
    expect(portionsFor('size')).toEqual([0.75, 1, 1.5])
    expect(sizeName(0.75)).toBe('small')
    expect(sizeName(1)).toBe('normal')
    expect(sizeName(1.5)).toBe('large')
    expect(sizeName(2)).toBeUndefined()
  })

  it('logs counted items from 1 to 10', () => {
    expect(portionsFor('count')).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
  })

  it('accepts only portions offered for the unit', () => {
    expect(isValidPortion('cups', 1.5)).toBe(true)
    expect(isValidPortion('cups', 0.75)).toBe(false)
    expect(isValidPortion('size', 0.75)).toBe(true)
    expect(isValidPortion('count', 11)).toBe(false)
    expect(CUP_PORTIONS).toContain(3)
  })
})

describe('defaultSlot', () => {
  const at = (h: number, m: number) => atLocalTime('2026-10-25', h, m)

  it.each([
    [0, 0, 'snack'],
    [3, 59, 'snack'],
    [4, 0, 'breakfast'],
    [10, 59, 'breakfast'],
    [11, 0, 'lunch'],
    [15, 59, 'lunch'],
    [16, 0, 'snack'],
    [18, 29, 'snack'],
    [18, 30, 'dinner'],
    [23, 59, 'dinner'],
  ] as const)('%i:%i is %s', (h, m, slot) => {
    expect(defaultSlot(at(h, m))).toBe(slot)
  })

  it('puts 23:59 and 00:00 on different days (plan §5)', () => {
    const late = atLocalTime('2026-10-25', 23, 59)
    const early = atLocalTime('2026-10-26', 0, 0)
    expect(toLocalDate(late)).toBe('2026-10-25')
    expect(toLocalDate(early)).toBe('2026-10-26')
    expect(defaultSlot(late)).toBe('dinner')
    expect(defaultSlot(early)).toBe('snack')
  })

  it('always files drinks under drinks', () => {
    expect(slotForFood(tea, 'lunch')).toBe('drink')
    expect(slotForFood(rice, 'lunch')).toBe('lunch')
  })
})

describe('mealItem', () => {
  it('snapshots the values at the portion', () => {
    expect(mealItem(rice, 1.5)).toEqual({
      foodId: 1,
      name: 'Rice',
      portion: 1.5,
      kcal: 300,
      proteinG: 6,
      countsAsProtein: false,
    })
  })

  it('rounds calories to whole numbers and protein to 0.1 g', () => {
    expect(mealItem(chicken, 0.75)).toMatchObject({ kcal: 150, proteinG: 15 })
    expect(mealItem(stringHopper, 3)).toMatchObject({ kcal: 105, proteinG: 2.1 })
    expect(mealItem({ ...stringHopper, kcal: 33 }, 0.75)).toMatchObject({ kcal: 25 })
  })

  it('changes the portion from the logged snapshot, not the current menu', () => {
    const logged = mealItem(rice, 1)
    expect(changePortion(logged, 2.5)).toMatchObject({ portion: 2.5, kcal: 500, proteinG: 10 })
    expect(changePortion({ ...logged, portion: 0 }, 1)).toMatchObject({ kcal: 0, proteinG: 0 })
  })
})

describe('dayTotals', () => {
  it('adds up calories, protein and protein items by slot', () => {
    const totals = dayTotals([
      { slot: 'breakfast', items: [mealItem(stringHopper, 5), mealItem(chicken, 1)] },
      { slot: 'lunch', items: [mealItem(rice, 2), mealItem(chicken, 1.5)] },
      { slot: 'lunch', items: [mealItem({ ...chicken, id: 9, name: 'Egg' }, 1)] },
      { slot: 'drink', items: [mealItem(tea, 2)] },
    ])
    expect(totals.kcal).toBe(175 + 200 + 400 + 300 + 200 + 40)
    expect(totals.proteinG).toBe(3.5 + 20 + 8 + 30 + 20)
    expect(totals.itemCount).toBe(6)
    expect(totals.proteinItems).toBe(3)
    expect(totals.bySlot.lunch).toEqual({ kcal: 900, proteinG: 58, itemCount: 3, proteinItems: 2 })
    expect(totals.bySlot.dinner).toEqual({ kcal: 0, proteinG: 0, itemCount: 0, proteinItems: 0 })
  })

  it('is zero for an empty day', () => {
    expect(dayTotals([])).toMatchObject({ kcal: 0, proteinG: 0, itemCount: 0, proteinItems: 0 })
  })

  it('keeps protein free of floating-point noise', () => {
    const items = [0.1, 0.2].map((g, i) => ({ ...mealItem(tea, 1), foodId: i, proteinG: g }))
    expect(dayTotals([{ slot: 'snack', items }]).proteinG).toBe(0.3)
    expect(sumItems(items)).toEqual({ kcal: 40, proteinG: 0.3 })
  })

  it('shows protein in whole grams', () => {
    expect(displayProtein(61.5)).toBe(62)
    expect(displayProtein(61.4)).toBe(61)
  })
})

describe('validateFood', () => {
  const good = { name: 'Fish curry', serving: '1 serving', kcal: 180, proteinG: 18 }

  it('accepts a sensible item', () => {
    expect(validateFood(good)).toEqual({})
  })

  it('needs a name, calories and protein', () => {
    expect(validateFood({ name: '  ', serving: '', kcal: undefined, proteinG: undefined })).toEqual(
      { name: 'required', kcal: 'required', proteinG: 'required' },
    )
  })

  it('rejects names and servings that are too long', () => {
    expect(validateFood({ ...good, name: 'x'.repeat(41), serving: 'y'.repeat(41) })).toEqual({
      name: 'tooLong',
      serving: 'tooLong',
    })
  })

  it('rejects a duplicate name, ignoring case and spaces', () => {
    expect(validateFood(good, ['Rice', ' fish CURRY '])).toEqual({ name: 'duplicate' })
  })

  it('keeps numbers in range', () => {
    expect(validateFood({ ...good, kcal: -1, proteinG: 201 })).toEqual({
      kcal: 'outOfRange',
      proteinG: 'outOfRange',
    })
    expect(validateFood({ ...good, kcal: 3001 })).toEqual({ kcal: 'outOfRange' })
    expect(validateFood({ ...good, kcal: Number.NaN })).toEqual({ kcal: 'outOfRange' })
  })

  it('catches protein worth more calories than the item has', () => {
    expect(validateFood({ ...good, kcal: 50, proteinG: 20 })).toEqual({
      proteinG: 'proteinTooHigh',
    })
    // Zero calories (hidden for under-18s) skips that check.
    expect(validateFood({ ...good, kcal: 0, proteinG: 20 })).toEqual({})
  })
})
