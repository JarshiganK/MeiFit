import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { en } from '../../copy/en'
import { db } from '../../db/db'
import { openSleep } from '../../db/sleep'
import { atLocalTime } from '../../domain/date'
import { seedProfile } from '../../test/fixtures'
import { renderApp } from '../../test/renderApp'

vi.mock('eruda', () => ({ default: { init: vi.fn(), destroy: vi.fn() } }))

const NIGHT = new Date(2026, 9, 25, 23, 10)
const MORNING = new Date(2026, 9, 26, 6, 28)

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'], now: NIGHT })
})

afterEach(() => {
  vi.useRealTimers()
})

async function openStatus() {
  renderApp('/')
  await screen.findByRole('heading', { level: 1, name: 'Status' })
  // Wait for the card's data, not just its frame.
  await screen.findByRole('button', { name: 'Add a sleep' })
  return screen.getByRole('region', { name: 'Sleep' })
}

describe('two-tap sleep log', () => {
  it('saves a night across midnight on the wake-up date', async () => {
    await seedProfile()
    let card = await openStatus()
    expect(within(card).getByText(en.sleep.none)).toBeInTheDocument()

    await userEvent.click(within(card).getByRole('button', { name: 'Going to sleep' }))
    expect(await within(card).findByText('Sleeping since 23:10')).toBeInTheDocument()
    expect(await openSleep()).toBe(NIGHT.getTime())

    vi.setSystemTime(MORNING)
    card = screen.getByRole('region', { name: 'Sleep' })
    await userEvent.click(within(card).getByRole('button', { name: 'I’m awake' }))
    expect(await screen.findByText('Good morning. You slept 7 h 18 min.')).toBeInTheDocument()

    const [log] = await db.sleepLogs.toArray()
    expect(log).toMatchObject({ wakeDate: '2026-10-26', minutes: 438, source: 'tap' })
    expect(await openSleep()).toBeUndefined()
    expect(await within(card).findByText('7 h 18 min')).toBeInTheDocument()
    expect(within(card).getByText('23:10 → 06:28, woke Mon 26 Oct')).toBeInTheDocument()
    expect(within(card).getByText('Met your 7 h target')).toBeInTheDocument()
  })

  it('undoes a wake-up back to the open sleep', async () => {
    await seedProfile()
    const card = await openStatus()
    await userEvent.click(within(card).getByRole('button', { name: 'Going to sleep' }))
    await within(card).findByText('Sleeping since 23:10')
    vi.setSystemTime(MORNING)
    await userEvent.click(within(card).getByRole('button', { name: 'I’m awake' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Undo' }))
    await waitFor(async () => expect(await db.sleepLogs.count()).toBe(0))
    expect(await openSleep()).toBe(NIGHT.getTime())
  })

  it('asks for the real wake time after more than 16 hours (owner change 4)', async () => {
    await seedProfile()
    const card = await openStatus()
    await userEvent.click(within(card).getByRole('button', { name: 'Going to sleep' }))
    await within(card).findByText('Sleeping since 23:10')

    vi.setSystemTime(new Date(2026, 9, 26, 16, 0)) // 16 h 50 min later
    await userEvent.click(within(card).getByRole('button', { name: 'I’m awake' }))
    const sheet = await screen.findByRole('dialog', { name: 'When did you wake up?' })
    expect(within(sheet).getByLabelText('Went to sleep')).toHaveValue('2026-10-25T23:10')
    expect(within(sheet).getByLabelText('Woke up')).toHaveValue('2026-10-26T06:10')
    fireEvent.change(within(sheet).getByLabelText('Woke up'), {
      target: { value: '2026-10-26T06:45' },
    })
    await userEvent.click(within(sheet).getByRole('button', { name: 'Save' }))

    await waitFor(async () =>
      expect((await db.sleepLogs.toArray())[0]).toMatchObject({ minutes: 455 }),
    )
    expect(await openSleep()).toBeUndefined()
  })

  it('edits both times and checks them', async () => {
    await seedProfile()
    await db.sleepLogs.add({
      wakeDate: '2026-10-25',
      bedAt: atLocalTime('2026-10-24', 23, 0),
      wakeAt: atLocalTime('2026-10-25', 6, 0),
      minutes: 420,
      source: 'tap',
    })
    const card = await openStatus()
    await userEvent.click(await within(card).findByRole('button', { name: 'Edit' }))
    const sheet = await screen.findByRole('dialog', { name: 'Edit sleep' })

    fireEvent.change(within(sheet).getByLabelText('Woke up'), {
      target: { value: '2026-10-24T22:00' },
    })
    await userEvent.click(within(sheet).getByRole('button', { name: 'Save' }))
    expect(within(sheet).getByText(en.sleep.errors.wakeBeforeBed)).toBeInTheDocument()

    fireEvent.change(within(sheet).getByLabelText('Woke up'), {
      target: { value: '2026-10-25T05:30' },
    })
    await userEvent.click(within(sheet).getByRole('button', { name: 'Save' }))
    await waitFor(async () =>
      expect((await db.sleepLogs.toArray())[0]).toMatchObject({ minutes: 390, source: 'manual' }),
    )
    expect(await within(card).findByText('Your target is 7 h')).toBeInTheDocument()
  })

  it('adds a forgotten night by hand, and deletes with Undo', async () => {
    await seedProfile()
    vi.setSystemTime(new Date(2026, 9, 26, 9, 0))
    const card = await openStatus()
    await userEvent.click(within(card).getByRole('button', { name: 'Add a sleep' }))
    const sheet = await screen.findByRole('dialog', { name: 'Add a sleep' })
    expect(within(sheet).getByLabelText('Went to sleep')).toHaveValue('2026-10-25T23:00')
    expect(within(sheet).getByLabelText('Woke up')).toHaveValue('2026-10-26T07:00')
    await userEvent.click(within(sheet).getByRole('button', { name: 'Save' }))
    await waitFor(async () =>
      expect(await db.sleepLogs.toArray()).toMatchObject([
        { wakeDate: '2026-10-26', minutes: 480, source: 'manual' },
      ]),
    )

    await userEvent.click(await within(card).findByRole('button', { name: 'Edit' }))
    await userEvent.click(
      within(await screen.findByRole('dialog', { name: 'Edit sleep' })).getByRole('button', {
        name: 'Delete',
      }),
    )
    await waitFor(async () => expect(await db.sleepLogs.count()).toBe(0))
    await userEvent.click(await screen.findByRole('button', { name: 'Undo' }))
    await waitFor(async () => expect(await db.sleepLogs.count()).toBe(1))
  })

  it('suggests last night before 07:00, so the default is never in the future', async () => {
    await seedProfile()
    vi.setSystemTime(new Date(2026, 9, 26, 5, 30))
    const card = await openStatus()
    await userEvent.click(within(card).getByRole('button', { name: 'Add a sleep' }))
    const sheet = await screen.findByRole('dialog', { name: 'Add a sleep' })
    expect(within(sheet).getByLabelText('Woke up')).toHaveValue('2026-10-25T07:00')
    await userEvent.click(within(sheet).getByRole('button', { name: 'Save' }))
    await waitFor(async () => expect(await db.sleepLogs.count()).toBe(1))
  })

  it('rejects a wake-up in the future', async () => {
    await seedProfile()
    const card = await openStatus()
    await userEvent.click(within(card).getByRole('button', { name: 'Add a sleep' }))
    const sheet = await screen.findByRole('dialog', { name: 'Add a sleep' })
    // It's 23:10, so a wake-up at 06:00 tomorrow hasn't happened yet.
    fireEvent.change(within(sheet).getByLabelText('Went to sleep'), {
      target: { value: '2026-10-25T22:00' },
    })
    fireEvent.change(within(sheet).getByLabelText('Woke up'), {
      target: { value: '2026-10-26T06:00' },
    })
    await userEvent.click(within(sheet).getByRole('button', { name: 'Save' }))
    expect(within(sheet).getByText(en.sleep.errors.inFuture)).toBeInTheDocument()
  })
})
