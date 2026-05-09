import { describe, it, expect } from 'vitest'
import type { SalesTransaction } from '@/features/ingest/lib/csv-parser'
import {
  isCompilation,
  resolveMainArtist,
  processTransactions,
  processTransactionsWithCompilations,
  getUniqueArtistsFromTransactions,
} from '../data-processor'
import type { DataProcessorConfig } from '../data-processor'
import type { CompilationFilter, ArtistMapping, SplitFee, ManualRevenue } from '../types'

// ── Test helpers ──────────────────────────────────────────────────────────────

function makeTx(overrides: Partial<SalesTransaction> = {}): SalesTransaction {
  return {
    id: crypto.randomUUID(),
    source: 'believe',
    sales_month: '2024-01',
    platform: 'Spotify',
    country: 'DE',
    main_artist: 'Omnimar',
    original_artist: 'Omnimar',
    release_title: 'Test Release',
    track_title: 'Test Track',
    upc_ean: '123456',
    isrc: 'ISRC001',
    catalog_number: 'CAT001',
    quantity: 100,
    net_revenue: 10.0,
    currency: 'EUR',
    is_physical: false,
    ...overrides,
  }
}

const emptyConfig: DataProcessorConfig = {
  compilationFilters: [],
  artistMappings: [],
  splitFees: [],
  manualRevenues: [],
  excludePhysical: false,
}

// ── isCompilation ─────────────────────────────────────────────────────────────

describe('isCompilation', () => {
  const eanFilter: CompilationFilter = { id: '1', label: 'Test EAN', type: 'ean', identifier: '999999' }
  const titleFilter: CompilationFilter = { id: '2', label: 'Various', type: 'title', identifier: 'Various' }
  const catalogFilter: CompilationFilter = { id: '3', label: 'VA Cat', type: 'catalog', identifier: 'VA-' }

  it('returns false when no filters are configured', () => {
    expect(isCompilation(makeTx(), [])).toBe(false)
  })

  it('detects compilation by EAN match (exact)', () => {
    const tx = makeTx({ upc_ean: '999999' })
    expect(isCompilation(tx, [eanFilter])).toBe(true)
  })

  it('does not match EAN by partial substring (exact match required)', () => {
    const tx = makeTx({ upc_ean: '999999-001' })
    expect(isCompilation(tx, [eanFilter])).toBe(false)
  })

  it('detects compilation by title match (case-insensitive)', () => {
    const tx = makeTx({ release_title: 'various artists: vol 1' })
    expect(isCompilation(tx, [titleFilter])).toBe(true)
  })

  it('detects compilation by catalog number match (exact)', () => {
    const tx = makeTx({ catalog_number: 'VA-' })
    expect(isCompilation(tx, [catalogFilter])).toBe(true)
  })

  it('does not match catalog number by partial substring (exact match required)', () => {
    const tx = makeTx({ catalog_number: 'VA-2024-001' })
    expect(isCompilation(tx, [catalogFilter])).toBe(false)
  })

  it('returns false when no filter matches', () => {
    const tx = makeTx()
    expect(isCompilation(tx, [eanFilter, titleFilter, catalogFilter])).toBe(false)
  })

  it('returns true on first match without requiring all to match', () => {
    const tx = makeTx({ upc_ean: '999999', release_title: 'Normal Release' })
    expect(isCompilation(tx, [eanFilter, titleFilter])).toBe(true)
  })
})

// ── resolveMainArtist ─────────────────────────────────────────────────────────

describe('resolveMainArtist', () => {
  const mapping: ArtistMapping = {
    id: '1',
    featuringName: 'Omnimar feat. BLACKBOOK',
    primaryArtist: 'Omnimar',
  }

  it('returns the original artist when no mapping exists', () => {
    expect(resolveMainArtist('Unknown Artist', [mapping])).toBe('Unknown Artist')
  })

  it('resolves the artist name via mapping (case-insensitive)', () => {
    expect(resolveMainArtist('omnimar feat. blackbook', [mapping])).toBe('Omnimar')
  })

  it('returns original artist when mapping list is empty', () => {
    expect(resolveMainArtist('Omnimar feat. BLACKBOOK', [])).toBe('Omnimar feat. BLACKBOOK')
  })
})

// ── processTransactions ───────────────────────────────────────────────────────

describe('processTransactions', () => {
  it('returns empty array for empty transactions', () => {
    expect(processTransactions([], emptyConfig)).toEqual([])
  })

  it('groups transactions by artist', () => {
    const txs = [
      makeTx({ original_artist: 'Omnimar', net_revenue: 10 }),
      makeTx({ original_artist: 'Omnimar', net_revenue: 5 }),
      makeTx({ original_artist: 'BLACKBOOK', net_revenue: 20 }),
    ]
    const result = processTransactions(txs, emptyConfig)
    expect(result).toHaveLength(2)
    const omnimar = result.find(r => r.artist === 'Omnimar')
    expect(omnimar).toBeDefined()
    expect(omnimar!.grossRevenue).toBeCloseTo(15)
  })

  it('applies artist mappings to resolve artist names', () => {
    const mapping: ArtistMapping = {
      id: '1',
      featuringName: 'Omnimar feat. BLACKBOOK',
      primaryArtist: 'Omnimar',
    }
    const txs = [
      makeTx({ original_artist: 'Omnimar feat. BLACKBOOK', net_revenue: 10 }),
    ]
    const result = processTransactions(txs, { ...emptyConfig, artistMappings: [mapping] })
    expect(result).toHaveLength(1)
    expect(result[0].artist).toBe('Omnimar')
  })

  it('applies split fee percentage', () => {
    const splitFees: SplitFee[] = [{ artist: 'Omnimar', percentage: 70 }]
    const txs = [makeTx({ original_artist: 'Omnimar', net_revenue: 100 })]
    const result = processTransactions(txs, { ...emptyConfig, splitFees })
    expect(result[0].splitPercentage).toBe(70)
    expect(result[0].finalPayout).toBeCloseTo(70)
  })

  it('defaults split percentage to 100 when no split fee configured', () => {
    const txs = [makeTx({ original_artist: 'Omnimar', net_revenue: 50 })]
    const result = processTransactions(txs, emptyConfig)
    expect(result[0].splitPercentage).toBe(100)
    expect(result[0].finalPayout).toBeCloseTo(50)
  })

  it('adds manual revenue to the artist total', () => {
    const manualRevenues: ManualRevenue[] = [
      { id: '1', artist: 'Omnimar', description: 'Sync Deal', amount: 25 },
    ]
    const txs = [makeTx({ original_artist: 'Omnimar', net_revenue: 10 })]
    const result = processTransactions(txs, { ...emptyConfig, manualRevenues })
    expect(result[0].manualRevenue).toBeCloseTo(25)
    expect(result[0].grossRevenue).toBeCloseTo(35)
  })

  it('applies split % only to digital/physical revenue, not manual revenue (Bug 10)', () => {
    const splitFees: SplitFee[] = [{ artist: 'Omnimar', percentage: 70 }]
    const manualRevenues: ManualRevenue[] = [
      { id: '1', artist: 'Omnimar', description: 'Sync Deal', amount: 100 },
    ]
    const txs = [makeTx({ original_artist: 'Omnimar', net_revenue: 100 })]
    const result = processTransactions(txs, { ...emptyConfig, splitFees, manualRevenues })
    // Split applies only to the €100 streaming revenue → €70.
    // Manual sync revenue of €100 is passed through in full.
    // Total payout = €70 + €100 = €170.
    expect(result[0].finalPayout).toBeCloseTo(170)
    // Before the fix this would have been (100 + 100) * 70% = 140.
  })

  it('excludes physical transactions when excludePhysical is true', () => {
    const txs = [
      makeTx({ original_artist: 'Omnimar', net_revenue: 10, is_physical: false }),
      makeTx({ original_artist: 'Omnimar', net_revenue: 5, is_physical: true }),
    ]
    const result = processTransactions(txs, { ...emptyConfig, excludePhysical: true })
    expect(result[0].totalPhysicalRevenue).toBeCloseTo(0)
    expect(result[0].totalDigitalRevenue).toBeCloseTo(10)
  })

  it('sorts results by final payout descending', () => {
    const txs = [
      makeTx({ original_artist: 'LowArtist', net_revenue: 5 }),
      makeTx({ original_artist: 'HighArtist', net_revenue: 100 }),
    ]
    const result = processTransactions(txs, emptyConfig)
    expect(result[0].artist).toBe('HighArtist')
    expect(result[1].artist).toBe('LowArtist')
  })
})

