// @vitest-environment node
import { describe, expect, it } from 'vitest'

/**
 * The unit suite runs twice: in Asia/Colombo (UTC+5:30, no DST) and in
 * America/Los_Angeles (UTC−8/−7). This fails if TZ wasn't actually applied,
 * so a date bug can't slip through by running in only one zone.
 */
const EXPECTED_OFFSETS: Record<string, { jan: number; jul: number }> = {
  'Asia/Colombo': { jan: -330, jul: -330 },
  'America/Los_Angeles': { jan: 480, jul: 420 },
}

describe('time zone sanity', () => {
  const tz = process.env.TZ ?? ''

  it('runs in one of the two required time zones', () => {
    expect(Object.keys(EXPECTED_OFFSETS)).toContain(tz)
  })

  it('applies that time zone to Date', () => {
    const expected = EXPECTED_OFFSETS[tz]
    expect(expected).toBeDefined()
    expect(new Date(2026, 0, 15).getTimezoneOffset()).toBe(expected?.jan)
    expect(new Date(2026, 6, 15).getTimezoneOffset()).toBe(expected?.jul)
    expect(Intl.DateTimeFormat().resolvedOptions().timeZone).toBe(tz)
  })
})
