/** Formats a number as a Euro currency string with 2 decimal places (de-DE locale). */
export const fmtEur = (n: number) =>
  n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

/**
 * Formats a number as a full Euro currency string including the € symbol (de-DE locale).
 * Use this for display values that require the currency symbol (e.g. stat cards, summaries).
 */
export const fmtCurrencyEur = (n: number) =>
  new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(n)

/** Returns the percentage share of `part` within `total`, formatted to one decimal place. */
export const fmtPct = (part: number, total: number) =>
  total > 0 ? ((part / total) * 100).toFixed(1) : '0.0'

/** Returns the combined distribution fee + recoupable expenses for an artist row. */
export const totalDeductions = (rev: { distributionFeeDeducted: number; totalExpenses: number }) =>
  rev.distributionFeeDeducted + rev.totalExpenses
