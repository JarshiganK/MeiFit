import { expect, test } from '@playwright/test'
import { SCREENS, idbPut, seedProfile } from './helpers'

// CLAUDE.md §7: usable from 360 to 1024 px wide with no horizontal scroll.
for (const width of [360, 1024]) {
  test(`no screen scrolls sideways at ${width} px`, async ({ page }) => {
    test.setTimeout(90_000)
    await page.setViewportSize({ width, height: 800 })
    await seedProfile(page)
    // Some data, so long names and full cards are on screen.
    await idbPut(page, 'foods', {
      id: 1,
      name: 'Nescafe with milk (1 tsp sugar)',
      category: 'drink',
      serving: '1 cup',
      unit: 'count',
      kcal: 100,
      proteinG: 3,
      countsAsProtein: false,
    })
    await idbPut(page, 'exercises', {
      id: 1,
      name: 'Overhead press',
      muscleGroup: 'Shoulders',
      type: 'weight-reps',
    })
    await idbPut(page, 'workoutPlans', {
      id: 1,
      name: 'My plan',
      kind: 'normal',
      days: [1, 2, 3, 4, 5, 6, 7].map((weekday) => ({
        weekday,
        exercises: [{ exerciseId: 1, sets: 5, repMin: 8, repMax: 12, targetKg: 102.5 }],
      })),
    })
    for (const { path, heading } of SCREENS) {
      await page.goto(path)
      await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible()
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      )
      expect(overflow, `${path} scrolls sideways`).toBeLessThanOrEqual(0)
    }
  })
}
