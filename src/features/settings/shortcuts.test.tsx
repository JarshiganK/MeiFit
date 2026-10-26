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

describe('Meal Snap and Health Sync help (plan §11)', () => {
  it('builds the Meal Snap prompt from the menu and copies it', async () => {
    const writeText = vi.fn(() => Promise.resolve())
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } })
    await seedProfile()
    await db.foods.bulkAdd([
      {
        name: 'Rice',
        category: 'staple',
        serving: '1 cup',
        unit: 'cups',
        kcal: 200,
        proteinG: 4,
        countsAsProtein: false,
      },
      {
        name: 'Chicken curry',
        category: 'curry',
        serving: '1',
        unit: 'size',
        kcal: 200,
        proteinG: 20,
        countsAsProtein: true,
      },
    ])
    renderApp('/settings/shortcuts')
    const snap = await screen.findByRole('region', { name: 'Meal Snap (photo to meal)' })
    const prompt =
      'Which of these foods are on the plate: Rice, Chicken curry? Reply only with names from the list, separated by commas.'
    expect(await within(snap).findByText(prompt)).toBeInTheDocument()
    await userEvent.click(within(snap).getByRole('button', { name: 'Copy the prompt' }))
    expect(writeText).toHaveBeenCalledWith(prompt)
    expect(await screen.findByText(en.shortcuts.promptCopied)).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Health Sync (sleep and steps)' })).toHaveTextContent(
      'DQ1;steps',
    )
    vi.unstubAllGlobals()
  })
})
