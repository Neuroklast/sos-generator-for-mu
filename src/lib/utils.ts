import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Replaces any non-alphanumeric characters with underscores for safe filenames. */
export function createSafeFilename(name: string): string {
  return name.replace(/[^a-z0-9]/gi, '_')
}

/**
 * Formats a YYYY-MM string as a short month + 2-digit year label (e.g. "Jan 24").
 * Returns the original value unchanged if the input is not a valid YYYY-MM string.
 */
export function formatMonthTick(v: string): string {
  if (!v || !/^\d{4}-\d{2}$/.test(v)) return v
  const [y, m] = v.split('-')
  const year = Number(y)
  const month = Number(m) - 1
  if (isNaN(year) || isNaN(month) || month < 0 || month > 11) return v
  const d = new Date(year, month)
  return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
}
