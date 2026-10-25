import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { saveFile } from './saveFile'

const blob = () => new Blob(['{}'], { type: 'application/json' })

function setShare(canShare: boolean, share: () => Promise<void>) {
  Object.defineProperty(navigator, 'canShare', { value: () => canShare, configurable: true })
  Object.defineProperty(navigator, 'share', { value: vi.fn(share), configurable: true })
}

let clicked: HTMLAnchorElement[]

beforeEach(() => {
  clicked = []
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
    this: HTMLAnchorElement,
  ) {
    clicked.push(this)
  })
  URL.createObjectURL = vi.fn(() => 'blob:backup')
  URL.revokeObjectURL = vi.fn()
})

afterEach(() => {
  Reflect.deleteProperty(navigator, 'canShare')
  Reflect.deleteProperty(navigator, 'share')
})

describe('saveFile', () => {
  it('uses the share sheet when files can be shared', async () => {
    setShare(true, () => Promise.resolve())
    expect(await saveFile(blob(), 'backup.json')).toBe('shared')
    expect(navigator.share).toHaveBeenCalledWith(
      expect.objectContaining({ files: [expect.any(File)] }),
    )
    expect(clicked).toHaveLength(0)
  })

  it('reports a cancelled share sheet without downloading', async () => {
    setShare(true, () => Promise.reject(new DOMException('cancelled', 'AbortError')))
    expect(await saveFile(blob(), 'backup.json')).toBe('cancelled')
    expect(clicked).toHaveLength(0)
  })

  it('falls back to a download when sharing fails for another reason', async () => {
    setShare(true, () => Promise.reject(new DOMException('nope', 'NotAllowedError')))
    expect(await saveFile(blob(), 'backup.json')).toBe('downloaded')
    expect(clicked[0]?.download).toBe('backup.json')
  })

  it('downloads when the browser cannot share files', async () => {
    expect(await saveFile(blob(), 'daily-quest-backup-2026-10-25.json')).toBe('downloaded')
    expect(clicked[0]?.download).toBe('daily-quest-backup-2026-10-25.json')
    expect(clicked[0]?.href).toBe('blob:backup')
    expect(document.querySelector('a[download]')).toBeNull() // the temporary link is removed
  })
})
