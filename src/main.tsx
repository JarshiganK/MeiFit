import '@fontsource-variable/inter/wght.css'
import '@fontsource-variable/space-grotesk/wght.css'
import './ui/theme.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app/App'

// The debug console is optional and loads after the app; a failure here must never stop the app.
import('./app/debug')
  .then((debug) => debug.bootDebugConsole())
  .catch((error: unknown) => console.error(error))

const root = document.getElementById('root')
if (!root) throw new Error('Missing #root element')

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
