import { X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { en } from '../copy/en'
import { IconButton } from './IconButton'
import { ToastContext, type ToastApi, type ToastOptions } from './toastContext'

export const DEFAULT_TOAST_MS = 5000

interface ActiveToast extends ToastOptions {
  id: number
}

/**
 * One toast at a time, announced politely, sitting just above the tab bar in
 * the thumb zone. Undo toasts replace "are you sure?" dialogs.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ActiveToast | null>(null)

  const dismiss = useCallback(() => setToast(null), [])
  const show = useCallback((options: ToastOptions) => {
    setToast({ ...options, id: Date.now() + Math.random() })
  }, [])

  useEffect(() => {
    if (!toast) return
    const duration = toast.durationMs === undefined ? DEFAULT_TOAST_MS : toast.durationMs
    if (duration === null) return
    const timer = window.setTimeout(() => setToast(null), duration)
    return () => window.clearTimeout(timer)
  }, [toast])

  const api = useMemo<ToastApi>(() => ({ show, dismiss }), [show, dismiss])

  return (
    <ToastContext value={api}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 z-40 mx-auto max-w-lg px-safe bottom-[calc(var(--tabbar-height)+env(safe-area-inset-bottom)+0.75rem)]"
      >
        {toast && (
          <div
            key={toast.id}
            className="pointer-events-auto flex min-h-13 animate-toast-in items-center gap-2 rounded-lg border border-border bg-raised py-1 pl-4 pr-1 text-text shadow-sheet"
          >
            <p className="min-w-0 flex-1 py-2 text-sm font-medium">{toast.message}</p>
            {toast.action && (
              <button
                type="button"
                onClick={() => {
                  toast.action?.onAction()
                  dismiss()
                }}
                className="min-h-11 rounded-md px-3 text-sm font-bold text-accent"
              >
                {toast.action.label}
              </button>
            )}
            <IconButton label={en.common.dismiss} icon={<X size={18} />} onClick={dismiss} />
          </div>
        )}
      </div>
    </ToastContext>
  )
}
