/**
 * Levels (plan §7): going from level n to n + 1 takes 100 + 25 × n XP.
 * Level 10 needs 2,025 XP in total; level 70 needs 67,275.
 */

/** XP to go from `level` to `level + 1`. */
export function xpToNext(level: number): number {
  return 100 + 25 * level
}

/** Total XP needed to reach `level` (level 1 needs 0). */
export function totalXpForLevel(level: number): number {
  const n = Math.max(0, Math.floor(level) - 1)
  return 100 * n + (25 * n * (n + 1)) / 2
}

export interface LevelProgress {
  level: number
  /** XP earned since reaching this level. */
  intoLevel: number
  /** XP this level needs in total to reach the next. */
  needed: number
  /** 0–1 through the current level. */
  ratio: number
}

export function levelFor(totalXp: number): LevelProgress {
  const xp = Math.max(0, Math.floor(totalXp))
  let level = 1
  while (totalXpForLevel(level + 1) <= xp) level++
  const intoLevel = xp - totalXpForLevel(level)
  const needed = xpToNext(level)
  return { level, intoLevel, needed, ratio: intoLevel / needed }
}
