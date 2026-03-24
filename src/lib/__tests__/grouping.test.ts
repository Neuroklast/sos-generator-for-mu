import { describe, it, expect } from 'vitest'
import {
  groupTransactions,
  nestedGroupTransactions,
  filterTransactions,
  defaultFilterState,
  getAvailablePlatforms,
  getAvailableCountries,
  buildArtistCollabTree,
} from '../grouping'
import type { FilterState, ArtistMapping } from '../grouping'
import type { SalesTransaction } from '../csv-parser'

// ── Fixture factories ─────────────────────────────────────────────────────────

function makeTx(overrides: Partial<SalesTransaction> = {}): SalesTransaction {
  return {
    id: crypto.randomUUID(),
    source: 'believe',
    sales_month: '2024-01',
    platform: 'Spotify',
    country: 'DE',
    main_artist: 'Artist A',
    original_artist: 'Artist A',
    release_title: 'Album X',
    track_title: 'Track 1',
    upc_ean: '',
    isrc: '',
    catalog_number: '',
    quantity: 10,
    net_revenue: 1.0,
    currency: 'EUR',
    is_physical: false,
    ...overrides,
  }
}

const TX_A1 = makeTx({ main_artist: 'Artist A', original_artist: 'Artist A', platform: 'Spotify', country: 'DE', sales_month: '2024-01', release_title: 'Album X', track_title: 'Track 1', net_revenue: 10, quantity: 100 })
const TX_A2 = makeTx({ main_artist: 'Artist A', original_artist: 'Artist A', platform: 'Apple Music', country: 'FR', sales_month: '2024-02', release_title: 'Album X', track_title: 'Track 2', net_revenue: 5, quantity: 50 })
const TX_B1 = makeTx({ main_artist: 'Artist B', original_artist: 'Artist B', platform: 'Spotify', country: 'US', sales_month: '2024-01', release_title: 'Album Y', track_title: 'Track 1', net_revenue: 20, quantity: 200 })
const TX_COLLAB = makeTx({ main_artist: 'Artist C', original_artist: 'Artist C feat. Artist D', platform: 'Tidal', country: 'DE', sales_month: '2024-03', release_title: 'Collab EP', track_title: 'Collab Track', net_revenue: 8, quantity: 80 })

const SAMPLE_TXS = [TX_A1, TX_A2, TX_B1, TX_COLLAB]

// ── groupTransactions ─────────────────────────────────────────────────────────

describe('groupTransactions', () => {
  it('groups by artist', () => {
    const result = groupTransactions(SAMPLE_TXS, 'artist')
    expect(result).toHaveLength(3)
    const artistB = result.find(n => n.key === 'Artist B')!
    expect(artistB.revenue).toBe(20)
    expect(artistB.quantity).toBe(200)
    expect(artistB.transactionCount).toBe(1)
    const artistA = result.find(n => n.key === 'Artist A')!
    expect(artistA.revenue).toBe(15)
    expect(artistA.transactionCount).toBe(2)
  })

  it('groups by album', () => {
    const result = groupTransactions(SAMPLE_TXS, 'album')
    expect(result.find(n => n.key === 'Album X')?.transactionCount).toBe(2)
    expect(result.find(n => n.key === 'Album Y')?.transactionCount).toBe(1)
  })

  it('groups by song', () => {
    const result = groupTransactions(SAMPLE_TXS, 'song')
    // Two "Track 1" items across artists
    const t1 = result.find(n => n.key === 'Track 1')!
    expect(t1.transactionCount).toBe(2)
  })

  it('groups by platform', () => {
    const result = groupTransactions(SAMPLE_TXS, 'platform')
    const spotify = result.find(n => n.key === 'Spotify')!
    expect(spotify.transactionCount).toBe(2)
    expect(spotify.revenue).toBe(30)
  })

  it('groups by country', () => {
    const result = groupTransactions(SAMPLE_TXS, 'country')
    const de = result.find(n => n.key === 'DE')!
    expect(de.transactionCount).toBe(2)
  })

  it('groups by month', () => {
    const result = groupTransactions(SAMPLE_TXS, 'month')
    expect(result).toHaveLength(3)
    const jan = result.find(n => n.key === '2024-01')!
    expect(jan.revenue).toBe(30) // TX_A1 + TX_B1
  })

  it('sorts by revenue descending', () => {
    const result = groupTransactions(SAMPLE_TXS, 'artist')
    expect(result[0].revenue).toBeGreaterThanOrEqual(result[1].revenue)
  })

  it('returns empty array for empty input', () => {
    expect(groupTransactions([], 'artist')).toEqual([])
  })

  it('handles single transaction', () => {
    const result = groupTransactions([TX_A1], 'artist')
    expect(result).toHaveLength(1)
    expect(result[0].key).toBe('Artist A')
  })
})

// ── nestedGroupTransactions ───────────────────────────────────────────────────

