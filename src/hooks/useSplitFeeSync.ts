import { useEffect } from 'react'
import type { SplitFee } from '@/lib/types'

/**
 * Automatically adds newly discovered artists to the split fee list
 * with the configured default percentage.
 *
 * This is intentionally isolated so the effect only re-runs when the
 * set of artists, setter reference, or default percentage changes.
 */
export function useSplitFeeSync(
  uniqueArtists: string[],
  splitFees: SplitFee[],
  setSplitFees: (updater: (current: SplitFee[] | undefined) => SplitFee[]) => void,
  defaultSplitPercentage: number = 100
) {
  useEffect(() => {
    const existingArtists = new Set(splitFees.map(sf => sf.artist.toLowerCase()))
    const newArtists = uniqueArtists.filter(a => !existingArtists.has(a.toLowerCase()))

    if (newArtists.length === 0) return

    setSplitFees(current => [
      ...(current ?? []),
      ...newArtists.map(artist => ({ artist, percentage: defaultSplitPercentage })),
    ])
  }, [uniqueArtists, splitFees, setSplitFees, defaultSplitPercentage])
}
