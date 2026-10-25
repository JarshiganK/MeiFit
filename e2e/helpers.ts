import AxeBuilder from '@axe-core/playwright'
import { expect, type Page } from '@playwright/test'

export const SCREENS = [
  { path: '/', heading: 'Status' },
  { path: '/food', heading: 'Food' },
  { path: '/train', heading: 'Train' },
  { path: '/study', heading: 'Study' },
  { path: '/progress', heading: 'Progress' },
  { path: '/settings', heading: 'Settings' },
  { path: '/settings/profile', heading: 'Profile and targets' },
  { path: '/settings/menu', heading: 'Menu' },
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

/** Reads every row of an object store straight from IndexedDB. */
export function idbAll(page: Page, store: string): Promise<unknown[]> {
  return page.evaluate(
    (name) =>
      new Promise<unknown[]>((resolve, reject) => {
        const open = indexedDB.open('daily-quest')
        open.onerror = () => reject(open.error ?? new Error('open failed'))
        open.onsuccess = () => {
          const db = open.result
          const request = db.transaction(name, 'readonly').objectStore(name).getAll()
          request.onsuccess = () => {
            resolve(request.result)
            db.close()
          }
          request.onerror = () => reject(request.error ?? new Error('read failed'))
        }
      }),
    store,
  )
}

export function idbPut(page: Page, store: string, value: unknown): Promise<void> {
  return page.evaluate(
    ([name, row]) =>
      new Promise<void>((resolve, reject) => {
        const open = indexedDB.open('daily-quest')
        open.onerror = () => reject(open.error ?? new Error('open failed'))
        open.onsuccess = () => {
          const db = open.result
          const tx = db.transaction(name, 'readwrite')
          tx.objectStore(name).put(row)
          tx.oncomplete = () => {
            db.close()
            resolve()
          }
          tx.onerror = () => reject(tx.error ?? new Error('write failed'))
        }
      }),
    [store, value] as const,
  )
}

/** A profile written straight to IndexedDB, so tests can open screens behind the setup gate. */
export const TEST_PROFILE = {
  id: 'me',
  nickname: 'Tester',
  sex: 'other',
  birthDate: '2000-01-01',
  heightCm: 170,
  activityLevel: 'moderate',
  goal: 'maintain',
  pace: 'standard',
  workoutsPerWeek: 3,
  flexDaysPerWeek: 1,
  sleepTargetMin: 420,
  studyGoalHours: 10,
  blockMin: 50,
  setupDate: '2026-10-25',
}

/** Opens the app (which creates the database), then saves a profile so setup is skipped. */
export async function seedProfile(page: Page): Promise<void> {
  await page.goto('/setup')
  await page.getByRole('heading', { level: 1 }).waitFor()
  await idbPut(page, 'profile', TEST_PROFILE)
}

/** Fails on any serious or critical axe violation on the settled page. */
export async function expectNoSeriousA11yIssues(page: Page): Promise<void> {
  // A toast fading in is briefly translucent; scan the settled UI.
  await page.waitForFunction(() => document.getAnimations().every((a) => a.playState !== 'running'))
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'])
    .analyze()
  const blocking = results.violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => `${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(' ')).join(', ')})`)
  expect(blocking).toEqual([])
}
