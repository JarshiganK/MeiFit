/**
 * Day rules saved with their date (plan §9): flex day and planned rest. A
 * past day is always judged by the rules it had.
 */
import { weekDates, type LocalDate } from '../domain/date'
import { dayRule } from '../domain/workout'
import { planOn } from './workout'
import { db } from './db'
import type { DayRecord } from './types'

export function getDay(date: LocalDate): Promise<DayRecord | undefined> {
  return db.days.get(date)
}

/** The saved rows for the Monday–Sunday week of `date`. */
export async function daysInWeek(date: LocalDate): Promise<DayRecord[]> {
  const week = weekDates(date)
  return db.days.where('date').between(week[0]!, week.at(-1)!, true, true).toArray()
}

/** Turns the flex day on or off, keeping the day's planned-rest flag (or taking it from the plan). */
export async function setFlexDay(date: LocalDate, isFlexDay: boolean): Promise<void> {
  await db.transaction('rw', db.days, db.workoutPlans, db.examPeriods, async () => {
    const day = await db.days.get(date)
    if (day) {
      await db.days.put({ ...day, isFlexDay })
      return
    }
    await db.days.put({ date, isFlexDay, ...dayRule(await planOn(date), date) })
  })
}
