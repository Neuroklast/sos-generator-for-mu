import { useCallback } from 'react'
import { useKV } from '@github/spark/hooks'
import type { HistoryEntry } from '@/lib/types'

const KV_KEY = 'upload-history'
const MAX_HISTORY = 200

/**
 * KV-persisted upload history log.
 * Provides addEntry, markRemoved, and clearHistory.
 */
export function useHistoryLog() {
  const [entries, setEntries] = useKV<HistoryEntry[]>(KV_KEY, [])

  const addEntry = useCallback(
    (entry: Omit<HistoryEntry, 'id' | 'timestamp'>) => {
      setEntries(current => {
        const all = current ?? []
        const newEntry: HistoryEntry = {
          ...entry,
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
        }
        // Keep newest first, cap total
        return [newEntry, ...all].slice(0, MAX_HISTORY)
      })
    },
    [setEntries]
  )

  const markRemoved = useCallback(
    (id: string) => {
      setEntries(current =>
        (current ?? []).map(e =>
          e.id === id ? { ...e, removedAt: new Date().toISOString() } : e
        )
      )
    },
    [setEntries]
  )

  const clearHistory = useCallback(() => {
    setEntries([])
  }, [setEntries])

  return {
    entries: entries ?? [],
    addEntry,
    markRemoved,
    clearHistory,
  }
}
