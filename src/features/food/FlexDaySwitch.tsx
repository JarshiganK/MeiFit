import { en } from '../../copy/en'
import { setFlexDay } from '../../db/days'
import type { DayRecord } from '../../db/types'
import type { LocalDate } from '../../domain/date'
import { canMakeFlexDay, flexDaysInWeek } from '../../domain/flex'
import { Switch } from '../../ui'

export interface FlexDaySwitchProps {
  date: LocalDate
  perWeek: number
  day: DayRecord | undefined
  week: DayRecord[]
  /** Under-18s have no flex days (owner answer B). */
  hidden: boolean
}

/** Turns the day into a flex day, within the weekly allowance (plan §3). */
export function FlexDaySwitch({ date, perWeek, day, week, hidden }: FlexDaySwitchProps) {
  const isFlex = day?.isFlexDay ?? false
  if (hidden || (perWeek === 0 && !isFlex)) return null
  if (!isFlex && !canMakeFlexDay(date, perWeek, week)) {
    return <p className="text-sm text-muted">{en.food.flexUsedUp(perWeek)}</p>
  }
  return (
    <Switch
      label={en.food.flexDay}
      hint={en.food.flexHint(flexDaysInWeek(date, week).length, perWeek)}
      checked={isFlex}
      onChange={(on) => void setFlexDay(date, on)}
    />
  )
}
