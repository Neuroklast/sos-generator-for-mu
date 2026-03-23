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
const CHUNK_SIZE = 500

/**
 * Detects the most likely delimiter by checking consistency of column counts
 * across the first few non-empty lines. Falls back to comma.
 */
function detectDelimiter(lines: string[]): string {
  const candidates = [';', ',']
  const sampleLines = lines.filter(l => l.trim()).slice(0, 5)
  if (sampleLines.length === 0) return ','

  let bestDelimiter = ','
  let bestScore = -1

  for (const delim of candidates) {
    const counts = sampleLines.map(l => (l.match(new RegExp(`\\${delim}`, 'g')) ?? []).length)
    const first = counts[0]
    // Score: consistency (lines with same count as header) × 100 + column count
    const consistent = counts.filter(c => c === first).length
    const score = consistent * 100 + first
    if (score > bestScore) {
      bestScore = score
      bestDelimiter = delim
    }
  }

  return bestDelimiter
}

/**
 * Removes a UTF-8 BOM character that some editors / Excel exports prepend.
 */
function stripBOM(text: string): string {
  return text.startsWith('\uFEFF') ? text.slice(1) : text
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
  startIndex: number
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
      const netRevenue = parseRevenue(mappedData.net_revenue ?? '')
      const quantity = parseQuantity(mappedData.quantity ?? '')
      const releaseType = mappedData.release_type ?? ''
      const isPhysical = /physical|cd|vinyl|cassette|tape/i.test(releaseType)

      // Skip rows with no useful data (no artist AND no revenue)
      if (!originalArtist && netRevenue === 0) continue

      if (originalArtist) artists.add(originalArtist)

      transactions.push({
        id: crypto.randomUUID(),
        source,
        sales_month: (mappedData.sales_month ?? '').trim(),
        platform: (mappedData.platform ?? '').trim(),
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
        currency: (mappedData.currency ?? 'EUR').trim() || 'EUR',
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

  for (let i = 0; i < dataLines.length; i += CHUNK_SIZE) {
    const chunk = dataLines.slice(i, i + CHUNK_SIZE)

    // Yield to the event loop between chunks
    await new Promise<void>(resolve => setTimeout(resolve, 0))

    const result = processChunk(chunk, headers, mapping, delimiter, source, processedRows)

    allTransactions.push(...result.transactions)
    result.artists.forEach(a => uniqueArtistsSet.add(a))
    allErrors.push(...result.errors)

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
