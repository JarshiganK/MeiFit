/**
 * Persistent storage (plan §16): asks the browser not to clear the app's data
 * to free up space. Home Screen apps on iOS are already exempt from Safari's
 * 7-day clean-up, but the request still helps elsewhere.
 */
export interface StorageStatus {
  supported: boolean
  persisted: boolean
  usageBytes?: number
}

export async function getStorageStatus(): Promise<StorageStatus> {
  const storage = navigator.storage as StorageManager | undefined
  if (!storage?.persisted) return { supported: false, persisted: false }
  const status: StorageStatus = { supported: true, persisted: await storage.persisted() }
  try {
    const { usage } = await storage.estimate()
    if (usage !== undefined) status.usageBytes = usage
  } catch {
    // The estimate is optional.
  }
  return status
}

/** Returns true if the browser agreed to keep the data. */
export async function requestPersistentStorage(): Promise<boolean> {
  const storage = navigator.storage as StorageManager | undefined
  if (!storage?.persist) return false
  try {
    return await storage.persist()
  } catch {
    return false
  }
}
