import { describe, expect, it } from 'vitest'
import { totalXpForLevel } from './levels'
import { STAT_SCALE, nextRankLevel, rankFor, statLevels, TYPICAL_WEEK_XP } from './stats'

describe('ranks (plan §7)', () => {
  it.each([
    [1, 'E'],
    [9, 'E'],
    [10, 'D'],
    [19, 'D'],
    [20, 'C'],
    [34, 'C'],
    [35, 'B'],
    [49, 'B'],
    [50, 'A'],
    [69, 'A'],
    [70, 'S'],
    [99, 'S'],
  ] as const)('level %i is rank %s', (level, rank) => {
    expect(rankFor(level)).toBe(rank)
  })

  it('reaches rank D at 2,025 XP and S at 67,275', () => {
    expect(rankFor(10)).toBe('D')
    expect(totalXpForLevel(10)).toBe(2025)
    expect(totalXpForLevel(70)).toBe(67275)
  })

  it('knows where the next rank starts', () => {
    expect(nextRankLevel(1)).toBe(10)
    expect(nextRankLevel(34)).toBe(35)
    expect(nextRankLevel(70)).toBeUndefined()
  })
})

describe('stats', () => {
  it('moves each stat about the same in a typical week', () => {
    const week = { total: 0, plain: 0, ...TYPICAL_WEEK_XP }
    const levels = statLevels(week)
    expect(levels.str.level).toBe(levels.vit.level)
    expect(levels.int.level).toBe(levels.vit.level)
    expect(STAT_SCALE.vit).toBe(1)
  })

  it('levels each stat from its own XP', () => {
    const levels = statLevels({ total: 0, plain: 0, str: 0, vit: 125, int: 50 })
    expect(levels.vit).toMatchObject({ level: 2, xp: 125 })
    expect(levels.str).toMatchObject({ level: 1, xp: 0 })
    expect(levels.int.level).toBe(1)
  })
})
