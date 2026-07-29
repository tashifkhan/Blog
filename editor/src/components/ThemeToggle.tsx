import { Monitor, Moon, Sun } from 'lucide-react'

import { useTheme } from '../hooks/use-theme'
import { themeLabel } from '../lib/theme'

type ThemeToggleProps = {
  className?: string
}

export function ThemeToggle({ className = '' }: ThemeToggleProps) {
  const { preference, cycleTheme } = useTheme()

  const Icon =
    preference === 'dark' ? Moon : preference === 'light' ? Sun : Monitor

  return (
    <button
      className={`theme-toggle ${className}`.trim()}
      type="button"
      onClick={cycleTheme}
      title={`Theme: ${themeLabel(preference)} (click to cycle)`}
      aria-label={`Theme: ${themeLabel(preference)}. Click to cycle light, dark, and system.`}
    >
      <Icon size={16} aria-hidden="true" />
      <span className="theme-toggle-label">{themeLabel(preference)}</span>
    </button>
  )
}
