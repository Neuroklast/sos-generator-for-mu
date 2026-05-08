/**
 * Tests for parseCSVContentStreaming — Bandcamp-specific physical/digital
 * detection and revenue column handling.
 *
 * Bandcamp rules (per product spec):
 *  - `package` column contains "digital" (e.g. "digital download", "digital bundle")
 *    → is_physical = false, is_download = true
 *  - `package` column contains anything else (e.g. "Limited Digipac CD", "T-Shirt")
 *    → is_physical = true
 *  - Revenue = `net amount` column (NOT "balance of revenue share (EUR)")
 */
import { describe, it, expect } from 'vitest'
import { parseCSVContentStreaming } from '@/features/ingest/lib/streaming-csv-parser'

// ── Minimal Bandcamp CSV builder ──────────────────────────────────────────────

/**
 * Builds a minimal Bandcamp-format CSV with only the columns needed for
 * physical/digital detection and revenue parsing tests.
 *
 * Uses a REDUCED header set (no GBP/PLN/USD balance columns) so that the
 * semantic-dictionary fuzzy-matcher cannot accidentally overwrite the EUR
 * balance field with blank values — giving clean, unambiguous test inputs.
 *
 * Columns (8 total):
 *   0  date
 *   1  paid to
 *   2  item type
 *   3  item name
 *   4  artist
 *   5  currency
 *   6  balance of revenue share (EUR)  ← maps to balance_eur
 *   7  net amount                      ← maps to net_revenue
 *   8  package                         ← maps to bandcamp_package
 */
function buildBandcampCsv(rows: Array<{
  date?: string
  /** item type column – intentionally defaulting to 'album' so physical
   *  detection must rely on the 'package' column, not on item type. */
  itemType?: string
  itemName?: string
  artist?: string
  currency?: string
  /** "balance of revenue share (EUR)" – the WRONG column (collection society) */
  balanceEur?: string
  /** "net amount" – the CORRECT revenue column */
  netAmount?: string
  packageCol?: string
}>): string {
  // Reduced header: no GBP/PLN/USD balance columns to avoid fuzzy-match
  // contamination of the balance_eur field in mapCSVHeadersToModel.
  const header = 'date,paid to,item type,item name,artist,currency,balance of revenue share (EUR),net amount,package'
  const dataRows = rows.map(r => [
    r.date ?? '10/1/25 1:02am',  // 0: date
    'Bandcamp',                   // 1: paid to
    r.itemType ?? 'album',        // 2: item type  ← default 'album', NOT 'package'
    r.itemName ?? 'Test Album',   // 3: item name
    r.artist ?? 'Test Artist',    // 4: artist
    r.currency ?? 'EUR',          // 5: currency
    r.balanceEur ?? '0.15',       // 6: balance of revenue share (EUR) – NON-ZERO by default
    r.netAmount ?? '5.00',        // 7: net amount
    r.packageCol ?? 'digital download', // 8: package
  ].join(','))
  return [header, ...dataRows].join('\n')
}

// ── Physical / Digital detection ──────────────────────────────────────────────

describe('parseCSVContentStreaming – Bandcamp package column → physical/digital', () => {
  it('marks "digital download" package as digital (is_physical=false, is_download=true)', async () => {
    const csv = buildBandcampCsv([{ packageCol: 'digital download' }])
    const result = await parseCSVContentStreaming(csv, 'bandcamp')
    expect(result.transactions).toHaveLength(1)
    expect(result.transactions[0].is_physical).toBe(false)
    expect(result.transactions[0].is_download).toBe(true)
  })

  it('marks "digital bundle" package as digital (is_physical=false, is_download=true)', async () => {
    const csv = buildBandcampCsv([{ packageCol: 'digital bundle' }])
    const result = await parseCSVContentStreaming(csv, 'bandcamp')
    expect(result.transactions).toHaveLength(1)
    expect(result.transactions[0].is_physical).toBe(false)
    expect(result.transactions[0].is_download).toBe(true)
  })

  it('is case-insensitive: "Digital Download" (mixed case) → digital', async () => {
    const csv = buildBandcampCsv([{ packageCol: 'Digital Download' }])
    const result = await parseCSVContentStreaming(csv, 'bandcamp')
    expect(result.transactions[0].is_physical).toBe(false)
    expect(result.transactions[0].is_download).toBe(true)
  })

  it('marks "Limited Digipac CD" package as physical based on package column (item type = album)', async () => {
    // itemType is intentionally left as default 'album' — physical detection must
    // come from the package column, not from item type === 'package'
    const csv = buildBandcampCsv([{ packageCol: 'Limited Digipac CD' }])
    const result = await parseCSVContentStreaming(csv, 'bandcamp')
    expect(result.transactions).toHaveLength(1)
    expect(result.transactions[0].is_physical).toBe(true)
  })

  it('marks a T-Shirt package as physical (item type = album)', async () => {
    const csv = buildBandcampCsv([{ packageCol: 'BLACKBOOK Confession T-Shirt' }])
    const result = await parseCSVContentStreaming(csv, 'bandcamp')
    expect(result.transactions[0].is_physical).toBe(true)
  })

  it('marks "Jewelcase 2CDs" package as physical (item type = album)', async () => {
    const csv = buildBandcampCsv([{ packageCol: 'Jewelcase 2CDs' }])
    const result = await parseCSVContentStreaming(csv, 'bandcamp')
    expect(result.transactions[0].is_physical).toBe(true)
  })

  it('marks "Collector Bundle (Limited Digipac CD + T-shirt)" as physical', async () => {
    const csv = buildBandcampCsv([{ packageCol: 'Collector Bundle (Limited Digipac CD + T-shirt)' }])
    const result = await parseCSVContentStreaming(csv, 'bandcamp')
    expect(result.transactions[0].is_physical).toBe(true)
  })

  it('parses multiple rows with mixed physical and digital correctly', async () => {
    const csv = buildBandcampCsv([
      { packageCol: 'digital download', artist: 'Artist A', netAmount: '1.06' },
      { packageCol: 'Limited Digipac CD', artist: 'Artist B', netAmount: '8.00' },
      { packageCol: 'digital bundle', artist: 'Artist A', netAmount: '3.50' },
    ])
    const result = await parseCSVContentStreaming(csv, 'bandcamp')
    expect(result.transactions).toHaveLength(3)
    expect(result.transactions[0].is_physical).toBe(false)
    expect(result.transactions[1].is_physical).toBe(true)
    expect(result.transactions[2].is_physical).toBe(false)
  })

  it('skips payout rows (item type = payout) regardless of package value', async () => {
    const csv = buildBandcampCsv([
      { itemType: 'payout', packageCol: '', artist: '' },
      { packageCol: 'digital download', artist: 'Artist A' },
    ])
    const result = await parseCSVContentStreaming(csv, 'bandcamp')
    // Only the second row (digital download) should be parsed; payout row skipped
    const nonEmptyArtist = result.transactions.filter(t => t.original_artist.length > 0)
    expect(nonEmptyArtist).toHaveLength(1)
    expect(nonEmptyArtist[0].is_physical).toBe(false)
  })
})

