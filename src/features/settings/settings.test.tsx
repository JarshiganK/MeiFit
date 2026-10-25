import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ThemeProvider } from '../../app/ThemeProvider'
import { routes } from '../../app/routes'
import { en } from '../../copy/en'
import { BACKUP_APP, createBackup, recordExport, serializeBackup } from '../../db/backup'
import { db } from '../../db/db'
import { SCHEMA_VERSION, TABLE_NAMES } from '../../db/schema'
import { addDays, toLocalDate } from '../../domain/date'
import { sampleTables } from '../../test/fixtures'
import { ToastProvider } from '../../ui'

const saveFile = vi.hoisted(() => vi.fn())
vi.mock('./saveFile', () => ({ saveFile }))
vi.mock('eruda', () => ({ default: { init: vi.fn(), destroy: vi.fn() } }))

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  render(
    <ThemeProvider>
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    </ThemeProvider>,
  )
  return router
}

async function seed() {
  const tables = sampleTables()
  await db.transaction('rw', db.tables, async () => {
    for (const name of TABLE_NAMES) await db.table(name).bulkAdd(tables[name])
  })
}

function backupFile(content: string): File {
  return new File([content], 'daily-quest-backup.json', { type: 'application/json' })
}

beforeEach(() => {
  saveFile.mockResolvedValue('shared')
})

afterEach(() => {
  saveFile.mockReset()
})

describe('Settings → Your data', () => {
  it('says there is no backup yet and nudges gently', async () => {
    renderAt('/settings')
    expect(await screen.findByText('No backup yet')).toBeInTheDocument()
    expect(screen.getByText(en.data.nudge)).toBeInTheDocument()
  })

  it('shows how long ago the last backup was', async () => {
    await recordExport(new Date(`${addDays(toLocalDate(Date.now()), -3)}T09:00`).getTime())
    renderAt('/settings')
    expect(await screen.findByText('Last backup: 3 days ago')).toBeInTheDocument()
    expect(screen.queryByText(en.data.nudge)).not.toBeInTheDocument()
  })

  it('exports a JSON backup, logs it and confirms', async () => {
    await seed()
    renderAt('/settings')
    await userEvent.click(await screen.findByRole('button', { name: 'Export backup' }))

    await waitFor(() => expect(saveFile).toHaveBeenCalledOnce())
    const [blob, name] = saveFile.mock.calls[0] as [Blob, string]
    expect(name).toMatch(/^daily-quest-backup-\d{4}-\d{2}-\d{2}\.json$/)
    const parsed = JSON.parse(await blob.text()) as {
      app: string
      tables: { meals: unknown[]; exportLogs: unknown[] }
    }
    expect(parsed.app).toBe(BACKUP_APP)
    expect(parsed.tables.meals).toHaveLength(1)
    expect(parsed.tables.exportLogs).toHaveLength(2) // the file carries its own export entry

    expect(await screen.findByText('Backup saved.')).toBeInTheDocument()
    expect(await screen.findByText('Last backup: today')).toBeInTheDocument()
    expect(await db.exportLogs.count()).toBe(2) // the seeded one plus this one
  })

  it('does not log an export the user cancelled in the share sheet', async () => {
    saveFile.mockResolvedValue('cancelled')
    renderAt('/settings')
    await userEvent.click(await screen.findByRole('button', { name: 'Export backup' }))
    await waitFor(() => expect(saveFile).toHaveBeenCalledOnce())
    expect(await db.exportLogs.count()).toBe(0)
    expect(screen.queryByText('Backup saved.')).not.toBeInTheDocument()
  })

  it('says so when the export fails', async () => {
    saveFile.mockRejectedValue(new Error('disk full'))
    renderAt('/settings')
    await userEvent.click(await screen.findByRole('button', { name: 'Export backup' }))
    expect(await screen.findByText(en.data.exportFailed)).toBeInTheDocument()
    expect(await db.exportLogs.count()).toBe(0)
  })

  it('reviews a backup, replaces the data, and can undo the import', async () => {
    await seed()
    const text = serializeBackup(await createBackup(Date.now()))
    await db.meals.add({ ...sampleTables().meals[0]!, id: 50 }) // current data differs
    renderAt('/settings')

    await userEvent.upload(await screen.findByTestId('backup-file-input'), backupFile(text))
    const sheet = await screen.findByRole('dialog', { name: 'Restore this backup?' })
    expect(within(sheet).getByText('Profile: Sam')).toBeInTheDocument()
    expect(within(sheet).getByText('1 meals')).toBeInTheDocument()

    await userEvent.click(within(sheet).getByRole('button', { name: 'Replace my data' }))
    expect(await screen.findByText('Backup restored.')).toBeInTheDocument()
    expect(await db.meals.count()).toBe(1)

    await userEvent.click(screen.getByRole('button', { name: 'Undo' }))
    await waitFor(async () => expect(await db.meals.count()).toBe(2))
  })

  it('keeps the current data when the review is cancelled', async () => {
    await seed()
    const text = serializeBackup(await createBackup(Date.now()))
    await db.meals.clear()
    renderAt('/settings')
    await userEvent.upload(await screen.findByTestId('backup-file-input'), backupFile(text))
    const sheet = await screen.findByRole('dialog', { name: 'Restore this backup?' })
    await userEvent.click(within(sheet).getByRole('button', { name: 'Keep my current data' }))
    expect(await db.meals.count()).toBe(0)
  })

  it.each([
    ['a file that is not JSON', 'not json at all', en.data.importErrors['not-json']],
    [
      'a backup from a newer app',
      JSON.stringify({ app: BACKUP_APP, schemaVersion: SCHEMA_VERSION + 1 }),
      en.data.importErrors['newer-version'],
    ],
  ])('explains why %s was rejected and changes nothing', async (_label, content, message) => {
    await seed()
    renderAt('/settings')
    await userEvent.upload(await screen.findByTestId('backup-file-input'), backupFile(content))
    expect(await screen.findByRole('alert')).toHaveTextContent(message)
    expect(screen.queryByRole('dialog', { name: 'Restore this backup?' })).not.toBeInTheDocument()
    expect(await db.meals.count()).toBe(1)
  })
})

