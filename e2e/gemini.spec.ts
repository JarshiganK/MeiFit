import { expect, test } from '@playwright/test'
import { expectNoSeriousA11yIssues, idbAll, seedProfile, useTheme, type ThemeName } from './helpers'

test.beforeEach(async ({ page }) => {
  await seedProfile(page)
})

for (const theme of ['dark', 'light'] as ThemeName[]) {
  test(`turn on Gemini photo recognition; axe passes (${theme})`, async ({ page }) => {
    await useTheme(page, theme)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/settings')
    const card = page.getByRole('region', { name: 'Photo recognition (Gemini)' })
    await card.getByRole('switch', { name: 'Use Gemini for food photos' }).click()
    await card.getByLabel('Gemini API key').fill('test-key-not-real')
    await card.getByRole('button', { name: 'Save' }).click()
    await expect(page.getByText('Key saved on this phone')).toBeVisible()
    await expectNoSeriousA11yIssues(page)

    await page.goto('/food')
    await expect(page.getByRole('button', { name: 'Photo', exact: true })).toBeVisible()
    // The key stays out of backups (checked in unit tests); here it's stored on the phone.
    const settings = (await idbAll(page, 'settings')) as { key: string }[]
    expect(settings.map((s) => s.key)).toContain('geminiKey')
  })
}
