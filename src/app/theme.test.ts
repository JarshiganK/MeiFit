import { describe, expect, it, vi } from 'vitest'
import { THEME_KEY, applyTheme, readThemePref, resolveTheme, writeThemePref } from './theme'

describe('theme preference', () => {
  it('defaults to system and round-trips light and dark', () => {
    expect(readThemePref()).toBe('system')
    writeThemePref('light')
    expect(readThemePref()).toBe('light')
    writeThemePref('dark')
    expect(readThemePref()).toBe('dark')
    writeThemePref('system')
    expect(localStorage.getItem(THEME_KEY)).toBeNull()
  })

  it('ignores unknown stored values', () => {
    localStorage.setItem(THEME_KEY, 'neon')
    expect(readThemePref()).toBe('system')
  })

  it('falls back to system when storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(readThemePref()).toBe('system')
    expect(() => writeThemePref('dark')).not.toThrow()
  })
})

describe('resolveTheme', () => {
  it('is dark by default and follows the system only on "system"', () => {
    expect(resolveTheme('system', false)).toBe('dark')
    expect(resolveTheme('system', true)).toBe('light')
    expect(resolveTheme('dark', true)).toBe('dark')
    expect(resolveTheme('light', false)).toBe('light')
  })
})

describe('applyTheme', () => {
  it('sets data-theme, color-scheme and the theme-color meta', () => {
    const meta = document.createElement('meta')
    meta.name = 'theme-color'
    meta.content = 'old'
    document.head.append(meta)
    document.documentElement.style.setProperty('--color-bg', 'rgb(1, 2, 3)')

    applyTheme('light')

    expect(document.documentElement.dataset.theme).toBe('light')
    expect(document.documentElement.style.colorScheme).toBe('light')
    expect(meta.content).toBe('rgb(1, 2, 3)')
    meta.remove()
    document.documentElement.style.removeProperty('--color-bg')
  })
})
