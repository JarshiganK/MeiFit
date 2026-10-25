import { expect, test } from '@playwright/test'
import { expectNoSeriousA11yIssues, idbAll, seedProfile, useTheme, type ThemeName } from './helpers'

test.beforeEach(async ({ page }) => {
  await seedProfile(page)
})

test('a focus block keeps time across a reload and completes at its end', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-25T20:00:00+05:30') })
  await page.goto('/study')
  const card = page.getByRole('region', { name: 'Focus timer' })
  await card.getByRole('button', { name: 'Start focus' }).click()
  await expect(card.getByRole('timer')).toHaveText('50:00')

  await page.clock.fastForward('10:00')
  await page.reload()
  await expect(page.getByRole('timer')).toHaveText(/^(40:00|39:5\d)$/)

  // Away from the app past the end time: the block completes at its scheduled end.
  await page.clock.fastForward('45:00')
  await expect(page.getByText('Block complete. Nice focus.')).toBeVisible()
  await expect(page.getByRole('region', { name: 'Today' }).getByText('1 of 5 blocks')).toBeVisible()
  const sessions = (await idbAll(page, 'studySessions')) as {
    minutes: number
    completed: boolean
  }[]
  expect(sessions).toMatchObject([{ minutes: 50, completed: true }])
})

for (const theme of ['dark', 'light'] as ThemeName[]) {
  test(`Study, idle and running, passes axe (${theme})`, async ({ page }) => {
    await useTheme(page, theme)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/study')
    await expect(page.getByRole('button', { name: 'Start focus' })).toBeVisible()
    await expectNoSeriousA11yIssues(page)
    await page.getByRole('button', { name: 'Start focus' }).click()
    await expect(page.getByRole('timer')).toBeVisible()
    await expectNoSeriousA11yIssues(page)
  })
}
