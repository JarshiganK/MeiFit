import { describe, expect, it } from 'vitest'
import { levelFor, totalXpForLevel, xpToNext } from './levels'

describe('levels (plan §7, §15)', () => {
  it('needs 2,025 XP for level 10 and 67,275 for level 70', () => {
    expect(totalXpForLevel(10)).toBe(2025)
    expect(totalXpForLevel(70)).toBe(67275)
  })

  it('matches the rank thresholds in the plan', () => {
    expect([1, 10, 20, 35, 50, 70].map(totalXpForLevel)).toEqual([
      0, 2025, 6650, 18275, 35525, 67275,
    ])
  })

  it('costs 100 + 25 × n to go from level n to n + 1', () => {
    expect(xpToNext(1)).toBe(125)
    expect(xpToNext(9)).toBe(325)
    expect(totalXpForLevel(2)).toBe(125)
  })

  it('works out the level and progress through it', () => {
    expect(levelFor(0)).toEqual({ level: 1, intoLevel: 0, needed: 125, ratio: 0 })
    expect(levelFor(124).level).toBe(1)
    expect(levelFor(125)).toEqual({ level: 2, intoLevel: 0, needed: 150, ratio: 0 })
    expect(levelFor(2024).level).toBe(9)
    expect(levelFor(2025).level).toBe(10)
    expect(levelFor(67275).level).toBe(70)
    expect(levelFor(200)).toMatchObject({ level: 2, intoLevel: 75, ratio: 0.5 })
  })

  it('treats negative or fractional XP safely', () => {
    expect(levelFor(-50).level).toBe(1)
    expect(levelFor(124.9).level).toBe(1)
    expect(totalXpForLevel(0)).toBe(0)
  })
})
