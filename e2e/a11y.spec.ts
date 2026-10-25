import { expect, test } from '@playwright/test'
import {
  SCREENS,
  expectNoSeriousA11yIssues,
  seedProfile,
  useTheme,
  type ThemeName,
} from './helpers'

// Screens sit behind first-launch setup, so every test starts with a profile.
test.beforeEach(async ({ page }) => {
  await seedProfile(page)
})

const THEMES: ThemeName[] = ['dark', 'light']

for (const theme of THEMES) {
  for (const { path, heading } of SCREENS) {
    test(`${heading} (${theme}) has no serious or critical axe violations`, async ({ page }) => {
      await useTheme(page, theme)
      // Reduced motion makes fades instant, so a late toast can't be scanned mid-fade.
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.goto(path)
      await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible()
      await expectNoSeriousA11yIssues(page)
    })
  }
}
