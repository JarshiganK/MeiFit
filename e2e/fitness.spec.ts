import { expect, test, type Page } from '@playwright/test'
import {
  expectNoSeriousA11yIssues,
  idbAll,
  idbPut,
  seedProfile,
  useTheme,
  type ThemeName,
} from './helpers'

const NOW = new Date('2026-10-31T08:00:00+05:30') // Saturday

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(NOW)
  await seedProfile(page)
  await idbPut(page, 'settings', { key: 'baselineCheckDue', value: '2026-10-31' })
  await idbPut(page, 'targetHistory', {
    id: 1,
    startsOn: '2026-10-25',
    kcal: 2400,
    kcalFloor: 1600,
    proteinG: 120,
    proteinQuestThresholdG: null,
    reason: 'setup',
  })
  await idbPut(page, 'bodyLogs', {
    id: 1,
    date: '2026-10-30',
    at: NOW.getTime() - 86_400_000,
    weightKg: 70,
  })
})

const next = (page: Page) => page.getByRole('button', { name: 'Next', exact: true }).click()

for (const theme of ['dark', 'light'] as ThemeName[]) {
  test(`a fitness check from the Status banner, with axe on every step (${theme})`, async ({
    page,
  }) => {
    test.setTimeout(120_000)
    await useTheme(page, theme)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')
    const banner = page.getByRole('region', { name: 'Fitness check due' })
    await expect(banner).toBeVisible()
    await expectNoSeriousA11yIssues(page)
    await banner.getByRole('link', { name: 'Start the check' }).click()

    for (const title of ['Your fitness check', 'Body', 'Strength', 'Endurance', 'Recovery']) {
      await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible()
      if (title === 'Body') await page.getByLabel('Waist (cm)').fill('84')
      if (title === 'Endurance') await page.getByLabel('Push-ups').fill('20')
      await expectNoSeriousA11yIssues(page)
      await next(page)
    }
    await expect(page.getByRole('heading', { level: 1, name: 'Your review' })).toBeVisible()
    await expectNoSeriousA11yIssues(page)
    await page.getByRole('button', { name: 'Save the check' }).click()

    await expect(page.getByRole('heading', { level: 1, name: 'Progress' })).toBeVisible()
    await expect(page.getByText('Fitness check saved. +50 XP')).toBeVisible()
    const checks = (await idbAll(page, 'fitnessChecks')) as { waistCm: number; pushups: number }[]
    expect(checks).toMatchObject([{ waistCm: 84, pushups: 20 }])
    await page.goto('/')
    await expect(page.getByRole('region', { name: 'Fitness check due' })).toBeHidden()
  })
}
