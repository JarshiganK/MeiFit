import { expect, test } from '@playwright/test'
import { waitForServiceWorker, seedProfile } from './helpers'

// Screens sit behind first-launch setup, so every test starts with a profile.
test.beforeEach(async ({ page }) => {
  await seedProfile(page)
})

test('reloads and navigates offline once the service worker is installed', async ({
  page,
  context,
}) => {
  await page.goto('/')
  await waitForServiceWorker(page)

  await context.setOffline(true)
  await page.reload()
  await expect(page.getByRole('heading', { level: 1, name: 'Status' })).toBeVisible()
  await expect(page.getByText(/You’re offline/)).toBeVisible()

  // In-app navigation and a cold deep link both work from the cache.
  await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Food' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Food' })).toBeVisible()
  await page.goto('/train')
  await expect(page.getByRole('heading', { level: 1, name: 'Train' })).toBeVisible()

  await context.setOffline(false)
})

test('serves the web app manifest with install details', async ({ request }) => {
  const response = await request.get('/manifest.webmanifest')
  expect(response.ok()).toBe(true)
  const manifest = (await response.json()) as {
    name: string
    display: string
    icons: { purpose?: string }[]
  }
  expect(manifest.name).toBe('Daily Quest')
  expect(manifest.display).toBe('standalone')
  expect(manifest.icons.some((icon) => icon.purpose === 'maskable')).toBe(true)
})
