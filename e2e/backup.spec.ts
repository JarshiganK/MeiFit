import { readFile } from 'node:fs/promises'
import { expect, test, type Page } from '@playwright/test'

/** Reads every row of an object store straight from IndexedDB. */
function idbAll(page: Page, store: string): Promise<unknown[]> {
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

function idbPut(page: Page, store: string, value: unknown): Promise<void> {
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

const WEIGH_IN = { id: 1, date: '2026-10-25', at: 1_761_360_000_000, weightKg: 69 }

test.beforeEach(async ({ page }) => {
  // Automated browsers can't drive the iOS share sheet, so use the download path.
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'canShare', { value: undefined, configurable: true })
  })
})

test('data survives a reload, and export → delete all → import restores it', async ({ page }) => {
  await page.goto('/settings')
  await expect(page.getByText('No backup yet')).toBeVisible()

  await idbPut(page, 'bodyLogs', WEIGH_IN)
  await page.reload()
  await expect(page.getByRole('heading', { level: 1, name: 'Settings' })).toBeVisible()
  expect(await idbAll(page, 'bodyLogs')).toEqual([WEIGH_IN])

  // Export
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export backup' }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toMatch(/^daily-quest-backup-\d{4}-\d{2}-\d{2}\.json$/)
  const file = await download.path()
  const backup = JSON.parse(await readFile(file, 'utf8')) as {
    app: string
    tables: { bodyLogs: unknown[] }
  }
  expect(backup.app).toBe('daily-quest')
  expect(backup.tables.bodyLogs).toEqual([WEIGH_IN])
  await expect(page.getByText('Last backup: today')).toBeVisible()

  // Delete all data
  await page.getByRole('link', { name: /^Delete all data/ }).click()
  const deleteButton = page.getByRole('button', { name: 'Delete everything' })
  await expect(deleteButton).toBeDisabled()
  await page.getByLabel('Type DELETE to confirm').fill('DELETE')
  await deleteButton.click()
  await expect(page.getByRole('heading', { level: 1, name: 'Status' })).toBeVisible()
  await expect(page.getByText('All data deleted.')).toBeVisible()
  expect(await idbAll(page, 'bodyLogs')).toEqual([])
  expect(await idbAll(page, 'exportLogs')).toEqual([])

  // Import
  await page.goto('/settings')
  await page.getByTestId('backup-file-input').setInputFiles(file)
  const sheet = page.getByRole('dialog', { name: 'Restore this backup?' })
  await expect(sheet.getByText('1 weigh-ins')).toBeVisible()
  await sheet.getByRole('button', { name: 'Replace my data' }).click()
  await expect(page.getByText('Backup restored.')).toBeVisible()
  expect(await idbAll(page, 'bodyLogs')).toEqual([WEIGH_IN])
  expect(await idbAll(page, 'exportLogs')).toHaveLength(1)
})

test('a damaged backup is rejected and nothing changes', async ({ page }) => {
  await page.goto('/settings')
  await expect(page.getByText('No backup yet')).toBeVisible()
  await idbPut(page, 'bodyLogs', WEIGH_IN)

  await page.getByTestId('backup-file-input').setInputFiles({
    name: 'daily-quest-backup.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"app":"daily-quest","schemaVersion":1,"tables":{"meals":"oops"}}'),
  })
  await expect(page.getByRole('alert')).toContainText('looks damaged')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  expect(await idbAll(page, 'bodyLogs')).toEqual([WEIGH_IN])
})
