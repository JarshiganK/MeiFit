import { afterEach, describe, expect, it, vi } from 'vitest'
import { getStorageStatus, requestPersistentStorage } from './storage'

// jsdom has no navigator.storage, so each test defines the one it needs.
function mockStorage(storage: Partial<StorageManager> | undefined) {
  Object.defineProperty(navigator, 'storage', { value: storage, configurable: true })
}

afterEach(() => {
  Reflect.deleteProperty(navigator, 'storage')
})

describe('storage status', () => {
  it('reports unsupported when the browser has no storage manager', async () => {
    mockStorage(undefined)
    expect(await getStorageStatus()).toEqual({ supported: false, persisted: false })
    expect(await requestPersistentStorage()).toBe(false)
  })

  it('reports whether storage is persistent and how much is used', async () => {
    mockStorage({
      persisted: () => Promise.resolve(true),
      estimate: () => Promise.resolve({ usage: 1_500_000, quota: 500_000_000 }),
    })
    expect(await getStorageStatus()).toEqual({
      supported: true,
      persisted: true,
      usageBytes: 1_500_000,
    })
  })

  it('still works when estimate is missing or fails', async () => {
    mockStorage({
      persisted: () => Promise.resolve(false),
      estimate: () => Promise.reject(new Error('nope')),
    })
    expect(await getStorageStatus()).toEqual({ supported: true, persisted: false })
  })

  it('asks the browser to keep the data and returns its answer', async () => {
    const persist = vi.fn(() => Promise.resolve(true))
    mockStorage({ persist, persisted: () => Promise.resolve(false) })
    expect(await requestPersistentStorage()).toBe(true)
    expect(persist).toHaveBeenCalledOnce()
  })

  it('treats a failed request as a refusal', async () => {
    mockStorage({ persist: () => Promise.reject(new Error('denied')) })
    expect(await requestPersistentStorage()).toBe(false)
  })
})