// ── Per-type distribution fee ─────────────────────────────────────────────────

describe('per-type distribution fee', () => {
  it('applies a global distribution fee to both digital and physical revenue', () => {
    const txs = [
      makeTx({ original_artist: 'Omnimar', net_revenue: 100, is_physical: false }),
      makeTx({ original_artist: 'Omnimar', net_revenue: 50, is_physical: true }),
    ]
    // 10 % global fee → €10 from digital + €5 from physical = €15 total fee
    const result = processTransactions(txs, { ...emptyConfig, distributionFeePercentage: 10 })
    expect(result[0].distributionFeeDeducted).toBeCloseTo(15)
    // 90 digital + 45 physical = 135 recoupable; 100% split → payout = 135
    expect(result[0].finalPayout).toBeCloseTo(135)
  })

  it('applies per-type digital fee override independently of physical', () => {
    const txs = [
      makeTx({ original_artist: 'Omnimar', net_revenue: 100, is_physical: false }),
      makeTx({ original_artist: 'Omnimar', net_revenue: 100, is_physical: true }),
    ]
    // Digital fee = 20 %, physical fee = 5 %
    const result = processTransactions(txs, {
      ...emptyConfig,
      distributionFeePercentage: 10,
      distributionFeeDigital: 20,
      distributionFeePhysical: 5,
    })
    // Digital: 100 × 20% = 20 deducted → 80 net
    // Physical: 100 × 5% = 5 deducted → 95 net
    expect(result[0].distributionFeeDeducted).toBeCloseTo(25)
    expect(result[0].finalPayout).toBeCloseTo(175) // 80 + 95 at 100% split
  })

  it('falls back to global fee when per-type override is not set', () => {
    const txs = [
      makeTx({ original_artist: 'Omnimar', net_revenue: 100, is_physical: false }),
      makeTx({ original_artist: 'Omnimar', net_revenue: 50, is_physical: true }),
    ]
    // Only digital override set; physical falls back to global 10%
    const result = processTransactions(txs, {
      ...emptyConfig,
      distributionFeePercentage: 10,
      distributionFeeDigital: 0,
    })
    // Digital: 0% fee → 100 net; Physical: 10% → 5 deducted → 45 net
    expect(result[0].distributionFeeDeducted).toBeCloseTo(5)
    expect(result[0].finalPayout).toBeCloseTo(145)
  })
})

// ── Per-type artist splits ────────────────────────────────────────────────────

describe('per-type artist splits', () => {
  it('applies different split percentages to digital and physical revenue', () => {
    const txs = [
      makeTx({ original_artist: 'Omnimar', net_revenue: 100, is_physical: false }),
      makeTx({ original_artist: 'Omnimar', net_revenue: 100, is_physical: true }),
    ]
    const splitFees: SplitFee[] = [{
      artist: 'Omnimar',
      percentage: 50,
      digitalPercentage: 80,
      physicalPercentage: 40,
    }]
    const result = processTransactions(txs, { ...emptyConfig, splitFees })
    // Digital: €100 × 80% = €80; Physical: €100 × 40% = €40; total = €120
    expect(result[0].finalPayout).toBeCloseTo(120)
  })

  it('falls back to base split when type-specific overrides are not set', () => {
    const txs = [
      makeTx({ original_artist: 'Omnimar', net_revenue: 100, is_physical: false }),
      makeTx({ original_artist: 'Omnimar', net_revenue: 100, is_physical: true }),
    ]
    const splitFees: SplitFee[] = [{ artist: 'Omnimar', percentage: 60 }]
    const result = processTransactions(txs, { ...emptyConfig, splitFees })
    // Both at 60%: 100×60 + 100×60 = 120
    expect(result[0].finalPayout).toBeCloseTo(120)
  })

  it('type-specific split overrides do not affect manual revenue pass-through', () => {
    const txs = [makeTx({ original_artist: 'Omnimar', net_revenue: 100, is_physical: false })]
    const splitFees: SplitFee[] = [{ artist: 'Omnimar', percentage: 100, digitalPercentage: 50 }]
    const manualRevenues: ManualRevenue[] = [{ id: '1', artist: 'Omnimar', description: 'Sync', amount: 200 }]
    const result = processTransactions(txs, { ...emptyConfig, splitFees, manualRevenues })
    // Digital: €100 × 50% = €50; Manual: €200 pass-through; total = €250
    expect(result[0].finalPayout).toBeCloseTo(250)
  })
})

// ── processTransactionsWithCompilations ───────────────────────────────────────

