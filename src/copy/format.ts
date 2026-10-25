const numberFormat = new Intl.NumberFormat('en')

/** 2020 → "2,020". The app's copy is English, so the format is fixed rather than the device's. */
export function formatNumber(value: number): string {
  return numberFormat.format(value)
}

const FRACTIONS: Record<number, string> = { 0.25: '¼', 0.5: '½', 0.75: '¾' }

/** 1.5 → "1½", 0.5 → "½", 2 → "2". */
export function formatCups(cups: number): string {
  const whole = Math.floor(cups)
  const fraction = FRACTIONS[cups - whole] ?? ''
  if (!fraction) return formatNumber(cups)
  return whole === 0 ? fraction : `${whole}${fraction}`
}
