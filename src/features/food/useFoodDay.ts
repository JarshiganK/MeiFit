import { useLiveQuery } from 'dexie-react-hooks'
import { allFoods, mealsOn } from '../../db/food'
import { currentTarget, getProfile } from '../../db/profile'
import type { Food, Meal, Profile, TargetHistory } from '../../db/types'
import { ageOn, type LocalDate } from '../../domain/date'
import { ADULT_AGE } from '../../domain/targets'

export interface FoodDay {
  profile: Profile | undefined
  target: TargetHistory | undefined
  /** Under-18s see protein only, never calorie numbers (owner answer B). */
  isMinor: boolean
  meals: Meal[]
  /** Every menu item, archived ones included, so old logs can still be edited. */
  foods: Food[]
}

export function useFoodDay(date: LocalDate): FoodDay | undefined {
  return useLiveQuery(async () => {
    const profile = await getProfile()
    return {
      profile,
      target: await currentTarget(date),
      isMinor: profile ? ageOn(profile.birthDate, date) < ADULT_AGE : false,
      meals: await mealsOn(date),
      foods: await allFoods(),
    }
  }, [date])
}
