const numberFormat = new Intl.NumberFormat('en')

/** 2020 → "2,020". The app's copy is English, so the format is fixed rather than the device's. */
export function formatNumber(value: number): string {
  return numberFormat.format(value)
}
