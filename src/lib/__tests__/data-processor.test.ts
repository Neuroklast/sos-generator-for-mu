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
      makeTx({ original_artist: 'Omnimar', upc_ean: 'UPC001', net_revenue: 7 }),
      makeTx({ original_artist: 'Omnimar', upc_ean: 'UPC001', net_revenue: 3 }),
      makeTx({ original_artist: 'Omnimar', upc_ean: 'UPC002', net_revenue: 15 }),
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
})
