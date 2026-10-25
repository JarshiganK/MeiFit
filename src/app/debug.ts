/**
 * Eruda debug console (plan §8, §15). It's a separate lazy chunk, so it costs
 * nothing until the toggle is on. The flag lives in the Dexie settings table.
 */
import { getSetting, setSetting } from '../db/settings'

/** Where Phase 0 kept the flag, before the database existed. */
export const LEGACY_DEBUG_KEY = 'dq.debug'

interface Eruda {
  init: () => void
  destroy: () => void
}

let eruda: Eruda | null = null

export function isDebugEnabled(): Promise<boolean> {
  return getSetting('debug', false)
}

export async function setDebugEnabled(on: boolean): Promise<void> {
  await setSetting('debug', on)
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

/** Moves a flag saved by the Phase 0 build into the settings table, once. */
export async function migrateLegacyDebugFlag(): Promise<void> {
  let legacy: string | null
  try {
    legacy = localStorage.getItem(LEGACY_DEBUG_KEY)
  } catch {
    return
  }
  if (legacy === null) return
  if (legacy === '1') await setSetting('debug', true)
  try {
    localStorage.removeItem(LEGACY_DEBUG_KEY)
  } catch {
    // Nothing to clean up if storage is blocked.
  }
}

/** Runs at start-up: loads the console if the user left it on. */
export async function bootDebugConsole(): Promise<void> {
  await migrateLegacyDebugFlag()
  if (await isDebugEnabled()) await startDebugConsole()
}
