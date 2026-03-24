import { JaroWinklerDistance } from 'natural'
import type { ArtistMapping } from './types'

/**
 * Generates automatic artist mappings using Jaro-Winkler similarity.
 *
 * For every unique artist from the CSV that:
 *   - is not already covered by an existing manual mapping, and
 *   - scores > 0.85 against a known primary artist name
 *
 * …a mapping entry is created with autoMapped = true.
 * These are displayed in the UI as suggestions but do NOT feed back
 * into the worker config (to avoid resolution loops).
 */
export function computeAutoMappings(
  uniqueArtists: string[],
  existingMappings: ArtistMapping[]
): ArtistMapping[] {
  const existingKeys = new Set(existingMappings.map(m => m.featuringName.toLowerCase()))
  const primaryArtists = Array.from(new Set(existingMappings.map(m => m.primaryArtist)))

  if (primaryArtists.length === 0) return []

  // Pre-compute lowercase primaries to avoid repeated conversion in the inner loop
  const primaryArtistsLower = primaryArtists.map(p => p.toLowerCase())

  const result: ArtistMapping[] = []

  for (const artist of uniqueArtists) {
    const artistLower = artist.toLowerCase()
    if (existingKeys.has(artistLower)) continue
    if (primaryArtistsLower.some(p => p === artistLower)) continue

    let bestScore = 0
    let bestPrimary = ''

    for (let i = 0; i < primaryArtists.length; i++) {
      const score = JaroWinklerDistance(artistLower, primaryArtistsLower[i])
      if (score > bestScore) {
        bestScore = score
        bestPrimary = primaryArtists[i]
      }
    }

    if (bestScore > 0.85 && bestPrimary) {
      result.push({
        id: `auto-${artist}`,
        featuringName: artist,
        primaryArtist: bestPrimary,
        autoMapped: true,
        mappingScore: parseFloat(bestScore.toFixed(4)),
      })
    }
  }

  return result
}
