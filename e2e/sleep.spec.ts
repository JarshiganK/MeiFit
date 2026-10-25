import { expect, test } from '@playwright/test'
import { expectNoSeriousA11yIssues, idbAll, seedProfile, useTheme, type ThemeName } from './helpers'

test.beforeEach(async ({ page }) => {
  await seedProfile(page)
})

test('going to sleep survives a reload, and waking up saves the night', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-25T23:10:00+05:30') })
  await page.goto('/')
  const card = page.getByRole('region', { name: 'Sleep' })
  await card.getByRole('button', { name: 'Going to sleep' }).click()
  await expect(card.getByText('Sleeping since 23:10')).toBeVisible()

  await page.reload()
  await expect(card.getByText('Sleeping since 23:10')).toBeVisible()

  await page.clock.setFixedTime(new Date('2026-10-26T06:28:00+05:30'))
  await page.reload()
  await card.getByRole('button', { name: 'I’m awake' }).click()
  await expect(page.getByText('Good morning. You slept 7 h 18 min.')).toBeVisible()
  await expect(card.getByText('23:10 → 06:28, woke Mon 26 Oct')).toBeVisible()

  const logs = (await idbAll(page, 'sleepLogs')) as { wakeDate: string; minutes: number }[]
  expect(logs).toMatchObject([{ wakeDate: '2026-10-26', minutes: 438 }])
})

for (const theme of ['dark', 'light'] as ThemeName[]) {
  test(`Status with a sleep and its edit sheet passes axe (${theme})`, async ({ page }) => {
    await useTheme(page, theme)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.clock.setFixedTime(new Date('2026-10-26T09:00:00+05:30'))
    await page.goto('/')
    const card = page.getByRole('region', { name: 'Sleep' })
    await card.getByRole('button', { name: 'Add a sleep' }).click()
    await page
      .getByRole('dialog', { name: 'Add a sleep' })
      .getByRole('button', { name: 'Save' })
      .click()
    await expect(card.getByRole('button', { name: 'Edit' })).toBeVisible()
    await page.getByRole('button', { name: 'Dismiss' }).click()
    await expectNoSeriousA11yIssues(page)

    await card.getByRole('button', { name: 'Edit' }).click()
    await expect(page.getByRole('dialog', { name: 'Edit sleep' })).toBeVisible()
    await expectNoSeriousA11yIssues(page)
  })
}
