/**
 * Security and caching headers. This file is the source for `vite preview`;
 * `netlify.toml` must declare exactly the same values (tests/headers.test.ts
 * fails if the two ever differ).
 */

/** Gemini is the only remote origin the app may call (optional, Phase 3). */
export const GEMINI_ORIGIN = 'https://generativelanguage.googleapis.com'

export const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self'",
  // Inline styles are needed by the Eruda debug console (docs/DECISIONS.md). Scripts stay strict.
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  // data: fonts are Eruda's icon font (docs/DECISIONS.md).
  "font-src 'self' data:",
  `connect-src 'self' ${GEMINI_ORIGIN}`,
  "manifest-src 'self'",
  "worker-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ')

/** Headers applied to every response (`/*`). */
export const globalHeaders: Record<string, string> = {
  'Content-Security-Policy': CONTENT_SECURITY_POLICY,
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'Permissions-Policy':
    'camera=(self), microphone=(), geolocation=(), payment=(), usb=(), bluetooth=(), interest-cohort=()',
}

/** Extra headers for specific paths. */
export const pathHeaders: Record<string, Record<string, string>> = {
  '/sw.js': { 'Cache-Control': 'no-cache' },
  '/manifest.webmanifest': { 'Cache-Control': 'no-cache' },
  '/index.html': { 'Cache-Control': 'no-cache' },
  '/assets/*': { 'Cache-Control': 'public, max-age=31536000, immutable' },
}

/** Matches a Netlify-style path pattern (only a trailing `*` wildcard). */
export function matchesPath(pattern: string, path: string): boolean {
  return pattern.endsWith('*') ? path.startsWith(pattern.slice(0, -1)) : path === pattern
}
