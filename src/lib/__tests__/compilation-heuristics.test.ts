import { describe, it, expect } from 'vitest'
import { detectCompilationCandidates } from '../compilation-heuristics'
import type { HeuristicTransaction } from '../compilation-heuristics'

function makeTx(overrides: Partial<HeuristicTransaction> = {}): HeuristicTransaction {
  return {
    release_title: 'Test Release',
    upc_ean: '123456',
    catalog_number: 'CAT001',
    main_artist: 'Artist A',
    ...overrides,
  }
}

describe('detectCompilationCandidates', () => {
  it('returns empty array when no transactions are provided', () => {
    expect(detectCompilationCandidates([])).toEqual([])
  })

  it('ignores releases with a single artist below the threshold', () => {
    const txs = [
      makeTx({ main_artist: 'Artist A' }),
      makeTx({ main_artist: 'Artist A' }),
    ]
    expect(detectCompilationCandidates(txs)).toHaveLength(0)
  })

  it('flags a release with >= 3 distinct artists (medium confidence)', () => {
    const txs = [
      makeTx({ main_artist: 'Artist A' }),
      makeTx({ main_artist: 'Artist B' }),
      makeTx({ main_artist: 'Artist C' }),
    ]
    const results = detectCompilationCandidates(txs)
    expect(results).toHaveLength(1)
    expect(results[0].confidence).toBe('medium')
    expect(results[0].uniqueArtistCount).toBe(3)
    expect(results[0].reasons).toContain('3 distinct artists')
  })

  it('flags high confidence when >= 5 distinct artists', () => {
    const txs = ['A', 'B', 'C', 'D', 'E'].map(a => makeTx({ main_artist: `Artist ${a}` }))
    const results = detectCompilationCandidates(txs)
    expect(results).toHaveLength(1)
    expect(results[0].confidence).toBe('high')
  })

  it('flags low confidence for keyword-only match (no artist diversity)', () => {
    const txs = [makeTx({ release_title: 'Best of 2024', main_artist: 'Solo Artist' })]
    const results = detectCompilationCandidates(txs)
    expect(results).toHaveLength(1)
    expect(results[0].confidence).toBe('low')
    expect(results[0].reasons.some(r => r.toLowerCase().includes('best of'))).toBe(true)
  })

  it('upgrades to high confidence when both artist-diversity and keyword match', () => {
    const txs = ['A', 'B', 'C'].map(a =>
      makeTx({ release_title: 'Various Artists Compilation', main_artist: `Artist ${a}` })
    )
    const results = detectCompilationCandidates(txs)
    expect(results).toHaveLength(1)
    expect(results[0].confidence).toBe('high')
    expect(results[0].reasons).toHaveLength(2)
  })

  it('groups transactions by upc_ean when available', () => {
    const txs = [
      makeTx({ upc_ean: 'UPC1', release_title: 'Album X', main_artist: 'Artist A' }),
      makeTx({ upc_ean: 'UPC1', release_title: 'Album X', main_artist: 'Artist B' }),
      // Different UPC but same title — should count as a separate release
      makeTx({ upc_ean: 'UPC2', release_title: 'Album X', main_artist: 'Artist C' }),
    ]
    // UPC1 has 2 artists (below default threshold of 3), UPC2 has 1 — both below threshold
    expect(detectCompilationCandidates(txs)).toHaveLength(0)
  })

  it('applies artist mappings before counting unique artists', () => {
    const mappings = [{ id: '1', featuringName: 'feat. B', primaryArtist: 'Artist A' }]
    const txs = [
      makeTx({ main_artist: 'Artist A' }),
      makeTx({ main_artist: 'feat. B' }), // should resolve to Artist A
      makeTx({ main_artist: 'Artist C' }),
    ]
    // After mapping, feat. B → Artist A, so effectively 2 unique: Artist A, Artist C
    const results = detectCompilationCandidates(txs, { artistMappings: mappings })
    expect(results).toHaveLength(0)
  })

  it('respects custom minArtistCount option', () => {
    const txs = [
      makeTx({ main_artist: 'Artist A' }),
      makeTx({ main_artist: 'Artist B' }),
    ]
    const results = detectCompilationCandidates(txs, { minArtistCount: 2 })
    expect(results).toHaveLength(1)
    // 2 artists >= 2 threshold, but < 5 high-confidence threshold → medium
    expect(results[0].confidence).toBe('medium')
  })

  it('returns results sorted high → medium → low', () => {
    const highTxs = ['A', 'B', 'C', 'D', 'E'].map(a =>
      makeTx({ upc_ean: 'HIGH', release_title: 'High Release', main_artist: `Artist ${a}` })
    )
    const mediumTxs = ['X', 'Y', 'Z'].map(a =>
      makeTx({ upc_ean: 'MED', release_title: 'Medium Release', main_artist: `Artist ${a}` })
    )
    const lowTx = makeTx({ upc_ean: 'LOW', release_title: 'Best of 2024', main_artist: 'Solo' })

    const results = detectCompilationCandidates([...mediumTxs, ...highTxs, lowTx])
    expect(results[0].confidence).toBe('high')
    expect(results[1].confidence).toBe('medium')
    expect(results[2].confidence).toBe('low')
  })

  it('uses case-insensitive keyword matching', () => {
    const txs = [makeTx({ release_title: 'VARIOUS ARTISTS VOL. 1', main_artist: 'Solo' })]
    const results = detectCompilationCandidates(txs)
    expect(results).toHaveLength(1)
    expect(results[0].confidence).toBe('low')
  })
})
