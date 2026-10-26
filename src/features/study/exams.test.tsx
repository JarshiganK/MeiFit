import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { en } from '../../copy/en'
import { db } from '../../db/db'
import { allEvents, allPeriods } from '../../db/exams'
import { getPlan } from '../../db/workout'
import { seedProfile } from '../../test/fixtures'
import { renderApp } from '../../test/renderApp'

vi.mock('eruda', () => ({ default: { init: vi.fn(), destroy: vi.fn() } }))

const NOW = new Date(2026, 9, 26, 9, 0)

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'], now: NOW })
})

afterEach(() => {
  vi.useRealTimers()
})

async function examsCard() {
  renderApp('/study')
  // Wait for the card's data, not just its frame.
  await screen.findByRole('button', { name: 'Add exam or deadline' })
  return screen.getByRole('region', { name: 'Exams and deadlines' })
}

/** An exam on 2 Nov: exam mode runs 19 Oct – 3 Nov (opening the app syncs the period). */
async function seedExam() {
  await db.events.add({ date: '2026-11-02', type: 'exam', title: 'Physics' })
  await db.examPeriods.add({ startsOn: '2026-10-19', endsOn: '2026-11-03', source: 'auto' })
}

describe('exam calendar and exam mode (plan §7)', () => {
  it('adds an exam, which schedules exam mode 14 days before it', async () => {
    await seedProfile()
    const card = await examsCard()
    expect(await within(card).findByText(en.exams.modeOff)).toBeInTheDocument()
    await userEvent.click(within(card).getByRole('button', { name: 'Add exam or deadline' }))
    const sheet = await screen.findByRole('dialog', { name: 'Add to the calendar' })
    await userEvent.type(within(sheet).getByLabelText('Title'), 'Maths paper')
    fireEvent.change(within(sheet).getByLabelText('Date'), { target: { value: '2026-12-01' } })
    await userEvent.click(within(sheet).getByRole('button', { name: 'Save' }))

    expect(await screen.findByText('Added Maths paper')).toBeInTheDocument()
    expect(
      await within(card).findByText('Exam mode starts on Tue 17 Nov, 14 days before your exam.'),
    ).toBeInTheDocument()
    expect(within(card).getByText(/Exam · Tue 1 Dec · In 36 days/)).toBeInTheDocument()
    expect(await allPeriods()).toMatchObject([{ startsOn: '2026-11-17', endsOn: '2026-12-02' }])
  })

  it('checks the title and refuses past dates', async () => {
    await seedProfile()
    const card = await examsCard()
    await userEvent.click(within(card).getByRole('button', { name: 'Add exam or deadline' }))
    const sheet = await screen.findByRole('dialog', { name: 'Add to the calendar' })
    fireEvent.change(within(sheet).getByLabelText('Date'), { target: { value: '2026-10-01' } })
    await userEvent.click(within(sheet).getByRole('button', { name: 'Save' }))
    expect(within(sheet).getByText(en.exams.errors.title)).toBeInTheDocument()
    expect(within(sheet).getByText(en.exams.errors.date)).toBeInTheDocument()
    expect(await allEvents()).toEqual([])
  })

  it('shows exam mode on, and deletes an exam with Undo', async () => {
    await seedProfile()
    await seedExam()
    const card = await examsCard()
    expect(within(card).getByText('Exam mode is on until Tue 3 Nov.')).toBeInTheDocument()
    await userEvent.click(within(card).getByRole('button', { name: 'Delete Physics' }))
    await waitFor(async () => expect(await allEvents()).toEqual([]))
    await userEvent.click(await screen.findByRole('button', { name: 'Undo' }))
    await waitFor(async () => expect(await allEvents()).toHaveLength(1))
  })

  it('switches exam mode on and off by hand', async () => {
    await seedProfile()
    const card = await examsCard()
    await userEvent.click(within(card).getByRole('switch', { name: 'Exam mode now' }))
    expect(await within(card).findByText(en.exams.modeOnOpen)).toBeInTheDocument()
    await userEvent.click(within(card).getByRole('switch', { name: 'Exam mode now' }))
    await waitFor(async () => expect(await allPeriods()).toEqual([]))
  })
})

describe('exam mode elsewhere', () => {
  it('marks the study quest ×1.5 and shows a note on Status', async () => {
    await seedProfile()
    await seedExam()
    renderApp('/')
    expect(await screen.findByText('Study blocks (×1.5)')).toBeInTheDocument()
    expect(screen.getByText('Exam mode until Tue 3 Nov: study XP ×1.5.')).toBeInTheDocument()
  })

  it('edits the exam plan separately, and Train uses it in exam mode', async () => {
    await seedProfile()
    await seedExam()
    renderApp('/train/plan?kind=exam')
    expect(await screen.findByText(en.exams.examPlanIntro)).toBeInTheDocument()
    const days = await screen.findByRole('region', { name: 'Training days' })
    await userEvent.click(within(days).getByRole('button', { name: 'Mon' }))
    await waitFor(async () => expect((await getPlan('exam'))?.days).toHaveLength(1))
    expect(await getPlan('normal')).toBeUndefined()

    await userEvent.click(screen.getByRole('link', { name: 'Back' }))
    expect(await screen.findByText(en.exams.trainNote)).toBeInTheDocument()
  })

  it('shrinks the fitness check to weight and waist', async () => {
    await seedProfile()
    await seedExam()
    renderApp('/fitness-check')
    expect(await screen.findByText(en.fitness.intro.examMode)).toBeInTheDocument()
    expect(screen.getByText('Step 1 of 3')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Next' }))
    await screen.findByRole('heading', { level: 1, name: 'Body' })
    await userEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Your review' }),
    ).toBeInTheDocument()
  })
})
