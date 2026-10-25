import { expect, test } from '@playwright/test'
import { CONTENT_SECURITY_POLICY } from '../config/headers'
import { SCREENS, recordCspViolations, seedProfile } from './helpers'

// Screens sit behind first-launch setup, so every test starts with a profile.
test.beforeEach(async ({ page }) => {
  await seedProfile(page)
})

test('the preview build sends the production security headers', async ({ request }) => {
  const page = await request.get('/')
  expect(page.headers()['content-security-policy']).toBe(CONTENT_SECURITY_POLICY)
  expect(page.headers()['x-content-type-options']).toBe('nosniff')
  expect(page.headers()['permissions-policy']).toContain('camera=(self)')

  const sw = await request.get('/sw.js')
  expect(sw.headers()['cache-control']).toBe('no-cache')
  const manifest = await request.get('/manifest.webmanifest')
  expect(manifest.headers()['cache-control']).toBe('no-cache')
})

test('no screen breaks the Content-Security-Policy', async ({ page }) => {
  const violations = await recordCspViolations(page)
  for (const { path, heading } of SCREENS) {
    await page.goto(path)
    await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible()
    expect(await violations()).toEqual([])
  }
})

test('the debug console loads on demand under the CSP and turns off again', async ({ page }) => {
  const violations = await recordCspViolations(page)
  await page.goto('/settings')
  const toggle = page.getByRole('switch', { name: 'Debug console' })

  await toggle.click()
  await expect(page.locator('#eruda')).toBeAttached()
  // Eruda tries eval during start-up and falls back when the CSP blocks it.
  // Blocked eval is intended (no 'unsafe-eval'); anything else is a real violation.
  expect((await violations()).filter((v) => v !== 'script-src eval')).toEqual([])

  // It still works: it opens and shows console output.
  await page.reload()
  await expect(page.locator('#eruda')).toBeAttached()
  await page.evaluate(() => console.log('dq-eruda-probe'))
  await page.locator('.eruda-entry-btn').click()
  await expect(page.getByText('dq-eruda-probe')).toBeVisible()

  // A reload closes Eruda's full-screen panel so the switch is reachable again.
  await page.reload()
  await expect(page.locator('#eruda')).toBeAttached()

  await page.getByRole('switch', { name: 'Debug console' }).click()
  await expect(page.locator('#eruda')).not.toBeAttached()
})
