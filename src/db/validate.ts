/**
 * Small composable checks for validating imported rows. A check returns true
 * when the value is acceptable. Extra fields on a row are allowed.
 */
import { isLocalDate } from '../domain/date'

export type Check = (value: unknown) => boolean

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export const text: Check = (v) => typeof v === 'string'
export const nonEmptyText: Check = (v) => typeof v === 'string' && v.trim().length > 0
export const num: Check = (v) => typeof v === 'number' && Number.isFinite(v)
export const nonNegative: Check = (v) => num(v) && (v as number) >= 0
export const positive: Check = (v) => num(v) && (v as number) > 0
export const int: Check = (v) => Number.isInteger(v)
export const id: Check = (v) => Number.isInteger(v) && (v as number) > 0
/** A menu item id, or 0 for a one-off custom entry. */
export const foodRef: Check = (v) => Number.isInteger(v) && (v as number) >= 0
export const bool: Check = (v) => typeof v === 'boolean'
export const date: Check = isLocalDate
export const defined: Check = (v) => v !== undefined

export const oneOf =
  (...values: readonly unknown[]): Check =>
  (v) =>
    values.includes(v)

export const optional =
  (check: Check): Check =>
  (v) =>
    v === undefined || check(v)

export const nullable =
  (check: Check): Check =>
  (v) =>
    v === null || check(v)

export const arrayOf =
  (check: Check): Check =>
  (v) =>
    Array.isArray(v) && v.every(check)

export const shape =
  (fields: Record<string, Check>): Check =>
  (v) =>
    isRecord(v) && Object.entries(fields).every(([key, check]) => check(v[key]))
