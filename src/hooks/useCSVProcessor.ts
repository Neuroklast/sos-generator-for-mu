import { useEffect, useState, useMemo } from 'react'
import { toast } from 'sonner'
import { parseCSVContentStreaming } from '@/lib/streaming-csv-parser'
import { processTransactions, getUniqueArtistsFromTransactions } from '@/lib/data-processor'
import type { SalesTransaction } from '@/lib/csv-parser'
import type {
  UploadedFile,
  CompilationFilter,
  ArtistMapping,
  SplitFee,
  ManualRevenue,
  ArtistRevenue,
} from '@/lib/types'

interface CSVProcessorConfig {
  compilationFilters: CompilationFilter[]
  artistMappings: ArtistMapping[]
  splitFees: SplitFee[]
  manualRevenues: ManualRevenue[]
  excludePhysical: boolean
}

/**
 * Parses all uploaded CSV files and runs the data processing pipeline.
 * Uses a cancellation flag to prevent stale state updates when files change
 * while a previous parse is still in flight.
 */
export function useCSVProcessor(
  believeFiles: UploadedFile[],
  bandcampFiles: UploadedFile[],
  config: CSVProcessorConfig
) {
  const [allTransactions, setAllTransactions] = useState<SalesTransaction[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    const allFiles = [...believeFiles, ...bandcampFiles]
    let cancelled = false

    if (allFiles.length === 0) {
      setAllTransactions([])
      return
    }

    const parseAll = async () => {
      setIsProcessing(true)
      const collected: SalesTransaction[] = []

      try {
        for (const file of allFiles) {
          if (cancelled) break
          if (!file.data) continue

          const result = await parseCSVContentStreaming(file.data, file.type)

          if (cancelled) break

          if (result.errors.length > 0) {
            console.warn(`Parse warnings for "${file.name}":`, result.errors)
            toast.warning(`${result.errors.length} row(s) skipped in "${file.name}"`)
          }

          collected.push(...result.transactions)
        }

        if (!cancelled) {
          setAllTransactions(collected)
        }
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : 'Unknown error during CSV processing'
          console.error('CSV processing failed:', err)
          toast.error('Failed to process CSV data', { description: message })
        }
      } finally {
        if (!cancelled) {
          setIsProcessing(false)
        }
      }
    }

    parseAll()

    return () => {
      cancelled = true
    }
  // We intentionally use file IDs + data lengths as a stable dependency signal
  // to avoid re-running the effect when only unrelated state changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    believeFiles.map(f => `${f.id}:${f.data.length}`).join(','),
    bandcampFiles.map(f => `${f.id}:${f.data.length}`).join(','),
  ])

  const uniqueArtists = useMemo(
    () => getUniqueArtistsFromTransactions(allTransactions, config.artistMappings),
    [allTransactions, config.artistMappings]
  )

  const processedData = useMemo(
    () =>
      processTransactions(allTransactions, {
        compilationFilters: config.compilationFilters,
        artistMappings: config.artistMappings,
        splitFees: config.splitFees,
        manualRevenues: config.manualRevenues,
        excludePhysical: config.excludePhysical,
      }),
    [
      allTransactions,
      config.compilationFilters,
      config.artistMappings,
      config.splitFees,
      config.manualRevenues,
      config.excludePhysical,
    ]
  )

  const revenues: ArtistRevenue[] = useMemo(
    () =>
      processedData.map(data => ({
        artist: data.artist,
        believeRevenue: data.transactions
          .filter(t => t.source === 'believe')
          .reduce((sum, t) => sum + t.net_revenue, 0),
        bandcampRevenue: data.transactions
          .filter(t => t.source === 'bandcamp')
          .reduce((sum, t) => sum + t.net_revenue, 0),
        manualRevenue: data.manualRevenue,
        totalRevenue: data.grossRevenue,
        splitPercentage: data.splitPercentage,
        finalAmount: data.finalPayout,
      })),
    [processedData]
  )

  return { allTransactions, isProcessing, uniqueArtists, processedData, revenues }
}
