import { createBrowserRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { ToastProvider } from '../ui'
import { ThemeProvider } from './ThemeProvider'
import { routes } from './routes'

const router = createBrowserRouter(routes)

export function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    </ThemeProvider>
  )
}