describe('processTransactionsWithCompilations', () => {
  it('reports compilation transactions separately but still counts them in artist revenue', () => {
    const filter: CompilationFilter = { id: '1', label: 'Test', type: 'ean', identifier: 'COMP-EAN' }
    const txs = [
      makeTx({ original_artist: 'Omnimar', upc_ean: 'COMP-EAN', net_revenue: 10 }),
      makeTx({ original_artist: 'Omnimar', upc_ean: 'NORMAL-EAN', net_revenue: 20 }),
    ]
    const result = processTransactionsWithCompilations(txs, { ...emptyConfig, compilationFilters: [filter] })
    // Compilation revenue is surfaced in the info panel …
    expect(result.filteredCompilations).toHaveLength(1)
    expect(result.filteredCompilations[0].revenue).toBeCloseTo(10)
    // … but the artist still receives the full amount (Bug 3b fix).
    const omnimar = result.artistData.find(a => a.artist === 'Omnimar')
    expect(omnimar!.grossRevenue).toBeCloseTo(30)
  })

  it('returns empty filteredCompilations when no filters configured', () => {
    const txs = [makeTx()]
    const result = processTransactionsWithCompilations(txs, emptyConfig)
    expect(result.filteredCompilations).toHaveLength(0)
  })

  it('summarizes compilation revenue in filteredCompilations', () => {
    const filter: CompilationFilter = { id: '1', label: 'VA', type: 'title', identifier: 'VA' }
    const txs = [
      makeTx({ release_title: 'VA - Club Anthems', net_revenue: 5 }),
      makeTx({ release_title: 'VA - Club Anthems', net_revenue: 8 }),
    ]
    const result = processTransactionsWithCompilations(txs, { ...emptyConfig, compilationFilters: [filter] })
    expect(result.filteredCompilations[0].revenue).toBeCloseTo(13)
    expect(result.filteredCompilations[0].transactionCount).toBe(2)
  })
})

// ── getUniqueArtistsFromTransactions ──────────────────────────────────────────

describe('getUniqueArtistsFromTransactions', () => {
  it('returns unique artist names sorted alphabetically', () => {
    const txs = [
      makeTx({ original_artist: 'Zebra' }),
      makeTx({ original_artist: 'Alpha' }),
      makeTx({ original_artist: 'Alpha' }),
    ]
    const result = getUniqueArtistsFromTransactions(txs, [])
    expect(result).toEqual(['Alpha', 'Zebra'])
  })

  it('resolves artists via mappings before deduplication', () => {
    const mapping: ArtistMapping = {
      id: '1',
      featuringName: 'Omnimar feat. BLACKBOOK',
      primaryArtist: 'Omnimar',
    }
    const txs = [
      makeTx({ original_artist: 'Omnimar' }),
      makeTx({ original_artist: 'Omnimar feat. BLACKBOOK' }),
    ]
    const result = getUniqueArtistsFromTransactions(txs, [mapping])
    expect(result).toEqual(['Omnimar'])
  })

  it('returns empty array for empty transaction list', () => {
    expect(getUniqueArtistsFromTransactions([], [])).toEqual([])
  })
})

// ── Platform/country/monthly/release breakdown accuracy ───────────────────────

describe('breakdown accuracy', () => {
  it('builds accurate platform breakdown', () => {
    const txs = [
      makeTx({ original_artist: 'Omnimar', platform: 'Spotify', net_revenue: 10 }),
      makeTx({ original_artist: 'Omnimar', platform: 'Apple Music', net_revenue: 5 }),
      makeTx({ original_artist: 'Omnimar', platform: 'Spotify', net_revenue: 3 }),
    ]
    const result = processTransactions(txs, emptyConfig)
    const spotifyEntry = result[0].platformBreakdown.find(p => p.platform === 'Spotify')
    const appleEntry = result[0].platformBreakdown.find(p => p.platform === 'Apple Music')
    expect(spotifyEntry?.revenue).toBeCloseTo(13)
    expect(appleEntry?.revenue).toBeCloseTo(5)
  })

  it('builds accurate country breakdown', () => {
    const txs = [
      makeTx({ original_artist: 'Omnimar', country: 'DE', net_revenue: 12 }),
      makeTx({ original_artist: 'Omnimar', country: 'US', net_revenue: 8 }),
      makeTx({ original_artist: 'Omnimar', country: 'DE', net_revenue: 4 }),
    ]
    const result = processTransactions(txs, emptyConfig)
    const deEntry = result[0].countryBreakdown.find(c => c.country === 'DE')
    expect(deEntry?.revenue).toBeCloseTo(16)
  })

  it('excludes items with no country from the country breakdown (no Unknown row)', () => {
    const txs = [
      makeTx({ original_artist: 'Omnimar', country: 'DE', net_revenue: 10 }),
      // physical/merch item with no country
      makeTx({ original_artist: 'Omnimar', country: '', net_revenue: 5, is_physical: true }),
    ]
    const result = processTransactions(txs, emptyConfig)
    // No 'Unknown' or empty-string entry in the breakdown
    expect(result[0].countryBreakdown.some(c => !c.country)).toBe(false)
    // Revenue from the no-country item is still in the totals
    expect(result[0].grossRevenue).toBeCloseTo(15)
  })

  it('builds accurate monthly breakdown', () => {
    const txs = [
      makeTx({ original_artist: 'Omnimar', sales_month: '2024-01', net_revenue: 10 }),
      makeTx({ original_artist: 'Omnimar', sales_month: '2024-02', net_revenue: 20 }),
      makeTx({ original_artist: 'Omnimar', sales_month: '2024-01', net_revenue: 5 }),
    ]
    const result = processTransactions(txs, emptyConfig)
    const jan = result[0].monthlyBreakdown.find(m => m.month === '2024-01')
    const feb = result[0].monthlyBreakdown.find(m => m.month === '2024-02')
    expect(jan?.revenue).toBeCloseTo(15)
    expect(feb?.revenue).toBeCloseTo(20)
  })

  it('excludes items with no sales_month from the monthly breakdown (no Unknown row)', () => {
    const txs = [
      makeTx({ original_artist: 'Omnimar', sales_month: '2024-01', net_revenue: 10 }),
      // physical/merch item with no date
      makeTx({ original_artist: 'Omnimar', sales_month: '', net_revenue: 8, is_physical: true }),
    ]
    const result = processTransactions(txs, emptyConfig)
    // No empty-month entry in the breakdown
    expect(result[0].monthlyBreakdown.some(m => !m.month)).toBe(false)
    // Revenue from the no-date item is still in the totals
    expect(result[0].grossRevenue).toBeCloseTo(18)
  })

  it('sorts monthly breakdown chronologically', () => {
    const txs = [
      makeTx({ original_artist: 'Omnimar', sales_month: '2024-03', net_revenue: 1 }),
      makeTx({ original_artist: 'Omnimar', sales_month: '2024-01', net_revenue: 1 }),
      makeTx({ original_artist: 'Omnimar', sales_month: '2024-02', net_revenue: 1 }),
    ]
    const result = processTransactions(txs, emptyConfig)
    const months = result[0].monthlyBreakdown.map(m => m.month)
    expect(months).toEqual(['2024-01', '2024-02', '2024-03'])
  })

  it('aggregates release breakdown by UPC/EAN', () => {
    const txs = [
      makeTx({ original_artist: 'Omnimar', upc_ean: 'UPC001', release_title: 'Release 1', net_revenue: 7 }),
      makeTx({ original_artist: 'Omnimar', upc_ean: 'UPC001', release_title: 'Release 1', net_revenue: 3 }),
      makeTx({ original_artist: 'Omnimar', upc_ean: 'UPC002', release_title: 'Release 2', net_revenue: 15 }),
    ]
    const result = processTransactions(txs, emptyConfig)
    const rel1 = result[0].releaseBreakdown.find(r => r.upcEan === 'UPC001')
    const rel2 = result[0].releaseBreakdown.find(r => r.upcEan === 'UPC002')
    expect(rel1?.revenue).toBeCloseTo(10)
    expect(rel2?.revenue).toBeCloseTo(15)
  })
})