describe('nestedGroupTransactions', () => {
  it('returns empty array for empty input', () => {
    expect(nestedGroupTransactions([], ['artist', 'album'])).toEqual([])
  })

  it('returns empty array for empty fields', () => {
    expect(nestedGroupTransactions(SAMPLE_TXS, [])).toEqual([])
  })

  it('single field = same as groupTransactions', () => {
    const nested = nestedGroupTransactions(SAMPLE_TXS, ['artist'])
    const flat = groupTransactions(SAMPLE_TXS, 'artist')
    expect(nested.map(n => n.key).sort()).toEqual(flat.map(n => n.key).sort())
  })

  it('two levels: artist → album', () => {
    const result = nestedGroupTransactions([TX_A1, TX_A2, TX_B1], ['artist', 'album'])
    const artistA = result.find(n => n.key === 'Artist A')!
    expect(artistA.children).toBeDefined()
    expect(artistA.children!).toHaveLength(1)
    expect(artistA.children![0].key).toBe('Album X')
    // Artist B has Album Y as child
    const artistB = result.find(n => n.key === 'Artist B')!
    expect(artistB.children![0].key).toBe('Album Y')
  })

  it('nested nodes accumulate revenue correctly', () => {
    const result = nestedGroupTransactions([TX_A1, TX_A2], ['artist', 'platform'])
    const artistA = result[0]
    expect(artistA.revenue).toBe(15)
    const spotifyChild = artistA.children!.find(c => c.key === 'Spotify')!
    expect(spotifyChild.revenue).toBe(10)
  })
})

// ── filterTransactions ────────────────────────────────────────────────────────

describe('filterTransactions', () => {
  it('returns all transactions with default filter', () => {
    const result = filterTransactions(SAMPLE_TXS, defaultFilterState())
    expect(result).toHaveLength(SAMPLE_TXS.length)
  })

  it('filters by search query (artist name)', () => {
    const filter: FilterState = { ...defaultFilterState(), searchQuery: 'Artist B' }
    const result = filterTransactions(SAMPLE_TXS, filter)
    expect(result).toHaveLength(1)
    expect(result[0].main_artist).toBe('Artist B')
  })

  it('filters by search query (platform)', () => {
    const filter: FilterState = { ...defaultFilterState(), searchQuery: 'tidal' }
    const result = filterTransactions(SAMPLE_TXS, filter)
    expect(result).toHaveLength(1)
  })

  it('filters by selected platforms', () => {
    const filter: FilterState = { ...defaultFilterState(), selectedPlatforms: ['Apple Music'] }
    const result = filterTransactions(SAMPLE_TXS, filter)
    expect(result).toHaveLength(1)
    expect(result[0].platform).toBe('Apple Music')
  })

  it('filters by selected countries', () => {
    const filter: FilterState = { ...defaultFilterState(), selectedCountries: ['US'] }
    const result = filterTransactions(SAMPLE_TXS, filter)
    expect(result).toHaveLength(1)
    expect(result[0].country).toBe('US')
  })

  it('filters by selected sources', () => {
    const bandcampTx = makeTx({ source: 'bandcamp', main_artist: 'Band', net_revenue: 3, quantity: 30 })
    const allTxs = [...SAMPLE_TXS, bandcampTx]
    const filter: FilterState = { ...defaultFilterState(), selectedSources: ['bandcamp'] }
    const result = filterTransactions(allTxs, filter)
    expect(result).toHaveLength(1)
    expect(result[0].source).toBe('bandcamp')
  })

  it('filters by minRevenue', () => {
    const filter: FilterState = { ...defaultFilterState(), minRevenue: 15 }
    const result = filterTransactions(SAMPLE_TXS, filter)
    // Only TX_B1 (20) qualifies
    expect(result.every(tx => tx.net_revenue >= 15)).toBe(true)
  })

  it('filters by maxRevenue', () => {
    const filter: FilterState = { ...defaultFilterState(), maxRevenue: 10 }
    const result = filterTransactions(SAMPLE_TXS, filter)
    expect(result.every(tx => tx.net_revenue <= 10)).toBe(true)
  })

  it('filters by dateFrom', () => {
    const filter: FilterState = { ...defaultFilterState(), dateFrom: '2024-02' }
    const result = filterTransactions(SAMPLE_TXS, filter)
    expect(result.every(tx => tx.sales_month >= '2024-02')).toBe(true)
  })

  it('filters by dateTo', () => {
    const filter: FilterState = { ...defaultFilterState(), dateTo: '2024-01' }
    const result = filterTransactions(SAMPLE_TXS, filter)
    expect(result.every(tx => tx.sales_month <= '2024-01')).toBe(true)
  })

  it('combines multiple filters', () => {
    const filter: FilterState = {
      ...defaultFilterState(),
      selectedPlatforms: ['Spotify'],
      selectedCountries: ['DE'],
    }
    const result = filterTransactions(SAMPLE_TXS, filter)
    expect(result).toHaveLength(1)
    expect(result[0].main_artist).toBe('Artist A')
  })

  it('returns empty for impossible filter combination', () => {
    const filter: FilterState = { ...defaultFilterState(), selectedPlatforms: ['Nonexistent'] }
    expect(filterTransactions(SAMPLE_TXS, filter)).toHaveLength(0)
  })

  it('returns empty for empty input', () => {
    expect(filterTransactions([], defaultFilterState())).toHaveLength(0)
  })
})

