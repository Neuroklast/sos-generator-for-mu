/** Formats a number as a Euro currency string with 2 decimal places (de-DE locale). */
export const fmtEur = (n: number) =>
  n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

/** Returns the percentage share of `part` within `total`, formatted to one decimal place. */
export const fmtPct = (part: number, total: number) =>
  total > 0 ? ((part / total) * 100).toFixed(1) : '0.0'

/** Returns the combined distribution fee + recoupable expenses for an artist row. */
export const totalDeductions = (rev: { distributionFeeDeducted: number; totalExpenses: number }) =>
  rev.distributionFeeDeducted + rev.totalExpenses
