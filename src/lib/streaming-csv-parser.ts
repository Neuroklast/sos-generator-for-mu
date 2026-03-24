import Papa from 'papaparse'
import type { SalesTransaction } from './csv-parser'
import { mapCSVHeadersToModel, parseCSVLine } from './csv-parser'

export interface ParseProgress {
  processedRows: number
  totalRows: number
  percentage: number
  isComplete: boolean
}

export interface StreamingParseResult {
  transactions: SalesTransaction[]
  uniqueArtists: string[]
  errors: Array<{ row: number; reason: string; data: string }>
}

/** Rows to process per scheduler tick to keep the UI responsive. */
const CHUNK_SIZE = 5000

function detectDelimiter(lines: string[]): string {
  // Take the first 6 non-empty lines as the sample; parse up to 6 rows
  // so PapaParse has enough context to auto-detect the delimiter reliably.
  const sampleLines = lines.filter(l => l.trim()).slice(0, 6)
  const sample = sampleLines.join('\n')
  if (!sample) return ','
  const result = Papa.parse(sample, { delimiter: '', preview: sampleLines.length })
  return (result.meta as { delimiter?: string }).delimiter || ','
}

/**
 * Removes a UTF-8 BOM character that some editors / Excel exports prepend.
 */
function stripBOM(text: string): string {
  return text.startsWith('\uFEFF') ? text.slice(1) : text
}

/**
 * Converts any incoming date string to a canonical `YYYY-MM` month key.
 *
 * Handles:
 *  - Already ISO: "2024-09" → "2024-09"
 *  - ISO with day:  "2024-09-01" → "2024-09"
 *  - European (DD/MM/YYYY):  "01/09/2024" → "2024-09"
 *  - Bandcamp (M/D/YY h:mma): "9/30/25 5:39pm" → "2025-09"
 *  - American (M/D/YYYY): "9/30/2025" → "2025-09"
 */
