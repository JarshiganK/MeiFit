import { expect, test } from '@playwright/test'
import { expectNoSeriousA11yIssues, idbAll, seedProfile, useTheme, type ThemeName } from './helpers'

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-26T09:00:00+05:30'))
  await seedProfile(page)
})

for (const theme of ['dark', 'light'] as ThemeName[]) {
  test(`add an exam and see exam mode scheduled; axe passes (${theme})`, async ({ page }) => {
    await useTheme(page, theme)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/study')
    const card = page.getByRole('region', { name: 'Exams and deadlines' })
    await card.getByRole('button', { name: 'Add exam or deadline' }).click()
    const sheet = page.getByRole('dialog', { name: 'Add to the calendar' })
    await sheet.getByLabel('Title').fill('Maths paper')
    await sheet.getByLabel('Date').fill('2026-11-05')
    await expectNoSeriousA11yIssues(page)
    await sheet.getByRole('button', { name: 'Save' }).click()

    // 5 Nov minus 14 days is 22 Oct, so exam mode is already on.
    await expect(card.getByText('Exam mode is on until Fri 6 Nov.')).toBeVisible()
    await page.getByRole('button', { name: 'Dismiss' }).click()
    await expectNoSeriousA11yIssues(page)
    const periods = (await idbAll(page, 'examPeriods')) as { startsOn: string }[]
    expect(periods.map((p) => p.startsOn)).toEqual(['2026-10-22'])

    await page
      .getByRole('navigation', { name: 'Main' })
      .getByRole('link', { name: 'Status' })
      .click()
    await expect(page.getByText('Study blocks (×1.5)')).toBeVisible()
  })
}
