import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import { toast } from 'sonner'
import { computeAutoMappings } from '@/lib/auto-mapping'
import { fetchExchangeRates } from '@/lib/currency'
import type { ExchangeRates } from '@/lib/currency'
import type {
  UploadedFile,
  CompilationFilter,
  ArtistMapping,
  SplitFee,
  ManualRevenue,
  ExpenseEntry,
  ArtistRevenue,
  CSVColumnAlias,
  SafeProcessedArtistData,
  ArtistTreeNode,
  ArtistCollabNode,
  FilteredCompilation,
  LabelArtist,
  IgnoredEntry,
} from '@/lib/types'
import type { WorkerRequest, WorkerResponse, WorkerProcessConfig, WorkerResult } from '@/workers/csv-processor.worker'

interface CSVProcessorConfig {
  compilationFilters: CompilationFilter[]
  artistMappings: ArtistMapping[]
  splitFees: SplitFee[]
  manualRevenues: ManualRevenue[]
  /** Recoupable expense entries deducted per artist before split. */
  expenses: ExpenseEntry[]
  excludePhysical: boolean
  /** User-defined additional column synonyms from the CSV Column Mapping settings. */
  csvAliases: CSVColumnAlias[]
  /** Label artist roster. When non-empty, only these artists appear in results. */
  labelArtists: LabelArtist[]
  /** Entries explicitly ignored in the statement of sales. */
  ignoredEntries: IgnoredEntry[]
  /** Label distribution fee percentage (0–100) deducted before artist splits. */
  distributionFeePercentage: number
}

const EMPTY_RESULT: WorkerResult = {
  processedData: [],
  artistTrees: [],
  collabTree: [],
  filteredCompilations: [],
  uniqueArtists: [],
  periodStart: '',
  periodEnd: '',
}

/**
 * Drives the CSV Processor Web Worker.
 *
 * Key properties of this design
 * ──────────────────────────────
 * • Raw SalesTransaction objects never enter main-thread React state.
 *   They live only inside the worker until discarded after aggregation.
 * • The worker is a long-lived singleton; file content is sent once per file
 *   (on add) and config-only re-processing is cheap (no re-parse).
 * • `knownFileIdsRef` tracks which files have already been sent to the
 *   worker so that incremental adds/removes work correctly.
 * • When csvAliases change the entire worker cache is reset and all files
 *   are re-parsed with the new column mappings.
 * • `pendingParsesRef` ensures we only send a 'process' message after all
 *   in-flight parses have completed (handles batch file drops gracefully).
 */
