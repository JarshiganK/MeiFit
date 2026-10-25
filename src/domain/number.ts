/** Reads a typed number: "69,5" → 69.5; empty → undefined; anything else that isn't a number → NaN. */
export function parseNumber(text: string): number | undefined {
  const trimmed = text.trim().replace(',', '.')
  return trimmed === '' ? undefined : Number(trimmed)
}
