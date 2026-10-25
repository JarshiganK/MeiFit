import { db } from './db'

/** Every setting and its type. Add keys here as features need them. */
export interface SettingsMap {
  debug: boolean
  geminiKey: string
  geminiModel: string
  fitnessCheckIntervalWeeks: number
  /** Due date of the baseline fitness check booked at setup (YYYY-MM-DD). */
  baselineCheckDue: string
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
