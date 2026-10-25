import { describe, expect, it } from 'vitest'
import { atLocalTime } from '../domain/date'
import { CUSTOM_FOOD_ID, customItem, mealItem } from '../domain/food'
import { createBackup, parseBackup, serializeBackup } from './backup'
import { db } from './db'
import {
  activeMenu,
  allCombos,
  allFoods,
  changeItemPortion,
  deleteCombo,
  deleteMeal,
  drinkLogs,
  logCombo,
  logCustom,
  restoreCombo,
  saveCombo,
  getMeal,
  logFood,
  mealsOn,
  moveMeal,
  removeItem,
  restoreMeal,
  saveFood,
  setFoodArchived,
} from './food'
import { STARTER_MENU } from './seed/starterMenu'
import type { Food } from './types'

const DAY = '2026-10-25'
const LUNCH = atLocalTime(DAY, 13, 5)

async function addFood(food: Omit<Food, 'id'>): Promise<Food> {
  const id = await saveFood({ ...food })
  return { ...food, id }
}

const rice: Omit<Food, 'id'> = {
  name: 'Rice',
  category: 'staple',
  serving: '1 cup cooked',
  unit: 'cups',
  kcal: 200,
  proteinG: 4,
  countsAsProtein: false,
}
const tea: Omit<Food, 'id'> = {
  name: 'Plain tea',
  category: 'drink',
  serving: '1 cup',
  unit: 'count',
  kcal: 20,
  proteinG: 0,
  countsAsProtein: false,
}

describe('menu', () => {
  it('lists items in menu order and hides archived ones from logging', async () => {
    await db.foods.bulkAdd(STARTER_MENU.map((food) => ({ ...food })))
    const menu = await activeMenu()
    expect(menu).toHaveLength(STARTER_MENU.length)
    expect(menu[0]?.category).toBe('staple')
    expect(menu.at(-1)?.category).toBe('outside')

    const bread = menu.find((food) => food.name === 'Bread')!
    await setFoodArchived(bread.id!, true)
    expect((await activeMenu()).map((food) => food.name)).not.toContain('Bread')
    expect((await allFoods()).at(-1)?.name).toBe('Bread')

    await setFoodArchived(bread.id!, false)
    expect((await activeMenu()).map((food) => food.name)).toContain('Bread')
  })

  it('trims names and updates an existing item in place', async () => {
    const id = await saveFood({ ...rice, name: '  Red rice  ' })
    expect((await db.foods.get(id))?.name).toBe('Red rice')
    await saveFood({ ...rice, id, kcal: 210 })
    expect(await db.foods.count()).toBe(1)
    expect((await db.foods.get(id))?.kcal).toBe(210)
  })
})

describe('logging', () => {
  it('saves a tap with the values the item had, so menu edits never rewrite it', async () => {
    const food = await addFood(rice)
    const id = await logFood({ date: DAY, at: LUNCH, slot: 'lunch', food, portion: 1.5 })
    await saveFood({ ...food, kcal: 250 })

    const [meal] = await mealsOn(DAY)
    expect(meal).toMatchObject({ id, date: DAY, at: LUNCH, slot: 'lunch', source: 'tap' })
    expect(meal?.kcal).toBe(300)
    expect(meal?.proteinG).toBe(6)
    expect(meal?.items).toEqual([
      {
        foodId: food.id,
        name: 'Rice',
        portion: 1.5,
        kcal: 300,
        proteinG: 6,
        countsAsProtein: false,
      },
    ])
  })

  it('files drinks under drinks whatever slot is chosen', async () => {
    const food = await addFood(tea)
    await logFood({ date: DAY, at: LUNCH, slot: 'lunch', food, portion: 2 })
    expect((await mealsOn(DAY))[0]?.slot).toBe('drink')
  })

  it('refuses an unsaved menu item', async () => {
    await expect(
      logFood({ date: DAY, at: LUNCH, slot: 'lunch', food: rice, portion: 1 }),
    ).rejects.toThrow()
  })

  it('lists a day in the order it was eaten and leaves other days alone', async () => {
    const food = await addFood(rice)
    await logFood({ date: DAY, at: LUNCH, slot: 'lunch', food, portion: 1 })
    await logFood({ date: DAY, at: atLocalTime(DAY, 8, 0), slot: 'breakfast', food, portion: 1 })
    await logFood({
      date: '2026-10-26',
      at: atLocalTime('2026-10-26', 0, 5),
      slot: 'snack',
      food,
      portion: 1,
    })
    expect((await mealsOn(DAY)).map((meal) => meal.slot)).toEqual(['breakfast', 'lunch'])
    expect(await mealsOn('2026-10-26')).toHaveLength(1)
  })
})

