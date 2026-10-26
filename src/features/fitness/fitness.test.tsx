import { cleanup, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { en } from '../../copy/en'
import { allWaists } from '../../db/body'
import { db } from '../../db/db'
import { allChecks } from '../../db/fitness'
import { currentTarget, getProfile } from '../../db/profile'
import { getSetting, setSetting } from '../../db/settings'
import { atLocalTime } from '../../domain/date'
import { sampleTables } from '../../test/fixtures'
import { renderApp } from '../../test/renderApp'

vi.mock('eruda', () => ({ default: { init: vi.fn(), destroy: vi.fn() } }))
vi.mock('../progress/WeightChart', () => ({ default: () => null }))

const TODAY = '2026-10-31' // Saturday
const NOW = new Date(2026, 9, 31, 8, 0)

async function seed({ goalWeightKg = 64, threshold = 90 } = {}) {
  const tables = sampleTables()
  await db.profile.put({ ...tables.profile[0]!, goalWeightKg })
  await db.targetHistory.add({ ...tables.targetHistory[0]!, proteinQuestThresholdG: threshold })
  await setSetting('baselineCheckDue', TODAY)
  // This week's weigh-ins: 68 kg on average.
  for (const [date, kg] of [
    ['2026-10-27', 68.2],
    ['2026-10-29', 67.8],
  ] as const) {
    await db.bodyLogs.add({ date, at: atLocalTime(date, 7, 0), weightKg: kg })
  }
  await db.exercises.add({ id: 1, name: 'Squat', muscleGroup: 'Legs', type: 'weight-reps' })
  await db.workoutSets.add({
    date: '2026-10-20',
    startedAt: atLocalTime('2026-10-20', 18, 0),
    exerciseId: 1,
    setNumber: 1,
    reps: 5,
    weightKg: 60,
    done: true,
  })
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'], now: NOW })
})

afterEach(() => {
  vi.useRealTimers()
})

const next = () => userEvent.click(screen.getByRole('button', { name: 'Next' }))

async function heading(name: string) {
  return screen.findByRole('heading', { level: 1, name })
}

describe('when a check is due', () => {
  it('shows a banner on Status during the window', async () => {
    await seed()
    renderApp('/')
    const banner = await screen.findByRole('region', { name: 'Fitness check due' })
    expect(within(banner).getByText('Due Sat 31 Oct. Open until Tue 3 Nov.')).toBeInTheDocument()
    expect(within(banner).getByRole('link', { name: 'Start the check' })).toHaveAttribute(
      'href',
      '/fitness-check',
    )
  })

  it('stays quiet outside the window', async () => {
    await seed()
    await setSetting('baselineCheckDue', '2026-11-14')
    renderApp('/')
    await screen.findByRole('region', { name: 'Today’s quests' })
    expect(screen.queryByRole('region', { name: 'Fitness check due' })).not.toBeInTheDocument()
  })
})

