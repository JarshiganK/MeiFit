import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { en } from '../../copy/en'
import { db } from '../../db/db'
import { moodOn } from '../../db/mood'
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

describe('mood check-in (plan §6)', () => {
  it('saves energy and mood with a tap each, and earns 5 XP', async () => {
    await seedProfile()
    renderApp('/')
    const card = await screen.findByRole('region', { name: en.mood.title })
    await userEvent.click((await within(card).findAllByRole('radio', { name: '4' }))[0]!)
    await userEvent.click(within(card).getAllByRole('radio', { name: '5' })[1]!)
    await waitFor(async () =>
      expect(await moodOn('2026-10-26')).toMatchObject({ energy: 4, mood: 5 }),
    )
    expect(await within(card).findByText(en.mood.saved)).toBeInTheDocument()
    expect(await screen.findByText('5 XP in total')).toBeInTheDocument()
  })

  it('is hidden in exam mode', async () => {
    await seedProfile()
    await db.examPeriods.add({ startsOn: '2026-10-20', endsOn: '9999-12-31', source: 'manual' })
    renderApp('/')
    await screen.findByRole('region', { name: 'Today’s quests' })
    expect(screen.queryByRole('region', { name: en.mood.title })).not.toBeInTheDocument()
  })
})
