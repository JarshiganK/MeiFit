import { expect, test } from '@playwright/test'
import { expectNoSeriousA11yIssues, seedProfile, useTheme, type ThemeName } from './helpers'

test.beforeEach(async ({ page }) => {
  // Monday 2 Nov: the week of 26 Oct has finished (setup was 25 Oct).
  await page.clock.setFixedTime(new Date('2026-11-02T09:00:00+05:30'))
  await seedProfile(page)
})

for (const theme of ['dark', 'light'] as ThemeName[]) {
  test(`the Monday boss banner and weekly report pass axe (${theme})`, async ({ page }) => {
    await useTheme(page, theme)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')
    const banner = page.getByRole('region', { name: 'Last week’s boss' })
    await expect(banner).toBeVisible()
    await expect(page.getByRole('region', { name: 'This week’s boss' })).toBeVisible()
    await expectNoSeriousA11yIssues(page)

    await banner.getByRole('link', { name: 'See the weekly report' }).click()
    const report = page.getByRole('region', { name: 'Weekly report' })
    await expect(report.getByText('Mon 26 Oct – Sun 1 Nov')).toBeVisible()
    await expect(report.getByRole('region', { name: 'Weekly boss' })).toBeVisible()
    await expectNoSeriousA11yIssues(page)
  })
}
