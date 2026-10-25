import { afterEach, describe, expect, it, vi } from 'vitest'
import { getSetting } from '../db/settings'

const eruda = vi.hoisted(() => ({ init: vi.fn(), destroy: vi.fn() }))
vi.mock('eruda', () => ({ default: eruda }))

import {
  LEGACY_DEBUG_KEY,
  bootDebugConsole,
  isDebugEnabled,
  setDebugEnabled,
  stopDebugConsole,
} from './debug'

afterEach(() => {
  stopDebugConsole()
  eruda.init.mockClear()
  eruda.destroy.mockClear()
})

describe('debug console toggle', () => {
  it('is off by default', async () => {
    expect(await isDebugEnabled()).toBe(false)
  })

  it('saves the choice in the settings table and loads Eruda once', async () => {
    await setDebugEnabled(true)
    await setDebugEnabled(true)
    expect(await getSetting('debug', false)).toBe(true)
    expect(eruda.init).toHaveBeenCalledOnce()
  })

  it('removes Eruda when turned off', async () => {
    await setDebugEnabled(true)
    await setDebugEnabled(false)
    expect(await isDebugEnabled()).toBe(false)
    expect(eruda.destroy).toHaveBeenCalledOnce()
  })
})

describe('bootDebugConsole', () => {
  it('starts the console when it was left on', async () => {
    await setDebugEnabled(true)
    stopDebugConsole()
    eruda.init.mockClear()
    await bootDebugConsole()
    expect(eruda.init).toHaveBeenCalledOnce()
  })

  it('does nothing when it is off', async () => {
    await bootDebugConsole()
    expect(eruda.init).not.toHaveBeenCalled()
  })

  it('moves the Phase 0 localStorage flag into the settings table once', async () => {
    localStorage.setItem(LEGACY_DEBUG_KEY, '1')
    await bootDebugConsole()
    expect(await getSetting('debug', false)).toBe(true)
    expect(localStorage.getItem(LEGACY_DEBUG_KEY)).toBeNull()
    expect(eruda.init).toHaveBeenCalledOnce()
  })

  it('drops an unexpected legacy value without turning the console on', async () => {
    localStorage.setItem(LEGACY_DEBUG_KEY, 'yes')
    await bootDebugConsole()
    expect(await isDebugEnabled()).toBe(false)
    expect(localStorage.getItem(LEGACY_DEBUG_KEY)).toBeNull()
  })

  it('carries on when storage is blocked', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    await expect(bootDebugConsole()).resolves.toBeUndefined()
    expect(eruda.init).not.toHaveBeenCalled()
  })
})
