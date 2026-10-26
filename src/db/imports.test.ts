import { describe, expect, it } from 'vitest'
import { atLocalTime } from '../domain/date'
import { mealItem } from '../domain/food'
import { db } from './db'
import { importMeal, importSleep, importSteps, recentSteps } from './imports'

describe('imports (plan §11)', () => {
  it('replaces the sleep on the same wake-up date', async () => {
    await db.sleepLogs.add({
      wakeDate: '2026-10-25',
      bedAt: 0,
      wakeAt: 1,
      minutes: 300,
      source: 'tap',
    })
    await importSleep({
      bedAt: atLocalTime('2026-10-24', 23, 10),
      wakeAt: atLocalTime('2026-10-25', 6, 28),
    })
    expect(await db.sleepLogs.toArray()).toMatchObject([
      { wakeDate: '2026-10-25', minutes: 438, source: 'import' },
    ])
  })

  it('replaces the steps on the same date', async () => {
    await importSteps('2026-10-24', 8000)
    await importSteps('2026-10-24', 8234)
    await importSteps('2026-10-25', 500)
    expect(await recentSteps('2026-10-24')).toMatchObject([
      { date: '2026-10-24', steps: 8234, source: 'import' },
      { date: '2026-10-25', steps: 500 },
    ])
  })

  it('saves a reviewed meal as an import', async () => {
    const item = mealItem(
      {
        id: 1,
        name: 'Rice',
        unit: 'cups',
        category: 'staple',
        kcal: 200,
        proteinG: 4,
        countsAsProtein: false,
      },
      1,
    )
    const id = await importMeal({
      date: '2026-10-25',
      at: atLocalTime('2026-10-25', 13, 5),
      slot: 'lunch',
      items: [item],
    })
    expect(await db.meals.get(id)).toMatchObject({ source: 'import', kcal: 200, proteinG: 4 })
  })
})
