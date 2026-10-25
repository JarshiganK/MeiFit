import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '../db/db'
import { getSetting } from '../db/settings'
import { seedProfile } from '../test/fixtures'
import { ToastProvider } from '../ui'
import { ThemeProvider } from './ThemeProvider'
import { routes } from './routes'
import { useTheme } from './useTheme'

vi.mock('eruda', () => ({ default: { init: vi.fn(), destroy: vi.fn() } }))

beforeEach(async () => {
  await seedProfile()
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

describe('app shell', () => {
  it('opens on Status with five labelled tabs and a Settings link', async () => {
    renderAt('/')
    expect(await screen.findByRole('heading', { level: 1, name: 'Status' })).toBeInTheDocument()
    const nav = screen.getByRole('navigation', { name: 'Main' })
    const links = within(nav).getAllByRole('link')
    expect(links.map((l) => l.textContent)).toEqual([
      'Status',
      'Food',
      'Train',
      'Study',
      'Progress',
    ])
    expect(within(nav).getByRole('link', { name: 'Status' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(screen.getByRole('link', { name: 'Settings' })).toHaveAttribute('href', '/settings')
  })

  it.each([
    ['Food', 'Your menu is empty'],
    ['Train', 'Your training plan goes here'],
    ['Study', 'Focus blocks start here'],
    ['Progress', 'Weight'],
  ])('navigates to %s and shows its designed empty state', async (tab, emptyTitle) => {
    renderAt('/')
    await userEvent.click(screen.getByRole('link', { name: tab }))
    expect(await screen.findByRole('heading', { level: 1, name: tab })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: emptyTitle })).toBeInTheDocument()
  })

  it('shows a friendly page for unknown links', async () => {
    renderAt('/nowhere')
    expect(
      await screen.findByRole('heading', { level: 2, name: 'This page doesn’t exist' }),
    ).toBeVisible()
    await userEvent.click(screen.getByRole('link', { name: 'Go to Status' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Status' })).toBeInTheDocument()
  })

  it('shows a calm offline banner when the connection drops', () => {
    renderAt('/')
    expect(screen.queryByText(/You’re offline/)).not.toBeInTheDocument()
    const online = vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
    act(() => {
      window.dispatchEvent(new Event('offline'))
    })
    expect(screen.getByText(/You’re offline/)).toBeInTheDocument()
    online.mockReturnValue(true)
    act(() => {
      window.dispatchEvent(new Event('online'))
    })
    expect(screen.queryByText(/You’re offline/)).not.toBeInTheDocument()
  })

  it('shows the error screen instead of a blank page when a screen crashes', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    function Boom(): never {
      throw new Error('boom')
    }
    const router = createMemoryRouter(
      [{ path: '/', element: <Boom />, errorElement: routes[0]!.errorElement }],
      { initialEntries: ['/'] },
    )
    render(<RouterProvider router={router} />)
    expect(screen.getByRole('heading', { name: 'Something went wrong' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reload app' })).toBeInTheDocument()
  })
})

describe('settings', () => {
  it('switches the theme and remembers it', async () => {
    renderAt('/settings')
    expect(await screen.findByRole('radio', { name: 'System' })).toBeChecked()
    await userEvent.click(screen.getByRole('radio', { name: 'Light' }))
    expect(document.documentElement.dataset.theme).toBe('light')
    expect(localStorage.getItem('dq.theme')).toBe('light')
    await userEvent.click(screen.getByRole('radio', { name: 'Dark' }))
    expect(document.documentElement.dataset.theme).toBe('dark')
  })

  it('turns the debug console on and off', async () => {
    renderAt('/settings')
    const toggle = await screen.findByRole('switch', { name: 'Debug console' })
    expect(toggle).toHaveAttribute('aria-checked', 'false')
    await userEvent.click(toggle)
    await waitFor(() => expect(toggle).toHaveAttribute('aria-checked', 'true'))
    expect(await getSetting('debug', false)).toBe(true)
    await userEvent.click(toggle)
    await waitFor(() => expect(toggle).toHaveAttribute('aria-checked', 'false'))
    expect(await getSetting('debug', true)).toBe(false)
  })

  it('shows the health note, version and a way back', async () => {
    renderAt('/settings')
    expect(await screen.findByText(/estimate, not medical advice/)).toBeInTheDocument()
    expect(
      screen.getByText(/^Version \d+\.\d+\.\d+ · built \d{4}-\d{2}-\d{2}$/),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back' })).toHaveAttribute('href', '/')
  })
})

describe('useTheme', () => {
  it('throws a clear error outside the provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    function Probe() {
      useTheme()
      return null
    }
    expect(() => render(<Probe />)).toThrow(/ThemeProvider/)
  })
})

describe('setup gate', () => {
  it('sends a phone with no profile to first-launch setup', async () => {
    await db.profile.clear()
    const router = renderAt('/food')
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Your day is a quest board' }),
    ).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/setup')
  })

  it('sends a phone that already has a profile from setup to Status', async () => {
    const router = renderAt('/setup')
    expect(await screen.findByRole('heading', { level: 1, name: 'Status' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/')
  })
})
