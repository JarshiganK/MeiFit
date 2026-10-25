// Fails the build if the initial JavaScript is over budget (CLAUDE.md §7: ≤ 200 KB gzipped).
// "Initial" means the entry script plus every module preloaded by dist/index.html.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { gzipSync } from 'node:zlib'

const BUDGET_KB = 200
const dist = new URL('../dist/', import.meta.url)
const html = readFileSync(new URL('index.html', dist), 'utf8')

const scripts = [
  ...html.matchAll(/<script[^>]+type="module"[^>]+src="\/([^"]+)"/g),
  ...html.matchAll(/<link[^>]+rel="modulepreload"[^>]+href="\/([^"]+)"/g),
].map((m) => m[1])

const files = [...new Set(scripts)]
let total = 0
for (const file of files) {
  const size = gzipSync(readFileSync(join(dist.pathname.replace(/^\/(\w:)/, '$1'), file))).length
  total += size
  console.log(`  ${file}  ${(size / 1024).toFixed(1)} KB gz`)
}

const kb = total / 1024
console.log(`Initial JS: ${kb.toFixed(1)} KB gzipped (budget ${BUDGET_KB} KB)`)
if (files.length === 0) {
  console.error('No entry scripts found in dist/index.html')
  process.exit(1)
}
if (kb > BUDGET_KB) {
  console.error(`Initial JS is over budget by ${(kb - BUDGET_KB).toFixed(1)} KB`)
  process.exit(1)
}
