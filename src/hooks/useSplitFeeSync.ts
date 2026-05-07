import { useEffect } from 'react'
import type { SplitFee } from '@/lib/types'

/**
 * Automatically adds newly discovered artists to the split fee list
 * with the configured default percentage.
 *
 * This is intentionally isolated so the effect only re-runs when the
 * set of artists, setter reference, or default percentage changes.
 *
 * @param isReady - Guard flag. When false (e.g. IndexedDB not yet loaded),
 *   the effect is skipped entirely so artists are not registered with a
 *   stale fallback percentage. Mirrors the same pattern used for the
 *   auto-period effect (Bug 5 fix).
 * @default true
 */
export function useSplitFeeSync(
  uniqueArtists: string[],
  splitFees: SplitFee[],
  setSplitFees: (updater: (current: SplitFee[] | undefined) => SplitFee[]) => void,
  defaultSplitPercentage: number = 100,
  isReady: boolean = true
) {
  useEffect(() => {
    if (!isReady) return

    const existingArtists = new Set(splitFees.map(sf => sf.artist.toLowerCase()))
    const newArtists = uniqueArtists.filter(a => !existingArtists.has(a.toLowerCase()))

    if (newArtists.length === 0) return

    setSplitFees(current => [
      ...(current ?? []),
      ...newArtists.map(artist => ({ artist, percentage: defaultSplitPercentage })),
    ])
  }, [uniqueArtists, splitFees, setSplitFees, defaultSplitPercentage, isReady])
}
