import { describe, expect, it } from 'vitest'
import { parseCSVContentStreaming } from '@/features/ingest/lib/streaming-csv-parser'
import { parseDarkmerchCSV } from '@/features/ingest/lib/darkmerch-parser'

describe('original source metadata', () => {
  it('retains Believe and Bandcamp distributor headers and values in the worker transaction', async () => {
    for (const source of ['believe', 'bandcamp'] as const) {
      const parsed = await parseCSVContentStreaming(
        'Artist Name,Net Revenue,Release title\nArtist A,0.50,Original Release', source,
      )
      expect(parsed.transactions).toHaveLength(1)
      const row = parsed.transactions[0]
      expect(row.source_row_id).toBe(row.id)
      expect(row.source_headers).toEqual(['Artist Name', 'Net Revenue', 'Release title'])
      expect(row.source_values).toEqual(['Artist A', '0.50', 'Original Release'])
    }
  })

  it('retains Darkmerch original columns alongside aggregated transactions', () => {
    const parsed = parseDarkmerchCSV('DATE;BAND;NET REVENUE\nQ1 2026;Artist A;8,40')
    expect(parsed.transactions).toHaveLength(1)
    expect(parsed.transactions[0].source_values).toEqual(['Q1 2026', 'Artist A', '8,40'])
  })
})
