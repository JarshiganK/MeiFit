import { describe, expect, it } from 'vitest'
import { db } from './db'
import { daysInWeek, getDay, setFlexDay } from './days'

describe('day rules', () => {
  it('turns a flex day on and off without touching planned rest', async () => {
    await db.days.put({ date: '2026-10-25', isFlexDay: false, isPlannedRest: true })
    await setFlexDay('2026-10-25', true)
    expect(await getDay('2026-10-25')).toEqual({
      date: '2026-10-25',
      isFlexDay: true,
      isPlannedRest: true,
    })
    await setFlexDay('2026-10-25', false)
    expect((await getDay('2026-10-25'))?.isFlexDay).toBe(false)
  })

  it('creates the day if it has no row yet', async () => {
    await setFlexDay('2026-10-22', true)
    expect(await getDay('2026-10-22')).toEqual({
      date: '2026-10-22',
      isFlexDay: true,
      isPlannedRest: false,
    })
  })

  it('lists the rows in the same Monday–Sunday week', async () => {
    await setFlexDay('2026-10-18', true) // Sunday before
    await setFlexDay('2026-10-19', true) // Monday
    await setFlexDay('2026-10-25', true) // Sunday
    await setFlexDay('2026-10-26', true) // next Monday
    expect((await daysInWeek('2026-10-22')).map((d) => d.date)).toEqual([
      '2026-10-19',
      '2026-10-25',
    ])
  })
})
