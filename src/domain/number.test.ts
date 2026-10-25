import { describe, expect, it } from 'vitest'
import { parseNumber } from './number'

describe('parseNumber', () => {
  it('reads dots and commas as decimal points', () => {
    expect(parseNumber('69.5')).toBe(69.5)
    expect(parseNumber(' 69,5 ')).toBe(69.5)
  })

  it('treats empty as missing and junk as NaN', () => {
    expect(parseNumber('  ')).toBeUndefined()
    expect(parseNumber('abc')).toBeNaN()
  })
})
