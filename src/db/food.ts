/**
 * The menu and the meal log (plan §3). Each log action is one `meals` row, so
 * Undo removes exactly what was added. Logged items keep their own values, so
 * editing the menu later never rewrites past days.
 */
import type { LocalDate } from '../domain/date'
import {
  CATEGORY_ORDER,
  changePortion,
  mealItem,
  slotForFood,
  sumItems,
  type MealItem,
  type MealSlot,
} from '../domain/food'
import { db } from './db'
import type { Food, Meal } from './types'

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
