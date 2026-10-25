import { useState } from 'react'
import { vi } from 'vitest'

/** Test stand-in for `virtual:pwa-register/react`. Tests set `pwaState` before rendering. */
export const pwaState = {
  needRefresh: false,
  offlineReady: false,
  updateServiceWorker: vi.fn((_reload?: boolean) => Promise.resolve()),
}

export function useRegisterSW() {
  const needRefresh = useState(pwaState.needRefresh)
  const offlineReady = useState(pwaState.offlineReady)
  return {
    needRefresh,
    offlineReady,
    updateServiceWorker: pwaState.updateServiceWorker,
  }
}
