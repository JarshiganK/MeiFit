// @vitest-environment node
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { contrastRatio, hueDistance, hexToHue } from './color.ts'

const css = readFileSync(new URL('../src/ui/theme.css', import.meta.url), 'utf8')

/** Reads `--color-*` hex tokens from a CSS block. */
function readColors(block: string): Record<string, string> {
  const colors: Record<string, string> = {}
  for (const m of block.matchAll(/--color-([a-z-]+):\s*(#[0-9a-f]{6})\s*;/gi)) {
    colors[m[1]!] = m[2]!.toLowerCase()
  }
  return colors
}

function block(startMarker: string): string {
  const start = css.indexOf(startMarker)
  if (start < 0) throw new Error(`Missing ${startMarker} in theme.css`)
  return css.slice(start, css.indexOf('\n}', start))
}

const dark = readColors(block('@theme {'))
const light = { ...dark, ...readColors(block("[data-theme='light'] {")) }
const themes = { dark, light }

const TEXT_COLORS = ['text', 'muted', 'accent', 'str', 'vit', 'int', 'error'] as const
const SURFACES = ['bg', 'surface', 'raised'] as const
const STATS = ['str', 'vit', 'int'] as const

describe('colour helpers', () => {
  it('computes known contrast ratios', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 1)
    expect(contrastRatio('#777777', '#ffffff')).toBeCloseTo(4.48, 1)
  })

  it('computes hues and wraps hue distance around 360°', () => {
    expect(hexToHue('#ff0000')).toBe(0)
    expect(hexToHue('#00ff00')).toBe(120)
    expect(hueDistance(350, 10)).toBe(20)
  })
})

describe.each(Object.entries(themes))('%s theme', (_name, c) => {
  it('defines every required token', () => {
    for (const key of [...TEXT_COLORS, ...SURFACES, 'border', 'on-accent', 'on-error']) {
      expect(c[key], `--color-${key}`).toMatch(/^#[0-9a-f]{6}$/)
    }
  })

  it.each(TEXT_COLORS.flatMap((fg) => SURFACES.map((bg) => [fg, bg] as const)))(
    '%s on %s meets WCAG AA (4.5:1)',
    (fg, bg) => {
      expect(contrastRatio(c[fg]!, c[bg]!)).toBeGreaterThanOrEqual(4.5)
    },
  )

  it('keeps text readable on accent and error fills', () => {
    expect(contrastRatio(c['on-accent']!, c.accent!)).toBeGreaterThanOrEqual(4.5)
    expect(contrastRatio(c['on-error']!, c.error!)).toBeGreaterThanOrEqual(4.5)
  })

  it.each(STATS)('%s is at least 30° from the error and XP colours', (stat) => {
    const hue = hexToHue(c[stat]!)
    expect(hueDistance(hue, hexToHue(c.error!))).toBeGreaterThanOrEqual(30)
    expect(hueDistance(hue, hexToHue(c.accent!))).toBeGreaterThanOrEqual(30)
  })

  it('keeps the three stat colours at least 30° apart', () => {
    const [str, vit, int] = STATS.map((s) => hexToHue(c[s]!))
    expect(hueDistance(str!, vit!)).toBeGreaterThanOrEqual(30)
    expect(hueDistance(str!, int!)).toBeGreaterThanOrEqual(30)
    expect(hueDistance(vit!, int!)).toBeGreaterThanOrEqual(30)
  })
})
