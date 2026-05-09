/**
 * Utility functions for working with release-title data structures.
 */

/**
 * Flattens and de-duplicates all release titles from an artist→releases map.
 *
 * Used to populate "show all releases" dropdowns when no specific artist has
 * been selected yet (both {@link TrackRevenueAssignmentManager} and
 * {@link IgnoredEntriesManager} rely on this).
 *
 * @param releaseTitlesByArtist - Map of artist name → sorted release titles.
 * @returns Alphabetically sorted, de-duplicated array of all release titles.
 *
 * @example
 * const releases = getAllReleases({ 'Artist A': ['Album 1', 'Album 2'], 'Artist B': ['Album 1', 'EP X'] })
 * // → ['Album 1', 'Album 2', 'EP X']
 */
export function getAllReleases(releaseTitlesByArtist: Record<string, string[]>): string[] {
  const seen = new Set<string>()
  for (const titles of Object.values(releaseTitlesByArtist)) {
    for (const title of titles) {
      seen.add(title)
    }
  }
  return Array.from(seen).sort((a, b) => a.localeCompare(b))
}
