/**
 * Everything the quest board needs, read in one transaction. XP and quest
 * results are never stored (plan §9); they're worked out from this each time.
 */
import type { QuestHistory } from '../domain/quests'
import { db } from './db'

export async function loadQuestHistory(): Promise<QuestHistory | undefined> {
  return db.transaction(
    'r',
    [
      db.profile,
      db.targetHistory,
      db.days,
      db.meals,
      db.sleepLogs,
      db.studySessions,
      db.workoutSets,
      db.workoutPlans,
      db.bodyLogs,
      db.exportLogs,
      db.fitnessChecks,
    ],
    async () => {
      const profile = await db.profile.get('me')
      if (!profile) return undefined
      const [targets, days, meals, sleeps, study, sets, plan, body, exports, checks] =
        await Promise.all([
          db.targetHistory.toArray(),
          db.days.toArray(),
          db.meals.where('date').aboveOrEqual(profile.setupDate).toArray(),
          db.sleepLogs.where('wakeDate').aboveOrEqual(profile.setupDate).toArray(),
          db.studySessions.where('date').aboveOrEqual(profile.setupDate).toArray(),
          db.workoutSets.where('date').aboveOrEqual(profile.setupDate).toArray(),
          db.workoutPlans.where('kind').equals('normal').first(),
          db.bodyLogs.toArray(),
          db.exportLogs.toArray(),
          db.fitnessChecks.toArray(),
        ])
      return {
        profile,
        targets,
        days,
        meals,
        sleeps,
        study,
        sets,
        plan,
        weighIns: body.filter((b) => b.weightKg !== undefined),
        exports,
        waists: body.filter((b) => b.waistCm !== undefined),
        checks,
      }
    },
  )
}
