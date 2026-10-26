// @vitest-environment node
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * The theme clears Tailwind's default scales, so a class like `text-5xl`
 * silently does nothing. This keeps every size class to a defined token.
 */
const root = new URL('../src/', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')
const css = readFileSync(join(root, 'ui/theme.css'), 'utf8')

function defined(prefix: string): Set<string> {
  const names = new Set<string>()
  for (const m of css.matchAll(new RegExp(`--${prefix}-([a-z0-9]+):`, 'g'))) names.add(m[1]!)
  return names
}

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return sourceFiles(path)
    return /\.tsx?$/.test(name) && !/\.test\.tsx?$/.test(name) ? [path] : []
  })
}

const files = sourceFiles(root).map((path) => ({ path, text: readFileSync(path, 'utf8') }))

describe('design token classes', () => {
  it('uses only the text sizes the theme defines', () => {
    const sizes = defined('text')
    const scale = /\btext-(xs|sm|base|lg|[0-9]xl|xl|display)\b/g
    const unknown = files.flatMap(({ path, text }) =>
      [...text.matchAll(scale)]
        .map((m) => m[1]!)
        .filter((size) => !sizes.has(size))
        .map((size) => `${path}: text-${size}`),
    )
    expect(sizes.size).toBeGreaterThan(5)
    expect(unknown).toEqual([])
  })
})
