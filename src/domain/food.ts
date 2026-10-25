/**
 * Food logging rules (plan §3). Calories are estimates: logged items keep the
 * values they had when logged, and totals are shown rounded with "≈".
 */
import { minuteOfDay } from './date'

export type FoodUnit = 'cups' | 'size' | 'count'
export type FoodCategory = 'staple' | 'curry' | 'side' | 'drink' | 'snack' | 'outside' | 'plate'
export type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'drink'

/** The three main meals the daily quests look at. */
export const MAIN_MEALS = ['breakfast', 'lunch', 'dinner'] as const satisfies readonly MealSlot[]

/** Slots in the order a day is shown. */
export const SLOT_ORDER: readonly MealSlot[] = ['breakfast', 'lunch', 'dinner', 'snack', 'drink']

/** Category order on the menu and in the editor. */
export const CATEGORY_ORDER: readonly FoodCategory[] = [
  'staple',
  'curry',
  'side',
  'plate',
  'drink',
  'snack',
  'outside',
]

/** Rice is logged in cups (plan §3). */
export const CUP_PORTIONS = [0.5, 1, 1.5, 2, 2.5, 3] as const
/** Everything else is small, normal or large. */
export const SIZE_PORTIONS = { small: 0.75, normal: 1, large: 1.5 } as const
export type SizeName = keyof typeof SIZE_PORTIONS
/** Countable items: pieces, slices, cups of tea. */
export const COUNT_PORTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const

/** What logging needs to know about a menu item. */
export interface FoodValues {
  id?: number
  name: string
  unit: FoodUnit
  category: FoodCategory
  kcal: number
  proteinG: number
  countsAsProtein: boolean
}

/** A logged item keeps the values it had when logged (plan §3). */
export interface MealItem {
  foodId: number
  name: string
  /** Multiplier: cups for rice, 0.75 / 1 / 1.5 for sizes, a count for pieces. */
  portion: number
  kcal: number
  proteinG: number
  countsAsProtein: boolean
}

export function portionsFor(unit: FoodUnit): readonly number[] {
  if (unit === 'cups') return CUP_PORTIONS
  if (unit === 'size') return Object.values(SIZE_PORTIONS)
  return COUNT_PORTIONS
}

/** The portion picked when nothing else is chosen. */
export const DEFAULT_PORTION = 1

export function isValidPortion(unit: FoodUnit, portion: number): boolean {
  return portionsFor(unit).includes(portion)
}

/** The size name for a size portion, e.g. 1.5 → "large". */
export function sizeName(portion: number): SizeName | undefined {
  return (Object.keys(SIZE_PORTIONS) as SizeName[]).find((name) => SIZE_PORTIONS[name] === portion)
}

/**
 * The slot a meal goes in by the time it's eaten (approved default):
 * breakfast 04:00–10:59, lunch 11:00–15:59, snack 16:00–18:29,
 * dinner 18:30–23:59, and snack again 00:00–03:59. Always changeable.
 */
export function defaultSlot(at: number): MealSlot {
  const minute = minuteOfDay(at)
  if (minute < 4 * 60) return 'snack'
  if (minute < 11 * 60) return 'breakfast'
  if (minute < 16 * 60) return 'lunch'
  if (minute < 18 * 60 + 30) return 'snack'
  return 'dinner'
}

/** A typical time for each slot, used when logging on an earlier day. */
export const SLOT_TIME: Readonly<Record<MealSlot, { hours: number; minutes: number }>> = {
  breakfast: { hours: 8, minutes: 0 },
  lunch: { hours: 13, minutes: 0 },
  snack: { hours: 16, minutes: 30 },
  dinner: { hours: 19, minutes: 30 },
  drink: { hours: 10, minutes: 30 },
}

/** Drinks always go in the drinks slot; everything else in the chosen slot. */
export function slotForFood(food: Pick<FoodValues, 'category'>, chosen: MealSlot): MealSlot {
  return food.category === 'drink' ? 'drink' : chosen
}

const round1 = (n: number) => Math.round(n * 10) / 10