// ── Case-insensitive artist & release grouping ─────────────────────────────────

describe('case-insensitive artist grouping', () => {
  it('groups "NEUROKLAST" and "Neuroklast" as the same artist', () => {
    const txs = [
      makeTx({ original_artist: 'NEUROKLAST', net_revenue: 10 }),
      makeTx({ original_artist: 'Neuroklast', net_revenue: 20 }),
    ]
    const result = processTransactions(txs, emptyConfig)
    expect(result).toHaveLength(1)
    expect(result[0].grossRevenue).toBeCloseTo(30)
  })

  it('groups "SynthAttack" and "Synthattack" as the same artist', () => {
    const txs = [
      makeTx({ original_artist: 'SynthAttack', net_revenue: 5 }),
      makeTx({ original_artist: 'Synthattack', net_revenue: 15 }),
    ]
    const result = processTransactions(txs, emptyConfig)
    expect(result).toHaveLength(1)
    expect(result[0].grossRevenue).toBeCloseTo(20)
  })

  it('uses first-seen casing as the canonical artist name', () => {
    const txs = [
      makeTx({ original_artist: 'Neuroklast', net_revenue: 10 }),
      makeTx({ original_artist: 'NEUROKLAST', net_revenue: 5 }),
    ]
    const result = processTransactions(txs, emptyConfig)
    expect(result[0].artist).toBe('Neuroklast')
  })

  it('matches split fee case-insensitively', () => {
    const splitFees: SplitFee[] = [{ artist: 'neuroklast', percentage: 80 }]
    const txs = [makeTx({ original_artist: 'Neuroklast', net_revenue: 100 })]
    const result = processTransactions(txs, { ...emptyConfig, splitFees })
    expect(result[0].splitPercentage).toBe(80)
    expect(result[0].finalPayout).toBeCloseTo(80)
  })

  it('matches manual revenue case-insensitively', () => {
    const manualRevenues: ManualRevenue[] = [
      { id: '1', artist: 'NEUROKLAST', description: 'Sync', amount: 50 },
    ]
    const txs = [makeTx({ original_artist: 'Neuroklast', net_revenue: 10 })]
    const result = processTransactions(txs, { ...emptyConfig, manualRevenues })
    expect(result[0].manualRevenue).toBeCloseTo(50)
    expect(result[0].grossRevenue).toBeCloseTo(60)
  })
})

describe('case-insensitive release grouping', () => {
  it('groups releases with the same title regardless of casing', () => {
    const txs = [
      makeTx({ original_artist: 'Omnimar', upc_ean: '', catalog_number: '', release_title: 'Dark Matter EP', net_revenue: 8 }),
      makeTx({ original_artist: 'Omnimar', upc_ean: '', catalog_number: '', release_title: 'DARK MATTER EP', net_revenue: 12 }),
    ]
    const result = processTransactions(txs, emptyConfig)
    expect(result[0].releaseBreakdown).toHaveLength(1)
    expect(result[0].releaseBreakdown[0].revenue).toBeCloseTo(20)
  })

  it('merges duplicate releases by title when one source misses the UPC', () => {
    const txs = [
      makeTx({ original_artist: 'Omnimar', source: 'believe', upc_ean: 'UPC001', catalog_number: '', release_title: 'Same Album', net_revenue: 8, quantity: 2 }),
      makeTx({ original_artist: 'Omnimar', source: 'bandcamp', upc_ean: '', catalog_number: '', release_title: 'Same Album', net_revenue: 12, quantity: 3 }),
    ]
    const result = processTransactions(txs, emptyConfig)
    expect(result[0].releaseBreakdown).toHaveLength(1)
    expect(result[0].releaseBreakdown[0].releaseTitle).toBe('Same Album')
    expect(result[0].releaseBreakdown[0].revenue).toBeCloseTo(20)
    expect(result[0].releaseBreakdown[0].quantity).toBe(5)
  })

  it('does not merge untitled releases with different identifiers', () => {
    const txs = [
      makeTx({ original_artist: 'Omnimar', upc_ean: 'UPC001', catalog_number: '', release_title: '', net_revenue: 8 }),
      makeTx({ original_artist: 'Omnimar', upc_ean: 'UPC002', catalog_number: '', release_title: '', net_revenue: 12 }),
    ]
    const result = processTransactions(txs, emptyConfig)
    expect(result[0].releaseBreakdown).toHaveLength(2)
    expect(result[0].releaseBreakdown.every(r => r.releaseTitle === '')).toBe(true)
    expect(result[0].releaseBreakdown[0].revenue).toBeCloseTo(12)
    expect(result[0].releaseBreakdown[1].revenue).toBeCloseTo(8)
  })
})

// ── Per-release split overrides ────────────────────────────────────────────────

