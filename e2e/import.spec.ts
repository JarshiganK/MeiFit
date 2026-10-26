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
  await page.clock.setFixedTime(new Date('2026-10-25T14:00:00+05:30'))
  await seedProfile(page)
  await idbPut(page, 'foods', {
    id: 1,
    name: 'Chicken curry',
    category: 'curry',
    serving: '1 serving',
    unit: 'size',
    kcal: 200,
    proteinG: 20,
    countsAsProtein: true,
  })
})

for (const theme of ['dark', 'light'] as ThemeName[]) {
  test(`import a meal, a night and steps; axe passes on the review (${theme})`, async ({
    page,
  }) => {
    await useTheme(page, theme)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')
    await page.getByRole('link', { name: 'Import from Shortcuts' }).click()
    await page
      .getByLabel('Or paste the text here')
      .fill(
        'DQ1;meal;2026-10-25T13:05;chicken curry\nDQ1;sleep;2026-10-24T23:10;2026-10-25T06:28\nDQ1;steps;2026-10-24;8234',
      )
    await page.getByRole('button', { name: 'Read' }).click()
    await expect(page.getByRole('region', { name: 'Lunch at 13:05, Sun 25 Oct' })).toBeVisible()
    await expectNoSeriousA11yIssues(page)

    await page.getByRole('button', { name: 'Save import' }).click()
    await expect(page.getByText('Imported 3 items')).toBeVisible()
    expect(await idbAll(page, 'meals')).toHaveLength(1)
    expect(await idbAll(page, 'stepsLogs')).toHaveLength(1)
    const sleeps = (await idbAll(page, 'sleepLogs')) as { minutes: number }[]
    expect(sleeps.map((s) => s.minutes)).toEqual([438])
  })
}
