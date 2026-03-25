/**
 * parser-facade.ts
 *
 * Unified entry point for all CSV parsing in the ingest feature.
 * Auto-detects file type (Believe CSV, Bandcamp CSV, Shopify CSV) and
 * delegates to the appropriate parser implementation.
 */
import type { SalesTransaction } from './csv-parser'
import { parseCSVContentStreaming } from './streaming-csv-parser'
import type { StreamingParseResult } from './streaming-csv-parser'
import { parseShopifyCSV } from './shopify-parser'
import type { ShopifyParseResult } from './shopify-parser'

export type FileType = 'believe' | 'bandcamp' | 'shopify' | 'unknown'

export interface ParseFileResult {
  fileType: FileType
  transactions: SalesTransaction[]
  errors: Array<{ row: number; reason: string; data: string }>
  uniqueArtists: string[]
}

/**
 * Detects the file type from the CSV header line.
 * @param headerLine - The first line of the CSV file.
 * @returns The detected FileType.
 */
export function detectFileType(headerLine: string): FileType {
  const lower = headerLine.toLowerCase()
  if (lower.includes('shopify') || lower.includes('financial status') || lower.includes('lineitem name')) {
    return 'shopify'
  }
  if (lower.includes('barcode') || lower.includes('release_title') || lower.includes('upc')) {
    return 'believe'
  }
  if (lower.includes('item type') || lower.includes('catalog number')) {
    return 'bandcamp'
  }
  return 'unknown'
}

/**
 * Parses a CSV file and auto-detects its type.
 * Delegates to the appropriate parser based on header detection.
 * Shopify exports do not contain artist data; uniqueArtists is empty for those files.
 * @param content - The raw CSV file content as string.
 * @param source - Optional override for file source ('believe' | 'bandcamp' | 'shopify').
 * @returns A ParseFileResult with transactions and metadata.
 */
export async function parseFile(
  content: string,
  source?: 'believe' | 'bandcamp' | 'shopify'
): Promise<ParseFileResult> {
  const firstLine = content.split('\n')[0] ?? ''
  const detectedType: FileType = source ?? detectFileType(firstLine)

  if (detectedType === 'shopify') {
    const shopifyResult: ShopifyParseResult = parseShopifyCSV(content)
    return {
      fileType: 'shopify',
      transactions: shopifyResult.transactions,
      errors: shopifyResult.errors,
      // Shopify exports attribute all revenue to a synthetic "Merch" artist;
      // no distinct artist names are extracted from the file.
      uniqueArtists: [],
    }
  }

  // Believe and Bandcamp share the streaming CSV parser
  const streamingResult: StreamingParseResult = await parseCSVContentStreaming(
    content,
    detectedType === 'unknown' ? 'believe' : detectedType
  )

  return {
    fileType: detectedType,
    transactions: streamingResult.transactions,
    errors: streamingResult.errors,
    uniqueArtists: streamingResult.uniqueArtists,
  }
}
