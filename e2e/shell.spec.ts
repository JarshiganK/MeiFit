import { expect, test } from '@playwright/test'
import { SCREENS, seedProfile } from './helpers'

// Screens sit behind first-launch setup, so every test starts with a profile.
test.beforeEach(async ({ page }) => {
  await seedProfile(page)
})

test('opens on Status and moves between every tab', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1, name: 'Status' })).toBeVisible()

  const nav = page.getByRole('navigation', { name: 'Main' })
  for (const name of ['Food', 'Train', 'Study', 'Progress', 'Status']) {
    await nav.getByRole('link', { name }).click()
    await expect(page.getByRole('heading', { level: 1, name })).toBeVisible()
    await expect(nav.getByRole('link', { name })).toHaveAttribute('aria-current', 'page')
  }

  await page.getByRole('link', { name: 'Settings' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Settings' })).toBeVisible()
  await expect(page.getByText(/^Version \d+\.\d+\.\d+/)).toBeVisible()
})

test('deep links survive a reload (SPA fallback)', async ({ page }) => {
  for (const { path, heading } of SCREENS) {
    await page.goto(path)
    await page.reload()
    await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible()
  }
})

test('the theme choice is applied before render and survives a reload', async ({ page }) => {
  await page.goto('/settings')
  await page.getByText('Light', { exact: true }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  await expect(page.getByRole('radio', { name: 'Light' })).toBeChecked()
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#f6f4ef')
})

test('has no horizontal scroll and 44 px touch targets in the tab bar', async ({ page }) => {
  await page.goto('/')
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  expect(overflow).toBeLessThanOrEqual(0)

  const links = page.getByRole('navigation', { name: 'Main' }).getByRole('link')
  for (const link of await links.all()) {
    const box = await link.boundingBox()
    expect(box?.width).toBeGreaterThanOrEqual(44)
    expect(box?.height).toBeGreaterThanOrEqual(44)
  }
})

test('shows a friendly page for unknown links', async ({ page }) => {
  await page.goto('/no-such-page')
  await expect(page.getByText('This page doesn’t exist').first()).toBeVisible()
  await page.getByRole('link', { name: 'Go to Status' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Status' })).toBeVisible()
})
