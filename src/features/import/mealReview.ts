import type { Food } from '../../db/types'
import {
  DEFAULT_PORTION,
  defaultSlot,
  mealItem,
  type MealItem,
  type MealSlot,
} from '../../domain/food'
import { bestMatch } from '../../domain/importFormat'

export const SKIP = 'skip'
export const REVIEW_SLOTS: MealSlot[] = ['breakfast', 'lunch', 'dinner', 'snack']

/** A meal from a photo or an import, while it's being checked (plan §11). */
export interface MealReview {
  slot: MealSlot
  /** A menu item id (as text) or SKIP, one per recognised name. */
  picks: string[]
}

/** Matches each name to the menu, with the slot from the time the photo was taken. */
export function initialReview(
  names: readonly string[],
  at: number,
  menu: readonly Food[],
): MealReview {
  return {
    slot: defaultSlot(at),
    picks: names.map((name) => {
      const match = bestMatch(name, menu)
      return match ? String(match.item.id) : SKIP
    }),
  }
}

/** The picked menu items, at one serving each. */
export function reviewedItems(review: MealReview, menu: readonly Food[]): MealItem[] {
  return review.picks.flatMap((pick) => {
    const food = menu.find((f) => String(f.id) === pick)
    return food ? [mealItem({ ...food, id: food.id! }, DEFAULT_PORTION)] : []
  })
}
