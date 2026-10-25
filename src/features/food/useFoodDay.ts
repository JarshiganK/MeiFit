import { useLiveQuery } from 'dexie-react-hooks'
import { daysInWeek, getDay } from '../../db/days'
import { allCombos, allFoods, drinkLogs, mealsOn } from '../../db/food'
import { currentTarget, getProfile, latestWeighIn, mealsBetween } from '../../db/profile'
import type { Combo, DayRecord, Food, Meal, Profile, TargetHistory } from '../../db/types'
import {
  CALIBRATION_DAYS,
  calibrationStatus,
  proposeThreshold,
  type CalibrationStatus,
  type ThresholdProposal,
} from '../../domain/calibration'
import { addDays, ageOn, datesInRange, type LocalDate } from '../../domain/date'
import { ADULT_AGE } from '../../domain/targets'

export interface FoodDay {
  profile: Profile | undefined
  target: TargetHistory | undefined
  /** Under-18s see protein only, never calorie numbers (owner answer B). */
  isMinor: boolean
  meals: Meal[]
  /** Every menu item, archived ones included, so old logs can still be edited. */
  foods: Food[]
  day: DayRecord | undefined
  /** Saved day rows in the same Monday–Sunday week. */
  week: DayRecord[]
  combos: Combo[]
  drinkLogs: Meal[]
  calibration: CalibrationStatus | null
  /** The day-15 protein quest proposal, while no threshold is set yet (today only). */
  proposal: ThresholdProposal | null
}

export function useFoodDay(date: LocalDate, today: LocalDate): FoodDay | undefined {
  return useLiveQuery(async () => {
    const profile = await getProfile()
    const target = await currentTarget(date)
    const calibration = profile ? calibrationStatus(profile.setupDate, date) : null

    let proposal: ThresholdProposal | null = null
    if (
      profile &&
      target &&
      calibration &&
      date === today &&
      !calibration.calibrating &&
      date >= calibration.proposalFrom &&
      target.proteinQuestThresholdG === null
    ) {
      const weightKg = (await latestWeighIn())?.weightKg
      if (weightKg !== undefined) {
        const last = addDays(profile.setupDate, CALIBRATION_DAYS - 1)
        const meals = await mealsBetween(profile.setupDate, last)
        const days = datesInRange(profile.setupDate, last).map((d) => ({
          date: d,
          meals: meals.filter((meal) => meal.date === d),
        }))
        proposal = proposeThreshold(days, weightKg, target.proteinG)
      }
    }

    return {
      profile,
      target,
      isMinor: profile ? ageOn(profile.birthDate, date) < ADULT_AGE : false,
      meals: await mealsOn(date),
      foods: await allFoods(),
      day: await getDay(date),
      week: await daysInWeek(date),
      combos: await allCombos(),
      drinkLogs: await drinkLogs(),
      calibration,
      proposal,
    }
  }, [date, today])
}
