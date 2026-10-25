import { defineConfig, devices } from '@playwright/test'

const PORT = 5174

/**
 * Design review screenshots (CLAUDE.md §7): every screen plus /dev/ui, light and
 * dark, at 430 × 932. Runs against the dev server because /dev/ui is dev-only.
 * Output: test-results/screens/.
 */
export default defineConfig({
  testDir: 'e2e',
  testMatch: 'screens.capture.ts',
  outputDir: 'test-results/screens-run',
  reporter: 'list',
  use: {
    ...devices['iPhone 15 Pro Max'],
    viewport: { width: 430, height: 932 },
    baseURL: `http://localhost:${PORT}`,
    timezoneId: 'Asia/Colombo',
  },
  projects: [{ name: 'webkit-iphone' }],
  webServer: {
    command: `npx vite --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: true,
    timeout: 60_000,
  },
})
