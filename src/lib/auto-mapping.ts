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

  const result: ArtistMapping[] = []

  for (const artist of uniqueArtists) {
    if (existingKeys.has(artist.toLowerCase())) continue
    if (primaryArtists.some(p => p.toLowerCase() === artist.toLowerCase())) continue

    let bestScore = 0
    let bestPrimary = ''

    for (const primary of primaryArtists) {
      const score = JaroWinklerDistance(artist.toLowerCase(), primary.toLowerCase())
      if (score > bestScore) {
        bestScore = score
        bestPrimary = primary
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
