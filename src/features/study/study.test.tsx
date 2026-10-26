import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { en } from '../../copy/en'
import { db } from '../../db/db'
import { runningTimer } from '../../db/study'
import { seedProfile } from '../../test/fixtures'
import { renderApp } from '../../test/renderApp'

vi.mock('eruda', () => ({ default: { init: vi.fn(), destroy: vi.fn() } }))

const START = new Date(2026, 9, 25, 23, 40) // Sunday 23:40
const MIN = 60_000

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'], now: START })
})

afterEach(() => {
  vi.useRealTimers()
})

async function openStudy() {
  renderApp('/study')
  await screen.findByRole('heading', { level: 1, name: 'Study' })
  return screen.findByRole('region', { name: 'Focus timer' })
}

describe('focus timer', () => {
  it('runs a 50-minute block and completes it at the end time', async () => {
    await seedProfile() // block length 50
    let card = await openStudy()
    expect(within(card).getByLabelText('Minutes')).toHaveValue('50')
    await userEvent.click(within(card).getByRole('button', { name: 'Start focus' }))

    card = await screen.findByRole('region', { name: 'Focus timer' })
    expect(await within(card).findByRole('timer')).toHaveTextContent('50:00')
    expect(within(card).getByText('Ends at 00:30')).toBeInTheDocument()
    expect(await runningTimer()).toMatchObject({ startedAt: START.getTime(), plannedMin: 50 })

    // The app comes back an hour later: the block completes at its scheduled end.
    vi.setSystemTime(START.getTime() + 60 * MIN)
    expect(await screen.findByText(en.study.blockDone, {}, { timeout: 3000 })).toBeInTheDocument()
    const [session] = await db.studySessions.toArray()
    expect(session).toMatchObject({
      date: '2026-10-25',
      minutes: 50,
      completed: true,
      source: 'timer',
    })
    expect(await runningTimer()).toBeUndefined()
    const today = screen.getByRole('region', { name: 'Today' })
    expect(await within(today).findByText('1 of 5 blocks')).toBeInTheDocument()
  })

  it('stopping early keeps the minutes for hours but earns no block', async () => {
    await seedProfile()
    const card = await openStudy()
    await userEvent.click(within(card).getByRole('button', { name: 'Start focus' }))
    await within(card).findByRole('timer')
    vi.setSystemTime(START.getTime() + 20.5 * MIN)
    await userEvent.click(within(card).getByRole('button', { name: 'Stop' }))
    expect(await screen.findByText(en.study.stoppedEarly(20))).toBeInTheDocument()
    expect((await db.studySessions.toArray())[0]).toMatchObject({ minutes: 20, completed: false })
    const today = screen.getByRole('region', { name: 'Today' })
    expect(await within(today).findByText('Stopped early')).toBeInTheDocument()
    expect(within(today).getByText('0 of 5 blocks')).toBeInTheDocument()
    expect(
      within(screen.getByRole('region', { name: 'This week' })).getByText(
        '0.3 h of your 20 h goal',
      ),
    ).toBeInTheDocument()
  })

  it('cancels without saving, and a stop within the first minute saves nothing', async () => {
    await seedProfile()
    let card = await openStudy()
    await userEvent.click(within(card).getByRole('button', { name: 'Start focus' }))
    await userEvent.click(await within(card).findByRole('button', { name: 'Cancel' }))
    expect(await screen.findByText(en.study.cancelled)).toBeInTheDocument()
    card = screen.getByRole('region', { name: 'Focus timer' })
    await userEvent.click(await within(card).findByRole('button', { name: 'Start focus' }))
    await userEvent.click(await within(card).findByRole('button', { name: 'Stop' }))
    expect(await screen.findByText(en.study.stoppedTooSoon)).toBeInTheDocument()
    expect(await db.studySessions.count()).toBe(0)
  })

  it('adds a subject and remembers it with the session', async () => {
    await seedProfile()
    const card = await openStudy()
    await userEvent.selectOptions(within(card).getByLabelText('Subject'), 'Add a subject…')
    const sheet = await screen.findByRole('dialog', { name: 'Add a subject' })
    await userEvent.type(within(sheet).getByLabelText('Subject name'), 'Maths')
    await userEvent.click(within(sheet).getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(within(card).getByLabelText('Subject')).toHaveDisplayValue('Maths'))
    await userEvent.click(within(card).getByRole('button', { name: 'Start focus' }))
    expect(await screen.findByText('Focusing on Maths')).toBeInTheDocument()
    const subject = await db.subjects.where('name').equals('Maths').first()
    expect((await runningTimer())?.subjectId).toBe(subject?.id)
  })
})

