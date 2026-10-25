import { afterEach, describe, expect, it, vi } from 'vitest'

const eruda = vi.hoisted(() => ({ init: vi.fn(), destroy: vi.fn() }))
vi.mock('eruda', () => ({ default: eruda }))

import { DEBUG_KEY, isDebugEnabled, setDebugEnabled, stopDebugConsole } from './debug'

afterEach(() => {
  stopDebugConsole()
  eruda.init.mockClear()
  eruda.destroy.mockClear()
})

describe('debug console toggle', () => {
  it('is off by default', () => {
    expect(isDebugEnabled()).toBe(false)
  })

  it('remembers the choice and loads Eruda once', async () => {
    await setDebugEnabled(true)
    await setDebugEnabled(true)
    expect(localStorage.getItem(DEBUG_KEY)).toBe('1')
    expect(isDebugEnabled()).toBe(true)
    expect(eruda.init).toHaveBeenCalledOnce()
  })

  it('removes Eruda and the flag when turned off', async () => {
    await setDebugEnabled(true)
    await setDebugEnabled(false)
    expect(isDebugEnabled()).toBe(false)
    expect(eruda.destroy).toHaveBeenCalledOnce()
  })

  it('still toggles when storage is blocked', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    await expect(setDebugEnabled(true)).resolves.toBeUndefined()
    expect(eruda.init).toHaveBeenCalledOnce()
    expect(isDebugEnabled()).toBe(false)
  })
})
