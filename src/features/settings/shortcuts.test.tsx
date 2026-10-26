import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { en } from '../../copy/en'
import { db } from '../../db/db'
import { seedProfile } from '../../test/fixtures'
import { renderApp } from '../../test/renderApp'

vi.mock('eruda', () => ({ default: { init: vi.fn(), destroy: vi.fn() } }))

describe('Shortcut help (plan §11)', () => {
  it('opens from Settings and lists the six reminders with setup steps', async () => {
    await seedProfile()
    renderApp('/settings')
    await userEvent.click(await screen.findByRole('link', { name: /^Shortcut help/ }))
    const reminders = await screen.findByRole('region', { name: 'Reminders' })
    for (const text of [
      'Daily quests ready',
      'Lunch: two proteins',
      'Gym time',
      'Wind down, log sleep',
      'Export a backup; fitness check if due',
      'Weekly boss result and report',
    ]) {
      expect(within(reminders).getByText(text)).toBeInTheDocument()
    }
    expect(within(reminders).getAllByRole('listitem').length).toBeGreaterThanOrEqual(6 + 5)
    expect(within(reminders).getByText(/Build a plan on Train/)).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Focus timer alarm' })).toHaveTextContent('Focus 50')
  })

  it('names the training days from the plan', async () => {
    await seedProfile()
    await db.workoutPlans.add({
      name: 'My plan',
      kind: 'normal',
      days: [
        { weekday: 1, exercises: [] },
        { weekday: 4, exercises: [] },
      ],
    })
    renderApp('/settings/shortcuts')
    expect(await screen.findByText(/Your training days: Mon, Thu\./)).toBeInTheDocument()
    expect(screen.getByText(en.shortcuts.note)).toBeInTheDocument()
  })
})
