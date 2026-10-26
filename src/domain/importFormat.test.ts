import { describe, expect, it } from 'vitest'
import { atLocalTime, parseImportInstant } from './date'
import { bestMatch, normalizeName, parseImport, similarity } from './importFormat'

describe('import date-times', () => {
  it('reads local times, with or without seconds', () => {
    expect(parseImportInstant('2026-10-25T13:05')).toBe(atLocalTime('2026-10-25', 13, 5))
    expect(parseImportInstant(' 2026-10-25T13:05:30 ')).toBe(
      atLocalTime('2026-10-25', 13, 5) + 30_000,
    )
  })

  it('honours an offset when the Shortcut gives one', () => {
    expect(parseImportInstant('2026-10-25T13:05:00+05:30')).toBe(Date.UTC(2026, 9, 25, 7, 35))
    expect(parseImportInstant('2026-10-25T07:35:00Z')).toBe(Date.UTC(2026, 9, 25, 7, 35))
  })

  it('refuses anything else', () => {
    expect(parseImportInstant('2026-10-25')).toBeUndefined()
    expect(parseImportInstant('yesterday')).toBeUndefined()
    expect(parseImportInstant('2026-02-30T10:00')).toBeUndefined()
  })
})

describe('parseImport (plan §11)', () => {
  it('reads all three kinds of line', () => {
    const { items, problems } = parseImport(
      [
        'DQ1;meal;2026-10-25T13:05;chicken curry, soya curry ,rice',
        'DQ1;sleep;2026-10-24T23:10;2026-10-25T06:28',
        '',
        'dq1;STEPS;2026-10-24;8234',
      ].join('\n'),
    )
    expect(problems).toEqual([])
    expect(items).toEqual([
      {
        kind: 'meal',
        at: atLocalTime('2026-10-25', 13, 5),
        names: ['chicken curry', 'soya curry', 'rice'],
        line: 1,
      },
      {
        kind: 'sleep',
        bedAt: atLocalTime('2026-10-24', 23, 10),
        wakeAt: atLocalTime('2026-10-25', 6, 28),
        line: 2,
      },
      { kind: 'steps', date: '2026-10-24', steps: 8234, line: 4 },
    ])
  })

  it('reports each bad line and keeps the good ones', () => {
    const { items, problems } = parseImport(
      [
        'DQ2;meal;2026-10-25T13:05;rice',
        'DQ1;nap;2026-10-25T13:05',
        'DQ1;meal;2026-10-25T13:05',
        'DQ1;meal;soon;rice',
        'DQ1;meal;2026-10-25T13:05; , ',
        'DQ1;sleep;2026-10-25T06:28;2026-10-24T23:10',
        'DQ1;sleep;2026-10-24T23:10',
        'DQ1;sleep;2026-10-24T23:10;later',
        'DQ1;steps;24 Oct;8234',
        'DQ1;steps;2026-10-24;-5',
        'DQ1;steps;2026-10-24',
        'DQ1;steps;2026-10-24;8234',
      ].join('\r\n'),
    )
    expect(problems).toEqual([
      { line: 1, problem: 'version' },
      { line: 2, problem: 'kind' },
      { line: 3, problem: 'fields' },
      { line: 4, problem: 'time' },
      { line: 5, problem: 'names' },
      { line: 6, problem: 'sleepOrder' },
      { line: 7, problem: 'fields' },
      { line: 8, problem: 'time' },
      { line: 9, problem: 'date' },
      { line: 10, problem: 'steps' },
      { line: 11, problem: 'fields' },
    ])
    expect(items).toHaveLength(1)
  })

  it('rejects a sleep over 24 hours', () => {
    expect(parseImport('DQ1;sleep;2026-10-23T23:10;2026-10-25T06:28').problems).toEqual([
      { line: 1, problem: 'sleepOrder' },
    ])
  })
})

describe('fuzzy matching to the menu', () => {
  const menu = [
    { name: 'Chicken curry' },
    { name: 'Soya curry' },
    { name: 'Rice' },
    { name: 'Parotta' },
    { name: 'Nescafe with milk (1 tsp sugar)' },
  ]

  it('normalises names', () => {
    expect(normalizeName('  Chicken-Curry! ')).toBe('chicken curry')
    expect(normalizeName('Café')).toBe('cafe')
  })

  it('matches exact, contained, misspelt and partly worded names', () => {
    expect(bestMatch('chicken curry', menu)?.item.name).toBe('Chicken curry')
    expect(bestMatch('rice', menu)?.score).toBe(1)
    expect(bestMatch('Nescafe', menu)?.item.name).toBe('Nescafe with milk (1 tsp sugar)')
    expect(bestMatch('parata', menu)?.item.name).toBe('Parotta')
    expect(bestMatch('soy curry', menu)?.item.name).toBe('Soya curry')
  })

  it('leaves unknown foods unmatched', () => {
    expect(bestMatch('pizza', menu)).toBeUndefined()
    expect(bestMatch('', menu)).toBeUndefined()
    expect(bestMatch('rice', [])).toBeUndefined()
    expect(similarity('!!', 'rice')).toBe(0)
  })
})