describe('editing the log', () => {
  it('changes a portion and recalculates the meal', async () => {
    const food = await addFood(rice)
    const id = await logFood({ date: DAY, at: LUNCH, slot: 'lunch', food, portion: 1 })
    await saveFood({ ...food, kcal: 999 }) // the snapshot is used, not the menu
    await changeItemPortion(id, 0, 2.5)
    expect(await getMeal(id)).toMatchObject({ kcal: 500, proteinG: 10 })
    await changeItemPortion(id, 5, 1) // no such item: nothing happens
    await changeItemPortion(999, 0, 1)
    expect((await getMeal(id))?.kcal).toBe(500)
  })

  it('removes an item, and the meal with its last item, with an undo copy', async () => {
    const food = await addFood(rice)
    const id = await logFood({ date: DAY, at: LUNCH, slot: 'lunch', food, portion: 1 })
    const meal = await getMeal(id)
    await db.meals.update(id, { items: [...meal!.items, ...meal!.items], kcal: 400, proteinG: 8 })

    const before = await removeItem(id, 1)
    expect(before?.items).toHaveLength(2)
    expect(await getMeal(id)).toMatchObject({ kcal: 200, proteinG: 4 })

    await removeItem(id, 0)
    expect(await getMeal(id)).toBeUndefined()
    expect(await removeItem(id, 0)).toBeUndefined()

    await restoreMeal(before!)
    expect(await getMeal(id)).toMatchObject({ kcal: 400 })
  })

  it('deletes and moves meals', async () => {
    const food = await addFood(rice)
    const id = await logFood({ date: DAY, at: LUNCH, slot: 'lunch', food, portion: 1 })
    await moveMeal(id, 'dinner')
    expect((await getMeal(id))?.slot).toBe('dinner')
    await deleteMeal(id)
    expect(await mealsOn(DAY)).toEqual([])
  })
})

describe('custom entries, combos and drinks', () => {
  it('logs a custom entry without a menu item, and it survives a backup check', async () => {
    const id = await logCustom({
      date: DAY,
      at: LUNCH,
      slot: 'lunch',
      item: customItem('Shop kottu', 950, 30, true),
    })
    expect(await getMeal(id)).toMatchObject({ source: 'custom', kcal: 950, proteinG: 30 })
    expect((await getMeal(id))?.items[0]?.foodId).toBe(CUSTOM_FOOD_ID)
    const text = serializeBackup(await createBackup(LUNCH))
    expect(() => parseBackup(text)).not.toThrow()
  })

  it('saves a meal as a combo and logs it in one tap at today’s menu values', async () => {
    const riceFood = await addFood(rice)
    const teaFood = await addFood(tea)
    const comboId = await saveCombo('  My lunch ', [
      mealItem({ ...riceFood, id: riceFood.id! }, 2),
      customItem('Something', 100, 1, false),
      mealItem({ ...teaFood, id: teaFood.id! }, 1),
    ])
    const [combo] = await allCombos()
    expect(combo).toMatchObject({ id: comboId, name: 'My lunch' })
    expect(combo?.items).toEqual([
      { foodId: riceFood.id, portion: 2 },
      { foodId: teaFood.id, portion: 1 },
    ])

    await saveFood({ ...riceFood, kcal: 210 })
    const mealId = await logCombo({ date: DAY, at: LUNCH, slot: 'lunch', combo: combo! })
    expect(await getMeal(mealId!)).toMatchObject({ source: 'combo', kcal: 440, slot: 'lunch' })
  })

  it('logs nothing for a combo whose foods are all gone', async () => {
    const id = await logCombo({
      date: DAY,
      at: LUNCH,
      slot: 'lunch',
      combo: { id: 1, name: 'Old', items: [{ foodId: 99, portion: 1 }] },
    })
    expect(id).toBeUndefined()
    expect(await mealsOn(DAY)).toEqual([])
  })

  it('deletes and restores combos', async () => {
    const id = await saveCombo('A', [])
    const removed = await deleteCombo(id)
    expect(await allCombos()).toEqual([])
    await restoreCombo(removed!)
    expect(await allCombos()).toHaveLength(1)
  })

  it('lists every drink logged', async () => {
    const food = await addFood(tea)
    await logFood({ date: DAY, at: LUNCH, slot: 'lunch', food, portion: 1 })
    await logFood({
      date: '2026-10-20',
      at: LUNCH - 5 * 86_400_000,
      slot: 'dinner',
      food,
      portion: 2,
    })
    expect(await drinkLogs()).toHaveLength(2)
  })
})
