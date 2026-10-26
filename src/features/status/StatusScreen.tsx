import { useLiveQuery } from 'dexie-react-hooks'
import { ScreenFallback } from '../../app/ScreenFallback'
import { ScreenHeader } from '../../app/ScreenHeader'
import { nowMs, useToday } from '../../app/useToday'
import { en } from '../../copy/en'
import { daysInWeek, getDay } from '../../db/days'
import { allFoods, deleteMeal, drinkLogs, logFood } from '../../db/food'
import { loadQuestHistory } from '../../db/history'
import { getProfile } from '../../db/profile'
import type { Food } from '../../db/types'
import { ageOn } from '../../domain/date'
import { levelFor } from '../../domain/levels'
import { indexHistory, questsForDay, totalXp, weeklyQuests } from '../../domain/quests'
import { streakFor } from '../../domain/streak'
import { ADULT_AGE } from '../../domain/targets'
import { Card, useToast } from '../../ui'
import { FitnessBanner } from '../fitness/FitnessBanner'
import { DrinkButtons } from '../food/DrinkButtons'
import { FlexDaySwitch } from '../food/FlexDaySwitch'
import { portionLabel } from '../food/format'
import { LevelCard } from './LevelCard'
import { QuestBoard } from './QuestBoard'
import { SleepCard } from './SleepCard'
import { StreakCard } from './StreakCard'

/** Status (plan §10): level and XP, today's quests, and the quick logs. */
export function StatusScreen() {
  const today = useToday()
  const toast = useToast()
  const data = useLiveQuery(async () => {
    const [history, profile] = await Promise.all([loadQuestHistory(), getProfile()])
    if (!history || !profile) return null
    return {
      history,
      flexPerWeek: profile.flexDaysPerWeek,
      foods: await allFoods(),
      drinks: await drinkLogs(),
      day: await getDay(today),
      week: await daysInWeek(today),
    }
  }, [today])

  if (data === undefined) return <ScreenFallback />
  if (data === null) return null

  const { history } = data
  const xp = totalXp(history, today)
  const quests = questsForDay(indexHistory(history), today)
  const weekly = weeklyQuests(history, today)
  const isMinor = ageOn(history.profile.birthDate, today) < ADULT_AGE
  const { flexPerWeek } = data

  const logDrink = async (drink: Food) => {
    const id = await logFood({ date: today, at: nowMs(), slot: 'drink', food: drink, portion: 1 })
    toast.show({
      message: en.food.added(drink.name, portionLabel(drink.unit, 1), en.food.slotSingular.drink),
      action: { label: en.common.undo, onAction: () => void deleteMeal(id) },
    })
  }

  return (
    <>
      <ScreenHeader title={en.status.title} />
      <div className="flex flex-col gap-4 pt-2">
        <FitnessBanner today={today} />
        <LevelCard progress={levelFor(xp)} totalXp={xp} />
        <StreakCard streak={streakFor(history, today)} />
        <QuestBoard
          quests={quests}
          weekly={weekly}
          sleepTargetMin={history.profile.sleepTargetMin}
        />
        <SleepCard />
        <DrinkButtons
          foods={data.foods}
          drinkLogs={data.drinks}
          hideKcal={isMinor}
          onLog={(drink) => void logDrink(drink)}
        />
        {!isMinor && flexPerWeek > 0 && (
          <Card>
            <FlexDaySwitch
              date={today}
              perWeek={flexPerWeek}
              day={data.day}
              week={data.week}
              hidden={isMinor}
            />
          </Card>
        )}
      </div>
    </>
  )
}