describe('Settings → Storage', () => {
  afterEach(() => {
    Reflect.deleteProperty(navigator, 'storage')
  })

  it('offers to protect the data and reports a refusal kindly', async () => {
    Object.defineProperty(navigator, 'storage', {
      configurable: true,
      value: {
        persisted: () => Promise.resolve(false),
        estimate: () => Promise.resolve({ usage: 2_400_000 }),
        persist: () => Promise.resolve(false),
      },
    })
    renderAt('/settings')
    expect(await screen.findByText(en.data.storageNotProtected)).toBeInTheDocument()
    expect(screen.getByText('Using about 2.4 MB')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Protect my data' }))
    expect(await screen.findByText(en.data.storageDenied)).toBeInTheDocument()
  })

  it('shows protected storage without a button', async () => {
    Object.defineProperty(navigator, 'storage', {
      configurable: true,
      value: {
        persisted: () => Promise.resolve(true),
        estimate: () => Promise.resolve({ usage: 20_000 }),
      },
    })
    renderAt('/settings')
    expect(await screen.findByText(en.data.storageProtected)).toBeInTheDocument()
    expect(screen.getByText('Using less than 0.1 MB')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Protect my data' })).not.toBeInTheDocument()
  })

  it('explains when the browser has no storage controls', async () => {
    renderAt('/settings')
    expect(await screen.findByText(en.data.storageUnsupported)).toBeInTheDocument()
  })
})

describe('Settings → Privacy', () => {
  it('is linked from Settings and shows every section', async () => {
    renderAt('/settings')
    await userEvent.click(await screen.findByRole('link', { name: /^Privacy/ }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Privacy' })).toBeInTheDocument()
    for (const section of en.privacy.sections) {
      expect(screen.getByRole('heading', { name: section.title })).toBeInTheDocument()
    }
    expect(screen.getByRole('link', { name: 'Back' })).toHaveAttribute('href', '/settings')
  })
})

describe('Settings → Delete all data', () => {
  it('only deletes after DELETE is typed, then returns home', async () => {
    await seed()
    localStorage.setItem('dq.theme', 'light')
    const router = renderAt('/settings/delete')

    const button = await screen.findByRole('button', { name: 'Delete everything' })
    expect(button).toBeDisabled()
    const input = screen.getByLabelText('Type DELETE to confirm')
    await userEvent.type(input, 'delet')
    expect(button).toBeDisabled()
    await userEvent.type(input, 'e')
    expect(button).toBeEnabled()

    await userEvent.click(button)
    expect(await screen.findByText('All data deleted.')).toBeInTheDocument()
    await waitFor(() => expect(router.state.location.pathname).toBe('/'))
    for (const name of TABLE_NAMES) expect(await db.table(name).count()).toBe(0)
    expect(localStorage.getItem('dq.theme')).toBeNull()
  })

  it('does nothing when the form is submitted without the word', async () => {
    await seed()
    renderAt('/settings/delete')
    await userEvent.type(await screen.findByLabelText('Type DELETE to confirm'), 'nope{Enter}')
    expect(await db.meals.count()).toBe(1)
  })

  it('offers an export first', async () => {
    renderAt('/settings/delete')
    await userEvent.click(await screen.findByRole('button', { name: 'Export a backup first' }))
    await waitFor(() => expect(saveFile).toHaveBeenCalledOnce())
  })
})
