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

/** Strips quotes and whitespace from a CSV header token for comparison. */
function normalizeHeader(h: string): string {
  return h.replace(/['"]/g, '').trim().toLowerCase()
}

/**
 * Parses the header line into individual column tokens.
 * Handles comma- and tab-delimited headers.
 */
function splitHeader(headerLine: string): string[] {
  const delimiter = headerLine.includes('\t') ? '\t' : ','
  return headerLine.split(delimiter).map(normalizeHeader)
}

/** Counts how many of the given candidate column names are present in the headers. */
function countMatches(headers: string[], candidates: string[]): number {
  return candidates.filter(c => headers.includes(c)).length
}

const SHOPIFY_COLUMNS = ['financial status', 'lineitem name', 'lineitem sku', 'lineitem quantity', 'lineitem price']
const BELIEVE_COLUMNS = ['release_title', 'barcode', 'upc', 'isrc', 'net_revenue']
const BANDCAMP_COLUMNS = ['item type', 'catalog number', 'artist', 'album title', 'net amount']

/**
 * Detects the file type from the CSV header line using a scoring approach.
 * Each candidate format receives a score based on how many of its characteristic
 * columns are present, which avoids false positives from partial name overlaps.
 * @param headerLine - The first line of the CSV file.
 * @returns The detected FileType.
 */
export function detectFileType(headerLine: string): FileType {
  const headers = splitHeader(headerLine)

  const scores: Record<Exclude<FileType, 'unknown'>, number> = {
    shopify: countMatches(headers, SHOPIFY_COLUMNS),
    believe: countMatches(headers, BELIEVE_COLUMNS),
    bandcamp: countMatches(headers, BANDCAMP_COLUMNS),
  }

  const best = (Object.entries(scores) as Array<[Exclude<FileType, 'unknown'>, number]>)
    .reduce<[Exclude<FileType, 'unknown'>, number] | null>((acc, [type, score]) => {
      if (score === 0) return acc
      if (acc === null || score > acc[1]) return [type, score]
      return acc
    }, null)

  return best !== null ? best[0] : 'unknown'
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
