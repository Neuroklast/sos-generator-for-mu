/**
 * CSV Processor Web Worker
 *
 * Architecture overview
 * ─────────────────────
 * This worker owns the entire CSV → aggregated-data pipeline so that the main
 * thread never holds raw SalesTransaction objects in memory.
 *
 * Protocol (Main → Worker)
 *   add-file   Parse a CSV file and store its transactions internally.
 *   remove-file  Remove a previously added file from the internal store.
 *   process    Run processTransactionsWithCompilations + buildArtistTree +
 *              buildArtistCollabTree on all stored transactions, then post the
 *              aggregated result back WITHOUT any raw transaction arrays.
 *   reset      Clear all stored transactions (e.g. when column aliases change
 *              so all files must be re-parsed).
 *
 * Protocol (Worker → Main)
 *   parse-progress  Percentage update while parsing a file.
 *   parse-done      Parse finished; carries row/artist stats.
 *   result          Full processing result (no raw transactions).
 *   error           Any unrecoverable error.
 */

import { parseCSVContentStreaming } from '@/lib/streaming-csv-parser'
import {
  processTransactionsWithCompilations,
  buildArtistTree,
  detectOutliers,
  calculateForecast,
} from '@/lib/data-processor'
import { buildArtistCollabTree } from '@/lib/grouping'
import type { SalesTransaction } from '@/lib/csv-parser'
import type {
  SafeProcessedArtistData,
  ArtistTreeNode,
  ArtistCollabNode,
  FilteredCompilation,
  CompilationFilter,
  ArtistMapping,
  SplitFee,
  ManualRevenue,
} from '@/lib/types'

// ── Message type definitions ──────────────────────────────────────────────────

export interface WorkerProcessConfig {
  compilationFilters: CompilationFilter[]
  artistMappings: ArtistMapping[]
  splitFees: SplitFee[]
  manualRevenues: ManualRevenue[]
  excludePhysical: boolean
}

export interface WorkerResult {
  processedData: SafeProcessedArtistData[]
  artistTrees: ArtistTreeNode[]
  collabTree: ArtistCollabNode[]
  filteredCompilations: FilteredCompilation[]
  uniqueArtists: string[]
  periodStart: string
  periodEnd: string
}

export type WorkerRequest =
  | { type: 'add-file'; fileId: string; content: string; source: 'believe' | 'bandcamp'; customAliases: Record<string, string[]> }
  | { type: 'remove-file'; fileId: string }
  | { type: 'process'; config: WorkerProcessConfig }
  | { type: 'reset' }

export type WorkerResponse =
  | { type: 'parse-progress'; fileId: string; percentage: number }
  | { type: 'parse-done'; fileId: string; rowsParsed: number; rowsSkipped: number; uniqueArtistsCount: number }
  | { type: 'result'; data: WorkerResult }
  | { type: 'error'; message: string; fileId?: string }

// ── Internal worker state ──────────────────────────────────────────────────────

/** All parsed transactions keyed by file ID. */
const fileTransactions = new Map<string, SalesTransaction[]>()

// ── Helpers ───────────────────────────────────────────────────────────────────

function post(msg: WorkerResponse): void {
  self.postMessage(msg)
}

function getAllTransactions(): SalesTransaction[] {
  const all: SalesTransaction[] = []
  for (const txs of fileTransactions.values()) {
    for (const t of txs) all.push(t)
  }
  return all
}

function runProcess(config: WorkerProcessConfig): void {
  try {
    const allTransactions = getAllTransactions()

    if (allTransactions.length === 0) {
      post({
        type: 'result',
        data: {
          processedData: [],
          artistTrees: [],
          collabTree: [],
          filteredCompilations: [],
          uniqueArtists: [],
          periodStart: '',
          periodEnd: '',
        },
      })
      return
    }

    // Detect reporting period from all transactions
    const months = allTransactions.map(t => t.sales_month).filter(Boolean).sort()
    const periodStart = months[0] ?? ''
    const periodEnd = months[months.length - 1] ?? ''

    // Core processing — financial math runs unchanged (no modifications to data-processor.ts)
    const { artistData, filteredCompilations } = processTransactionsWithCompilations(
      allTransactions,
      config
    )

    // Pre-compute tree structures while we still have raw transactions in scope
    const artistTrees: ArtistTreeNode[] = buildArtistTree(artistData)
    const collabTransactions = config.excludePhysical
      ? allTransactions.filter(t => !t.is_physical)
      : allTransactions
    const collabTree: ArtistCollabNode[] = buildArtistCollabTree(collabTransactions, config.artistMappings)

    const uniqueArtists = artistData.map(d => d.artist).sort()

    // Build the safe (no-raw-transactions) payload to send to the main thread.
    // We compute believeRevenue / bandcampRevenue here before discarding rows.
    const processedData: SafeProcessedArtistData[] = artistData.map(d => {
      const monthlyWithOutliers = detectOutliers(d.monthlyBreakdown)
      const { forecastData, quarterForecast } = calculateForecast(monthlyWithOutliers)

      return {
        artist: d.artist,
        believeRevenue: d.transactions
          .filter(t => t.source === 'believe')
          .reduce((s, t) => s + t.net_revenue, 0),
        bandcampRevenue: d.transactions
          .filter(t => t.source === 'bandcamp')
          .reduce((s, t) => s + t.net_revenue, 0),
        totalDigitalRevenue: d.totalDigitalRevenue,
        totalPhysicalRevenue: d.totalPhysicalRevenue,
        manualRevenue: d.manualRevenue,
        grossRevenue: d.grossRevenue,
        splitPercentage: d.splitPercentage,
        finalPayout: d.finalPayout,
        totalQuantity: d.totalQuantity,
        platformBreakdown: d.platformBreakdown,
        countryBreakdown: d.countryBreakdown,
        monthlyBreakdown: monthlyWithOutliers,
        releaseBreakdown: d.releaseBreakdown,
        forecastData,
        quarterForecast,
      }
    })

    // Raw transaction arrays and the full ProcessedArtistData (with .transactions)
    // are now only in local scope and will be garbage-collected once this
    // function returns — they are NEVER sent to the main thread.
    post({
      type: 'result',
      data: { processedData, artistTrees, collabTree, filteredCompilations, uniqueArtists, periodStart, periodEnd },
    })
  } catch (err) {
    post({
      type: 'error',
      message: err instanceof Error ? err.message : 'Unknown processing error',
    })
  }
}

// ── Message handler ───────────────────────────────────────────────────────────

self.addEventListener('message', async (event: MessageEvent<WorkerRequest>) => {
  const msg = event.data

  switch (msg.type) {
    case 'add-file': {
      const { fileId, content, source, customAliases } = msg
      try {
        const result = await parseCSVContentStreaming(
          content,
          source,
          (progress) => {
            post({ type: 'parse-progress', fileId, percentage: progress.percentage })
          },
          undefined,
          customAliases
        )
        fileTransactions.set(fileId, result.transactions)
        post({
          type: 'parse-done',
          fileId,
          rowsParsed: result.transactions.length,
          rowsSkipped: result.errors.length,
          uniqueArtistsCount: result.uniqueArtists.length,
        })
      } catch (err) {
        post({
          type: 'error',
          fileId,
          message: err instanceof Error ? err.message : 'Unknown parse error',
        })
      }
      break
    }

    case 'remove-file': {
      fileTransactions.delete(msg.fileId)
      break
    }

    case 'process': {
      runProcess(msg.config)
      break
    }

    case 'reset': {
      fileTransactions.clear()
      break
    }
  }
})
