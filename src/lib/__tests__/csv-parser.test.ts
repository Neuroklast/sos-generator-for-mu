import { describe, it, expect } from 'vitest'
import {
  extractFeaturedArtists,
  extractFeaturedArtistsDetailed,
  suggestArtistMappings,
  parseCSVLine,
  mapCSVHeadersToModel,
  parseCSVContent,
  buildMergedDictionary,
  semanticDictionary,
} from '@/features/ingest/lib/csv-parser'

// ── extractFeaturedArtistsDetailed ────────────────────────────────────────────

describe('extractFeaturedArtistsDetailed', () => {
  it('returns empty primary for empty string', () => {
    expect(extractFeaturedArtistsDetailed('')).toEqual({ primary: '', featured: [] })
  })

  it('returns empty primary for whitespace-only string', () => {
    expect(extractFeaturedArtistsDetailed('   ')).toEqual({ primary: '', featured: [] })
  })

  it('handles single artist with no collaboration', () => {
    const result = extractFeaturedArtistsDetailed('Omnimar')
    expect(result.primary).toBe('Omnimar')
    expect(result.featured).toEqual([])
  })

  it('splits on "feat." into primary and featured', () => {
    const result = extractFeaturedArtistsDetailed('Omnimar feat. BLACKBOOK')
    expect(result.primary).toBe('Omnimar')
    expect(result.featured).toEqual(['BLACKBOOK'])
  })

  it('splits on "ft." into primary and featured', () => {
    const result = extractFeaturedArtistsDetailed('Omnimar ft. BLACKBOOK')
    expect(result.primary).toBe('Omnimar')
    expect(result.featured).toEqual(['BLACKBOOK'])
  })

  it('splits on "featuring" into primary and featured', () => {
    const result = extractFeaturedArtistsDetailed('Omnimar featuring BLACKBOOK')
    expect(result.primary).toBe('Omnimar')
    expect(result.featured).toEqual(['BLACKBOOK'])
  })

  it('handles multi-level: feat. + & within featured', () => {
    const result = extractFeaturedArtistsDetailed('Omnimar feat. BLACKBOOK & SynthAttack')
    expect(result.primary).toBe('Omnimar')
    expect(result.featured).toContain('BLACKBOOK')
    expect(result.featured).toContain('SynthAttack')
    expect(result.featured).toHaveLength(2)
  })

  it('handles multi-level: feat. + comma within featured', () => {
    const result = extractFeaturedArtistsDetailed('Artist A feat. B, C')
    expect(result.primary).toBe('Artist A')
    expect(result.featured).toContain('B')
    expect(result.featured).toContain('C')
  })

  it('handles parenthesized feat.', () => {
    const result = extractFeaturedArtistsDetailed('Track Title (feat. Guest Artist)')
    expect(result.primary).toBe('Track Title')
    expect(result.featured).toContain('Guest Artist')
  })

  it('handles "and" separator between artists', () => {
    const result = extractFeaturedArtistsDetailed('Artist A and Artist B')
    expect(result.primary).toBe('Artist A')
    expect(result.featured).toContain('Artist B')
  })

  it('is case-insensitive for separators', () => {
    const result = extractFeaturedArtistsDetailed('Omnimar FEAT. BLACKBOOK')
    expect(result.primary).toBe('Omnimar')
    expect(result.featured).toContain('BLACKBOOK')
  })

  it('trims leading/trailing whitespace from artist names', () => {
    const result = extractFeaturedArtistsDetailed('  Omnimar  feat.  BLACKBOOK  ')
    expect(result.primary).toBe('Omnimar')
    expect(result.featured[0]).toBe('BLACKBOOK')
  })

  it('handles three featured artists from single feat. group', () => {
    const result = extractFeaturedArtistsDetailed('Primary feat. A & B & C')
    expect(result.primary).toBe('Primary')
    expect(result.featured).toHaveLength(3)
    expect(result.featured).toContain('A')
    expect(result.featured).toContain('B')
    expect(result.featured).toContain('C')
  })
})

// ── extractFeaturedArtists ────────────────────────────────────────────────────

describe('extractFeaturedArtists', () => {
  it('returns empty array for empty string', () => {
    expect(extractFeaturedArtists('')).toEqual([])
  })

  it('returns single-element array for plain artist name', () => {
    expect(extractFeaturedArtists('Omnimar')).toEqual(['Omnimar'])
  })

  it('splits "feat." correctly, returning primary first', () => {
    const result = extractFeaturedArtists('Omnimar feat. BLACKBOOK')
    expect(result[0]).toBe('Omnimar')
    expect(result[1]).toBe('BLACKBOOK')
    expect(result).toHaveLength(2)
  })

  it('splits "ft." correctly', () => {
    const result = extractFeaturedArtists('Omnimar ft. BLACKBOOK')
    expect(result[0]).toBe('Omnimar')
    expect(result[1]).toBe('BLACKBOOK')
  })

  it('splits "&" within featured section (multi-level)', () => {
    const result = extractFeaturedArtists('Omnimar feat. BLACKBOOK & SynthAttack')
    expect(result).toContain('Omnimar')
    expect(result).toContain('BLACKBOOK')
    expect(result).toContain('SynthAttack')
    expect(result).toHaveLength(3)
  })

  it('returns all artists without duplicates', () => {
    const result = extractFeaturedArtists('A feat. B & C')
    const unique = new Set(result)
    expect(unique.size).toBe(result.length)
  })

  it('filters out empty strings', () => {
    const result = extractFeaturedArtists('Omnimar')
    expect(result.every(a => a.length > 0)).toBe(true)
  })

  it('handles "&" only (no feat.) as secondary separator', () => {
    const result = extractFeaturedArtists('Artist A & Artist B')
    expect(result).toContain('Artist A')
    expect(result).toContain('Artist B')
  })
})

