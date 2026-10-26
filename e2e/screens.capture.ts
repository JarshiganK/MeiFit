import { expect, test, type Page } from '@playwright/test'
import { SCREENS, useTheme, type ThemeName } from './helpers'

const OUT = 'test-results/screens'
const THEMES: ThemeName[] = ['dark', 'light']

async function shot(page: Page, name: string, fullPage = false) {
  // Let database reads (live queries, storage status) settle before capturing.
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(400)
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage })
}

const next = (page: Page) => page.getByRole('button', { name: 'Next', exact: true }).click()

for (const theme of THEMES) {
  test(`capture screens (${theme})`, async ({ page }) => {
    test.setTimeout(180_000)
    await useTheme(page, theme)
    await page.emulateMedia({ reducedMotion: 'reduce' })

    // First-launch setup, step by step.
    await page.goto('/setup')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await shot(page, `setup-intro-${theme}`)
    await page.getByRole('button', { name: 'Skip intro' }).click()
    await shot(page, `setup-install-${theme}`)
    await page.getByRole('button', { name: /^Continue/ }).click()
    await next(page) // empty "About you" shows its errors
    await shot(page, `setup-about-errors-${theme}`)
    await page.getByLabel('Nickname').fill('Sam')
    await page.getByText('Male', { exact: true }).click()
    await page.getByLabel('Date of birth').fill('2001-01-15')
    await page.getByLabel('Height (cm)').fill('169')
    await page.getByLabel('Current weight (kg)').fill('69')
    await page.getByText('Moderate', { exact: true }).click()
    await shot(page, `setup-about-${theme}`, true)
    await next(page)
    await page.getByText('Lose fat', { exact: true }).click()
    await shot(page, `setup-goal-${theme}`)
    await next(page)
    await shot(page, `setup-routine-${theme}`, true)
    await next(page)
    await shot(page, `setup-food-${theme}`)
    await next(page)
    await shot(page, `setup-exams-${theme}`)
    await next(page)
    await shot(page, `setup-review-${theme}`, true)
    await page.getByRole('button', { name: 'Start my quests' }).click()
    await expect(page.getByRole('heading', { level: 1, name: 'Status' })).toBeVisible()

    for (const { path, heading } of SCREENS) {
      await page.goto(path)
      await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible()
      await shot(page, `${path === '/' ? 'status' : path.slice(1).replaceAll('/', '-')}-${theme}`)
    }

    // Food with a few meals logged, and the portion sheet.
    await page.goto('/food')
    await page.getByText('Lunch', { exact: true }).click()
    for (const [tile, portion] of [
      [/^Rice\s?≈/, /^2 cups\s?≈/],
      [/^Chicken curry\s?≈/, /^Normal\s?≈/],
      [/^Varai or other vegetables\s?≈/, /^Large\s?≈/],
    ] as const) {
      await page.getByRole('button', { name: tile }).click()
      await page.getByRole('dialog').getByRole('button', { name: portion }).click()
    }
    await page.getByRole('button', { name: 'Dismiss' }).click()
    await shot(page, `food-logged-${theme}`, true)
    await page.getByRole('button', { name: /^Rice\s?≈/ }).click()
    await shot(page, `food-portion-sheet-${theme}`)
    await page.keyboard.press('Escape')
    await page.goto('/settings/menu')
    await page.getByRole('button', { name: /^Edit\s?Chicken curry/ }).click()
    await shot(page, `menu-edit-sheet-${theme}`)

    // Progress with a few earlier weigh-ins plus today's.
    await page.evaluate(async () => {
      const db = await new Promise<IDBDatabase>((resolve) => {
        const open = indexedDB.open('daily-quest')
        open.onsuccess = () => resolve(open.result)
      })
      const tx = db.transaction('bodyLogs', 'readwrite')
      const store = tx.objectStore('bodyLogs')
      const day = 86_400_000
      ;[70.6, 70.3, 70.4, 70.1, 69.9, 70, 69.7, 69.6, 69.4].forEach((kg, i) => {
        const at = Date.now() - (24 - i * 2.5) * day
        const date = new Date(at).toLocaleDateString('en-CA')
        store.put({ id: 100 + i, date, at, weightKg: kg })
      })
      await new Promise((resolve) => (tx.oncomplete = resolve))
      db.close()
    })
    await page.goto('/progress')
    await page.getByLabel('Today’s weight (kg)').fill('69.2')
    await page
      .locator('form', { has: page.getByLabel('Today’s weight (kg)') })
      .getByRole('button', { name: 'Save' })
      .click()
    await page.getByRole('button', { name: 'Dismiss' }).click()
    await shot(page, `progress-weight-${theme}`, true)

    // A fitness check up to its review.
    await page.goto('/fitness-check')
    await shot(page, `fitness-intro-${theme}`)
    await next(page)
    await page.getByLabel('Waist (cm)').fill('84')
    await shot(page, `fitness-body-${theme}`)
    await next(page)
    await next(page)
    await page.getByLabel('Push-ups').fill('22')
    await page.getByLabel('Plank (seconds)').fill('70')
    await next(page)
    await next(page)
    await shot(page, `fitness-review-${theme}`, true)

    // A plan with two training days, then Train.
    await page.goto('/train/plan')
    const days = page.getByRole('region', { name: 'Training days' })
    for (const day of ['Mon', 'Thu']) await days.getByRole('button', { name: day }).click()
    const monday = page.getByRole('region', { name: 'Monday' })
    for (const name of [/^Squat/, /^Push-ups/, /^Plank/]) {
      await monday.getByRole('button', { name: 'Add exercise' }).click()
      await page.getByRole('dialog').getByRole('button', { name }).click()
    }
    await page.getByRole('button', { name: 'Dismiss' }).click()
    await shot(page, `train-plan-built-${theme}`, true)
    await page.goto('/train')
    await shot(page, `train-with-plan-${theme}`, true)

    await page.goto('/dev/ui')
    await expect(page.getByRole('heading', { name: 'Design tokens' })).toBeVisible()
    await shot(page, `dev-ui-${theme}`, true)

    await page.getByRole('button', { name: 'Open sheet' }).click()
    await expect(page.getByRole('dialog', { name: 'Pick a portion' })).toBeVisible()
    await shot(page, `sheet-${theme}`)
    await page.keyboard.press('Escape')

    await page.getByRole('button', { name: 'Show toast' }).click()
    await expect(page.getByText('Meal deleted')).toBeVisible()
    await shot(page, `toast-${theme}`)
  })
}