describe('per-release split overrides', () => {
  it('applies per-release override rate for a matching release title substring', () => {
    const txs = [
      makeTx({ original_artist: 'Omnimar', release_title: 'Different (Lim. Digipac CD)', net_revenue: 100, is_physical: true }),
    ]
    const splitFees: SplitFee[] = [{
      artist: 'Omnimar',
      percentage: 70,
      releaseOverrides: [{ releaseTitle: 'Different', percentage: 50 }],
    }]
    const result = processTransactions(txs, { ...emptyConfig, splitFees })
    // release matches the override → 50% split applied instead of 70%
    expect(result[0].finalPayout).toBeCloseTo(50)
  })

  it('falls back to type-level split for releases that do not match any override', () => {
    const txs = [
      makeTx({ original_artist: 'Omnimar', release_title: 'Normal Album', net_revenue: 100, is_physical: false }),
    ]
    const splitFees: SplitFee[] = [{
      artist: 'Omnimar',
      percentage: 80,
      releaseOverrides: [{ releaseTitle: 'Different', percentage: 50 }],
    }]
    const result = processTransactions(txs, { ...emptyConfig, splitFees })
    // No match → falls back to base split 80%
    expect(result[0].finalPayout).toBeCloseTo(80)
  })

  it('applies different rates per release group in the same artist bucket', () => {
    const txs = [
      makeTx({ original_artist: 'Omnimar', upc_ean: 'UPC001', release_title: 'EP One', net_revenue: 100, is_physical: false }),
      makeTx({ original_artist: 'Omnimar', upc_ean: 'UPC002', release_title: 'EP Two', net_revenue: 100, is_physical: false }),
    ]
    const splitFees: SplitFee[] = [{
      artist: 'Omnimar',
      percentage: 80,
      releaseOverrides: [{ releaseTitle: 'EP One', percentage: 60 }],
    }]
    const result = processTransactions(txs, { ...emptyConfig, splitFees })
    // EP One: 100 × 60% = 60; EP Two: 100 × 80% = 80; total = 140
    expect(result[0].finalPayout).toBeCloseTo(140)
  })

  it('is mathematically identical to non-override path when releaseOverrides is empty', () => {
    const txs = [
      makeTx({ original_artist: 'Omnimar', net_revenue: 100, is_physical: false }),
      makeTx({ original_artist: 'Omnimar', net_revenue: 50, is_physical: true }),
    ]
    const splitFeesWithEmpty: SplitFee[] = [{ artist: 'Omnimar', percentage: 70, releaseOverrides: [] }]
    const splitFeesWithout: SplitFee[] = [{ artist: 'Omnimar', percentage: 70 }]

    const withEmpty = processTransactions(txs, { ...emptyConfig, splitFees: splitFeesWithEmpty })
    const without = processTransactions(txs, { ...emptyConfig, splitFees: splitFeesWithout })
    expect(withEmpty[0].finalPayout).toBeCloseTo(without[0].finalPayout)
  })

  it('performs case-insensitive substring match on release title', () => {
    const txs = [
      makeTx({ original_artist: 'Omnimar', release_title: 'DIFFERENT (LIM. DIGIPAC CD)', net_revenue: 100, is_physical: true }),
    ]
    const splitFees: SplitFee[] = [{
      artist: 'Omnimar',
      percentage: 70,
      releaseOverrides: [{ releaseTitle: 'different', percentage: 40 }],
    }]
    const result = processTransactions(txs, { ...emptyConfig, splitFees })
    // case-insensitive match → 40% applied
    expect(result[0].finalPayout).toBeCloseTo(40)
  })

  it('manual revenue is always passed through regardless of release overrides', () => {
    const txs = [
      makeTx({ original_artist: 'Omnimar', release_title: 'Special Edition', net_revenue: 100, is_physical: false }),
    ]
    const manualRevenues: ManualRevenue[] = [{ id: '1', artist: 'Omnimar', description: 'Sync', amount: 200 }]
    const splitFees: SplitFee[] = [{
      artist: 'Omnimar',
      percentage: 100,
      releaseOverrides: [{ releaseTitle: 'Special Edition', percentage: 50 }],
    }]
    const result = processTransactions(txs, { ...emptyConfig, splitFees, manualRevenues })
    // Streaming: 100 × 50% = 50; Manual pass-through: 200; total = 250
    expect(result[0].finalPayout).toBeCloseTo(250)
  })

  it('splitPercentage on the output still reflects the base percentage, not the override', () => {
    const txs = [makeTx({ original_artist: 'Omnimar', net_revenue: 100, is_physical: false })]
    const splitFees: SplitFee[] = [{
      artist: 'Omnimar',
      percentage: 80,
      releaseOverrides: [{ releaseTitle: 'Test Release', percentage: 50 }],
    }]
    const result = processTransactions(txs, { ...emptyConfig, splitFees })
    // splitPercentage is the base for display, not the override
    expect(result[0].splitPercentage).toBe(80)
  })

  it('uses the first matching override when multiple overrides could match the same release title', () => {
    const txs = [
      makeTx({ original_artist: 'Omnimar', release_title: 'EP One Special Edition', net_revenue: 100, is_physical: false }),
    ]
    const splitFees: SplitFee[] = [{
      artist: 'Omnimar',
      percentage: 80,
      releaseOverrides: [
        { releaseTitle: 'EP One', percentage: 60 },
        { releaseTitle: 'EP', percentage: 40 },
      ],
    }]
    const result = processTransactions(txs, { ...emptyConfig, splitFees })
    // 'EP One' is the first match → 60% applied, not 40%
    expect(result[0].finalPayout).toBeCloseTo(60)
  })
})

// ── Per-source split overrides ─────────────────────────────────────────────────