/** Snapshots a menu item at a portion. Calories are whole numbers, protein to 0.1 g. */
export function mealItem(food: FoodValues & { id: number }, portion: number): MealItem {
  return {
    foodId: food.id,
    name: food.name,
    portion,
    kcal: Math.round(food.kcal * portion),
    proteinG: round1(food.proteinG * portion),
    countsAsProtein: food.countsAsProtein,
  }
}

/** Re-prices a logged item at a new portion, from its own snapshot (not today's menu). */
export function changePortion(item: MealItem, portion: number): MealItem {
  const per = item.portion > 0 ? 1 / item.portion : 0
  return {
    ...item,
    portion,
    kcal: Math.round(item.kcal * per * portion),
    proteinG: round1(item.proteinG * per * portion),
  }
}

export function sumItems(items: readonly MealItem[]): { kcal: number; proteinG: number } {
  return {
    kcal: items.reduce((sum, item) => sum + item.kcal, 0),
    proteinG: round1(items.reduce((sum, item) => sum + item.proteinG, 0)),
  }
}

export interface LoggedMeal {
  slot: MealSlot
  items: readonly MealItem[]
}

export interface SlotTotals {
  kcal: number
  proteinG: number
  itemCount: number
  /** One logged line counts as one protein item, whatever the portion (approved default). */
  proteinItems: number
}

export interface DayTotals extends SlotTotals {
  bySlot: Record<MealSlot, SlotTotals>
}

const emptySlot = (): SlotTotals => ({ kcal: 0, proteinG: 0, itemCount: 0, proteinItems: 0 })

export function dayTotals(meals: readonly LoggedMeal[]): DayTotals {
  const bySlot = Object.fromEntries(SLOT_ORDER.map((slot) => [slot, emptySlot()])) as Record<
    MealSlot,
    SlotTotals
  >
  const total = emptySlot()
  for (const meal of meals) {
    for (const item of meal.items) {
      for (const bucket of [bySlot[meal.slot], total]) {
        bucket.kcal += item.kcal
        bucket.proteinG += item.proteinG
        bucket.itemCount += 1
        if (item.countsAsProtein) bucket.proteinItems += 1
      }
    }
  }
  for (const bucket of [...Object.values(bySlot), total]) bucket.proteinG = round1(bucket.proteinG)
  return { ...total, bySlot }
}

/** Protein to show: whole grams. */
export function displayProtein(grams: number): number {
  return Math.round(grams)
}

// ---------------------------------------------------------------- menu editor

export const FOOD_LIMITS = {
  nameMax: 40,
  servingMax: 40,
  kcalMax: 3000,
  proteinMax: 200,
} as const

export interface FoodDraft {
  name: string
  serving: string
  kcal: number | undefined
  proteinG: number | undefined
}

export type FoodField = 'name' | 'serving' | 'kcal' | 'proteinG'
export type FoodError = 'required' | 'tooLong' | 'outOfRange' | 'proteinTooHigh' | 'duplicate'

/**
 * Checks a menu item. Protein can't supply more calories than the item has
 * (4 kcal per gram), which catches swapped fields.
 */
export function validateFood(
  draft: FoodDraft,
  otherNames: readonly string[] = [],
): Partial<Record<FoodField, FoodError>> {
  const errors: Partial<Record<FoodField, FoodError>> = {}
  const name = draft.name.trim()
  if (name === '') errors.name = 'required'
  else if (name.length > FOOD_LIMITS.nameMax) errors.name = 'tooLong'
  else if (otherNames.some((other) => other.trim().toLowerCase() === name.toLowerCase())) {
    errors.name = 'duplicate'
  }
  if (draft.serving.trim().length > FOOD_LIMITS.servingMax) errors.serving = 'tooLong'

  const { kcal, proteinG } = draft
  if (kcal === undefined) errors.kcal = 'required'
  else if (!Number.isFinite(kcal) || kcal < 0 || kcal > FOOD_LIMITS.kcalMax) {
    errors.kcal = 'outOfRange'
  }
  if (proteinG === undefined) errors.proteinG = 'required'
  else if (!Number.isFinite(proteinG) || proteinG < 0 || proteinG > FOOD_LIMITS.proteinMax) {
    errors.proteinG = 'outOfRange'
  } else if (kcal !== undefined && !errors.kcal && kcal > 0 && proteinG * 4 > kcal) {
    errors.proteinG = 'proteinTooHigh'
  }
  return errors
}
