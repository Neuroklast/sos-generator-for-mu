import { useEffect } from 'react'
import type { SplitFee } from '@/lib/types'

/**
 * Automatically adds newly discovered artists to the split fee list
 * with a default percentage of 100%.
 *
 * This is intentionally isolated so the effect only re-runs when the
 * set of artists or the setter reference changes, not on every App render.
 */
export function useSplitFeeSync(
  uniqueArtists: string[],
  splitFees: SplitFee[],
  setSplitFees: (updater: (current: SplitFee[] | undefined) => SplitFee[]) => void
) {
  useEffect(() => {
    const existingArtists = new Set(splitFees.map(sf => sf.artist.toLowerCase()))
    const newArtists = uniqueArtists.filter(a => !existingArtists.has(a.toLowerCase()))

    if (newArtists.length === 0) return

    setSplitFees(current => [
      ...(current ?? []),
      ...newArtists.map(artist => ({ artist, percentage: 100 })),
    ])
  }, [uniqueArtists, splitFees, setSplitFees])
}
