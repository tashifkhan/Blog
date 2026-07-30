import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // `editor/` is a separate install with its own runner and dependencies —
    // running its suite from here resolves imports against the wrong
    // node_modules. Use `bun run test` inside editor/ for those.
    include: ['packages/**/*.test.ts'],
    environment: 'node',
    restoreMocks: true,
  },
})
