/**
 * All XP: quests, records, fitness checks and weekly quests
 * (`xpBreakdown`), plus 100 for each weekly boss won (plan §7).
 */
import type { LocalDate } from './date'
import { xpBreakdown, type QuestHistory, type XpBreakdown } from './quests'
import { BOSS_XP, bossHistory } from './weekly'

export function xpTotals(history: QuestHistory, today: LocalDate): XpBreakdown {
  const xp = xpBreakdown(history, today)
  const boss = bossHistory(history, today).filter((r) => r.won).length * BOSS_XP
  return { ...xp, plain: xp.plain + boss, total: xp.total + boss }
}
