/**
 * The clipboard import format from Shortcuts (plan §11). One or more lines;
 * DQ1 is the format version:
 *
 *   DQ1;meal;2026-10-25T13:05;chicken curry,soya curry,rice
 *   DQ1;sleep;2026-10-24T23:10;2026-10-25T06:28
 *   DQ1;steps;2026-10-24;8234
 */
import { isLocalDate, parseImportInstant, type LocalDate } from './date'
import { MAX_SLEEP_MS } from './sleep'

export const FORMAT_VERSION = 'DQ1'
export const MAX_STEPS = 200_000

export type ImportItem =
  | { kind: 'meal'; at: number; names: string[]; line: number }
  | { kind: 'sleep'; bedAt: number; wakeAt: number; line: number }
  | { kind: 'steps'; date: LocalDate; steps: number; line: number }

export type ImportProblem =
  'version' | 'kind' | 'fields' | 'time' | 'names' | 'sleepOrder' | 'date' | 'steps'

export interface ParsedImport {
  items: ImportItem[]
  problems: { line: number; problem: ImportProblem }[]
}

export function parseImport(text: string): ParsedImport {
  const items: ImportItem[] = []
  const problems: ParsedImport['problems'] = []
  text.split(/\r?\n/).forEach((raw, i) => {
    const line = i + 1
    const value = raw.trim()
    if (value === '') return
    const parts = value.split(';').map((p) => p.trim())
    if (parts[0]?.toUpperCase() !== FORMAT_VERSION)
      return problems.push({ line, problem: 'version' })
    const kind = parts[1]?.toLowerCase()
    if (kind === 'meal') {
      if (parts.length < 4) return problems.push({ line, problem: 'fields' })
      const at = parseImportInstant(parts[2]!)
      if (at === undefined) return problems.push({ line, problem: 'time' })
      const names = parts
        .slice(3)
        .join(';')
        .split(',')
        .map((n) => n.trim())
        .filter(Boolean)
      if (names.length === 0) return problems.push({ line, problem: 'names' })
      return items.push({ kind, at, names, line })
    }
    if (kind === 'sleep') {
      if (parts.length !== 4) return problems.push({ line, problem: 'fields' })
      const bedAt = parseImportInstant(parts[2]!)
      const wakeAt = parseImportInstant(parts[3]!)
      if (bedAt === undefined || wakeAt === undefined)
        return problems.push({ line, problem: 'time' })
      if (wakeAt <= bedAt || wakeAt - bedAt > MAX_SLEEP_MS) {
        return problems.push({ line, problem: 'sleepOrder' })
      }
      return items.push({ kind, bedAt, wakeAt, line })
    }
    if (kind === 'steps') {
      if (parts.length !== 4) return problems.push({ line, problem: 'fields' })
      if (!isLocalDate(parts[2])) return problems.push({ line, problem: 'date' })
      const steps = Number(parts[3])
      if (!Number.isInteger(steps) || steps < 0 || steps > MAX_STEPS) {
        return problems.push({ line, problem: 'steps' })
      }
      return items.push({ kind, date: parts[2], steps, line })
    }
    return problems.push({ line, problem: 'kind' })
  })
  return { items, problems }
}

// ---------------------------------------------------------------- fuzzy match

/** Lower case, no punctuation or extra spaces, so "Chicken-Curry!" matches "chicken curry". */
export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function editDistance(a: string, b: string): number {
  const row = Array.from({ length: b.length + 1 }, (_, j) => j)
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0]!
    row[0] = i
    for (let j = 1; j <= b.length; j++) {
      const cur = row[j]!
      row[j] = Math.min(row[j]! + 1, row[j - 1]! + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1))
      prev = cur
    }
  }
  return row[b.length]!
}

/** How alike two names are, 0–1: exact, contained, shared words, or close spelling. */
export function similarity(a: string, b: string): number {
  const x = normalizeName(a)
  const y = normalizeName(b)
  if (!x || !y) return 0
  if (x === y) return 1
  if (x.includes(y) || y.includes(x)) return 0.9
  const xs = new Set(x.split(' '))
  const ys = new Set(y.split(' '))
  const shared = [...xs].filter((w) => ys.has(w)).length
  const words = shared / Math.max(xs.size, ys.size)
  const spelling = 1 - editDistance(x, y) / Math.max(x.length, y.length)
  return Math.max(words * 0.85, spelling)
}

export const MATCH_THRESHOLD = 0.6

/** The best menu item for a name, if one is close enough. */
export function bestMatch<T extends { name: string }>(
  name: string,
  menu: readonly T[],
): { item: T; score: number } | undefined {
  let best: { item: T; score: number } | undefined
  for (const item of menu) {
    const score = similarity(name, item.name)
    if (!best || score > best.score) best = { item, score }
  }
  return best && best.score >= MATCH_THRESHOLD ? best : undefined
}
