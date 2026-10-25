// @vitest-environment node
import { readFileSync } from 'node:fs'
import { parse } from 'smol-toml'
import { describe, expect, it } from 'vitest'
import { globalHeaders, matchesPath, pathHeaders } from '../config/headers.ts'
import viteConfig from '../vite.config.ts'

interface NetlifyHeaders {
  for: string
  values: Record<string, string>
}

const toml = parse(readFileSync(new URL('../netlify.toml', import.meta.url), 'utf8')) as {
  headers?: NetlifyHeaders[]
}
const netlify = Object.fromEntries((toml.headers ?? []).map((h) => [h.for, h.values]))

describe('security headers', () => {
  it('netlify.toml and config/headers.ts declare exactly the same headers', () => {
    expect(netlify).toEqual({ '/*': globalHeaders, ...pathHeaders })
  })

  it('vite preview serves the same global headers', () => {
    expect(viteConfig.preview?.headers).toEqual(globalHeaders)
  })

  it('allows only the app itself plus Gemini for network calls', () => {
    const csp = globalHeaders['Content-Security-Policy']!
    expect(csp).toContain("default-src 'self'")
    expect(csp).toMatch(/script-src 'self'(;|$)/)
    expect(csp).toMatch(/connect-src 'self' https:\/\/generativelanguage\.googleapis\.com(;|$)/)
    expect(csp).not.toMatch(/unsafe-eval|https?:\/\/(?!generativelanguage)/)
  })

  it('allows the camera only for the app itself', () => {
    expect(globalHeaders['Permissions-Policy']).toContain('camera=(self)')
    expect(globalHeaders['X-Content-Type-Options']).toBe('nosniff')
    expect(globalHeaders['Referrer-Policy']).toBeTruthy()
  })

  it('serves the service worker and manifest with no-cache', () => {
    expect(pathHeaders['/sw.js']?.['Cache-Control']).toBe('no-cache')
    expect(pathHeaders['/manifest.webmanifest']?.['Cache-Control']).toBe('no-cache')
  })

  it('matches Netlify-style path patterns', () => {
    expect(matchesPath('/assets/*', '/assets/index-abc.js')).toBe(true)
    expect(matchesPath('/sw.js', '/sw.js')).toBe(true)
    expect(matchesPath('/sw.js', '/sw.js.map')).toBe(false)
  })
})