// ── suggestArtistMappings ─────────────────────────────────────────────────────

describe('suggestArtistMappings', () => {
  it('returns empty array for single-artist list', () => {
    expect(suggestArtistMappings(['Omnimar'])).toEqual([])
  })

  it('suggests mapping for "feat." collaboration', () => {
    const result = suggestArtistMappings(['Omnimar feat. BLACKBOOK'])
    expect(result.length).toBeGreaterThan(0)
    expect(result[0].primaryArtist).toBe('Omnimar')
    expect(result[0].featuringName).toBe('Omnimar feat. BLACKBOOK')
    expect(result[0].confidence).toBe('high')
  })

  it('suggests medium-confidence mappings for featured artists', () => {
    const result = suggestArtistMappings(['Omnimar feat. BLACKBOOK & SynthAttack'])
    const mediumSuggestions = result.filter(s => s.confidence === 'medium')
    expect(mediumSuggestions.length).toBeGreaterThan(0)
    const featuredArtistNames = mediumSuggestions.map(s => s.featuringName)
    expect(featuredArtistNames).toContain('BLACKBOOK')
    expect(featuredArtistNames).toContain('SynthAttack')
  })

  it('handles mixed list of single and collab artists', () => {
    const result = suggestArtistMappings(['Solo Artist', 'Collab feat. Guest'])
    expect(result.length).toBeGreaterThan(0)
    const highConf = result.filter(s => s.confidence === 'high')
    expect(highConf[0].featuringName).toBe('Collab feat. Guest')
  })

  it('returns no suggestions when no featuring keywords present', () => {
    const result = suggestArtistMappings(['Artist One', 'Artist Two', 'Artist Three'])
    expect(result).toEqual([])
  })
})

// ── parseCSVLine ──────────────────────────────────────────────────────────────

describe('parseCSVLine', () => {
  it('parses a simple comma-delimited line', () => {
    expect(parseCSVLine('a,b,c', ',')).toEqual(['a', 'b', 'c'])
  })

  it('parses a simple semicolon-delimited line', () => {
    expect(parseCSVLine('a;b;c', ';')).toEqual(['a', 'b', 'c'])
  })

  it('handles quoted fields containing the delimiter', () => {
    expect(parseCSVLine('"hello, world",foo', ',')).toEqual(['hello, world', 'foo'])
  })

  it('handles escaped quotes inside quoted fields', () => {
    expect(parseCSVLine('"she said ""hello""",bar', ',')).toEqual(['she said "hello"', 'bar'])
  })

  it('strips surrounding whitespace from unquoted values', () => {
    expect(parseCSVLine(' a , b , c ', ',')).toEqual(['a', 'b', 'c'])
  })

  it('handles empty fields', () => {
    expect(parseCSVLine('a,,c', ',')).toEqual(['a', '', 'c'])
  })

  it('handles a single field', () => {
    expect(parseCSVLine('only', ',')).toEqual(['only'])
  })

  it('removes surrounding double-quotes from quoted field', () => {
    expect(parseCSVLine('"quoted"', ',')).toEqual(['quoted'])
  })
})

// ── mapCSVHeadersToModel ──────────────────────────────────────────────────────

describe('mapCSVHeadersToModel', () => {
  it('maps exact header matches', () => {
    const mapping = mapCSVHeadersToModel(['Artist Name', 'Net Revenue', 'Platform'])
    expect(mapping['Artist Name']).toBe('original_artist')
    expect(mapping['Net Revenue']).toBe('net_revenue')
    expect(mapping['Platform']).toBe('platform')
  })

  it('is case-insensitive for exact matches', () => {
    const mapping = mapCSVHeadersToModel(['ARTIST NAME', 'net revenue'])
    expect(mapping['ARTIST NAME']).toBe('original_artist')
    expect(mapping['net revenue']).toBe('net_revenue')
  })

  it('uses custom aliases when provided', () => {
    const mapping = mapCSVHeadersToModel(['My Artist Field'], { original_artist: ['My Artist Field'] })
    expect(mapping['My Artist Field']).toBe('original_artist')
  })

  it('returns empty mapping for unrecognized headers', () => {
    const mapping = mapCSVHeadersToModel(['Unknown Column XYZ'])
    expect(mapping['Unknown Column XYZ']).toBeUndefined()
  })

  it('does fuzzy matching for similar header names', () => {
    // 'Net Revenues' vs synonym 'Net Revenue': distance=1, maxLen=12, similarity≈0.92
    const mapping = mapCSVHeadersToModel(['Net Revenues'])
    expect(mapping['Net Revenues']).toBe('net_revenue')
  })
})

