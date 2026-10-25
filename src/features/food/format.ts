import { en } from '../../copy/en'
import { formatCups, formatNumber } from '../../copy/format'
import { sizeName, type FoodUnit } from '../../domain/food'
import { roundKcal } from '../../domain/targets'

/** "≈300" (rounded to 10, plan §3). */
export function approxKcal(kcal: number): string {
  return formatNumber(roundKcal(kcal))
}

/** How much was eaten, e.g. "1½ cups", "Large" or "× 2". */
export function portionLabel(unit: FoodUnit | undefined, portion: number): string {
  if (unit === 'cups') return en.food.cups(formatCups(portion))
  if (unit === 'size') {
    const size = sizeName(portion)
    if (size) return en.food.sizes[size]
  }
  return en.food.count(portion)
}