describe('per-source split overrides', () => {
  it('applies source override for darkmerch transactions', () => {
    const txs = [
      makeTx({ original_artist: 'Omnimar', net_revenue: 100, is_physical: true, source: 'darkmerch' }),
    ]
    const splitFees: SplitFee[] = [{
      artist: 'Omnimar',
      percentage: 60,
      sourceOverrides: [{ source: 'darkmerch', percentage: 100 }],
    }]
    const result = processTransactions(txs, { ...emptyConfig, splitFees })
    // Darkmerch at 100% → artist keeps full amount
    expect(result[0].finalPayout).toBeCloseTo(100)
  })

  it('source override takes priority over physicalPercentage for darkmerch', () => {
    const txs = [
      makeTx({ original_artist: 'Omnimar', net_revenue: 200, is_physical: true, source: 'darkmerch' }),
    ]
    const splitFees: SplitFee[] = [{
      artist: 'Omnimar',
      percentage: 60,
      physicalPercentage: 40,
      sourceOverrides: [{ source: 'darkmerch', percentage: 100 }],
    }]
    const result = processTransactions(txs, { ...emptyConfig, splitFees })
    // Source override (100%) wins over physicalPercentage (40%) for darkmerch
    expect(result[0].finalPayout).toBeCloseTo(200)
  })

  it('non-darkmerch physical still uses physicalPercentage when darkmerch source override is set', () => {
    const txs = [
      makeTx({ original_artist: 'Omnimar', net_revenue: 100, is_physical: true, source: 'believe' }),
      makeTx({ original_artist: 'Omnimar', net_revenue: 100, is_physical: true, source: 'darkmerch' }),
    ]
    const splitFees: SplitFee[] = [{
      artist: 'Omnimar',
      percentage: 60,
      physicalPercentage: 40,
      sourceOverrides: [{ source: 'darkmerch', percentage: 100 }],
    }]
    const result = processTransactions(txs, { ...emptyConfig, splitFees })
    // Believe physical at 40%, darkmerch at 100%: 40 + 100 = 140
    expect(result[0].finalPayout).toBeCloseTo(140)
  })

  it('separates darkmerch from totalPhysicalRevenue in physicalReleasesRevenue', () => {
    const txs = [
      makeTx({ original_artist: 'Omnimar', net_revenue: 100, is_physical: true, source: 'believe' }),
      makeTx({ original_artist: 'Omnimar', net_revenue: 50, is_physical: true, source: 'darkmerch' }),
    ]
    const result = processTransactions(txs, { ...emptyConfig })
    expect(result[0].totalPhysicalRevenue).toBeCloseTo(150)
    expect(result[0].physicalReleasesRevenue).toBeCloseTo(100)
    expect(result[0].darkmerchRevenue).toBeCloseTo(50)
  })

  it('exposes digitalSplitPercentage, physicalSplitPercentage, darkmerchSplitPercentage on output', () => {
    const txs = [
      makeTx({ original_artist: 'Omnimar', net_revenue: 100, is_physical: false }),
      makeTx({ original_artist: 'Omnimar', net_revenue: 100, is_physical: true, source: 'darkmerch' }),
    ]
    const splitFees: SplitFee[] = [{
      artist: 'Omnimar',
      percentage: 60,
      digitalPercentage: 70,
      sourceOverrides: [{ source: 'darkmerch', percentage: 100 }],
    }]
    const result = processTransactions(txs, { ...emptyConfig, splitFees })
    expect(result[0].digitalSplitPercentage).toBe(70)
    expect(result[0].physicalSplitPercentage).toBe(60)
    expect(result[0].darkmerchSplitPercentage).toBe(100)
  })

  // ── Bucket split regression tests ──────────────────────────────────────────
  // Bucket splits (sourceSplits) are a parallel system that activates ONLY when
  // the value is explicitly set. When NOT set, the normal main chain applies:
  //   globalBase → globalTypeDefault → perArtistBase → perArtistType → perRelease
  //
  // When SET, the bucket split bypasses the main chain entirely.
  // The ONLY override for an active bucket split is a per-artist sourceOverride
  // for that specific source.

  // ── When bucket split IS set: bypasses main chain ──

  it('sourceSplits.darkmerch (when set) bypasses per-artist base', () => {
    const txs = [
      makeTx({ original_artist: 'BLACKBOOK', net_revenue: 514, is_physical: true, source: 'darkmerch' }),
    ]
    const result = processTransactions(txs, {
      ...emptyConfig,
      splitFees: [{ artist: 'BLACKBOOK', percentage: 50 }],
      sourceSplits: { darkmerch: 100 },
    })
    expect(result[0].darkmerchSplitPercentage).toBe(100)
    expect(result[0].finalPayout).toBeCloseTo(514)
  })

  it('sourceSplits.darkmerch (when set) bypasses per-artist physicalPercentage', () => {
    const txs = [
      makeTx({ original_artist: 'BLACKBOOK', net_revenue: 100, is_physical: true, source: 'darkmerch' }),
    ]
    const result = processTransactions(txs, {
      ...emptyConfig,
      splitFees: [{ artist: 'BLACKBOOK', percentage: 50, physicalPercentage: 70 }],
      sourceSplits: { darkmerch: 100 },
    })
    expect(result[0].darkmerchSplitPercentage).toBe(100)
  })

  it('sourceSplits.physical (when set) bypasses per-artist base', () => {
    const txs = [
      makeTx({ original_artist: 'BLACKBOOK', net_revenue: 424, is_physical: true, source: 'believe' }),
    ]
    const result = processTransactions(txs, {
      ...emptyConfig,
      splitFees: [{ artist: 'BLACKBOOK', percentage: 50 }],
      sourceSplits: { physical: 15 },
    })
    expect(result[0].physicalSplitPercentage).toBe(15)
    expect(result[0].finalPayout).toBeCloseTo(424 * 0.15)
  })

  it('sourceSplits.believe (when set) bypasses per-artist base', () => {
    const txs = [
      makeTx({ original_artist: 'BLACKBOOK', net_revenue: 200, is_physical: false, source: 'believe' }),
    ]
    const result = processTransactions(txs, {
      ...emptyConfig,
      splitFees: [{ artist: 'BLACKBOOK', percentage: 50 }],
      sourceSplits: { believe: 60 },
    })
    expect(result[0].digitalSplitPercentage).toBe(60)
    expect(result[0].finalPayout).toBeCloseTo(200 * 0.6)
  })

  it('per-artist sourceOverride can still override an active bucket split', () => {
    const txs = [
      makeTx({ original_artist: 'BLACKBOOK', net_revenue: 100, is_physical: true, source: 'darkmerch' }),
    ]
    const result = processTransactions(txs, {
      ...emptyConfig,
      splitFees: [{ artist: 'BLACKBOOK', percentage: 50, sourceOverrides: [{ source: 'darkmerch', percentage: 80 }] }],
      sourceSplits: { darkmerch: 100 },
    })
    // source override (80) wins over bucket split (100)
    expect(result[0].darkmerchSplitPercentage).toBe(80)
  })

  it('all three bucket splits apply simultaneously when set', () => {
    const txs = [
      makeTx({ original_artist: 'BLACKBOOK', net_revenue: 200, is_physical: false, source: 'believe' }),
      makeTx({ original_artist: 'BLACKBOOK', net_revenue: 400, is_physical: true, source: 'believe' }),
      makeTx({ original_artist: 'BLACKBOOK', net_revenue: 500, is_physical: true, source: 'darkmerch' }),
    ]
    const result = processTransactions(txs, {
      ...emptyConfig,
      splitFees: [{ artist: 'BLACKBOOK', percentage: 50 }],
      sourceSplits: { believe: 50, physical: 15, darkmerch: 100 },
    })
    expect(result[0].digitalSplitPercentage).toBe(50)
    expect(result[0].physicalSplitPercentage).toBe(15)
    expect(result[0].darkmerchSplitPercentage).toBe(100)
    expect(result[0].finalPayout).toBeCloseTo(200 * 0.5 + 400 * 0.15 + 500 * 1.0)
  })

  // ── When bucket split is NOT set: main chain applies normally ──

  it('darkmerch falls through to main physical chain when sourceSplits.darkmerch is not set', () => {
    const txs = [
      makeTx({ original_artist: 'BLACKBOOK', net_revenue: 100, is_physical: true, source: 'darkmerch' }),
    ]
    const result = processTransactions(txs, {
      ...emptyConfig,
      splitFees: [{ artist: 'BLACKBOOK', percentage: 70 }],
      // no sourceSplits.darkmerch configured
    })
    // main chain: per-artist base 70 applies
    expect(result[0].darkmerchSplitPercentage).toBe(70)
  })

  it('physical falls through to main chain when sourceSplits.physical is not set', () => {
    const txs = [
      makeTx({ original_artist: 'BLACKBOOK', net_revenue: 100, is_physical: true, source: 'believe' }),
    ]
    const result = processTransactions(txs, {
      ...emptyConfig,
      splitFees: [{ artist: 'BLACKBOOK', percentage: 40 }],
      // no sourceSplits.physical configured
    })
    // main chain: per-artist base 40 applies
    expect(result[0].physicalSplitPercentage).toBe(40)
  })

  it('digital falls through to main chain when sourceSplits.believe/bandcamp not set', () => {
    const txs = [
      makeTx({ original_artist: 'BLACKBOOK', net_revenue: 100, is_physical: false, source: 'believe' }),
    ]
    const result = processTransactions(txs, {
      ...emptyConfig,
      splitFees: [{ artist: 'BLACKBOOK', percentage: 60 }],
      // no sourceSplits.believe configured
    })
    // main chain: per-artist base 60 applies
    expect(result[0].digitalSplitPercentage).toBe(60)
  })

  it('when no bucket split and no per-artist entry, globalTypeDefault applies for physical', () => {
    const txs = [
      makeTx({ original_artist: 'BLACKBOOK', net_revenue: 100, is_physical: true, source: 'believe' }),
    ]
    const result = processTransactions(txs, {
      ...emptyConfig,
      defaultSplitPercentage: 50,
      defaultSplitPercentagePhysical: 30,
      // no sourceSplits.physical
    })
    // main chain with no per-artist: globalPhysical (30) overrides globalBase (50)
    expect(result[0].physicalSplitPercentage).toBe(30)
  })

  // ── Bug regression: defaultSplitPercentagePhysical/Digital with per-artist base ──
  // Previously, an auto-created per-artist entry (percentage = 50) silently overrode the
  // label-wide type default (e.g. defaultSplitPercentagePhysical = 15), showing 50% in the
  // PDF instead of 15%. The label-wide type default now beats the per-artist base so that
  // policies like "all physical = 15%" are respected for all artists.

  it('globalTypeDefault for physical overrides per-artist base when no per-artist physicalPercentage is set', () => {
    const txs = [
      makeTx({ original_artist: 'BLACKBOOK', net_revenue: 100, is_physical: true, source: 'believe' }),
    ]
    const result = processTransactions(txs, {
      ...emptyConfig,
      defaultSplitPercentage: 50,
      defaultSplitPercentagePhysical: 15,
      splitFees: [{ artist: 'BLACKBOOK', percentage: 50 }], // auto-created by useSplitFeeSync
      // no sourceSplits.physical
    })
    // globalPhysical (15) should override per-artist base (50) — the core bug fix
    expect(result[0].physicalSplitPercentage).toBe(15)
    expect(result[0].finalPayout).toBeCloseTo(100 * 0.15)
  })

  it('per-artist physicalPercentage still overrides globalTypeDefault for physical', () => {
    const txs = [
      makeTx({ original_artist: 'BLACKBOOK', net_revenue: 100, is_physical: true, source: 'believe' }),
    ]
    const result = processTransactions(txs, {
      ...emptyConfig,
      defaultSplitPercentage: 50,
      defaultSplitPercentagePhysical: 15,
      splitFees: [{ artist: 'BLACKBOOK', percentage: 50, physicalPercentage: 70 }],
      // no sourceSplits.physical
    })
    // Explicit physicalPercentage (70) beats globalPhysical (15)
    expect(result[0].physicalSplitPercentage).toBe(70)
    expect(result[0].finalPayout).toBeCloseTo(100 * 0.70)
  })

  it('globalTypeDefault for digital overrides per-artist base when no per-artist digitalPercentage is set', () => {
    const txs = [
      makeTx({ original_artist: 'BLACKBOOK', net_revenue: 100, is_physical: false, source: 'believe' }),
    ]
    const result = processTransactions(txs, {
      ...emptyConfig,
      defaultSplitPercentage: 80,
      defaultSplitPercentageDigital: 40,
      splitFees: [{ artist: 'BLACKBOOK', percentage: 80 }], // auto-created by useSplitFeeSync
      // no sourceSplits.believe
    })
    // globalDigital (40) should override per-artist base (80)
    expect(result[0].digitalSplitPercentage).toBe(40)
    expect(result[0].finalPayout).toBeCloseTo(100 * 0.40)
  })

  it('per-artist digitalPercentage still overrides globalTypeDefault for digital', () => {
    const txs = [
      makeTx({ original_artist: 'BLACKBOOK', net_revenue: 100, is_physical: false, source: 'believe' }),
    ]
    const result = processTransactions(txs, {
      ...emptyConfig,
      defaultSplitPercentage: 80,
      defaultSplitPercentageDigital: 40,
      splitFees: [{ artist: 'BLACKBOOK', percentage: 80, digitalPercentage: 60 }],
      // no sourceSplits.believe
    })
    // Explicit digitalPercentage (60) beats globalDigital (40)
    expect(result[0].digitalSplitPercentage).toBe(60)
    expect(result[0].finalPayout).toBeCloseTo(100 * 0.60)
  })

  it('globalTypeDefault physical + globalTypeDefault digital both apply to artist with only base rate', () => {
    const txs = [
      makeTx({ original_artist: 'BLACKBOOK', net_revenue: 200, is_physical: false, source: 'believe' }),
      makeTx({ original_artist: 'BLACKBOOK', net_revenue: 100, is_physical: true, source: 'believe' }),
    ]
    const result = processTransactions(txs, {
      ...emptyConfig,
      defaultSplitPercentage: 50,
      defaultSplitPercentageDigital: 50,
      defaultSplitPercentagePhysical: 15,
      splitFees: [{ artist: 'BLACKBOOK', percentage: 50 }], // mirrors the screenshot scenario
    })
    // PDF screenshot bug: both showed 50%, physical should be 15%
    expect(result[0].digitalSplitPercentage).toBe(50)
    expect(result[0].physicalSplitPercentage).toBe(15)
    // digital: 200 × 50% = 100; physical: 100 × 15% = 15; total = 115
    expect(result[0].finalPayout).toBeCloseTo(115)
  })

  it('applies source override for darkmerch in release-override path', () => {
    const txs = [
      makeTx({ original_artist: 'Omnimar', release_title: 'Some Release', net_revenue: 100, is_physical: true, source: 'darkmerch' }),
      makeTx({ original_artist: 'Omnimar', release_title: 'Some Release', net_revenue: 50, is_physical: false }),
    ]
    const splitFees: SplitFee[] = [{
      artist: 'Omnimar',
      percentage: 60,
      sourceOverrides: [{ source: 'darkmerch', percentage: 100 }],
      releaseOverrides: [],
    }]
    const result = processTransactions(txs, { ...emptyConfig, splitFees })
    // Digital 50 × 60% = 30; Darkmerch 100 × 100% = 100; total = 130
    expect(result[0].finalPayout).toBeCloseTo(130)
  })
})

