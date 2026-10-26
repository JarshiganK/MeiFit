import type { RestTimer } from '../domain/records'
import type { FocusTimer } from '../domain/study'
import { db } from './db'

/** Every setting and its type. Add keys here as features need them. */
export interface SettingsMap {
  debug: boolean
  /** Photo meal recognition with the user's own Gemini key (plan §11). Off by default. */
  geminiEnabled: boolean
  geminiKey: string
  geminiModel: string
  fitnessCheckIntervalWeeks: number
  /** Due date of the baseline fitness check booked at setup (YYYY-MM-DD). */
  baselineCheckDue: string
  /** A half-finished first-launch setup, so it resumes after iOS closes the app. */
  setupDraft: unknown
  /** Bedtime (epoch ms) of a sleep started with "Going to sleep" and not ended yet. */
  openSleep: number
  /** The running focus timer, if any (plan §12: it keeps its start time). */
  focusTimer: FocusTimer | null
  /** Up to 3 main lifts (exercise ids) tracked at fitness checks. */
  fitnessLifts: number[]
  /** A fitness check in progress, so it resumes after iOS closes the app. */
  fitnessDraft: unknown
  /** Rest between sets, in seconds (plan §6). */
  restSeconds: number
  /** The rest timer running on this phone, if any (plan §12: it keeps its start time). */
  restTimer: RestTimer | null
}

export type SettingKey = keyof SettingsMap

export async function getSetting<K extends SettingKey>(
  key: K,
  fallback: SettingsMap[K],
): Promise<SettingsMap[K]> {
  const row = await db.settings.get(key)
  return row === undefined ? fallback : (row.value as SettingsMap[K])
}

export async function setSetting<K extends SettingKey>(
  key: K,
  value: SettingsMap[K],
): Promise<void> {
  await db.settings.put({ key, value })
}

export async function deleteSetting(key: SettingKey): Promise<void> {
  await db.settings.delete(key)
}
