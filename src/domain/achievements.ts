/**
 * Achievements (plan §7), worked out from the logs like everything else.
 */
import { datesInRange, type LocalDate } from './date'
import { indexHistory, questsForDay, recordsUpTo, type QuestHistory } from './quests'
import { streakFor } from './streak'
import { blocksOn } from './study'

export type AchievementId = 'ironWeek' | 'proteinHunter' | 'scholar' | 'prBreaker' | 'checkpoint'

export const ACHIEVEMENT_GOALS: Readonly<Record<AchievementId, number>> = {
  ironWeek: 7,
  proteinHunter: 30,
  scholar: 100,
  prBreaker: 10,
  checkpoint: 3,
}

export interface Achievement {
  id: AchievementId
  progress: number
  goal: number
  unlocked: boolean
}

export function achievements(history: QuestHistory, today: LocalDate): Achievement[] {
  const index = indexHistory(history)
  const start = history.profile.setupDate
  const dates = start <= today ? datesInRange(start, today) : []
  let proteinDays = 0
  let blocks = 0
  for (const date of dates) {
    const protein = questsForDay(index, date).find((q) => q.id === 'dailyProtein')
    if (protein?.done && protein.variant === 'threshold') proteinDays++
    blocks += blocksOn(date, index.study.get(date) ?? [], history.profile.blockMin)
  }
  const progress: Record<AchievementId, number> = {
    ironWeek: streakFor(history, today).best,
    proteinHunter: proteinDays,
    scholar: blocks,
    prBreaker: recordsUpTo(history, today).length,
    checkpoint: history.checks.filter((c) => c.date <= today).length,
  }
  return (Object.keys(ACHIEVEMENT_GOALS) as AchievementId[]).map((id) => {
    const goal = ACHIEVEMENT_GOALS[id]
    return { id, goal, progress: Math.min(progress[id], goal), unlocked: progress[id] >= goal }
  })
}
