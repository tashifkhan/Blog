import { describe, expect, it } from 'vitest'

import {
  isThemePreference,
  nextThemePreference,
  resolveTheme,
  themeLabel,
} from './theme'

describe('theme helpers', () => {
  it('accepts only known preferences', () => {
    expect(isThemePreference('light')).toBe(true)
    expect(isThemePreference('dark')).toBe(true)
    expect(isThemePreference('system')).toBe(true)
    expect(isThemePreference('auto')).toBe(false)
    expect(isThemePreference(null)).toBe(false)
  })

  it('cycles light → dark → system → light', () => {
    expect(nextThemePreference('light')).toBe('dark')
    expect(nextThemePreference('dark')).toBe('system')
    expect(nextThemePreference('system')).toBe('light')
  })

  it('resolves explicit preferences without looking at the system', () => {
    expect(resolveTheme('light')).toBe('light')
    expect(resolveTheme('dark')).toBe('dark')
  })

  it('labels preferences for the control', () => {
    expect(themeLabel('light')).toBe('Light')
    expect(themeLabel('dark')).toBe('Dark')
    expect(themeLabel('system')).toBe('System')
  })
})