export function normalizeDateToMonth(dateStr: string): string {
  if (!dateStr) return ''
  const s = dateStr.trim()
  if (!s) return ''

  // Already YYYY-MM or YYYY-MM-DD
  const isoMatch = s.match(/^(\d{4})-(\d{2})(?:-\d{2})?/)
  if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}`

  // Slash-separated: X/Y/Z [optional time]
  const slashMatch = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/)
  if (slashMatch) {
    const a = parseInt(slashMatch[1], 10)
    const b = parseInt(slashMatch[2], 10)
    const rawYear = parseInt(slashMatch[3], 10)
    const year = rawYear < 100 ? 2000 + rawYear : rawYear

    // If the second part > 12 it cannot be a month → format is M/D/Y (American/Bandcamp)
    if (b > 12) {
      if (a >= 1 && a <= 12) return `${year}-${String(a).padStart(2, '0')}`
      return ''
    }
    // If the year is 2-digit → American/Bandcamp format M/D/YY, first part is month
    if (rawYear < 100) {
      if (a >= 1 && a <= 12) return `${year}-${String(a).padStart(2, '0')}`
      return ''
    }
    // 4-digit year: treat as European DD/MM/YYYY → second part is month
    if (b >= 1 && b <= 12) return `${year}-${String(b).padStart(2, '0')}`
    return ''
  }

  // Dot-separated (DE): "01.09.2024"
  const dotMatch = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})/)
  if (dotMatch) {
    const year = parseInt(dotMatch[3], 10)
    const month = parseInt(dotMatch[2], 10)
    if (month >= 1 && month <= 12) {
      return `${year}-${String(month).padStart(2, '0')}`
    }
  }

  // Fallback: return empty string for unrecognised formats so invalid dates
  // don't silently propagate through the system as 'Unknown' month keys.
  return ''
}

/**
 * Parses a revenue number that may use European ("1.234,56"), standard
 * ("1,234.56"), or scientific notation ("3.495e-4") decimal formats.
 */
function parseRevenue(raw: string): number {
  if (!raw) return 0
  const cleaned = raw.trim()
  if (!cleaned) return 0

  // Scientific notation (e.g. "3.495e-4" or "3,495E-4")
  const sciMatch = cleaned.match(/^([+-]?\d+[.,]\d+)[eE]([+-]?\d+)$/)
  if (sciMatch) {
    const mantissa = sciMatch[1].replace(',', '.')
    return parseFloat(`${mantissa}e${sciMatch[2]}`) || 0
  }
  // Plain scientific notation without decimal (e.g. "1e-3")
  if (/^[+-]?\d+[eE][+-]?\d+$/.test(cleaned)) {
    return parseFloat(cleaned) || 0
  }

  const lastComma = cleaned.lastIndexOf(',')
  const lastDot = cleaned.lastIndexOf('.')

  if (lastComma > lastDot) {
    // European notation: last separator is comma → "1.234,56"
    const normalised = cleaned.replace(/\./g, '').replace(',', '.')
    return parseFloat(normalised.replace(/[^0-9.-]/g, '')) || 0
  }

  // Standard notation (or plain integer)
  return parseFloat(cleaned.replace(/[^0-9.eE-]/g, '')) || 0
}

function parseQuantity(raw: string): number {
  if (!raw) return 0
  return parseInt(raw.replace(/[^0-9]/g, ''), 10) || 0
}

function processChunk(
  lines: string[],
  headers: string[],
  mapping: Record<string, string>,
  delimiter: string,
  source: 'believe' | 'bandcamp',
  startIndex: number,
  parseTag: string
): {
  transactions: SalesTransaction[]
  artists: Set<string>
  errors: Array<{ row: number; reason: string; data: string }>
} {
  const transactions: SalesTransaction[] = []
  const artists = new Set<string>()
  const errors: Array<{ row: number; reason: string; data: string }> = []
  const expectedCols = headers.length

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (!line.trim()) continue

    try {
      const values = parseCSVLine(line, delimiter)

      // Be lenient: if a row has fewer columns, fill with empty strings.
      // If it has way more (>= 2× expected), it's likely a corrupted row.
      if (values.length >= expectedCols * 2 && values.length > expectedCols) {
        errors.push({
          row: startIndex + i + 2,
          reason: `Too many columns: expected ~${expectedCols}, got ${values.length}`,
          data: line.substring(0, 120),
        })
        continue
      }

      const rowData: Record<string, string> = {}
      headers.forEach((header, idx) => {
        rowData[header] = values[idx] ?? ''
      })

      const mappedData: Record<string, string> = {}
      for (const [header, value] of Object.entries(rowData)) {
        const field = mapping[header]
        if (field) mappedData[field] = value
      }

      const originalArtist = (mappedData.original_artist ?? '').trim()
      const releaseType = (mappedData.release_type ?? '').trim().toLowerCase()

      // ── Bandcamp-specific row filters ──────────────────────────────────────
      // Skip payout rows: these are label-internal transfers, not sales income.
      if (source === 'bandcamp' && releaseType === 'payout') continue

      // ── Revenue resolution ─────────────────────────────────────────────────
      // For Bandcamp: prefer the pre-converted EUR balance column when present.
      // This avoids currency mixing (USD/GBP/PLN blindly summed in EUR fields).
      let netRevenue: number
      let currency: string
      if (source === 'bandcamp') {
        const eurBalance = parseRevenue(mappedData.balance_eur ?? '')
        if (eurBalance !== 0) {
          // Pre-converted EUR value is available — use it directly.
          netRevenue = eurBalance
          currency = 'EUR'
        } else {
          // No pre-converted balance; keep the raw amount + currency for
          // later conversion in the data-processor (exchange rates are applied
          // at process time when the full config including rates is available).
          netRevenue = parseRevenue(mappedData.net_revenue ?? '')
          currency = (mappedData.currency ?? 'EUR').trim() || 'EUR'
        }
      } else {
        netRevenue = parseRevenue(mappedData.net_revenue ?? '')
        currency = (mappedData.currency ?? 'EUR').trim() || 'EUR'
      }

      const quantity = parseQuantity(mappedData.quantity ?? '')

      // ── Physical product detection ─────────────────────────────────────────
      // Bandcamp uses item type "package" for physical merch/vinyl/CD orders,
      // but may also include other physical identifiers; combine both checks.
      const isPhysical = source === 'bandcamp'
        ? releaseType === 'package' || /physical|cd|vinyl|cassette|tape/i.test(releaseType)
        : /physical|cd|vinyl|cassette|tape/i.test(releaseType)

      // Skip rows with no artist and no revenue (Bandcamp transfer rows)
      if (!originalArtist && netRevenue === 0) continue

      if (originalArtist) artists.add(originalArtist)

      // Normalise the date to YYYY-MM for all sources.
      const rawMonth = (mappedData.sales_month ?? '').trim()
      const salesMonth = normalizeDateToMonth(rawMonth)

      // Bandcamp CSVs have no dedicated platform column; default to "Bandcamp".
      const platform = (mappedData.platform ?? '').trim() || (source === 'bandcamp' ? 'Bandcamp' : '')

      transactions.push({
        id: `${parseTag}-${startIndex + i}`,
        source,
        sales_month: salesMonth,
        platform,
        country: (mappedData.country ?? '').trim(),
        main_artist: originalArtist,
        original_artist: originalArtist,
        release_title: (mappedData.release_title ?? '').trim(),
        track_title: (mappedData.track_title ?? '').trim(),
        upc_ean: (mappedData.upc_ean ?? '').trim(),
        isrc: (mappedData.isrc ?? '').trim(),
        catalog_number: (mappedData.catalog_number ?? '').trim(),
        quantity,
        net_revenue: netRevenue,
        currency,
        is_physical: isPhysical,
      })
    } catch (err) {
      errors.push({
        row: startIndex + i + 2,
        reason: err instanceof Error ? err.message : 'Unknown parsing error',
        data: line.substring(0, 120),
      })
    }
  }

  return { transactions, artists, errors }
}

/**
 * Parses a CSV file in chunks, yielding progress callbacks between chunks so
 * the main thread stays responsive even for files with hundreds of thousands
 * of rows.
 *
 * @param customAliases - Optional map of fieldName → additional synonyms to
 *   extend the built-in semantic dictionary (from user CSV column settings).
 */
export async function parseCSVContentStreaming(
  csvContent: string,
  source: 'believe' | 'bandcamp',
  onProgress?: (progress: ParseProgress) => void,
  columnMapping?: Record<string, string>,
  customAliases?: Record<string, string[]>
): Promise<StreamingParseResult> {
  const allTransactions: SalesTransaction[] = []
  const uniqueArtistsSet = new Set<string>()
  const allErrors: Array<{ row: number; reason: string; data: string }> = []

  // Normalise line endings and remove BOM
  const normalised = stripBOM(csvContent).replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const lines = normalised.split('\n')

  // Find first non-empty line (header)
  const firstNonEmpty = lines.findIndex(l => l.trim().length > 0)
  if (firstNonEmpty === -1) {
    return { transactions: [], uniqueArtists: [], errors: [] }
  }

  // Detect delimiter using the header + first few data lines for accuracy
  const sampleLines = lines.slice(firstNonEmpty, firstNonEmpty + 6)
  const delimiter = detectDelimiter(sampleLines)
  const headerLine = lines[firstNonEmpty]
  const headers = parseCSVLine(headerLine, delimiter).map(h => h.trim())

  if (headers.length === 0) {
    return { transactions: [], uniqueArtists: [], errors: [{ row: 1, reason: 'Empty header row', data: '' }] }
  }

  const mapping = columnMapping ?? mapCSVHeadersToModel(headers, customAliases)
  const dataLines = lines.slice(firstNonEmpty + 1)
  const totalRows = dataLines.length
  let processedRows = 0

  // Short random tag to make transaction IDs unique across multiple parse calls.
  const parseTag = `${source}-${Math.random().toString(36).slice(2, 8)}`

  for (let i = 0; i < dataLines.length; i += CHUNK_SIZE) {
    const chunk = dataLines.slice(i, i + CHUNK_SIZE)

    // Yield to the event loop between chunks
    await new Promise<void>(resolve => setTimeout(resolve, 0))

    const result = processChunk(chunk, headers, mapping, delimiter, source, processedRows, parseTag)

    for (const t of result.transactions) allTransactions.push(t)
    result.artists.forEach(a => uniqueArtistsSet.add(a))
    for (const e of result.errors) allErrors.push(e)

    processedRows += chunk.length

    onProgress?.({
      processedRows,
      totalRows,
      percentage: totalRows > 0 ? Math.round((processedRows / totalRows) * 100) : 100,
      isComplete: processedRows >= totalRows,
    })
  }

  return {
    transactions: allTransactions,
    uniqueArtists: Array.from(uniqueArtistsSet).sort(),
    errors: allErrors,
  }
}