describe('study log', () => {
  it('adds study time by hand and counts full blocks', async () => {
    await seedProfile()
    await openStudy()
    const today = screen.getByRole('region', { name: 'Today' })
    await userEvent.click(within(today).getByRole('button', { name: 'Add study time' }))
    const sheet = await screen.findByRole('dialog', { name: 'Add study time' })
    fireEvent.change(within(sheet).getByLabelText('Started at'), { target: { value: '20:00' } })
    const minutes = within(sheet).getByLabelText('Minutes studied')
    await userEvent.clear(minutes)
    await userEvent.type(minutes, '100')
    await userEvent.click(within(sheet).getByRole('button', { name: 'Save' }))

    expect(await within(today).findByText('2 of 5 blocks')).toBeInTheDocument()
    expect(within(today).getByText('Added by hand')).toBeInTheDocument()
    expect((await db.studySessions.toArray())[0]).toMatchObject({
      date: '2026-10-25',
      minutes: 100,
      source: 'manual',
    })
  })

  it('checks hand entries', async () => {
    await seedProfile()
    await openStudy()
    await userEvent.click(screen.getByRole('button', { name: 'Add study time' }))
    const sheet = await screen.findByRole('dialog', { name: 'Add study time' })
    fireEvent.change(within(sheet).getByLabelText('Started at'), { target: { value: '23:55' } })
    const minutes = within(sheet).getByLabelText('Minutes studied')
    await userEvent.clear(minutes)
    await userEvent.type(minutes, '0')
    await userEvent.click(within(sheet).getByRole('button', { name: 'Save' }))
    expect(within(sheet).getByText(en.study.errors.outOfRange)).toBeInTheDocument()
    expect(within(sheet).getByText(en.study.errors.future)).toBeInTheDocument()
    expect(await db.studySessions.count()).toBe(0)
  })

  it('deletes a session with Undo', async () => {
    await seedProfile()
    await db.studySessions.add({
      date: '2026-10-25',
      startedAt: START.getTime() - 120 * MIN,
      minutes: 50,
      completed: true,
      source: 'timer',
    })
    await openStudy()
    await userEvent.click(await screen.findByRole('button', { name: 'Delete the 21:40 session' }))
    await waitFor(async () => expect(await db.studySessions.count()).toBe(0))
    await userEvent.click(await screen.findByRole('button', { name: 'Undo' }))
    await waitFor(async () => expect(await db.studySessions.count()).toBe(1))
  })

  it('offers the Clock alarm shortcut for the block length (plan §11)', async () => {
    await seedProfile()
    const card = await openStudy()
    expect(within(card).getByRole('link', { name: 'Also start a Clock alarm' })).toHaveAttribute(
      'href',
      'shortcuts://run-shortcut?name=Focus%2050',
    )
  })
})

describe('hours per subject (plan §6)', () => {
  it('splits this week’s hours by subject', async () => {
    await seedProfile()
    await db.subjects.bulkAdd([
      { id: 1, name: 'Maths' },
      { id: 2, name: 'Physics' },
    ])
    const startedAt = START.getTime() - 300 * MIN
    await db.studySessions.bulkAdd([
      {
        date: '2026-10-25',
        startedAt,
        minutes: 90,
        completed: true,
        source: 'manual',
        subjectId: 1,
      },
      {
        date: '2026-10-24',
        startedAt,
        minutes: 60,
        completed: true,
        source: 'manual',
        subjectId: 2,
      },
      { date: '2026-10-23', startedAt, minutes: 30, completed: true, source: 'manual' },
    ])
    renderApp('/study')
    const subjects = await screen.findByRole('region', { name: 'By subject' })
    expect(
      within(subjects)
        .getAllByRole('listitem')
        .map((li) => li.textContent),
    ).toEqual(['Maths: 1.5 h', 'Physics: 1 h', 'No subject: 0.5 h'])
  })
})
