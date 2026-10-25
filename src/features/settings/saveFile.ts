export type SaveResult = 'shared' | 'downloaded' | 'cancelled'

/**
 * Saves a file. On iPhone the share sheet offers "Save to Files", which works
 * from the Home Screen app; elsewhere it falls back to a normal download.
 */
export async function saveFile(blob: Blob, fileName: string): Promise<SaveResult> {
  const file = new File([blob], fileName, { type: blob.type })
  if (typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: fileName })
      return 'shared'
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return 'cancelled'
      // Sharing failed for another reason: fall back to a download.
    }
  }
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.append(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000)
  return 'downloaded'
}
