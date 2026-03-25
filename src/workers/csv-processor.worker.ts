/**
 * CSV Processor Web Worker
 *
 * Architecture overview
 * ─────────────────────
 * This worker owns the entire CSV → aggregated-data pipeline so that the main
 * thread never holds raw SalesTransaction objects in memory.
 *
 * Protocol (Main → Worker)
 *   add-file     Parse a CSV file and store its transactions (or raw buffer
 *                data for Shopify/Printful) internally.
 *   remove-file  Remove a previously added file from all internal stores.
 *   process      Reconcile e-commerce buffers, run processTransactionsWithCompilations
 *                + buildArtistTree + buildArtistCollabTree on all transactions,
 *                then post the aggregated result WITHOUT any raw transaction arrays.
 *   reset        Clear all stored data (e.g. when column aliases change).
 *
 * E-Commerce staging (Schritt 2)
 * ────────────────────────────────
 * Shopify files are parsed into raw ShopifyRawOrder arrays and held in
 * `shopifyRawOrdersMap` (keyed by fileId). Printful files are parsed into
 * PrintfulRawCost arrays in `printfulRawCostsMap`. On every `process` call
 * both buffers are reconciled via `reconcileMerchTransactions` and the
 * resulting SalesTransactions are merged with the believe/bandcamp transactions.
 *
 * This ensures that:
 *  - A Shopify-only upload immediately produces artist-attributed transactions
 *    (with full subtotal as net, since Printful costs = []).
 *  - When Printful data is later added, the next `process` call updates the
 *    net revenue figures without requiring a full re-parse.
 *  - No Printful match for a Shopify order is silently acceptable (CDs/Vinyl
 *    are self-fulfilled and have no Printful cost entry).
 */

import { parseCSVContentStreaming } from '@/features/ingest/lib/streaming-csv-parser'
import { parseShopifyRaw, reconcileMerchTransactions } from '@/features/ingest/lib/ecommerce-merger'
import type { ShopifyRawOrder } from '@/features/ingest/lib/ecommerce-merger'
import { parsePrintfulCSV } from '@/features/ingest/lib/printful-parser'
import type { PrintfulRawCost } from '@/features/ingest/lib/ecommerce-merger'
import {
  processTransactionsWithCompilations,
  buildArtistTree,
} from '@/lib/data-processor'
import { buildArtistCollabTree } from '@/lib/grouping'
import type { SalesTransaction } from '@/features/ingest/lib/csv-parser'
import type {
  SafeProcessedArtistData,
  ArtistTreeNode,
  ArtistCollabNode,
  FilteredCompilation,
  CompilationFilter,
  ArtistMapping,
  SplitFee,
  ManualRevenue,
  ExpenseEntry,
  LabelArtist,
  IgnoredEntry,
} from '@/lib/types'
import type { ExchangeRates } from '@/lib/currency'

// ── Message type definitions ──────────────────────────────────────────────────

export interface WorkerProcessConfig {
  compilationFilters: CompilationFilter[]
  artistMappings: ArtistMapping[]
  splitFees: SplitFee[]
  manualRevenues: ManualRevenue[]
  /** Recoupable expenses deducted per artist before split. */
  expenses: ExpenseEntry[]
  excludePhysical: boolean
  /** ECB exchange rates (1 EUR = N units of foreign currency). */
  exchangeRates: ExchangeRates
  /** Label artist roster — when non-empty only these artists appear in results. */
  labelArtists: LabelArtist[]
  /** Entries explicitly ignored in the statement of sales. */
  ignoredEntries: IgnoredEntry[]
  /** Label distribution fee percentage (0–100) deducted before artist splits. */
  distributionFeePercentage: number
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
  | { type: 'add-file'; fileId: string; content: string; source: 'believe' | 'bandcamp' | 'shopify' | 'printful'; customAliases: Record<string, string[]> }
  | { type: 'remove-file'; fileId: string }
  | { type: 'process'; config: WorkerProcessConfig }
  | { type: 'reset' }

export type WorkerResponse =
  | { type: 'parse-progress'; fileId: string; percentage: number }
  | { type: 'parse-done'; fileId: string; rowsParsed: number; rowsSkipped: number; uniqueArtistsCount: number }
  | { type: 'result'; data: WorkerResult }
  | { type: 'error'; message: string; fileId?: string }

// ── Internal worker state ──────────────────────────────────────────────────────

/** Parsed transactions for believe / bandcamp files, keyed by file ID. */
const fileTransactions = new Map<string, SalesTransaction[]>()

/**
 * Raw Shopify order groups, keyed by file ID.
 * These are staged until `runProcess` calls `reconcileMerchTransactions`.
 */
const shopifyRawOrdersMap = new Map<string, ShopifyRawOrder[]>()

/**
 * Raw Printful cost rows, keyed by file ID.
 * Reconciled against `shopifyRawOrdersMap` on every `process` call.
 */
const printfulRawCostsMap = new Map<string, PrintfulRawCost[]>()

// ── Helpers ───────────────────────────────────────────────────────────────────

function post(msg: WorkerResponse): void {
  self.postMessage(msg)
}

function getAllTransactions(): SalesTransaction[] {
  const all: SalesTransaction[] = []
  for (const txs of fileTransactions.values()) {
    for (const t of txs) all.push(t)
  }

  // ── Reconcile e-commerce buffers ─────────────────────────────────────────
  // Collect all raw Shopify orders and Printful costs across all uploaded files.
  const allShopifyOrders: ShopifyRawOrder[] = []
  for (const orders of shopifyRawOrdersMap.values()) {
    for (const o of orders) allShopifyOrders.push(o)
  }

  if (allShopifyOrders.length > 0) {
    const allPrintfulCosts: PrintfulRawCost[] = []
    for (const costs of printfulRawCostsMap.values()) {
      for (const c of costs) allPrintfulCosts.push(c)
    }

    const { transactions: mergedTxs } = reconcileMerchTransactions(allShopifyOrders, allPrintfulCosts)
    for (const t of mergedTxs) all.push(t)
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
        totalExpenses: d.totalExpenses,
        distributionFeeDeducted: d.distributionFeeDeducted,
        platformBreakdown: d.platformBreakdown,
        countryBreakdown: d.countryBreakdown,
        monthlyBreakdown: d.monthlyBreakdown,
        releaseBreakdown: d.releaseBreakdown,
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
        if (source === 'shopify') {
          // Stage raw orders for reconciliation — do NOT convert to SalesTransactions yet.
          const { orders, errors } = parseShopifyRaw(content)
          shopifyRawOrdersMap.set(fileId, orders)
          post({
            type: 'parse-done',
            fileId,
            rowsParsed: orders.length,
            rowsSkipped: errors.length,
            // Artist count is not known until reconciliation — report 0 here;
            // the actual unique artists appear in the `result` message.
            uniqueArtistsCount: 0,
          })
        } else if (source === 'printful') {
          // Stage raw costs for reconciliation.
          const { costs, errors } = parsePrintfulCSV(content)
          printfulRawCostsMap.set(fileId, costs)
          post({
            type: 'parse-done',
            fileId,
            rowsParsed: costs.length,
            rowsSkipped: errors.length,
            uniqueArtistsCount: 0,
          })
        } else {
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
        }
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
      shopifyRawOrdersMap.delete(msg.fileId)
      printfulRawCostsMap.delete(msg.fileId)
      break
    }

    case 'process': {
      runProcess(msg.config)
      break
    }

    case 'reset': {
      fileTransactions.clear()
      shopifyRawOrdersMap.clear()
      printfulRawCostsMap.clear()
      break
    }
  }
})
