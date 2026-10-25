import { useEffect, useState, type ReactNode } from 'react'
import { LIGHT_QUERY, applyTheme, readThemePref, resolveTheme, writeThemePref } from './theme'
import type { ThemePref } from './theme'
import { ThemeContext } from './useTheme'

function systemPrefersLight(): boolean {
  return window.matchMedia(LIGHT_QUERY).matches
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [pref, setPrefState] = useState<ThemePref>(readThemePref)
  const [prefersLight, setPrefersLight] = useState(systemPrefersLight)
  const theme = resolveTheme(pref, prefersLight)

  useEffect(() => {
    const query = window.matchMedia(LIGHT_QUERY)
    const onChange = () => setPrefersLight(query.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  useEffect(() => applyTheme(theme), [theme])

  const setPref = (next: ThemePref) => {
    writeThemePref(next)
    setPrefState(next)
  }

  return <ThemeContext value={{ pref, theme, setPref }}>{children}</ThemeContext>
}
