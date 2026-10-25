/**
 * The menu and the meal log (plan §3). Each log action is one `meals` row, so
 * Undo removes exactly what was added. Logged items keep their own values, so
 * editing the menu later never rewrites past days.
 */
import type { LocalDate } from '../domain/date'
import {
  CATEGORY_ORDER,
  CUSTOM_FOOD_ID,
  changePortion,
  comboItems,
  mealItem,
  slotForFood,
  sumItems,
  type MealItem,
  type MealSlot,
} from '../domain/food'
import { db } from './db'
import type { Combo, Food, Meal } from './types'

function byMenuOrder(a: Food, b: Food): number {
  return (
    CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category) ||
    a.name.localeCompare(b.name)
  )
}

/** Every menu item, active ones first in menu order, then archived ones. */
export async function allFoods(): Promise<Food[]> {
  const foods = await db.foods.toArray()
  return foods.sort(
    (a, b) => Number(Boolean(a.archived)) - Number(Boolean(b.archived)) || byMenuOrder(a, b),
  )
}

/** The menu shown for logging: archived items are hidden. */
export async function activeMenu(): Promise<Food[]> {
  return (await allFoods()).filter((food) => !food.archived)
}

/** Adds or updates a menu item; returns its id. */
export async function saveFood(food: Food): Promise<number> {
  const clean: Food = { ...food, name: food.name.trim(), serving: food.serving.trim() }
  if (clean.id !== undefined) {
    await db.foods.put(clean)
    return clean.id
  }
  const id = await db.foods.add(clean)
  if (id === undefined) throw new Error('The food was not saved')
  return id
}

/** Hides an item from the menu (or brings it back). Logged meals keep their copy. */
export async function setFoodArchived(id: number, archived: boolean): Promise<void> {
  await db.foods.update(id, { archived })
}

export async function mealsOn(date: LocalDate): Promise<Meal[]> {
  return db.meals.where('date').equals(date).sortBy('at')
}

export interface LogFoodInput {
  date: LocalDate
  at: number
  slot: MealSlot
  food: Food
  portion: number
}

/** Logs one tap; returns the new meal row's id for Undo. */
export async function logFood({ date, at, slot, food, portion }: LogFoodInput): Promise<number> {
  if (food.id === undefined) throw new Error('Only saved menu items can be logged')
  const items = [mealItem({ ...food, id: food.id }, portion)]
  const id = await db.meals.add({
    date,
    at,
    slot: slotForFood(food, slot),
    items,
    ...sumItems(items),
    source: 'tap',
  })
  if (id === undefined) throw new Error('The meal was not saved')
  return id
}

export async function getMeal(id: number): Promise<Meal | undefined> {
  return db.meals.get(id)
}

/** Puts a deleted meal back exactly as it was (Undo). */
export async function restoreMeal(meal: Meal): Promise<void> {
  await db.meals.put(meal)
}

export async function deleteMeal(id: number): Promise<void> {
  await db.meals.delete(id)
}

/** Changes one logged item's portion, re-pricing it from its own snapshot. */
export async function changeItemPortion(
  mealId: number,
  itemIndex: number,
  portion: number,
): Promise<void> {
  await db.transaction('rw', db.meals, async () => {
    const meal = await db.meals.get(mealId)
    const item = meal?.items[itemIndex]
    if (!meal || !item) return
    const items = meal.items.map((it, i) => (i === itemIndex ? changePortion(it, portion) : it))
    await db.meals.update(mealId, { items, ...sumItems(items) })
  })
}

/**
 * Removes one item from a meal (the whole meal if it was the last item).
 * Returns the meal as it was, for Undo.
 */
export async function removeItem(mealId: number, itemIndex: number): Promise<Meal | undefined> {
  return db.transaction('rw', db.meals, async () => {
    const meal = await db.meals.get(mealId)
    if (!meal || !meal.items[itemIndex]) return undefined
    const items: MealItem[] = meal.items.filter((_, i) => i !== itemIndex)
    if (items.length === 0) await db.meals.delete(mealId)
    else await db.meals.update(mealId, { items, ...sumItems(items) })
    return meal
  })
}

/** Moves a meal to another slot (drinks stay drinks). */
export async function moveMeal(mealId: number, slot: MealSlot): Promise<void> {
  await db.meals.update(mealId, { slot })
}

/** Logs a one-off entry (outside food with estimated values); returns its id for Undo. */
export async function logCustom(input: {
  date: LocalDate
  at: number
  slot: MealSlot
  item: MealItem
}): Promise<number> {
  const items = [input.item]
  const id = await db.meals.add({
    date: input.date,
    at: input.at,
    slot: input.slot,
    items,
    ...sumItems(items),
    source: 'custom',
  })
  if (id === undefined) throw new Error('The meal was not saved')
  return id
}

// ---------------------------------------------------------------- combos

export async function allCombos(): Promise<Combo[]> {
  const combos = await db.combos.toArray()
  return combos.sort((a, b) => a.name.localeCompare(b.name))
}

/** Saves the menu items of a meal as a combo (custom entries can't be part of one). */
export async function saveCombo(name: string, items: readonly MealItem[]): Promise<number> {
  const id = await db.combos.add({
    name: name.trim(),
    items: items
      .filter((item) => item.foodId !== CUSTOM_FOOD_ID)
      .map(({ foodId, portion }) => ({ foodId, portion })),
  })
  if (id === undefined) throw new Error('The combo was not saved')
  return id
}

export async function deleteCombo(id: number): Promise<Combo | undefined> {
  const combo = await db.combos.get(id)
  await db.combos.delete(id)
  return combo
}

export async function restoreCombo(combo: Combo): Promise<void> {
  await db.combos.put(combo)
}

/** Logs a whole combo as one meal, priced from today's menu; returns its id for Undo. */
export async function logCombo(input: {
  date: LocalDate
  at: number
  slot: MealSlot
  combo: Combo
}): Promise<number | undefined> {
  const items = comboItems(input.combo, await db.foods.toArray())
  if (items.length === 0) return undefined
  const id = await db.meals.add({
    date: input.date,
    at: input.at,
    slot: input.slot,
    items,
    ...sumItems(items),
    source: 'combo',
  })
  if (id === undefined) throw new Error('The meal was not saved')
  return id
}

// ---------------------------------------------------------------- drinks

/** Every drink ever logged, for picking the +1 drink. */
export async function drinkLogs(): Promise<Meal[]> {
  return db.meals.where('slot').equals('drink').toArray()
}
