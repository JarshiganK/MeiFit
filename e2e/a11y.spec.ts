import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { SCREENS, useTheme, type ThemeName } from './helpers'

const THEMES: ThemeName[] = ['dark', 'light']

for (const theme of THEMES) {
  for (const { path, heading } of SCREENS) {
    test(`${heading} (${theme}) has no serious or critical axe violations`, async ({ page }) => {
      await useTheme(page, theme)
      // Reduced motion makes fades instant, so a late toast can't be scanned mid-fade.
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.goto(path)
      await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible()
      // A toast fading in (e.g. "Ready to work offline") is briefly translucent; scan settled UI.
      await page.waitForFunction(() =>
        document.getAnimations().every((a) => a.playState !== 'running'),
      )

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'])
        .analyze()
      const blocking = results.violations
        .filter((v) => v.impact === 'serious' || v.impact === 'critical')
        .map((v) => `${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(' ')).join(', ')})`)
      expect(blocking).toEqual([])
    })
  }
}
