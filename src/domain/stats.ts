/**
 * Stats and ranks (plan §7). STR, VIT and INT each level up on the same
 * curve as the overall level, but on XP scaled so a typical week moves each
 * by about the same amount: study can earn 150 INT a day against 50 STR and
 * 70 VIT, so one shared scale would leave INT far ahead.
 */
import { levelFor, type LevelProgress } from './levels'
import type { XpBreakdown } from './quests'

export type StatName = 'str' | 'vit' | 'int'

/**
 * A typical good week's XP for each stat, used to scale the stats to each
 * other. Tune these after 2 weeks of real data (plan §7).
 * STR: 3 workouts (150) + 4 rest days (40); VIT: about 60 a day; INT: about 2 blocks a day.
 */
export const TYPICAL_WEEK_XP: Readonly<Record<StatName, number>> = { str: 190, vit: 420, int: 420 }

/** VIT is the reference: a stat's XP counts this many times toward its level. */
export const STAT_SCALE: Readonly<Record<StatName, number>> = {
  str: TYPICAL_WEEK_XP.vit / TYPICAL_WEEK_XP.str,
  vit: 1,
  int: TYPICAL_WEEK_XP.vit / TYPICAL_WEEK_XP.int,
}

export function statLevels(xp: XpBreakdown): Record<StatName, LevelProgress & { xp: number }> {
  const level = (stat: StatName) => ({
    ...levelFor(Math.floor(xp[stat] * STAT_SCALE[stat])),
    xp: xp[stat],
  })
  return { str: level('str'), vit: level('vit'), int: level('int') }
}

export type Rank = 'E' | 'D' | 'C' | 'B' | 'A' | 'S'

/** Ranks by overall level (plan §7): E 1–9, D 10–19, C 20–34, B 35–49, A 50–69, S 70+. */
export function rankFor(level: number): Rank {
  if (level >= 70) return 'S'
  if (level >= 50) return 'A'
  if (level >= 35) return 'B'
  if (level >= 20) return 'C'
  if (level >= 10) return 'D'
  return 'E'
}

/** The level the next rank starts at, or undefined at S. */
export function nextRankLevel(level: number): number | undefined {
  return [10, 20, 35, 50, 70].find((start) => start > level)
}
