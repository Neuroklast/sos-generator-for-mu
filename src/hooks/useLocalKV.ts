/**
 * useLocalKV – drop-in replacement for @github/spark/hooks useKV.
 * Persists data in IndexedDB via idb-keyval so state survives page reloads
 * without any server dependency. Compatible with future Vercel KV migration
 * by keeping the same [value, setter, deleter] tuple API.
 */
import { useState, useEffect, useCallback, useRef } from 'react'
import { get, set, del } from 'idb-keyval'

type Setter<T> = (newValue: T | ((oldValue: T | undefined) => T)) => void
type Deleter = () => void

// In-memory cache + subscriber map for cross-hook reactivity in the same tab.
const cache = new Map<string, unknown>()
const subscribers = new Map<string, Set<() => void>>()

function notify(key: string) {
  subscribers.get(key)?.forEach(cb => cb())
}

export function useLocalKV<T = string>(
  key: string,
  initialValue?: T
): readonly [T | undefined, Setter<T>, Deleter] {
  const [value, setLocalValue] = useState<T | undefined>(() =>
    cache.has(key) ? (cache.get(key) as T) : initialValue
  )
  const valueRef = useRef<T | undefined>(value)
  valueRef.current = value

  // Subscribe to changes from other hook instances using the same key.
  useEffect(() => {
    if (!subscribers.has(key)) subscribers.set(key, new Set())
    const refresh = () => {
      setLocalValue(cache.has(key) ? (cache.get(key) as T) : initialValue)
    }
    subscribers.get(key)!.add(refresh)
    return () => {
      subscribers.get(key)!.delete(refresh)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  // Load from IndexedDB on mount (or when key changes).
  useEffect(() => {
    let cancelled = false
    get<T>(key).then(stored => {
      if (cancelled) return
      if (stored !== undefined) {
        cache.set(key, stored)
        setLocalValue(stored)
        notify(key)
      } else if (initialValue !== undefined) {
        // Persist the default value so future reads are consistent.
        cache.set(key, initialValue)
        set(key, initialValue).catch(err => {
          console.warn(`[useLocalKV] Failed to persist default value for "${key}":`, err)
        })
      }
    }).catch(err => {
      console.warn(`[useLocalKV] Failed to read "${key}" from IndexedDB:`, err)
    })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  const setter: Setter<T> = useCallback(
    newValueOrUpdater => {
      const resolved =
        typeof newValueOrUpdater === 'function'
          ? (newValueOrUpdater as (old: T | undefined) => T)(valueRef.current)
          : newValueOrUpdater
      cache.set(key, resolved)
      setLocalValue(resolved)
      notify(key)
      set(key, resolved).catch(err => {
        console.warn(`[useLocalKV] Failed to persist "${key}" to IndexedDB:`, err)
      })
    },
    [key]
  )

  const deleter: Deleter = useCallback(() => {
    cache.delete(key)
    setLocalValue(undefined)
    notify(key)
    del(key).catch(err => {
      console.warn(`[useLocalKV] Failed to delete "${key}" from IndexedDB:`, err)
    })
  }, [key])

  return [value, setter, deleter] as const
}

// Convenience re-export so callers can do:
//   import { useKV } from '@/hooks/useLocalKV'
export { useLocalKV as useKV }
