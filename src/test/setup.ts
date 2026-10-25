import '@testing-library/jest-dom/vitest'
import 'fake-indexeddb/auto'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'
import { db } from '../db/db'

// Every test starts with an empty database.
afterEach(async () => {
  await Promise.all(db.tables.map((table) => table.clear()))
})

// Node-environment tests (tests/*.test.ts) share this file; browser shims apply only in jsdom.
if (typeof window !== 'undefined') {
  afterEach(() => {
    cleanup()
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
  })

  // jsdom has no matchMedia; default to a dark system theme and full motion.
  if (!window.matchMedia) {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    })
  }

  // React Router's ScrollRestoration calls scrollTo, which jsdom doesn't implement.
  window.scrollTo = vi.fn()

  // jsdom's <dialog> lacks showModal/close in some versions.
  if (typeof HTMLDialogElement !== 'undefined' && !HTMLDialogElement.prototype.showModal) {
    HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
      this.open = true
    }
    HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
      this.open = false
      this.dispatchEvent(new Event('close'))
    }
  }
}
