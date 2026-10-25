import { defineConfig, devices } from '@playwright/test'

const PORT = 4173

/** End-to-end tests run against the production build served by `vite preview`. */
export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  // WebKit on Windows sometimes stalls IndexedDB in several workers at once under a full
  // parallel run; one retry absorbs that. A test that fails twice still fails the run.
  retries: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    timezoneId: 'Asia/Colombo',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'webkit-iphone',
      use: { ...devices['iPhone 15 Pro Max'], timezoneId: 'Asia/Colombo' },
    },
    {
      name: 'chromium-mobile',
      use: { ...devices['Pixel 7'], timezoneId: 'Asia/Colombo' },
    },
  ],
  webServer: {
    command: 'npm run preview',
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
})
