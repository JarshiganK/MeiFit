/**
 * Eruda debug console (plan §8, §15). It's a separate lazy chunk, so it costs
 * nothing until the toggle is on. The flag lives in localStorage for now and
 * moves to the Dexie settings table in Phase 1 item 1.
 */
export const DEBUG_KEY = 'dq.debug'

interface Eruda {
  init: () => void
  destroy: () => void
}

let eruda: Eruda | null = null

export function isDebugEnabled(): boolean {
  try {
    return localStorage.getItem(DEBUG_KEY) === '1'
  } catch {
    return false
  }
}

export async function setDebugEnabled(on: boolean): Promise<void> {
  try {
    if (on) localStorage.setItem(DEBUG_KEY, '1')
    else localStorage.removeItem(DEBUG_KEY)
  } catch {
    // Storage blocked: the console still toggles for this session.
  }
  if (on) await startDebugConsole()
  else stopDebugConsole()
}

export async function startDebugConsole(): Promise<void> {
  if (eruda) return
  const mod = await import('eruda')
  eruda = mod.default
  eruda.init()
}

export function stopDebugConsole(): void {
  eruda?.destroy()
  eruda = null
}