// ── trackRevenueAssignments ────────────────────────────────────────────────────

describe('trackRevenueAssignments', () => {
  it('re-attributes all revenue from a matching release to the owner artist', () => {
    const txs = [
      makeTx({ original_artist: 'ArtistA feat. ArtistB', release_title: 'Collab Album', net_revenue: 100 }),
      makeTx({ original_artist: 'ArtistB', release_title: 'Solo Album', net_revenue: 50 }),
    ]
    const result = processTransactions(txs, {
      ...emptyConfig,
      trackRevenueAssignments: [{ id: '1', trackTitle: 'Collab Album', ownerArtist: 'ArtistA' }],
    })
    const artistA = result.find(r => r.artist === 'ArtistA')
    const artistB = result.find(r => r.artist === 'ArtistB')
    expect(artistA?.grossRevenue).toBeCloseTo(100)
    expect(artistB?.grossRevenue).toBeCloseTo(50)
  })

  it('does not affect artists when no rule matches', () => {
    const txs = [
      makeTx({ original_artist: 'ArtistA', release_title: 'Release X', net_revenue: 80 }),
    ]
    const result = processTransactions(txs, {
      ...emptyConfig,
      trackRevenueAssignments: [{ id: '1', trackTitle: 'Release Y', ownerArtist: 'ArtistB' }],
    })
    const artistA = result.find(r => r.artist === 'ArtistA')
    expect(artistA?.grossRevenue).toBeCloseTo(80)
  })

  it('is case-insensitive and matches substrings', () => {
    const txs = [
      makeTx({ original_artist: 'ArtistA', release_title: 'My Great Album Vol. 1', net_revenue: 60 }),
    ]
    const result = processTransactions(txs, {
      ...emptyConfig,
      trackRevenueAssignments: [{ id: '1', trackTitle: 'great album', ownerArtist: 'ArtistB' }],
    })
    const artistB = result.find(r => r.artist === 'ArtistB')
    const artistA = result.find(r => r.artist === 'ArtistA')
    expect(artistB?.grossRevenue).toBeCloseTo(60)
    expect(artistA).toBeUndefined()
  })

  it('first matching rule wins when multiple rules could match', () => {
    const txs = [
      makeTx({ original_artist: 'ArtistA', release_title: 'Shared Title', net_revenue: 40 }),
    ]
    const result = processTransactions(txs, {
      ...emptyConfig,
      trackRevenueAssignments: [
        { id: '1', trackTitle: 'Shared Title', ownerArtist: 'Owner1' },
        { id: '2', trackTitle: 'Shared', ownerArtist: 'Owner2' },
      ],
    })
    const owner1 = result.find(r => r.artist === 'Owner1')
    const owner2 = result.find(r => r.artist === 'Owner2')
    expect(owner1?.grossRevenue).toBeCloseTo(40)
    expect(owner2).toBeUndefined()
  })

  it('skips rules with empty trackTitle', () => {
    const txs = [
      makeTx({ original_artist: 'ArtistA', release_title: 'Some Release', net_revenue: 70 }),
    ]
    const result = processTransactions(txs, {
      ...emptyConfig,
      trackRevenueAssignments: [{ id: '1', trackTitle: '', ownerArtist: 'ArtistB' }],
    })
    const artistA = result.find(r => r.artist === 'ArtistA')
    expect(artistA?.grossRevenue).toBeCloseTo(70)
  })

  it('splits revenue proportionally among multiple owners', () => {
    const txs = [
      makeTx({ original_artist: 'Artist A', release_title: 'Collab EP', net_revenue: 100 }),
    ]
    const result = processTransactions(txs, {
      ...emptyConfig,
      trackRevenueAssignments: [{
        id: '1',
        trackTitle: 'Collab EP',
        owners: [
          { artist: 'Artist A', percentage: 60 },
          { artist: 'Artist B', percentage: 40 },
        ],
      }],
    })
    const artistA = result.find(r => r.artist === 'Artist A')
    const artistB = result.find(r => r.artist === 'Artist B')
    expect(artistA?.grossRevenue).toBeCloseTo(60)
    expect(artistB?.grossRevenue).toBeCloseTo(40)
  })

  it('falls back to ownerArtist when owners is absent (backward-compat)', () => {
    const txs = [
      makeTx({ original_artist: 'ArtistX', release_title: 'Legacy Album', net_revenue: 80 }),
    ]
    const result = processTransactions(txs, {
      ...emptyConfig,
      trackRevenueAssignments: [{ id: '1', trackTitle: 'Legacy Album', ownerArtist: 'ArtistY' }],
    })
    const artistY = result.find(r => r.artist === 'ArtistY')
    expect(artistY?.grossRevenue).toBeCloseTo(80)
  })

  it('three-way split sums to full revenue', () => {
    const txs = [
      makeTx({ original_artist: 'Various', release_title: 'Three Way', net_revenue: 300 }),
    ]
    const result = processTransactions(txs, {
      ...emptyConfig,
      trackRevenueAssignments: [{
        id: '1',
        trackTitle: 'Three Way',
        owners: [
          { artist: 'Artist A', percentage: 50 },
          { artist: 'Artist B', percentage: 30 },
          { artist: 'Artist C', percentage: 20 },
        ],
      }],
    })
    const total = result.reduce((s, r) => s + r.grossRevenue, 0)
    expect(total).toBeCloseTo(300)
    expect(result.find(r => r.artist === 'Artist A')?.grossRevenue).toBeCloseTo(150)
    expect(result.find(r => r.artist === 'Artist B')?.grossRevenue).toBeCloseTo(90)
    expect(result.find(r => r.artist === 'Artist C')?.grossRevenue).toBeCloseTo(60)
  })
})