// ── defaultFilterState ────────────────────────────────────────────────────────

describe('defaultFilterState', () => {
  it('returns correct empty state', () => {
    const state = defaultFilterState()
    expect(state.searchQuery).toBe('')
    expect(state.selectedPlatforms).toEqual([])
    expect(state.selectedCountries).toEqual([])
    expect(state.selectedSources).toEqual([])
    expect(state.minRevenue).toBe(0)
    expect(state.maxRevenue).toBe(Infinity)
    expect(state.dateFrom).toBe('')
    expect(state.dateTo).toBe('')
  })

  it('returns independent objects each call', () => {
    const a = defaultFilterState()
    const b = defaultFilterState()
    a.selectedPlatforms.push('X')
    expect(b.selectedPlatforms).toHaveLength(0)
  })
})

// ── getAvailablePlatforms / getAvailableCountries ─────────────────────────────

describe('getAvailablePlatforms', () => {
  it('returns sorted unique platforms', () => {
    const result = getAvailablePlatforms(SAMPLE_TXS)
    expect(result).toContain('Spotify')
    expect(result).toContain('Apple Music')
    expect(result).toContain('Tidal')
    // Unique (Spotify appears twice across TX_A1 + TX_B1)
    expect(result.filter(p => p === 'Spotify')).toHaveLength(1)
    expect([...result]).toEqual([...result].sort())
  })

  it('returns empty for empty input', () => {
    expect(getAvailablePlatforms([])).toEqual([])
  })
})

describe('getAvailableCountries', () => {
  it('returns sorted unique countries', () => {
    const result = getAvailableCountries(SAMPLE_TXS)
    expect(result).toContain('DE')
    expect(result).toContain('FR')
    expect(result).toContain('US')
    expect([...result]).toEqual([...result].sort())
  })

  it('returns empty for empty input', () => {
    expect(getAvailableCountries([])).toEqual([])
  })
})

// ── buildArtistCollabTree ─────────────────────────────────────────────────────

describe('buildArtistCollabTree', () => {
  it('returns empty for empty input', () => {
    expect(buildArtistCollabTree([], [])).toEqual([])
  })

  it('groups solo artist without collabs', () => {
    const result = buildArtistCollabTree([TX_A1, TX_A2], [])
    expect(result).toHaveLength(1)
    const node = result[0]
    expect(node.primaryArtist).toBe('Artist A')
    expect(node.collabEntries).toHaveLength(0)
    expect(node.revenue).toBe(15)
    expect(node.quantity).toBe(150)
  })

  it('extracts featured artist as collab', () => {
    const result = buildArtistCollabTree([TX_COLLAB], [])
    const artistC = result.find(n => n.primaryArtist === 'Artist C')!
    expect(artistC).toBeDefined()
    expect(artistC.collabEntries).toHaveLength(1)
    expect(artistC.collabEntries[0].name).toBe('Artist D')
    expect(artistC.collabEntries[0].revenue).toBe(8)
  })

  it('applies artist mapping overrides', () => {
    const mapping: ArtistMapping = { id: '1', featuringName: 'Artist A feat. Artist B', primaryArtist: 'Artist A' }
    const tx = makeTx({ original_artist: 'Artist A feat. Artist B', net_revenue: 5, quantity: 50 })
    const result = buildArtistCollabTree([tx], [mapping])
    // The whole entry is re-mapped to Artist A without collab expansion
    const node = result.find(n => n.primaryArtist === 'Artist A')!
    expect(node).toBeDefined()
    expect(node.revenue).toBe(5)
  })

  it('sorts result by revenue descending', () => {
    const result = buildArtistCollabTree([TX_A1, TX_B1, TX_COLLAB], [])
    expect(result[0].revenue).toBeGreaterThanOrEqual(result[1].revenue)
    if (result.length > 2) {
      expect(result[1].revenue).toBeGreaterThanOrEqual(result[2].revenue)
    }
  })

  it('accumulates revenue from multiple transactions for same artist', () => {
    const result = buildArtistCollabTree([TX_A1, TX_A2, TX_B1], [])
    const artistA = result.find(n => n.primaryArtist === 'Artist A')!
    expect(artistA.revenue).toBeCloseTo(15)
    expect(artistA.quantity).toBe(150)
  })

  it('handles artists with no original_artist field', () => {
    const tx = makeTx({ original_artist: '', main_artist: 'Solo Artist', net_revenue: 3, quantity: 30 })
    const result = buildArtistCollabTree([tx], [])
    expect(result.find(n => n.primaryArtist === 'Solo Artist')).toBeDefined()
  })
})
