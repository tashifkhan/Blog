export type ThemePreference = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

export const THEME_STORAGE_KEY = 'pressroom:theme:v1'

export function isThemePreference(value: unknown): value is ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system'
}

export function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

export function resolveTheme(preference: ThemePreference): ResolvedTheme {
  return preference === 'system' ? getSystemTheme() : preference
}

export function readStoredTheme(): ThemePreference {
  if (typeof window === 'undefined') return 'system'
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
    return isThemePreference(stored) ? stored : 'system'
  } catch {
    return 'system'
  }
}

export function applyTheme(resolved: ResolvedTheme) {
  if (typeof document === 'undefined') return
  document.documentElement.dataset.theme = resolved
  document.documentElement.style.colorScheme = resolved
}

/**
 * Cycles light → dark → system so the control can honor OS preference without
 * a separate menu.
 */
export function nextThemePreference(
  preference: ThemePreference,
): ThemePreference {
  if (preference === 'light') return 'dark'
  if (preference === 'dark') return 'system'
  return 'light'
}

export function themeLabel(preference: ThemePreference): string {
  if (preference === 'light') return 'Light'
  if (preference === 'dark') return 'Dark'
  return 'System'
}
