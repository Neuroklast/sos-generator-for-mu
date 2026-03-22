export interface SalesTransaction {
  id: string
  source: 'believe' | 'bandcamp' | 'manual'
  sales_month: string
  platform: string
  country: string
  main_artist: string
  original_artist: string
  release_title: string
  track_title: string
  upc_ean: string
  isrc: string
  catalog_number: string
  quantity: number
  net_revenue: number
  currency: string
  is_physical: boolean
}

export interface ParsedCSVData {
  transactions: SalesTransaction[]
  uniqueArtists: string[]
  errors: Array<{ row: number, reason: string, data: string }>
}

export const semanticDictionary: Record<string, string[]> = {
  sales_month: ["Sales Month", "Month", "Date", "Period", "Verkaufsmonat", "Datum", "Reporting Period"],
  platform: ["Platform", "Store", "Shop", "Plattform", "Provider", "Service", "DSP"],
  country: ["Country/Region", "Country", "Region", "Territory", "Land", "Territorium"],
  original_artist: ["Artist Name", "Artist", "Band", "Künstler", "Main Artist", "Track Artist"],
  release_title: ["Release title", "Release", "Album", "Album Title", "Titel", "Project Name"],
  track_title: ["Track title", "Track", "Song", "Title", "Track Name", "Songtitel"],
  upc_ean: ["UPC", "EAN", "Barcode", "GTIN", "Release UPC"],
  isrc: ["ISRC", "Track ISRC", "Recording ISRC"],
  catalog_number: ["Release Catalog nb", "Catalog Number", "Cat No", "Cat Number", "Katalognummer", "Catalog"],
  quantity: ["Quantity", "Qty", "Downloads", "Streams", "Units", "Anzahl", "Menge", "Verkäufe"],
  net_revenue: ["Net Revenue", "Revenue", "Umsatz", "Netto", "Payout", "Net Amount", "Earnings", "Amount"],
  currency: ["Currency", "Währung", "Curr", "Paid Currency"],
  release_type: ["Release Type", "Sales Type", "Format", "Product Type", "Physical", "Medium", "Type"]
}

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = []

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i]
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }

  return matrix[b.length][a.length]
}

function calculateSimilarity(str1: string, str2: string): number {
  const maxLen = Math.max(str1.length, str2.length)
  if (maxLen === 0) return 1.0
  const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase())
  return (maxLen - distance) / maxLen
}

export function mapCSVHeadersToModel(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {}

  headers.forEach((header) => {
    const normalized = header.trim().toLowerCase().replace(/\s+/g, '')
    
    for (const [fieldName, synonyms] of Object.entries(semanticDictionary)) {
      for (const synonym of synonyms) {
        const normalizedSynonym = synonym.toLowerCase().replace(/\s+/g, '')
        
        if (normalized === normalizedSynonym) {
          mapping[header] = fieldName
          return
        }
      }
    }

    for (const [fieldName, synonyms] of Object.entries(semanticDictionary)) {
      for (const synonym of synonyms) {
        const similarity = calculateSimilarity(header, synonym)
        if (similarity >= 0.8 && !mapping[header]) {
          mapping[header] = fieldName
          break
        }
      }
      if (mapping[header]) break
    }
  })

  return mapping
}

export function parseCSVContent(
  csvContent: string,
  source: 'believe' | 'bandcamp',
  columnMapping?: Record<string, string>
): ParsedCSVData {
  const transactions: SalesTransaction[] = []
  const uniqueArtistsSet = new Set<string>()
  const errors: Array<{ row: number, reason: string, data: string }> = []

  const lines = csvContent.split('\n').filter(line => line.trim())
  if (lines.length === 0) {
    return { transactions, uniqueArtists: [], errors }
  }

  const delim = csvContent.includes(';') ? ';' : ','
  const headers = lines[0].split(delim).map(h => h.trim().replace(/^"|"$/g, ''))
  
  const mapping = columnMapping || mapCSVHeadersToModel(headers)

  for (let i = 1; i < lines.length; i++) {
    try {
      const values = parseCSVLine(lines[i], delim)
      
      if (values.length !== headers.length && values.length > 0) {
        errors.push({
          row: i + 1,
          reason: `Column count mismatch: expected ${headers.length}, got ${values.length}`,
          data: lines[i].substring(0, 100)
        })
        continue
      }

      const rowData: Record<string, string> = {}
      headers.forEach((header, index) => {
        rowData[header] = values[index] || ''
      })

      const mappedData: Partial<Record<keyof typeof semanticDictionary, string>> = {}
      for (const [originalHeader, value] of Object.entries(rowData)) {
        const mappedField = mapping[originalHeader]
        if (mappedField) {
          mappedData[mappedField as keyof typeof semanticDictionary] = value
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
        uniqueArtistsSet.add(originalArtist)
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
        row: i + 1,
        reason: error instanceof Error ? error.message : 'Unknown parsing error',
        data: lines[i].substring(0, 100)
      })
    }
  }

  return {
    transactions,
    uniqueArtists: Array.from(uniqueArtistsSet).sort(),
    errors
  }
}

function parseCSVLine(line: string, delimiter: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const nextChar = line[i + 1]

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }

  result.push(current.trim())
  return result.map(v => v.replace(/^"|"$/g, ''))
}

export function extractFeaturedArtists(artistName: string): string[] {
  const separators = [' feat. ', ' feat ', ' ft. ', ' ft ', ' featuring ', ' with ', ' & ', ' and ', ' x ']
  
  let artists = [artistName]
  for (const sep of separators) {
    const regex = new RegExp(sep, 'gi')
    if (regex.test(artistName)) {
      artists = artistName.split(regex).map(a => a.trim())
      break
    }
  }

  return artists.filter(a => a.length > 0)
}

export function suggestArtistMappings(uniqueArtists: string[]): Array<{
  featuringName: string
  primaryArtist: string
  confidence: 'high' | 'medium'
}> {
  const suggestions: Array<{
    featuringName: string
    primaryArtist: string
    confidence: 'high' | 'medium'
  }> = []

  for (const artist of uniqueArtists) {
    const featuredArtists = extractFeaturedArtists(artist)
    
    if (featuredArtists.length > 1) {
      suggestions.push({
        featuringName: artist,
        primaryArtist: featuredArtists[0],
        confidence: 'high'
      })
    }
  }

  return suggestions
}
