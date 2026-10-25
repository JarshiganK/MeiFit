import { createContext, use } from 'react'

export interface ToastOptions {
  message: string
  action?: { label: string; onAction: () => void }
  /** Milliseconds before it hides; null keeps it until acted on or dismissed. */
  durationMs?: number | null
}

export interface ToastApi {
  show: (options: ToastOptions) => void
  dismiss: () => void
}

export const ToastContext = createContext<ToastApi | null>(null)

export function useToast(): ToastApi {
  const api = use(ToastContext)
  if (!api) throw new Error('useToast must be used inside <ToastProvider>')
  return api
}
