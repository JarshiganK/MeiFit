import { expect, test } from '@playwright/test'
import { expectNoSeriousA11yIssues, idbAll, seedProfile, useTheme, type ThemeName } from './helpers'

const MONDAY = new Date('2026-10-26T18:00:00+05:30')

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(MONDAY)
  await seedProfile(page)
})

test('build a plan and see today’s exercises on Train', async ({ page }) => {
  await page.goto('/train')
  await page.getByRole('link', { name: 'Build my plan' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Workout plan' })).toBeVisible()

  const days = page.getByRole('region', { name: 'Training days' })
  await days.getByRole('button', { name: 'Mon' }).click()
  const monday = page.getByRole('region', { name: 'Monday' })
  await monday.getByRole('button', { name: 'Add exercise' }).click()
  await page
    .getByRole('dialog')
    .getByRole('button', { name: /^Squat/ })
    .click()
  await expect(monday.getByText('3 × 8–12 @ 20 kg')).toBeVisible()

  await page.reload()
  await expect(page.getByRole('region', { name: 'Monday' }).getByText('Squat')).toBeVisible()
  await page.getByRole('link', { name: 'Back' }).click()
  const today = page.getByRole('region', { name: 'Today, Monday' })
  await expect(today.getByText('Squat')).toBeVisible()

  const plans = (await idbAll(page, 'workoutPlans')) as { days: { weekday: number }[] }[]
  expect(plans[0]?.days.map((d) => d.weekday)).toEqual([1])
  const dayRows = (await idbAll(page, 'days')) as { date: string; isPlannedRest: boolean }[]
  expect(dayRows.find((d) => d.date === '2026-10-26')?.isPlannedRest).toBe(false)
})

for (const theme of ['dark', 'light'] as ThemeName[]) {
  test(`plan editor and Train with a plan pass axe (${theme})`, async ({ page }) => {
    await useTheme(page, theme)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/train/plan')
    await page
      .getByRole('region', { name: 'Training days' })
      .getByRole('button', { name: 'Mon' })
      .click()
    const monday = page.getByRole('region', { name: 'Monday' })
    await monday.getByRole('button', { name: 'Add exercise' }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await expectNoSeriousA11yIssues(page)
    await page
      .getByRole('dialog')
      .getByRole('button', { name: /^Plank/ })
      .click()
    await expect(monday.getByText('3 × 30 s')).toBeVisible()
    await page.getByRole('button', { name: 'Dismiss' }).click()
    await expectNoSeriousA11yIssues(page)
    await monday.getByRole('button', { name: /Plank/ }).first().click()
    await expect(page.getByRole('dialog', { name: 'Plank' })).toBeVisible()
    await expectNoSeriousA11yIssues(page)
    await page.goto('/train')
    await expect(page.getByRole('region', { name: 'Today, Monday' })).toBeVisible()
    await expectNoSeriousA11yIssues(page)
  })
}
