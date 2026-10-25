import { expect, test, type Page } from '@playwright/test'
import { expectNoSeriousA11yIssues, idbAll, useTheme, type ThemeName } from './helpers'

const next = (page: Page) => page.getByRole('button', { name: 'Next', exact: true }).click()

async function heading(page: Page, name: string) {
  await expect(page.getByRole('heading', { level: 1, name })).toBeVisible()
}

for (const theme of ['dark', 'light'] as ThemeName[]) {
  test(`first-launch setup works end to end and passes axe on every step (${theme})`, async ({
    page,
  }) => {
    // Ten axe scans in one flow take longer than the default 30 s on WebKit.
    test.setTimeout(120_000)
    await useTheme(page, theme)
    await page.emulateMedia({ reducedMotion: 'reduce' })

    // A new phone opens straight into setup.
    await page.goto('/')
    await expect(page).toHaveURL(/\/setup$/)

    for (const title of [
      'Your day is a quest board',
      'Earn XP and level up',
      'Estimates, not exact counts',
    ]) {
      await heading(page, title)
      await expectNoSeriousA11yIssues(page)
      await next(page)
    }

    // 1. Install check (Playwright runs in a browser tab, not from the Home Screen).
    await heading(page, 'Add Daily Quest to your Home Screen')
    await expectNoSeriousA11yIssues(page)
    await page.getByRole('button', { name: 'Continue in the browser' }).click()

    // 2. About you.
    await heading(page, 'About you')
    await page.getByLabel('Nickname').fill('Sam')
    await page.getByText('Male', { exact: true }).click()
    await page.getByLabel('Date of birth').fill('2001-01-15')
    await page.getByLabel('Height (cm)').fill('169')
    await page.getByLabel('Current weight (kg)').fill('69')
    await page.getByText('Moderate', { exact: true }).click()
    await expectNoSeriousA11yIssues(page)
    await next(page)

    // 3. Goal.
    await heading(page, 'Your goal')
    await page.getByText('Lose fat', { exact: true }).click()
    await expectNoSeriousA11yIssues(page)
    await next(page)

    // 4. Routine.
    await heading(page, 'Your routine')
    await expectNoSeriousA11yIssues(page)
    await next(page)

    // 5. Food.
    await heading(page, 'Your menu')
    await expectNoSeriousA11yIssues(page)
    await next(page)

    // 6. Exams (optional).
    await heading(page, 'Exams')
    await expectNoSeriousA11yIssues(page)
    await next(page)

    // 7. Review.
    await heading(page, 'Your targets')
    await expect(page.getByText(/^≈[\d,]+ kcal$/)).toBeVisible()
    await expect(page.getByText(/^\d+ g$/)).toBeVisible()
    await expectNoSeriousA11yIssues(page)
    await page.getByRole('button', { name: 'Start my quests' }).click()

    await heading(page, 'Status')
    await expect(page.getByText('Welcome, Sam. Your quests are ready.')).toBeVisible()

    // Saved, and still there after a reload.
    await page.reload()
    await heading(page, 'Status')
    const [profile] = (await idbAll(page, 'profile')) as { nickname: string }[]
    expect(profile?.nickname).toBe('Sam')
    expect(await idbAll(page, 'foods')).toHaveLength(24)
    expect(await idbAll(page, 'targetHistory')).toHaveLength(1)
  })
}

test('under-13s are stopped kindly at "About you"', async ({ page }) => {
  await page.goto('/setup')
  await page.getByRole('button', { name: 'Skip intro' }).click()
  await page.getByRole('button', { name: 'Continue in the browser' }).click()
  await page.getByLabel('Date of birth').fill('2016-05-01')
  await next(page)
  await expect(page.getByRole('alert')).toContainText('made for ages 13 and up')
  await heading(page, 'About you')
})