export function useCSVProcessor(
  believeFiles: UploadedFile[],
  bandcampFiles: UploadedFile[],
  config: CSVProcessorConfig,
  shopifyFiles: UploadedFile[] = [],
  printfulFiles: UploadedFile[] = []
) {
  const workerRef = useRef<Worker | null>(null)
  /** IDs of files that have been successfully sent to the worker for parsing. */
  const knownFileIdsRef = useRef(new Set<string>())
  /** Number of 'add-file' messages still awaiting 'parse-done' from the worker. */
  const pendingParsesRef = useRef(0)
  /** Latest config snapshot — updated synchronously so the parse-done handler uses it. */
  const latestConfigRef = useRef<WorkerProcessConfig | null>(null)
  /** The alias key that was in effect the last time files were synced with the worker. */
  const prevAliasKeyRef = useRef<string | undefined>(undefined)

  const [workerResult, setWorkerResult] = useState<WorkerResult>(EMPTY_RESULT)
  const [isProcessing, setIsProcessing] = useState(false)
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates>({})
  const [exchangeRatesLoading, setExchangeRatesLoading] = useState(true)

  // ── Fetch ECB exchange rates once on mount ────────────────────────────────────

  useEffect(() => {
    fetchExchangeRates()
      .then(rates => {
        setExchangeRates(rates)
      })
      .catch(err => {
        console.warn('[useCSVProcessor] Exchange rate fetch failed unexpectedly:', err)
        toast.warning('Wechselkurse konnten nicht geladen werden', {
          description: 'Es werden Fallback-Kurse verwendet. Währungsumrechnungen können ungenau sein.',
        })
      })
      .finally(() => {
        setExchangeRatesLoading(false)
      })
  }, [])

  // ── Build stable derivative keys ─────────────────────────────────────────────

  const customAliases = useMemo(() => {
    const map: Record<string, string[]> = {}
    for (const alias of config.csvAliases) {
      if (!map[alias.fieldName]) map[alias.fieldName] = []
      map[alias.fieldName].push(alias.synonym)
    }
    return map
  }, [config.csvAliases])

  const aliasKey = config.csvAliases.map(a => `${a.fieldName}:${a.synonym}`).join(',')
  const believeKey = believeFiles.map(f => `${f.id}:${f.data?.length ?? 0}`).join(',')
  const bandcampKey = bandcampFiles.map(f => `${f.id}:${f.data?.length ?? 0}`).join(',')
  const shopifyKey = shopifyFiles.map(f => `${f.id}:${f.data?.length ?? 0}`).join(',')
  const printfulKey = printfulFiles.map(f => `${f.id}:${f.data?.length ?? 0}`).join(',')

  const configKey = [
    config.compilationFilters.map(f => f.id).join(','),
    config.artistMappings.map(m => m.id).join(','),
    config.splitFees.map(s => `${s.artist}:${s.percentage}`).join(','),
    config.manualRevenues.map(r => r.id).join(','),
    config.expenses.map(e => `${e.id}:${e.amount}`).join(','),
    String(config.excludePhysical),
    Object.keys(exchangeRates).length > 0 ? 'rates' : 'no-rates',
    config.labelArtists.map(la => la.id).join(','),
    config.ignoredEntries.map(ie => ie.id).join(','),
    String(config.distributionFeePercentage),
  ].join('|')

  // ── Helpers ───────────────────────────────────────────────────────────────────

  const buildConfig = useCallback((): WorkerProcessConfig => ({
    compilationFilters: config.compilationFilters,
    artistMappings: config.artistMappings,
    splitFees: config.splitFees,
    manualRevenues: config.manualRevenues,
    expenses: config.expenses,
    excludePhysical: config.excludePhysical,
    exchangeRates,
    labelArtists: config.labelArtists,
    ignoredEntries: config.ignoredEntries,
    distributionFeePercentage: config.distributionFeePercentage,
  }), [config.compilationFilters, config.artistMappings, config.splitFees, config.manualRevenues, config.expenses, config.excludePhysical, exchangeRates, config.labelArtists, config.ignoredEntries, config.distributionFeePercentage])

  const sendProcess = useCallback(() => {
    const cfg = latestConfigRef.current ?? buildConfig()
    workerRef.current?.postMessage({ type: 'process', config: cfg } satisfies WorkerRequest)
    setIsProcessing(true)
  }, [buildConfig])

  // ── Worker lifecycle ──────────────────────────────────────────────────────────

  useEffect(() => {
    const worker = new Worker(
      new URL('../workers/csv-processor.worker.ts', import.meta.url),
      { type: 'module' }
    )
    workerRef.current = worker

    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const msg = event.data
      switch (msg.type) {
        case 'parse-progress':
          // Progress updates are currently consumed by useFileManager's own
          // parsing pass for the UI progress bars; we don't duplicate them here.
          break

        case 'parse-done':
          pendingParsesRef.current = Math.max(0, pendingParsesRef.current - 1)
          if (pendingParsesRef.current === 0) {
            sendProcess()
          }
          break

        case 'result':
          setWorkerResult(msg.data)
          setIsProcessing(false)
          break

        case 'error':
          console.error('CSV Worker error:', msg.message)
          toast.error('CSV processing error', { description: msg.message })
          setIsProcessing(false)
          break
      }
    }

    worker.onerror = (err) => {
      console.error('CSV Worker uncaught error:', err)
      toast.error('Worker crashed', { description: err.message ?? 'Unknown error' })
      setIsProcessing(false)
    }

    const knownFileIds = knownFileIdsRef.current
    return () => {
      worker.terminate()
      workerRef.current = null
      knownFileIds.clear()
      pendingParsesRef.current = 0
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Effect: sync files with worker ────────────────────────────────────────────
  // Triggers when file content changes or when column aliases change.

  useEffect(() => {
    const worker = workerRef.current
    if (!worker) return

    const allFiles = [...believeFiles, ...bandcampFiles, ...shopifyFiles, ...printfulFiles]
    const currentFileMap = new Map(
      allFiles.filter(f => f.data).map(f => [f.id, f])
    )

    // When aliases change, reset the worker's internal cache and re-send all files
    // (because column mappings affect which CSV columns get parsed).
    if (prevAliasKeyRef.current !== aliasKey) {
      const isFirstRun = prevAliasKeyRef.current === undefined
      prevAliasKeyRef.current = aliasKey
      if (!isFirstRun) {
        // Aliases actually changed — reset the worker cache.
        worker.postMessage({ type: 'reset' } satisfies WorkerRequest)
        knownFileIdsRef.current.clear()
        pendingParsesRef.current = 0
      }
    }

    // Remove files that are no longer present
    for (const id of knownFileIdsRef.current) {
      if (!currentFileMap.has(id)) {
        worker.postMessage({ type: 'remove-file', fileId: id } satisfies WorkerRequest)
        knownFileIdsRef.current.delete(id)
      }
    }

    // Send newly added files (with data) to the worker
    let newFilesQueued = 0
    for (const [id, file] of currentFileMap.entries()) {
      if (!knownFileIdsRef.current.has(id) && file.data) {
        knownFileIdsRef.current.add(id)
        pendingParsesRef.current++
        newFilesQueued++
        worker.postMessage({
          type: 'add-file',
          fileId: id,
          content: file.data,
          source: file.type,
          customAliases,
        } satisfies WorkerRequest)
        setIsProcessing(true)
      }
    }

    // If all files were already known (no new adds) and there are no pending
    // parses, trigger a process with the current config immediately.
    if (newFilesQueued === 0 && pendingParsesRef.current === 0) {
      if (currentFileMap.size === 0) {
        // No files left — return empty result
        setWorkerResult(EMPTY_RESULT)
        setIsProcessing(false)
      } else {
        sendProcess()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [believeKey, bandcampKey, shopifyKey, printfulKey, aliasKey])

  // ── Effect: re-process when config changes (no re-parse needed) ───────────────

  useEffect(() => {
    const cfg = buildConfig()
    latestConfigRef.current = cfg
    if (workerRef.current && pendingParsesRef.current === 0 && knownFileIdsRef.current.size > 0) {
      sendProcess()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configKey])

  // ── Derived values ─────────────────────────────────────────────────────────────

  const revenues: ArtistRevenue[] = useMemo(
    () =>
      workerResult.processedData.map(data => ({
        artist: data.artist,
        believeRevenue: data.believeRevenue,
        bandcampRevenue: data.bandcampRevenue,
        manualRevenue: data.manualRevenue,
        totalRevenue: data.grossRevenue,
        splitPercentage: data.splitPercentage,
        finalAmount: data.finalPayout,
        totalQuantity: data.totalQuantity,
        totalExpenses: data.totalExpenses,
        distributionFeeDeducted: data.distributionFeeDeducted,
        platformBreakdown: data.platformBreakdown,
        countryBreakdown: data.countryBreakdown,
        monthlyBreakdown: data.monthlyBreakdown,
        releaseBreakdown: data.releaseBreakdown,
      })),
    [workerResult.processedData]
  )

  const autoMappings = useMemo(
    () => computeAutoMappings(workerResult.uniqueArtists, config.artistMappings),
    [workerResult.uniqueArtists, config.artistMappings]
  )

  return {
    isProcessing,
    exchangeRatesLoading,
    uniqueArtists: workerResult.uniqueArtists,
    processedData: workerResult.processedData as SafeProcessedArtistData[],
    artistTrees: workerResult.artistTrees as ArtistTreeNode[],
    collabTree: workerResult.collabTree as ArtistCollabNode[],
    filteredCompilations: workerResult.filteredCompilations as FilteredCompilation[],
    revenues,
    autoMappings,
    detectedPeriodStart: workerResult.periodStart,
    detectedPeriodEnd: workerResult.periodEnd,
  }
}

