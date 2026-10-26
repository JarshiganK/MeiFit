import { describe, expect, it } from 'vitest'
import { moodOn, recentMoods, setMood } from './mood'

describe('mood check-in', () => {
  it('keeps one check-in a day, updating either part', async () => {
    await setMood('2026-10-26', { energy: 4 })
    expect(await moodOn('2026-10-26')).toMatchObject({ energy: 4, mood: 3 })
    await setMood('2026-10-26', { mood: 5 })
    expect(await moodOn('2026-10-26')).toMatchObject({ energy: 4, mood: 5 })
    await setMood('2026-10-20', { mood: 2 })
    expect((await recentMoods('2026-10-21')).map((m) => m.date)).toEqual(['2026-10-26'])
  })
})
