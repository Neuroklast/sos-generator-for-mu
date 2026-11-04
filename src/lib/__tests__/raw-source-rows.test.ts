import { describe, expect, it } from 'vitest'
import type { SalesTransaction } from '@/features/ingest/lib/csv-parser'
import { buildArtistRawSheets, missingOriginalReportSources } from '../raw-source-rows'

function tx(id: string, source: 'believe' | 'bandcamp' | 'darkmerch', artist: string, headers: string[], values: string[]): SalesTransaction {
  return { id, source_row_id: id, source_headers: headers, source_values: values, source,
    sales_month: '2026-01', platform: 'Spotify', country: '', main_artist: artist, original_artist: artist,
    release_title: '', track_title: '', upc_ean: '', isrc: '', catalog_number: '', quantity: 1,
    net_revenue: 10, currency: 'EUR', is_physical: false }
}

describe('original report sheets', () => {
  it('isolates artists and strips confidential Believe columns while keeping net revenue', () => {
    const headers = ['Artist Name', 'Gross revenue', 'Client share rate', 'Net Revenue']
    const sheets = buildArtistRawSheets([
      { artist: 'Band A', transactions: [tx('a', 'believe', 'Band A', headers, ['Band A', '12', '0.8', '10'])] },
      { artist: 'Band B', transactions: [tx('b', 'believe', 'Band B', headers, ['Band B', '99', '0.5', '30'])] },
    ])
    expect(sheets.get('banda')?.[0]?.headers).toEqual(['Artist Name', 'Net Revenue'])
    expect(sheets.get('banda')?.[0]?.rows).toEqual([['Band A', '10']])
    expect(sheets.get('bandb')?.[0]?.rows).toEqual([['Band B', '30']])
  })

  it('deduplicates proportional split clones and retains Bandcamp columns', () => {
    const headers = ['artist', 'date', 'net amount']
    const original = tx('same', 'bandcamp', 'Artist', headers, ['Artist', '1/1/2026', '10'])
    const cloned = { ...original, id: 'same__split__Artist' }
    const sheets = buildArtistRawSheets([{ artist: 'Artist', transactions: [original, cloned] }])
    expect(sheets.get('artist')?.[0]?.rows).toEqual([['Artist', '1/1/2026', '10']])
  })

  it('preserves original source values while exposing proportional ownership revenue', () => {
    const original = {
      ...tx('shared', 'believe', 'Exstais', ['Artist Name', 'Net Revenue'], ['Exstais feat Agnis', '100']),
      id: 'shared__split__Exstais',
      net_revenue: 60,
      quantity: 60,
      assignment_allocation_percentage: 60,
    }
    const sheets = buildArtistRawSheets([{ artist: 'Exstais', transactions: [original] }])
    expect(sheets.get('exstais')?.[0]?.headers).toEqual([
      'Artist Name', 'Net Revenue', 'Statement Allocation (%)',
      'Statement Net Revenue (source currency)', 'Statement Quantity',
    ])
    expect(sheets.get('exstais')?.[0]?.rows).toEqual([
      ['Exstais feat Agnis', '100', '60', '60', '60'],
    ])
  })

  it('includes Darkmerch while preserving the reported source period', () => {
    const sheets = buildArtistRawSheets([{
      artist: 'Artist',
      transactions: [tx('darkmerch-1', 'darkmerch', 'Artist', ['DATE', 'BAND', 'NET REVENUE'], ['Q1 2026', 'Artist', '8,40'])],
    }])
    expect(sheets.get('artist')?.[0]?.rows).toEqual([['Q1 2026', 'Artist', '8,40']])
  })

  it('rejects a distributor-revenue statement when no corresponding source rows survive', () => {
    expect(missingOriginalReportSources({ believeRevenue: 1, bandcampRevenue: 0, darkmerchRevenue: 0 }, [])).toEqual(['believe'])
  })
})
