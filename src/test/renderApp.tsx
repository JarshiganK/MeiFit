import { render } from '@testing-library/react'
import { createMemoryRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { ThemeProvider } from '../app/ThemeProvider'
import { routes } from '../app/routes'
import { ToastProvider } from '../ui'

/** Renders the whole app at `path`, as the phone would show it. */
export function renderApp(path: string) {
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
