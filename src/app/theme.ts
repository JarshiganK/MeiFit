export type ThemePref = 'system' | 'light' | 'dark'
export type Theme = 'light' | 'dark'

/** Kept in localStorage (not IndexedDB) so public/theme-init.js can apply it before first paint. */
export const THEME_KEY = 'dq.theme'
export const LIGHT_QUERY = '(prefers-color-scheme: light)'

export function readThemePref(): ThemePref {
  try {
    const value = localStorage.getItem(THEME_KEY)
    return value === 'light' || value === 'dark' ? value : 'system'
  } catch {
    return 'system'
  }
}

export function writeThemePref(pref: ThemePref): void {
  try {
    if (pref === 'system') localStorage.removeItem(THEME_KEY)
    else localStorage.setItem(THEME_KEY, pref)
  } catch {
    // Storage can be blocked (private mode); the choice lasts for this session.
  }
}

/** Dark unless the user or their system asks for light. */
export function resolveTheme(pref: ThemePref, systemPrefersLight: boolean): Theme {
  if (pref !== 'system') return pref
  return systemPrefersLight ? 'light' : 'dark'
}

export function applyTheme(theme: Theme, root: HTMLElement = document.documentElement): void {
  root.dataset.theme = theme
  root.style.colorScheme = theme
  const meta = document.querySelector('meta[name="theme-color"]')
  const bg = getComputedStyle(root).getPropertyValue('--color-bg').trim()
  if (meta && bg) meta.setAttribute('content', bg)
}
