import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ThemeProvider } from '../../app/ThemeProvider'
import { routes } from '../../app/routes'
import { en } from '../../copy/en'
import { createBackup, deleteAllData, serializeBackup } from '../../db/backup'
import { db } from '../../db/db'
import { currentTarget, getProfile } from '../../db/profile'
import { STARTER_MENU } from '../../db/seed/starterMenu'
import { getSetting, setSetting } from '../../db/settings'
import { TABLE_NAMES } from '../../db/schema'
import { sampleTables } from '../../test/fixtures'
import { ToastProvider } from '../../ui'

vi.mock('eruda', () => ({ default: { init: vi.fn(), destroy: vi.fn() } }))

const TODAY = new Date(2026, 9, 25, 9, 0) // Sunday 25 Oct 2026

beforeEach(() => {
  // Only the clock is faked, so dates and ages are stable; timers stay real for Dexie.
  vi.useFakeTimers({ toFake: ['Date'], now: TODAY })
})

afterEach(() => {
  vi.useRealTimers()
})

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

const next = () => userEvent.click(screen.getByRole('button', { name: 'Next' }))

async function reachAboutStep() {
  await userEvent.click(await screen.findByRole('button', { name: 'Skip intro' }))
  expect(
    await screen.findByRole('heading', { level: 1, name: en.setup.install.title }),
  ).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: 'Continue in the browser' }))
  await screen.findByRole('heading', { level: 1, name: 'About you' })
}

async function fillAboutYou(birthDate = '2001-10-25') {
  await userEvent.type(screen.getByLabelText('Nickname'), 'Sam')
  await userEvent.click(screen.getByRole('radio', { name: 'Male' }))
  fireEvent.change(screen.getByLabelText('Date of birth'), { target: { value: birthDate } })
  await userEvent.type(screen.getByLabelText('Height (cm)'), '169')
  await userEvent.type(screen.getByLabelText('Current weight (kg)'), '69')
  await userEvent.click(screen.getByRole('radio', { name: /^Moderate/ }))
}

