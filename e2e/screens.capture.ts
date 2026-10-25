import { expect, test } from '@playwright/test'
import { SCREENS, useTheme, type ThemeName } from './helpers'

const OUT = 'test-results/screens'
const THEMES: ThemeName[] = ['dark', 'light']

for (const theme of THEMES) {
  test(`capture screens (${theme})`, async ({ page }) => {
    await useTheme(page, theme)
    await page.emulateMedia({ reducedMotion: 'reduce' })

    for (const { path, heading } of SCREENS) {
      await page.goto(path)
      await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible()
      const name = path === '/' ? 'status' : path.slice(1)
      await page.screenshot({ path: `${OUT}/${name}-${theme}.png` })
    }

    await page.goto('/dev/ui')
    await expect(page.getByRole('heading', { name: 'Design tokens' })).toBeVisible()
    await page.screenshot({ path: `${OUT}/dev-ui-${theme}.png`, fullPage: true })

    await page.getByRole('button', { name: 'Open sheet' }).click()
    await expect(page.getByRole('dialog', { name: 'Pick a portion' })).toBeVisible()
    await page.screenshot({ path: `${OUT}/sheet-${theme}.png` })
    await page.keyboard.press('Escape')

    await page.getByRole('button', { name: 'Show toast' }).click()
    await expect(page.getByText('Meal deleted')).toBeVisible()
    await page.waitForFunction(() =>
      document.getAnimations().every((a) => a.playState !== 'running'),
    )
    await page.waitForTimeout(100)
    await page.screenshot({ path: `${OUT}/toast-${theme}.png` })
  })
}
