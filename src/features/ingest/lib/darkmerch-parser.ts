/**
 * Darkmerch CSV parser.
 *
 * Expected CSV format (comma-delimited):
 *   DATE,ORDER NUMBER,BAND,NET REVENUE
 *   Q4 2025 - Q1 2026,1005,SMASH HIT COMBO,5
 *   Q4 2025 - Q1 2026,1008,darkmerch,
 *
 * Parser rules:
 *   - The header row is consumed and column positions are detected by name.
 *   - Rows where NET REVENUE is empty or zero are skipped.
 *   - Each valid row produces one SalesTransaction with is_physical = true.
 *
 * XLSX support:
 *   - Use `parseDarkmerchXLSX` to parse an `.xlsx` file (ArrayBuffer).
 *     It converts the first sheet to CSV and delegates to `parseDarkmerchCSV`.
 */

import type { SalesTransaction } from './csv-parser'

export interface DarkmerchParseResult {
  transactions: SalesTransaction[]
  errors: Array<{ row: number; reason: string; data: string }>
}

/**
 * Parses a Darkmerch orders CSV and returns a list of SalesTransactions.
 *
 * @param content - Raw CSV string with a Darkmerch-format header row.
 * @returns Parsed transactions and any row-level parse errors.
 */
export function parseDarkmerchCSV(content: string): DarkmerchParseResult {
  const transactions: SalesTransaction[] = []
  const errors: Array<{ row: number; reason: string; data: string }> = []

  const lines = content.split(/\r?\n/)
  if (lines.length === 0) return { transactions, errors }

  // ── Detect header and column indices ───────────────────────────────────────
  const headerLine = lines[0] ?? ''
  const delimiter = headerLine.includes(';') ? ';' : ','
  const headers = headerLine.split(delimiter).map(h => h.trim().toUpperCase())

  const colDate = headers.indexOf('DATE')
  const colBand = headers.indexOf('BAND')
  const colRevenue = headers.indexOf('NET REVENUE')

  if (colBand === -1 || colRevenue === -1) {
    errors.push({ row: 0, reason: 'Missing required columns: BAND, NET REVENUE', data: headerLine })
    return { transactions, errors }
  }

  // ── Parse data rows ─────────────────────────────────────────────────────────
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    if (!line || !line.trim()) continue

    const cols = line.split(delimiter).map(c => c.trim())

    const bandValue = cols[colBand] ?? ''
    const revenueStr = cols[colRevenue] ?? ''
    const dateValue = colDate >= 0 ? (cols[colDate] ?? '') : ''

    // Skip rows with no artist name
    if (!bandValue) {
      errors.push({ row: i + 1, reason: 'Empty BAND value', data: line })
      continue
    }

    // Skip rows where NET REVENUE is empty or zero
    if (revenueStr === '') continue
    const netRevenue = parseFloat(revenueStr.replace(',', '.'))
    if (isNaN(netRevenue) || netRevenue === 0) continue

    transactions.push({
      id: crypto.randomUUID(),
      source: 'darkmerch',
      sales_month: '',
      platform: 'DARKMERCH',
      country: '',
      main_artist: bandValue,
      original_artist: bandValue,
      // release_title stores the reporting period (DATE column) so the
      // revenue is grouped per-period in the release breakdown table.
      release_title: dateValue,
      track_title: '',
      upc_ean: '',
      isrc: '',
      catalog_number: '',
      // Darkmerch CSVs report aggregated revenue per order — assume qty 1
      // unless the source format provides per-item granularity.
      quantity: 1,
      net_revenue: netRevenue,
      currency: 'EUR',
      is_physical: true,
    })
  }

  return { transactions, errors }
}

/**
 * Parses a Darkmerch orders XLSX file and returns a list of SalesTransactions.
 *
 * Reads the first sheet of the workbook, converts it to CSV via SheetJS, and
 * delegates to {@link parseDarkmerchCSV} for row-level parsing.
 *
 * **Why dynamic import?** SheetJS (`xlsx`) is a large dependency (~1 MB). Using
 * a dynamic import ensures the module is only loaded when an XLSX file is actually
 * uploaded, keeping the initial bundle lean for users who only upload CSV files.
 *
 * **Edge cases:**
 * - Empty workbook (no sheets) → returns a structured error, no exception thrown.
 * - Corrupted or unsupported XLSX format → caught internally and returned as a
 *   structured error so callers do not need additional try-catch.
 *
 * @param buffer - Raw XLSX file content as an ArrayBuffer.
 * @returns Parsed transactions and any row-level or structural parse errors.
 */
export async function parseDarkmerchXLSX(buffer: ArrayBuffer): Promise<DarkmerchParseResult> {
  let XLSX: typeof import('xlsx')
  try {
    XLSX = await import('xlsx')
  } catch {
    return {
      transactions: [],
      errors: [{ row: 0, reason: 'Failed to load XLSX library', data: '' }],
    }
  }

  try {
    const workbook = XLSX.read(buffer, { type: 'array' })
    const firstSheetName = workbook.SheetNames[0]
    if (!firstSheetName) {
      return {
        transactions: [],
        errors: [{ row: 0, reason: 'XLSX workbook has no sheets', data: '' }],
      }
    }
    const sheet = workbook.Sheets[firstSheetName]
    if (!sheet) {
      return {
        transactions: [],
        errors: [{ row: 0, reason: 'Could not read first sheet from XLSX', data: '' }],
      }
    }
    const csv = XLSX.utils.sheet_to_csv(sheet)
    return parseDarkmerchCSV(csv)
  } catch (err) {
    const reason = err instanceof Error ? err.message : 'Unknown error reading XLSX file'
    return {
      transactions: [],
      errors: [{ row: 0, reason: `Failed to read XLSX file: ${reason}`, data: '' }],
    }
  }
}