describe('first-launch setup', () => {
  it('walks through the intro, all seven steps and saves the plan §15 targets', async () => {
    const router = renderAt('/setup')

    // Three short intro screens.
    for (const slide of en.setup.intro) {
      expect(await screen.findByRole('heading', { level: 1, name: slide.title })).toBeVisible()
      await next()
    }

    // 1. Install check (jsdom isn't a Home Screen app).
    expect(screen.getByText('Step 1 of 7')).toBeInTheDocument()
    expect(screen.getByText(en.setup.install.why)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Continue in the browser' }))

    // 2. About you.
    expect(await screen.findByText('Step 2 of 7')).toBeInTheDocument()
    await fillAboutYou()
    await next()

    // 3. Goal.
    await userEvent.click(await screen.findByRole('radio', { name: /^Lose fat/ }))
    expect(screen.getByRole('radio', { name: /^Standard/ })).toBeChecked()
    await next()

    // 4. Routine: defaults.
    expect(await screen.findByLabelText('Sleep target (hours)')).toHaveValue('7')
    await next()

    // 5. Food: starter menu is the default.
    expect(await screen.findByRole('radio', { name: /starter menu/ })).toBeChecked()
    await next()

    // 6. Exams.
    await userEvent.type(await screen.findByLabelText('Exam'), 'Maths paper')
    fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2026-11-20' } })
    await userEvent.click(screen.getByRole('button', { name: 'Add exam' }))
    expect(screen.getByText('Maths paper')).toBeInTheDocument()
    await next()

    // 7. Review: plan §15 numbers.
    expect(await screen.findByText('≈2,020 kcal')).toBeInTheDocument()
    expect(screen.getByText('Aim for 1,970–2,070')).toBeInTheDocument()
    expect(screen.getByText('Never below ≈1,630 kcal')).toBeInTheDocument()
    expect(screen.getByText('124 g')).toBeInTheDocument()
    expect(screen.getByText(en.setup.healthNote)).toBeInTheDocument()
    expect(screen.getByLabelText('Baseline fitness check')).toHaveValue('2026-10-31')

    await userEvent.click(screen.getByRole('button', { name: 'Start my quests' }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/'))
    expect(await screen.findByText('Welcome, Sam. Your quests are ready.')).toBeInTheDocument()
    expect(await getProfile()).toMatchObject({ nickname: 'Sam', setupDate: '2026-10-25' })
    expect(await currentTarget('2026-10-25')).toMatchObject({ kcal: 2021, proteinG: 124 })
    expect(await db.foods.count()).toBe(STARTER_MENU.length)
    expect(await db.events.count()).toBe(1)
    expect(await getSetting('baselineCheckDue', '')).toBe('2026-10-31')
    // Finished, so nothing is left to resume.
    expect(await getSetting('setupDraft', null)).toBeNull()
  })

  it('picks up where it left off after the app is closed mid-setup', async () => {
    renderAt('/setup')
    await reachAboutStep()
    await fillAboutYou()
    await next()
    await userEvent.click(await screen.findByRole('radio', { name: /^Lose fat/ }))
    await next()
    expect(await screen.findByRole('heading', { level: 1, name: 'Your routine' })).toBeVisible()
    await waitFor(async () =>
      expect(await getSetting('setupDraft', null)).toMatchObject({ step: 'routine' }),
    )

    // iOS closes the app; it opens again from the Home Screen.
    cleanup()
    renderAt('/')
    expect(await screen.findByRole('heading', { level: 1, name: 'Your routine' })).toBeVisible()
    expect(screen.getByText('Step 4 of 7')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Back' }))
    expect(await screen.findByRole('radio', { name: /^Lose fat/ })).toBeChecked()
    await userEvent.click(screen.getByRole('button', { name: 'Back' }))
    expect(await screen.findByLabelText('Nickname')).toHaveValue('Sam')
    expect(screen.getByLabelText('Current weight (kg)')).toHaveValue('69')
  })

  it('starts afresh when the saved setup is unreadable', async () => {
    await setSetting('setupDraft', { step: 'review', draft: { nickname: 7 } })
    renderAt('/setup')
    expect(
      await screen.findByRole('heading', { level: 1, name: en.setup.intro[0]?.title }),
    ).toBeVisible()
  })

  it('shows what is missing instead of moving on', async () => {
    renderAt('/setup')
    await reachAboutStep()
    await next()
    expect(screen.getByRole('heading', { level: 1, name: 'About you' })).toBeInTheDocument()
    expect(screen.getAllByText(en.setup.errors.required).length).toBeGreaterThanOrEqual(5)
    await waitFor(() => expect(screen.getByLabelText('Nickname')).toHaveFocus())
  })

  it('stops politely for under-13s', async () => {
    renderAt('/setup')
    await reachAboutStep()
    await fillAboutYou('2015-03-01')
    await next()
    expect(screen.getByRole('alert')).toHaveTextContent(en.setup.about.tooYoung)
    expect(screen.getByRole('heading', { level: 1, name: 'About you' })).toBeInTheDocument()
  })

  it('keeps under-18s at maintenance: no fat-loss goal, no flex days, no calorie numbers', async () => {
    renderAt('/setup')
    await reachAboutStep()
    await fillAboutYou('2010-01-01')
    expect(screen.getByText(en.setup.about.minorNote)).toBeInTheDocument()
    await next()

    expect(await screen.findByRole('radio', { name: /^Maintain/ })).toBeInTheDocument()
    expect(screen.queryByRole('radio', { name: /^Lose fat/ })).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('radio', { name: /^Build muscle/ }))
    await next()

    expect(await screen.findByLabelText('Workouts per week')).toBeInTheDocument()
    expect(screen.queryByLabelText('Flex days per week')).not.toBeInTheDocument()
    await next()
    await next() // food
    await next() // exams

    expect(await screen.findByText('Protein a day')).toBeInTheDocument()
    expect(screen.queryByText('Calories a day')).not.toBeInTheDocument()
    expect(screen.queryByText(/kcal/)).not.toBeInTheDocument()
    expect(screen.getByText(en.setup.review.plateRule)).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Start my quests' }))
    await waitFor(async () => expect(await getProfile()).toBeDefined())
    const profile = await getProfile()
    expect(profile?.flexDaysPerWeek).toBe(0)
    const target = await currentTarget('2026-10-25')
    expect(target?.kcal).toBeGreaterThanOrEqual(target?.kcalFloor ?? Infinity)
  })

  it('never lets an edited calorie target go below the floor', async () => {
    renderAt('/setup')
    await reachAboutStep()
    await fillAboutYou()
    await next()
    await userEvent.click(await screen.findByRole('radio', { name: /^Lose fat/ }))
    await next()
    await next()
    await next()
    await next()

    await userEvent.click(await screen.findByRole('button', { name: 'Edit targets' }))
    const kcal = screen.getByLabelText('Calories (kcal)')
    await userEvent.clear(kcal)
    await userEvent.type(kcal, '1000{Enter}')
    expect(kcal).toHaveValue('1626')
    expect(screen.getByRole('button', { name: 'Decrease Calories (kcal)' })).toBeDisabled()

    await userEvent.click(screen.getByRole('button', { name: 'Start my quests' }))
    await waitFor(async () => expect((await currentTarget('2026-10-25'))?.kcal).toBe(1626))
  })

  it('restores a backup on a new phone from the install step', async () => {
    // Make a backup file, then start from an empty phone.
    const tables = sampleTables()
    tables.exportLogs = []
    await db.transaction('rw', db.tables, async () => {
      for (const name of TABLE_NAMES) await db.table(name).bulkAdd(tables[name])
    })
    const text = serializeBackup(await createBackup(Date.now()))
    await deleteAllData()

    const router = renderAt('/setup')
    await userEvent.click(await screen.findByRole('button', { name: 'Skip intro' }))
    await userEvent.upload(
      await screen.findByTestId('backup-file-input'),
      new File([text], 'daily-quest-backup.json', { type: 'application/json' }),
    )
    const sheet = await screen.findByRole('dialog', { name: 'Restore this backup?' })
    // Nothing on this phone to lose, so Replace is the main action.
    expect(await within(sheet).findByText('No backup yet')).toBeInTheDocument()
    const replace = within(sheet).getByRole('button', { name: 'Replace my data' })
    expect(replace).toHaveAttribute('data-variant', 'primary')
    expect(within(sheet).queryByRole('button', { name: 'Back up first' })).not.toBeInTheDocument()

    await userEvent.click(replace)
    await waitFor(() => expect(router.state.location.pathname).toBe('/'))
    expect((await getProfile())?.nickname).toBe('Sam')
  })
})

describe('changing answers later', () => {
  beforeEach(async () => {
    const tables = sampleTables()
    await db.profile.put(tables.profile[0]!)
    await db.bodyLogs.add({ date: '2026-10-20', at: 1, weightKg: 69 })
    await db.targetHistory.add({ ...tables.targetHistory[0]!, proteinQuestThresholdG: 95 })
  })

  it('prefills the answers, skips the intro and keeps the calibrated protein threshold', async () => {
    const router = renderAt('/setup?mode=change')
    expect(await screen.findByLabelText('Nickname')).toHaveValue('Sam')
    expect(screen.getByText('Step 1 of 4')).toBeInTheDocument()
    expect(screen.getByLabelText('Current weight (kg)')).toHaveValue('69')
    await next()

    await userEvent.click(await screen.findByRole('radio', { name: /^Maintain/ }))
    await next()
    await next()
    await userEvent.click(await screen.findByRole('button', { name: 'Save changes' }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/settings/profile'))
    expect((await getProfile())?.goal).toBe('maintain')
    expect((await getProfile())?.setupDate).toBe('2026-10-01')
    const target = await currentTarget('2026-10-25')
    expect(target).toMatchObject({ startsOn: '2026-10-25', proteinQuestThresholdG: 95 })
    expect(await db.bodyLogs.count()).toBe(1) // weight unchanged: no new weigh-in
    expect(await db.targetHistory.count()).toBe(2) // the old targets still judge old days
  })

  it('records a weigh-in when the weight is changed', async () => {
    renderAt('/setup?mode=change')
    const weight = await screen.findByLabelText('Current weight (kg)')
    await userEvent.clear(weight)
    await userEvent.type(weight, '68.4')
    await next()
    await next()
    await next()
    await userEvent.click(await screen.findByRole('button', { name: 'Save changes' }))
    await waitFor(async () => expect(await db.bodyLogs.count()).toBe(2))
  })

  it('shows the answers and targets on Settings → Profile', async () => {
    renderAt('/settings/profile')
    expect(await screen.findByRole('heading', { level: 1, name: en.profile.title })).toBeVisible()
    expect(await screen.findByText('≈2,020 kcal')).toBeInTheDocument()
    expect(screen.getByText('124 g')).toBeInTheDocument()
    expect(screen.getByText('69 kg')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Change answers' })).toHaveAttribute(
      'href',
      '/setup?mode=change',
    )
  })
})
