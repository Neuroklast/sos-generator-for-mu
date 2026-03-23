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
  errors: Array<{ row: number, reason: string, data: string }>
}

const CHUNK_SIZE = 1000

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
  errors: Array<{ row: number, reason: string, data: string }>
} {
  const transactions: SalesTransaction[] = []
  const artists = new Set<string>()
  const errors: Array<{ row: number, reason: string, data: string }> = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (!line.trim()) continue

    try {
      const values = parseCSVLine(line, delimiter)
      
      if (values.length !== headers.length && values.length > 0) {
        errors.push({
          row: startIndex + i + 2,
          reason: `Column count mismatch: expected ${headers.length}, got ${values.length}`,
          data: line.substring(0, 100)
        })
        continue
      }

      const rowData: Record<string, string> = {}
      headers.forEach((header, index) => {
        rowData[header] = values[index] || ''
      })

      const mappedData: Record<string, string> = {}
      for (const [originalHeader, value] of Object.entries(rowData)) {
        const mappedField = mapping[originalHeader]
        if (mappedField) {
          mappedData[mappedField] = value
        }
      }

      const originalArtist = mappedData.original_artist || ''
      const netRevenueStr = mappedData.net_revenue || '0'
      const quantityStr = mappedData.quantity || '0'
      
      const netRevenue = parseFloat(netRevenueStr.replace(/[^0-9.-]/g, '')) || 0
      const quantity = parseInt(quantityStr.replace(/[^0-9]/g, '')) || 0

      const releaseType = mappedData.release_type || ''
      const isPhysical = /physical|cd|vinyl|cassette|tape/i.test(releaseType)

      if (originalArtist) {
        artists.add(originalArtist)
      }

      const transaction: SalesTransaction = {
        id: crypto.randomUUID(),
        source,
        sales_month: mappedData.sales_month || '',
        platform: mappedData.platform || '',
        country: mappedData.country || '',
        main_artist: originalArtist,
        original_artist: originalArtist,
        release_title: mappedData.release_title || '',
        track_title: mappedData.track_title || '',
        upc_ean: mappedData.upc_ean || '',
        isrc: mappedData.isrc || '',
        catalog_number: mappedData.catalog_number || '',
        quantity,
        net_revenue: netRevenue,
        currency: mappedData.currency || 'EUR',
        is_physical: isPhysical
      }

      transactions.push(transaction)
    } catch (error) {
      errors.push({
        row: startIndex + i + 2,
        reason: error instanceof Error ? error.message : 'Unknown parsing error',
        data: line.substring(0, 100)
      })
    }
  }

  return { transactions, artists, errors }
}

export async function parseCSVContentStreaming(
  csvContent: string,
  source: 'believe' | 'bandcamp',
  onProgress?: (progress: ParseProgress) => void,
  columnMapping?: Record<string, string>
): Promise<StreamingParseResult> {
  const allTransactions: SalesTransaction[] = []
  const uniqueArtistsSet = new Set<string>()
  const allErrors: Array<{ row: number, reason: string, data: string }> = []

  const lines = csvContent.split('\n').filter(line => line.trim())
  
  if (lines.length === 0) {
    return { transactions: [], uniqueArtists: [], errors: [] }
  }

  const delimiter = csvContent.includes(';') ? ';' : ','
  const headers = lines[0].split(delimiter).map(h => h.trim().replace(/^"|"$/g, ''))
  
  const mapping = columnMapping || mapCSVHeadersToModel(headers)

  const dataLines = lines.slice(1)
  const totalRows = dataLines.length

  let processedRows = 0

  const chunks: string[][] = []
  for (let i = 0; i < dataLines.length; i += CHUNK_SIZE) {
    chunks.push(dataLines.slice(i, i + CHUNK_SIZE))
  }

  for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
    const chunk = chunks[chunkIndex]
    
    await new Promise(resolve => setTimeout(resolve, 0))

    const result = processChunk(
      chunk,
      headers,
      mapping,
      delimiter,
      source,
      processedRows
    )

    allTransactions.push(...result.transactions)
    result.artists.forEach(artist => uniqueArtistsSet.add(artist))
    allErrors.push(...result.errors)

    processedRows += chunk.length

    if (onProgress) {
      onProgress({
        processedRows,
        totalRows,
        percentage: Math.round((processedRows / totalRows) * 100),
        isComplete: processedRows >= totalRows
      })
    }
  }

  return {
    transactions: allTransactions,
    uniqueArtists: Array.from(uniqueArtistsSet).sort(),
    errors: allErrors
  }
}