describe('the fitness check flow (plan §4)', () => {
  it('records a baseline, reviews targets and earns 50 VIT', async () => {
    await seed()
    const router = renderApp('/fitness-check')
    await heading('Your fitness check')
    expect(screen.getByText(en.fitness.intro.baseline)).toBeInTheDocument()
    await next()

    await heading('Body')
    expect(screen.getByText('68 kg from 2 weigh-ins this week')).toBeInTheDocument()
    await userEvent.type(screen.getByLabelText('Waist (cm)'), '84,5')
    await next()

    await heading('Strength')
    await userEvent.click(screen.getByRole('checkbox', { name: /Squat/ }))
    expect(screen.getByText('≈70 kg 1-rep max')).toBeInTheDocument()
    await next()

    await heading('Endurance')
    await userEvent.type(screen.getByLabelText('Push-ups'), '22')
    await userEvent.type(screen.getByLabelText('Plank (seconds)'), '75')
    await next()
    await heading('Recovery')
    await next()

    await heading('Your review')
    const results = screen.getByRole('region', { name: 'Results' })
    expect(within(results).getByText('84.5 cm')).toBeInTheDocument()
    expect(within(results).getAllByText('New').length).toBeGreaterThanOrEqual(3)
    expect(within(results).getByText('Rewards: +50 VIT')).toBeInTheDocument()
    const targets = screen.getByRole('region', { name: 'Targets' })
    await userEvent.click(within(targets).getByRole('switch', { name: 'Use the new targets' }))
    await userEvent.click(screen.getByRole('button', { name: 'Save the check' }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/progress'))
    expect(await screen.findByText('Fitness check saved. +50 XP')).toBeInTheDocument()
    expect(await allChecks()).toMatchObject([
      {
        date: TODAY,
        waistCm: 84.5,
        pushups: 22,
        plankSec: 75,
        lifts: [{ exerciseId: 1, e1rmKg: 70 }],
      },
    ])
    expect(await currentTarget(TODAY)).toMatchObject({ reason: 'fitness-check' })
    expect(await getSetting('fitnessLifts', [])).toEqual([1])
    expect(await allWaists()).toEqual([{ date: TODAY, waistCm: 84.5 }])
    expect(await getSetting('fitnessDraft', null)).toBeNull()
  })

  it('rewards improved endurance and nudges the protein quest', async () => {
    await seed()
    await db.fitnessChecks.add({
      date: '2026-10-03',
      pushups: 20,
      plankSec: 60,
      squats60s: 30,
      lifts: [],
    })
    renderApp('/fitness-check')
    await heading('Your fitness check')
    await next()
    await next()
    await next()
    await heading('Endurance')
    await userEvent.type(screen.getByLabelText('Push-ups'), '25')
    await userEvent.type(screen.getByLabelText('Bodyweight squats in 60 seconds'), '35')
    await next()
    await next()

    await heading('Your review')
    expect(screen.getByText('Rewards: +50 VIT and +20 STR for improving')).toBeInTheDocument()
    await userEvent.click(
      screen.getByRole('switch', { name: 'Raise the protein quest from 90 g to 105 g' }),
    )
    await userEvent.click(screen.getByRole('button', { name: 'Save the check' }))
    await waitFor(async () =>
      expect(await currentTarget(TODAY)).toMatchObject({
        proteinQuestThresholdG: 105,
        kcal: 2021,
        reason: 'fitness-check',
      }),
    )
  })

  it('offers to switch to maintain once the goal is reached', async () => {
    await seed({ goalWeightKg: 68.5 })
    renderApp('/fitness-check')
    await heading('Your fitness check')
    for (let i = 0; i < 5; i++) await next()
    await heading('Your review')
    await userEvent.click(screen.getByRole('switch', { name: 'Switch my goal to maintain' }))
    await userEvent.click(screen.getByRole('button', { name: 'Save the check' }))
    await waitFor(async () => expect((await getProfile())?.goal).toBe('maintain'))
  })

  it('refuses impossible numbers', async () => {
    await seed()
    renderApp('/fitness-check')
    await heading('Your fitness check')
    await next()
    await heading('Body')
    await userEvent.type(screen.getByLabelText('Waist (cm)'), '400')
    expect(screen.getByText(en.fitness.errors.outOfRange)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled()
  })

  it('picks up where it left off after the app is closed', async () => {
    await seed()
    renderApp('/fitness-check')
    await heading('Your fitness check')
    await next()
    await userEvent.type(await screen.findByLabelText('Waist (cm)'), '83')
    await next()
    await heading('Strength')
    await waitFor(async () =>
      expect(await getSetting('fitnessDraft', null)).toMatchObject({
        step: 'strength',
        waist: '83',
      }),
    )

    cleanup()
    renderApp('/fitness-check')
    await heading('Strength')
    await userEvent.click(screen.getByRole('button', { name: 'Back' }))
    expect(await screen.findByLabelText('Waist (cm)')).toHaveValue('83')
  })
})

describe('waist and interval', () => {
  it('logs a waist on Progress with Undo', async () => {
    await seed()
    renderApp('/progress')
    await userEvent.type(await screen.findByLabelText('Waist (cm)'), '84')
    const form = screen.getByLabelText('Waist (cm)').closest('form')!
    await userEvent.click(within(form).getByRole('button', { name: 'Save' }))
    expect(await screen.findByText('Saved waist 84 cm')).toBeInTheDocument()
    expect(await allWaists()).toEqual([{ date: TODAY, waistCm: 84 }])
    expect(await screen.findByText('Last: 84 cm on Sat 31 Oct')).toBeInTheDocument()
  })

  it('changes the check interval in Settings', async () => {
    await seed()
    renderApp('/settings')
    await userEvent.click(await screen.findByRole('radio', { name: '6 weeks' }))
    await waitFor(async () => expect(await getSetting('fitnessCheckIntervalWeeks', 4)).toBe(6))
  })
})