// ── Revenue column: net amount (not balance of revenue share) ─────────────────

describe('parseCSVContentStreaming – Bandcamp uses "net amount" for revenue', () => {
  it('uses the "net amount" column as net_revenue, not "balance of revenue share (EUR)"', async () => {
    // net amount = 5.00, balance_eur = 0.15 — parser must use 5.00
    const csv = buildBandcampCsv([{
      netAmount: '5.00',
      balanceEur: '0.15',
      packageCol: 'digital download',
    }])
    const result = await parseCSVContentStreaming(csv, 'bandcamp')
    expect(result.transactions).toHaveLength(1)
    expect(result.transactions[0].net_revenue).toBeCloseTo(5.00)
  })

  it('does NOT use the "balance of revenue share (EUR)" column for revenue', async () => {
    const csv = buildBandcampCsv([{
      netAmount: '1.06',
      balanceEur: '0.15',
      packageCol: 'digital download',
    }])
    const result = await parseCSVContentStreaming(csv, 'bandcamp')
    expect(result.transactions[0].net_revenue).not.toBeCloseTo(0.15)
    expect(result.transactions[0].net_revenue).toBeCloseTo(1.06)
  })

  it('uses the "net amount" column even when balance_eur is non-zero', async () => {
    // Scenario that previously caused wrong revenue: balance_eur=0.30 overrode net_amount=1.35
    const csv = buildBandcampCsv([{
      netAmount: '1.35',
      balanceEur: '0.30',
      packageCol: 'digital download',
    }])
    const result = await parseCSVContentStreaming(csv, 'bandcamp')
    expect(result.transactions[0].net_revenue).toBeCloseTo(1.35)
  })

  it('correctly sums revenue across multiple rows using net amount', async () => {
    const csv = buildBandcampCsv([
      { netAmount: '1.06', balanceEur: '0.15', packageCol: 'digital download', artist: 'ArtistA' },
      { netAmount: '2.50', balanceEur: '0.30', packageCol: 'digital download', artist: 'ArtistA' },
    ])
    const result = await parseCSVContentStreaming(csv, 'bandcamp')
    const total = result.transactions.reduce((s, t) => s + t.net_revenue, 0)
    expect(total).toBeCloseTo(3.56)
  })

  it('preserves the currency from the currency column', async () => {
    const csv = buildBandcampCsv([{
      netAmount: '5.00',
      currency: 'EUR',
      packageCol: 'digital download',
    }])
    const result = await parseCSVContentStreaming(csv, 'bandcamp')
    expect(result.transactions[0].currency).toBe('EUR')
  })
})

// ── Physical bandcamp revenue is NOT double-counted in digital ────────────────

describe('parseCSVContentStreaming – physical Bandcamp rows use physical split bucket', () => {
  it('physical bandcamp transaction has source=bandcamp and is_physical=true', async () => {
    const csv = buildBandcampCsv([{
      packageCol: 'Limited Digipac CD',
      itemType: 'package',
      artist: 'NEUROKLAST',
      netAmount: '12.00',
    }])
    const result = await parseCSVContentStreaming(csv, 'bandcamp')
    expect(result.transactions).toHaveLength(1)
    const tx = result.transactions[0]
    expect(tx.source).toBe('bandcamp')
    expect(tx.is_physical).toBe(true)
    expect(tx.net_revenue).toBeCloseTo(12.00)
  })
})
