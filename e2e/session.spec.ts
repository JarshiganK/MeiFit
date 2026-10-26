import { expect, test } from '@playwright/test'
import {
  expectNoSeriousA11yIssues,
  idbAll,
  idbPut,
  seedProfile,
  useTheme,
  type ThemeName,
} from './helpers'

test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-26T18:00:00+05:30') }) // Monday
  await seedProfile(page)
  await idbPut(page, 'exercises', {
    id: 1,
    name: 'Squat',
    muscleGroup: 'Legs',
    type: 'weight-reps',
  })
  await idbPut(page, 'exercises', { id: 2, name: 'Push-ups', muscleGroup: 'Chest', type: 'reps' })
  await idbPut(page, 'workoutPlans', {
    id: 1,
    name: 'My plan',
    kind: 'normal',
    days: [
      {
        weekday: 1,
        exercises: [
          { exerciseId: 1, sets: 3, repMin: 5, repMax: 5, targetKg: 60 },
          { exerciseId: 2, sets: 2, repMin: 10, repMax: 15 },
        ],
      },
    ],
  })
  // Last Thursday's session, for pre-fill.
  await idbPut(page, 'workoutSets', {
    id: 1,
    date: '2026-10-22',
    startedAt: Date.parse('2026-10-22T18:00:00+05:30'),
    exerciseId: 1,
    setNumber: 1,
    reps: 5,
    weightKg: 62.5,
    done: true,
  })
})

test('tick sets with pre-filled values; they survive a reload', async ({ page }) => {
  await page.goto('/train')
  const squat = page.getByRole('region', { name: 'Squat' })
  await expect(squat.getByText('5 reps × 62.5 kg')).toHaveCount(3)
  for (const n of [1, 2, 3])
    await squat.getByRole('button', { name: `Set ${n} of Squat done` }).click()
  await page
    .getByRole('region', { name: 'Push-ups' })
    .getByRole('button', { name: 'Set 1 of Push-ups done' })
    .click()
  await expect(page.getByText('4 of 5 sets done')).toBeVisible()

  await page.reload()
  await expect(page.getByText('4 of 5 sets done')).toBeVisible()
  const sets = (await idbAll(page, 'workoutSets')) as { date: string; done: boolean }[]
  expect(sets.filter((s) => s.date === '2026-10-26')).toHaveLength(4)
})

for (const theme of ['dark', 'light'] as ThemeName[]) {
  test(`a session in progress and the set sheet pass axe (${theme})`, async ({ page }) => {
    await useTheme(page, theme)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/train')
    const squat = page.getByRole('region', { name: 'Squat' })
    await squat.getByRole('button', { name: 'Set 1 of Squat done' }).click()
    await expect(page.getByRole('region', { name: 'Rest' }).getByRole('timer')).toHaveText(
      'Rest 01:30',
    )
    await page.getByRole('status').getByRole('button', { name: 'Dismiss' }).click()
    await expectNoSeriousA11yIssues(page)
    await squat.getByRole('button', { name: /^Change set 2 of Squat/ }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await expectNoSeriousA11yIssues(page)
  })
}
