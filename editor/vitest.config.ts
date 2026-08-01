import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    restoreMocks: true,
    unstubGlobals: true,
    // Playwright specs live under e2e/ and must not be collected by Vitest.
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.output/**',
      '**/e2e/**',
      '**/playwright-report/**',
      '**/test-results/**',
    ],
  },
})
