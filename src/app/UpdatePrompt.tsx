import { useEffect } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { en } from '../copy/en'
import { useToast } from '../ui'

/** How often an open app checks for a new deploy (plan §12: updates can lag). */
export const UPDATE_CHECK_MS = 60 * 60 * 1000

/**
 * Registers the service worker and shows "Update available — Reload" when a
 * new version is waiting. Renders nothing itself; it uses the toast.
 */
export function UpdatePrompt() {
  const toast = useToast()
  const {
    needRefresh: [needRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      if (!registration) return
      window.setInterval(() => void registration.update(), UPDATE_CHECK_MS)
    },
  })

  useEffect(() => {
    if (!needRefresh) return
    toast.show({
      message: en.update.available,
      action: { label: en.update.reload, onAction: () => void updateServiceWorker(true) },
      durationMs: null,
    })
  }, [needRefresh, toast, updateServiceWorker])

  useEffect(() => {
    if (!offlineReady) return
    toast.show({ message: en.update.offlineReady })
    setOfflineReady(false)
  }, [offlineReady, setOfflineReady, toast])

  return null
}
