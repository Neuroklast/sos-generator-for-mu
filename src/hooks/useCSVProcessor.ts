import { useEffect, useState, useMemo } from 'react'
import { toast } from 'sonner'
import { parseCSVContentStreaming } from '@/lib/streaming-csv-parser'
import {
  processTransactionsWithCompilations,
  getUniqueArtistsFromTransactions,
} from '@/lib/data-processor'
import type { SalesTransaction } from '@/lib/csv-parser'
import type {
  UploadedFile,
  CompilationFilter,
  ArtistMapping,
  SplitFee,
  ManualRevenue,
  ArtistRevenue,
  CSVColumnAlias,
} from '@/lib/types'

interface CSVProcessorConfig {
  compilationFilters: CompilationFilter[]
  artistMappings: ArtistMapping[]
  splitFees: SplitFee[]
  manualRevenues: ManualRevenue[]
  excludePhysical: boolean
  /** User-defined additional column synonyms from the CSV Column Mapping settings. */
  csvAliases: CSVColumnAlias[]
}

/**
 * Parses all uploaded CSV files and runs the full data processing pipeline.
 *
 * A cancellation flag prevents stale state updates when files change while a
 * previous parse is still in flight. The dependency string is intentionally
 * derived from file IDs + data lengths to avoid re-running the effect when
 * only unrelated state changes.
 */
export function useCSVProcessor(
  believeFiles: UploadedFile[],
  bandcampFiles: UploadedFile[],
  config: CSVProcessorConfig
) {
  const [allTransactions, setAllTransactions] = useState<SalesTransaction[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  // Build a stable map of field → additional synonyms from user-defined aliases
  const customAliases = useMemo(() => {
    const map: Record<string, string[]> = {}
    for (const alias of config.csvAliases) {
      if (!map[alias.fieldName]) map[alias.fieldName] = []
      map[alias.fieldName].push(alias.synonym)
    }
    return map
  }, [config.csvAliases])

  // Stable alias key: re-parse when user changes column mappings
  const aliasKey = config.csvAliases.map(a => `${a.fieldName}:${a.synonym}`).join(',')

  // Stable keys: re-parse only when file content actually changes
  const believeKey = believeFiles.map(f => `${f.id}:${f.data.length}`).join(',')
  const bandcampKey = bandcampFiles.map(f => `${f.id}:${f.data.length}`).join(',')

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

          const result = await parseCSVContentStreaming(
            file.data,
            file.type,
            undefined,
            undefined,
            customAliases
          )

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [believeKey, bandcampKey, aliasKey])

  const uniqueArtists = useMemo(
    () => getUniqueArtistsFromTransactions(allTransactions, config.artistMappings),
    [allTransactions, config.artistMappings]
  )

  const { artistData: processedData, filteredCompilations } = useMemo(
    () =>
      processTransactionsWithCompilations(allTransactions, {
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
        totalQuantity: data.totalQuantity,
        platformBreakdown: data.platformBreakdown,
        countryBreakdown: data.countryBreakdown,
        monthlyBreakdown: data.monthlyBreakdown,
        releaseBreakdown: data.releaseBreakdown,
      })),
    [processedData]
  )

  /**
   * Automatically detected period boundaries derived from the `sales_month`
   * field across all parsed transactions. Format: "YYYY-MM" (the native value
   * of an <input type="month">). Empty string when no transactions are loaded.
   */
  const sortedMonths = useMemo(
    () => allTransactions.map(t => t.sales_month).filter(Boolean).sort(),
    [allTransactions]
  )

  const detectedPeriodStart = sortedMonths[0] ?? ''
  const detectedPeriodEnd = sortedMonths[sortedMonths.length - 1] ?? ''

  return {
    allTransactions,
    isProcessing,
    uniqueArtists,
    processedData,
    filteredCompilations,
    revenues,
    detectedPeriodStart,
    detectedPeriodEnd,
  }
}
