import type { Page } from '@playwright/test'

export const SCREENS = [
  { path: '/', heading: 'Status' },
  { path: '/food', heading: 'Food' },
  { path: '/train', heading: 'Train' },
  { path: '/study', heading: 'Study' },
  { path: '/progress', heading: 'Progress' },
  { path: '/settings', heading: 'Settings' },
  { path: '/settings/privacy', heading: 'Privacy' },
  { path: '/settings/delete', heading: 'Delete all data' },
] as const

export type ThemeName = 'dark' | 'light'

/** Sets the saved theme before any app code runs. */
export async function useTheme(page: Page, theme: ThemeName): Promise<void> {
  await page.addInitScript((value) => localStorage.setItem('dq.theme', value), theme)
}

/** Records Content-Security-Policy violations so tests can assert there are none. */
export async function recordCspViolations(page: Page): Promise<() => Promise<string[]>> {
  await page.addInitScript(() => {
    const w = window as unknown as { __cspViolations: string[] }
    w.__cspViolations = []
    document.addEventListener('securitypolicyviolation', (event) => {
      w.__cspViolations.push(`${event.violatedDirective} ${event.blockedURI}`)
    })
  })
  return () =>
    page.evaluate(() => (window as unknown as { __cspViolations: string[] }).__cspViolations)
}

/** Waits until a service worker controls the page (one reload after first install). */
export async function waitForServiceWorker(page: Page): Promise<void> {
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
  })
  const controlled = await page.evaluate(() => Boolean(navigator.serviceWorker.controller))
  if (!controlled) await page.reload()
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller))
}
