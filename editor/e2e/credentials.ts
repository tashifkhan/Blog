/**
 * Known credentials for the Playwright webServer only. The real
 * `.env.local` password is overridden so tests never need to read it.
 */
export const E2E_PASSWORD = 'playwright-editor-password-for-local-e2e'
export const E2E_SESSION_SECRET = 'playwright-session-secret-32chars-min!!'
