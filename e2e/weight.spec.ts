import { expect, test } from '@playwright/test'
import {
  expectNoSeriousA11yIssues,
  idbAll,
  idbPut,
  seedProfile,
  useTheme,
  waitForServiceWorker,
  type ThemeName,
} from './helpers'

const DAY_MS = 86_400_000
const NOW = new Date('2026-10-25T07:30:00+05:30')

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(NOW)
  await seedProfile(page)
  // Three weeks of weigh-ins, three a week.
  let id = 1
  for (const [daysAgo, kg] of [
    [20, 70.4],
    [18, 70.1],
    [16, 70.2],
    [13, 69.9],
    [11, 69.8],
    [9, 69.6],
    [6, 69.5],
    [4, 69.2],
  ] as const) {
    const at = NOW.getTime() - daysAgo * DAY_MS
    const date = new Date(at).toLocaleDateString('en-CA', { timeZone: 'Asia/Colombo' })
    await idbPut(page, 'bodyLogs', { id: id++, date, at, weightKg: kg })
  }
})

test('a weigh-in updates the weekly average and draws the chart, even offline', async ({
  page,
  context,
}) => {
  await page.goto('/progress')
  const card = page.getByRole('region', { name: 'Weight' })
  await card.getByLabel('Today’s weight (kg)').fill('69.0')
  // The card also has a Save for waist; use the weight form's.
  await card
    .locator('form', { has: page.getByLabel('Today’s weight (kg)') })
    .getByRole('button', { name: 'Save' })
    .click()
  await expect(page.getByText('Saved 69 kg')).toBeVisible()
  await expect(card.getByText(/average from 3 weigh-ins/)).toBeVisible()
  await expect(card.locator('canvas')).toBeVisible()
  expect(await idbAll(page, 'bodyLogs')).toHaveLength(9)

  await waitForServiceWorker(page)
  await context.setOffline(true)
  await page.reload()
  await expect(page.getByRole('region', { name: 'Weight' }).locator('canvas')).toBeVisible()
  await expect(page.getByText('Today: 69 kg')).toBeVisible()
  await context.setOffline(false)
})

for (const theme of ['dark', 'light'] as ThemeName[]) {
  test(`Progress with the weight chart passes axe (${theme})`, async ({ page }) => {
    await useTheme(page, theme)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/progress')
    await expect(page.locator('canvas')).toBeVisible()
    await expectNoSeriousA11yIssues(page)
    await page.getByRole('button', { name: /^Wed 21 Oct/ }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await expectNoSeriousA11yIssues(page)
  })
}
