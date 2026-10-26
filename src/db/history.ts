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
      db.examPeriods,
      db.exercises,
    ],
    async () => {
      const profile = await db.profile.get('me')
      if (!profile) return undefined
      const since = profile.setupDate
      const body = await db.bodyLogs.toArray()
      return {
        profile,
        targets: await db.targetHistory.toArray(),
        days: await db.days.toArray(),
        meals: await db.meals.where('date').aboveOrEqual(since).toArray(),
        sleeps: await db.sleepLogs.where('wakeDate').aboveOrEqual(since).toArray(),
        study: await db.studySessions.where('date').aboveOrEqual(since).toArray(),
        // Every set: personal records compare against days before setup too.
        sets: await db.workoutSets.toArray(),
        plan: await db.workoutPlans.where('kind').equals('normal').first(),
        weighIns: body.filter((b) => b.weightKg !== undefined),
        exports: await db.exportLogs.toArray(),
        waists: body.filter((b) => b.waistCm !== undefined),
        checks: await db.fitnessChecks.toArray(),
        examPeriods: await db.examPeriods.toArray(),
        examPlan: await db.workoutPlans.where('kind').equals('exam').first(),
        exercises: await db.exercises.toArray(),
      }
    },
  )
}
