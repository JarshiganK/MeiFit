import { createContext, use } from 'react'
import type { Theme, ThemePref } from './theme'

export interface ThemeContextValue {
  pref: ThemePref
  theme: Theme
  setPref: (pref: ThemePref) => void
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)

export function useTheme(): ThemeContextValue {
  const value = use(ThemeContext)
  if (!value) throw new Error('useTheme must be used inside <ThemeProvider>')
  return value
}
