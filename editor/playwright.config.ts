import { defineConfig, devices } from '@playwright/test'

import { E2E_PASSWORD, E2E_SESSION_SECRET } from './e2e/credentials'

const PORT = 3100
const BASE_URL =
  process.env.PLAYWRIGHT_BASE_URL || `http://127.0.0.1:${PORT}`
// Docker / external host server: do not also spawn webServer (needs bun).
const externalServer = Boolean(process.env.PLAYWRIGHT_BASE_URL)

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.ts',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  workers: 1,
  reporter: 'list',
  timeout: 45_000,
  expect: { timeout: 12_000 },
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: externalServer
    ? undefined
    : {
        command: `bun run dev --host 127.0.0.1 --port ${PORT}`,
        url: `http://127.0.0.1:${PORT}`,
        reuseExistingServer: true,
        timeout: 120_000,
        env: {
          ...process.env,
          EDITOR_PASSWORD: E2E_PASSWORD,
          EDITOR_SESSION_SECRET:
            process.env.EDITOR_SESSION_SECRET &&
            process.env.EDITOR_SESSION_SECRET.length >= 32
              ? process.env.EDITOR_SESSION_SECRET
              : E2E_SESSION_SECRET,
          COOKIE_SECURE: 'false',
        },
      },
})