// ── buildMergedDictionary ─────────────────────────────────────────────────────

describe('buildMergedDictionary', () => {
  it('returns the base dictionary when no aliases are provided', () => {
    const merged = buildMergedDictionary()
    expect(merged).toEqual(semanticDictionary)
  })

  it('merges custom aliases into the base dictionary', () => {
    const merged = buildMergedDictionary({ platform: ['My DSP'] })
    expect(merged.platform).toContain('My DSP')
    // Original entries should still be present
    expect(merged.platform).toContain('Platform')
  })

  it('does not mutate the original semanticDictionary', () => {
    const originalPlatform = [...semanticDictionary.platform]
    buildMergedDictionary({ platform: ['Custom Platform'] })
    expect(semanticDictionary.platform).toEqual(originalPlatform)
  })
})

// ── parseCSVContent ────────────────────────────────────────────────────────────

describe('parseCSVContent', () => {
  const BELIEVE_CSV = [
    'Artist Name,Net Revenue,Platform,Country/Region,Sales Month,Release title,Track title,UPC,ISRC,Release Catalog nb,Quantity,Currency,Release Type',
    'Omnimar,12.50,Spotify,DE,2024-01,Album One,Track One,123456,ISRC001,CAT001,100,EUR,Digital Download',
    'BLACKBOOK,7.30,Apple Music,US,2024-01,Album Two,Track Two,654321,ISRC002,CAT002,50,EUR,Digital Download',
  ].join('\n')

  it('parses a valid CSV and returns correct transactions', () => {
    const result = parseCSVContent(BELIEVE_CSV, 'believe')
    expect(result.transactions).toHaveLength(2)
    expect(result.errors).toHaveLength(0)
  })

  it('extracts unique artists correctly', () => {
    const result = parseCSVContent(BELIEVE_CSV, 'believe')
    expect(result.uniqueArtists).toContain('Omnimar')
    expect(result.uniqueArtists).toContain('BLACKBOOK')
  })

  it('parses net revenue as a float', () => {
    const result = parseCSVContent(BELIEVE_CSV, 'believe')
    expect(result.transactions[0].net_revenue).toBe(12.5)
  })

  it('parses quantity as an integer', () => {
    const result = parseCSVContent(BELIEVE_CSV, 'believe')
    expect(result.transactions[0].quantity).toBe(100)
  })

  it('detects physical releases via release_type field', () => {
    const physicalCsv = [
      'Artist Name,Net Revenue,Platform,Country/Region,Sales Month,Release title,Track title,UPC,ISRC,Release Catalog nb,Quantity,Currency,Release Type',
      'Vinyl Artist,20.00,Shop,DE,2024-01,Vinyl Release,Track,111,ISR001,CAT003,1,EUR,Physical CD',
    ].join('\n')
    const result = parseCSVContent(physicalCsv, 'believe')
    expect(result.transactions[0].is_physical).toBe(true)
  })

  it('returns errors for column count mismatches', () => {
    const badCsv = [
      'Artist Name,Net Revenue',
      'Omnimar,12.50,ExtraColumn',
    ].join('\n')
    const result = parseCSVContent(badCsv, 'believe')
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it('returns empty transactions for empty CSV', () => {
    const result = parseCSVContent('', 'believe')
    expect(result.transactions).toHaveLength(0)
    expect(result.uniqueArtists).toHaveLength(0)
  })

  it('auto-detects semicolon delimiter', () => {
    const csvSemicolon = [
      'Artist Name;Net Revenue;Platform',
      'Omnimar;15.00;Spotify',
    ].join('\n')
    const result = parseCSVContent(csvSemicolon, 'believe')
    expect(result.transactions).toHaveLength(1)
    expect(result.transactions[0].main_artist).toBe('Omnimar')
  })

  it('uses custom column mapping when provided', () => {
    const csv = [
      'Künstler,Umsatz,Plattform',
      'TestArtist,5.00,Spotify',
    ].join('\n')
    const mapping = { Künstler: 'original_artist', Umsatz: 'net_revenue', Plattform: 'platform' }
    const result = parseCSVContent(csv, 'believe', mapping)
    expect(result.transactions[0].main_artist).toBe('TestArtist')
    expect(result.transactions[0].net_revenue).toBe(5.0)
  })

  it('sorts unique artists alphabetically', () => {
    const result = parseCSVContent(BELIEVE_CSV, 'believe')
    const sorted = [...result.uniqueArtists].sort()
    expect(result.uniqueArtists).toEqual(sorted)
  })
})
