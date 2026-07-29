import { useCallback, useEffect, useState } from 'react'

import {
  type ResolvedTheme,
  type ThemePreference,
  applyTheme,
  nextThemePreference,
  readStoredTheme,
  resolveTheme,
  THEME_STORAGE_KEY,
} from '../lib/theme'

export function useTheme() {
  const [preference, setPreferenceState] =
    useState<ThemePreference>('system')
  const [resolved, setResolved] = useState<ResolvedTheme>('light')

  useEffect(() => {
    const stored = readStoredTheme()
    const next = resolveTheme(stored)
    setPreferenceState(stored)
    setResolved(next)
    applyTheme(next)
  }, [])

  useEffect(() => {
    if (preference !== 'system') return

    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => {
      const next = resolveTheme('system')
      setResolved(next)
      applyTheme(next)
    }

    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [preference])

  const setPreference = useCallback((next: ThemePreference) => {
    const resolvedNext = resolveTheme(next)
    setPreferenceState(next)
    setResolved(resolvedNext)
    applyTheme(resolvedNext)
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next)
    } catch {
      // Private mode / blocked storage should not break the editor.
    }
  }, [])

  const cycleTheme = useCallback(() => {
    setPreference(nextThemePreference(preference))
  }, [preference, setPreference])

  return { preference, resolved, setPreference, cycleTheme }
}
