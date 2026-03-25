import type { SalesTransaction } from '@/features/ingest/lib/csv-parser'
import type {
  CompilationFilter,
  ArtistMapping,
  SplitFee,
  ManualRevenue,
  ExpenseEntry,
  PlatformRevenue,
  CountryRevenue,
  MonthlyRevenue,
  ReleaseRevenue,
  FilteredCompilation,
  LabelArtist,
  IgnoredEntry,
} from './types'
import { convertToEur } from './currency'
import type { ExchangeRates } from './currency'

export interface ProcessedArtistData {
  artist: string
  transactions: SalesTransaction[]
  totalDigitalRevenue: number
  totalPhysicalRevenue: number
  manualRevenue: number
  grossRevenue: number
  splitPercentage: number
  finalPayout: number
  totalQuantity: number
  /** Total recoupable expenses deducted from gross revenue before split. */
  totalExpenses: number
  /** Label distribution fee (EUR) deducted from streaming/physical revenue before the split. */
  distributionFeeDeducted: number
  platformBreakdown: PlatformRevenue[]
  countryBreakdown: CountryRevenue[]
  monthlyBreakdown: MonthlyRevenue[]
  releaseBreakdown: ReleaseRevenue[]
}

export interface DataProcessorConfig {
  compilationFilters: CompilationFilter[]
  artistMappings: ArtistMapping[]
  splitFees: SplitFee[]
  manualRevenues: ManualRevenue[]
  /** Recoupable expense entries deducted per artist before split. */
  expenses?: ExpenseEntry[]
  excludePhysical?: boolean
  /** Exchange rates map (1 EUR = N units of foreign currency). Used to convert
   *  non-EUR Bandcamp transactions to EUR at processing time. */
  exchangeRates?: ExchangeRates
  /**
   * When non-empty, only transactions whose resolved main artist appears in this
   * list are included. Co-artists not in the roster are silently dropped (their
   * transactions are re-attributed to the matching label artist).
   */
  labelArtists?: LabelArtist[]
  /**
   * Entries to exclude from all revenue calculations.
   * Each entry can target a specific artist or a specific release of an artist.
   */
  ignoredEntries?: IgnoredEntry[]
  /**
   * Label distribution fee as a percentage (0–100) deducted from each artist's
   * streaming/physical gross revenue before the split percentage is applied.
   */
  distributionFeePercentage?: number
  /**
   * Optional override distribution fee (0–100) applied exclusively to digital
   * (streaming) revenue. When set, overrides `distributionFeePercentage` for
   * digital revenue. Falls back to `distributionFeePercentage` when omitted.
   */
  distributionFeeDigital?: number
  /**
   * Optional override distribution fee (0–100) applied exclusively to physical
   * and merch revenue. When set, overrides `distributionFeePercentage` for
   * physical revenue. Falls back to `distributionFeePercentage` when omitted.
   */
  distributionFeePhysical?: number
}

export interface ProcessorResult {
  artistData: ProcessedArtistData[]
  filteredCompilations: FilteredCompilation[]
}

// ── Helpers ────────────────────────────────────────────────────────────────────

export function isCompilation(
  transaction: SalesTransaction,
  filters: CompilationFilter[]
): boolean {
  for (const filter of filters) {
    switch (filter.type) {
      case 'ean':
        // Exact match to prevent a short code from matching unrelated releases.
        if (
          transaction.upc_ean &&
          transaction.upc_ean.toLowerCase() === filter.identifier.toLowerCase()
        ) return true
        break
      case 'catalog':
        // Exact match for the same reason.
        if (
          transaction.catalog_number &&
          transaction.catalog_number.toLowerCase() === filter.identifier.toLowerCase()
        ) return true
        break
      case 'title':
        // Substring match is appropriate for human-readable titles.
        if (transaction.release_title?.toLowerCase().includes(filter.identifier.toLowerCase())) return true
        break
    }
  }
  return false
}

export function resolveMainArtist(
  originalArtist: string,
  mappings: ArtistMapping[]
): string {
  if (!originalArtist) return ''
  const lower = originalArtist.toLowerCase()
  const mapping = mappings.find(m => m.featuringName.toLowerCase() === lower)
  return mapping ? mapping.primaryArtist : originalArtist
}

/** Constrains a split percentage to the valid 0–100 range. */
function clampSplitPercentage(value: number): number {
  return Math.min(100, Math.max(0, value))
}

/**
 * Resolves the effective distribution fee rate for a given revenue type.
 * When a type-specific override is provided it takes priority; otherwise the
 * global fallback rate is used.
 */
function resolveDistributionFeeRate(override: number | undefined, fallback: number): number {
  return (override != null ? override : fallback) / 100
}

/**
 * Resolves the effective split percentage for a given revenue type.
 * Type-specific override → base split → 100 % (pass-through).
 */
function resolveSplitPercentage(
  splitFee: { percentage: number; digitalPercentage?: number; physicalPercentage?: number } | undefined,
  typeOverride: 'digital' | 'physical'
): number {
  const override = typeOverride === 'digital' ? splitFee?.digitalPercentage : splitFee?.physicalPercentage
  return clampSplitPercentage(override ?? splitFee?.percentage ?? 100)
}

function aggregateBy<K extends string>(
  items: { key: K; revenue: number; quantity: number }[]
): Map<K, { revenue: number; quantity: number }> {
  const map = new Map<K, { revenue: number; quantity: number }>()
  for (const { key, revenue, quantity } of items) {
    const existing = map.get(key) ?? { revenue: 0, quantity: 0 }
    map.set(key, { revenue: existing.revenue + revenue, quantity: existing.quantity + quantity })
  }
  return map
}

function buildPlatformBreakdown(transactions: SalesTransaction[]): PlatformRevenue[] {
  const agg = aggregateBy(
    transactions.map(t => ({ key: t.platform || 'Unknown', revenue: t.net_revenue, quantity: t.quantity }))
  )
  return Array.from(agg.entries())
    .map(([platform, { revenue, quantity }]) => ({ platform, revenue, quantity }))
    .sort((a, b) => b.revenue - a.revenue)
}

function buildCountryBreakdown(transactions: SalesTransaction[]): CountryRevenue[] {
  const agg = aggregateBy(
    transactions.map(t => ({ key: t.country || 'Unknown', revenue: t.net_revenue, quantity: t.quantity }))
  )
  return Array.from(agg.entries())
    .map(([country, { revenue, quantity }]) => ({ country, revenue, quantity }))
    .sort((a, b) => b.revenue - a.revenue)
}

function parseMonthToDate(month: string): number {
  if (!month || month === 'Unknown') return 0
  // Dates are normalised to YYYY-MM by the streaming parser.
  const d = new Date(month + '-01')
  return isNaN(d.getTime()) ? 0 : d.getTime()
}

function buildMonthlyBreakdown(transactions: SalesTransaction[]): MonthlyRevenue[] {
  const map = new Map<string, number>()
  for (const t of transactions) {
    const month = t.sales_month || 'Unknown'
    map.set(month, (map.get(month) ?? 0) + t.net_revenue)
  }
  return Array.from(map.entries())
    .map(([month, revenue]) => ({ month, revenue }))
    .sort((a, b) => parseMonthToDate(a.month) - parseMonthToDate(b.month))
}

function buildReleaseBreakdown(transactions: SalesTransaction[]): ReleaseRevenue[] {
  const map = new Map<string, ReleaseRevenue>()
  for (const t of transactions) {
    // Use a normalised lowercase key so the same release with different casing is grouped together.
    const key = (t.upc_ean || t.catalog_number || t.release_title || 'Unknown').toLowerCase()
    const existing = map.get(key)
    if (existing) {
      existing.revenue += t.net_revenue
      existing.quantity += t.quantity
    } else {
      map.set(key, {
        releaseTitle: t.release_title || 'Unknown',
        upcEan: t.upc_ean || '',
        catalogNumber: t.catalog_number || '',
        revenue: t.net_revenue,
        quantity: t.quantity,
        isPhysical: t.is_physical,
      })
    }
  }
  return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue)
}

// ── Main processing ────────────────────────────────────────────────────────────

export function processTransactions(
  transactions: SalesTransaction[],
  config: DataProcessorConfig
): ProcessedArtistData[] {
  return processTransactionsWithCompilations(transactions, config).artistData
}

export function processTransactionsWithCompilations(
  transactions: SalesTransaction[],
  config: DataProcessorConfig
): ProcessorResult {
  // Identify compilation transactions for reporting purposes only.
  // They still count toward artist revenue (Bug 3b fix).
  const compilationTransactionIds = new Set<string>()
  for (const t of transactions) {
    if (isCompilation(t, config.compilationFilters)) {
      compilationTransactionIds.add(t.id)
    }
  }

  // Build filtered compilation summary (informational panel only)
  const compilationMap = new Map<string, FilteredCompilation>()
  for (const t of transactions) {
    if (!compilationTransactionIds.has(t.id)) continue

    const matchingFilter = config.compilationFilters.find(f => {
      switch (f.type) {
        case 'ean': return t.upc_ean?.toLowerCase() === f.identifier.toLowerCase()
        case 'catalog': return t.catalog_number?.toLowerCase() === f.identifier.toLowerCase()
        case 'title': return t.release_title?.toLowerCase().includes(f.identifier.toLowerCase())
        default: return false
      }
    })
    if (!matchingFilter) continue

    const key = matchingFilter.id
    const existing = compilationMap.get(key)
    if (existing) {
      existing.revenue += t.net_revenue
      existing.transactionCount += 1
    } else {
      compilationMap.set(key, {
        releaseTitle: t.release_title || matchingFilter.identifier,
        identifier: matchingFilter.identifier,
        filterType: matchingFilter.type,
        revenue: t.net_revenue,
        transactionCount: 1,
      })
    }
  }

  const filteredCompilations = Array.from(compilationMap.values()).sort(
    (a, b) => b.revenue - a.revenue
  )

  // Apply physical exclusion to all transactions (compilations are still counted)
  const workingTransactions = config.excludePhysical
    ? transactions.filter(t => !t.is_physical)
    : transactions

  // Resolve artist names via mappings
  const resolved = workingTransactions.map(t => ({
    ...t,
    main_artist: resolveMainArtist(t.original_artist, config.artistMappings),
  }))

  // ── Label artist roster filter ─────────────────────────────────────────────
  // When the roster is non-empty, re-attribute transactions whose original
  // artist string contains a label artist (comma/ampersand/feat. separated)
  // to that label artist.  Transactions with no label artist are dropped.
  const rosterNames =
    config.labelArtists && config.labelArtists.length > 0
      ? config.labelArtists.map(la => la.name.trim().toLowerCase())
      : null

  const rosterFiltered = rosterNames
    ? resolved.flatMap(t => {
        // Check if the resolved main artist itself is in the roster
        if (rosterNames.includes(t.main_artist.trim().toLowerCase())) {
          return [t]
        }
        // Try to find a label artist within the original_artist string
        // (handles "Neuroklast, mechanical vein" or "Neuroklast feat. X")
        const found = rosterNames.find(rn =>
          t.original_artist.trim().toLowerCase() === rn ||
          t.original_artist.toLowerCase().split(/\s*[,&]\s*|\s+feat(?:uring)?\.?\s+|\s+ft\.?\s+/i).some(
            part => part.trim().toLowerCase() === rn
          )
        )
        if (!found) return []
        // Re-attribute to the canonical roster name (fall back to found name if lookup fails)
        const canonical =
          config.labelArtists?.find(la => la.name.trim().toLowerCase() === found)?.name ?? found
        return [{ ...t, main_artist: canonical }]
      })
    : resolved

  // ── Ignored entries filter ─────────────────────────────────────────────────
  const ignoredEntries = config.ignoredEntries ?? []
  const rosterAndIgnoreFiltered =
    ignoredEntries.length === 0
      ? rosterFiltered
      : rosterFiltered.filter(t => {
          const artistLower = t.main_artist.trim().toLowerCase()
          return !ignoredEntries.some(ie => {
            if (ie.artist.trim().toLowerCase() !== artistLower) return false
            if (!ie.releaseTitle) return true // whole artist ignored
            return (
              t.release_title?.trim().toLowerCase() === ie.releaseTitle.trim().toLowerCase()
            )
          })
        })

  // Group by resolved artist (case-insensitive: "NEUROKLAST" == "Neuroklast")
  const artistGroups = new Map<string, SalesTransaction[]>()
  // Stores the first-seen canonical casing for each lowercase key.
  const canonicalArtistNames = new Map<string, string>()
  for (const t of rosterAndIgnoreFiltered) {
    const key = t.main_artist.toLowerCase()
    if (!canonicalArtistNames.has(key)) {
      canonicalArtistNames.set(key, t.main_artist)
    }
    const group = artistGroups.get(key)
    if (group) {
      group.push(t)
    } else {
      artistGroups.set(key, [t])
    }
  }

  // Build per-artist data with all breakdowns
  const artistData: ProcessedArtistData[] = []

  const rates = config.exchangeRates ?? {}

  for (const [lowerKey, artistTransactions] of artistGroups.entries()) {
    const artist = canonicalArtistNames.get(lowerKey) ?? lowerKey
    let digitalRevenue = 0
    let physicalRevenue = 0
    let totalQuantity = 0

    // Create EUR-normalised versions of the transactions for breakdown functions.
    const eurTransactions = artistTransactions.map(t => {
      const revenueEur = t.source === 'bandcamp' && t.currency !== 'EUR'
        ? convertToEur(t.net_revenue, t.currency, rates)
        : t.net_revenue
      return { ...t, net_revenue: revenueEur }
    })

    for (const t of eurTransactions) {
      totalQuantity += t.quantity
      if (t.is_physical) {
        physicalRevenue += t.net_revenue
      } else {
        digitalRevenue += t.net_revenue
      }
    }

    const manualRevenue = config.manualRevenues
      .filter(mr => mr.artist.toLowerCase() === lowerKey)
      .reduce((sum, mr) => sum + mr.amount, 0)

    // Recoupable expenses: deducted from streaming/physical revenue before split.
    const totalExpenses = (config.expenses ?? [])
      .filter(e => e.artist.toLowerCase() === lowerKey)
      .reduce((sum, e) => sum + e.amount, 0)

    // Distribution fee: a percentage of streaming/physical revenue retained by
    // the label before the artist's split is calculated.
    // Per-type overrides take precedence over the global rate.
    const globalFeeDefault = config.distributionFeePercentage ?? 0
    const digitalFeeRate = resolveDistributionFeeRate(config.distributionFeeDigital, globalFeeDefault)
    const physicalFeeRate = resolveDistributionFeeRate(config.distributionFeePhysical, globalFeeDefault)

    const digitalFeeDeducted = digitalRevenue * digitalFeeRate
    const physicalFeeDeducted = physicalRevenue * physicalFeeRate
    const distributionFeeDeducted = digitalFeeDeducted + physicalFeeDeducted

    // Revenue after fee deduction per type
    const digitalAfterFee = digitalRevenue - digitalFeeDeducted
    const physicalAfterFee = physicalRevenue - physicalFeeDeducted

    // Revenue available for the artist split after fee and expense deductions.
    // Expenses are deducted from the combined streaming/physical base, then
    // scaled proportionally across digital and physical so that neither type
    // bears a disproportionate share of the expense burden.
    // Math.max(0, …) ensures we never pass a negative base into the split
    // calculation — expenses and fees cannot create a negative payout.
    const streamingPhysicalAfterFee = digitalAfterFee + physicalAfterFee
    const afterExpenses = Math.max(0, streamingPhysicalAfterFee - totalExpenses)

    // Proportional scaling factor so expense deductions are applied evenly
    // across both revenue types (avoids double-deduction or starvation).
    // When streamingPhysicalAfterFee is zero (no revenue after fees) expenses
    // cannot be allocated proportionally, so scale defaults to 0 — the artist
    // receives nothing from this bucket regardless.
    const expenseScale = streamingPhysicalAfterFee > 0 ? afterExpenses / streamingPhysicalAfterFee : 0
    const digitalRecoupable = digitalAfterFee * expenseScale
    const physicalRecoupable = physicalAfterFee * expenseScale

    const grossRevenue = digitalRevenue + physicalRevenue + manualRevenue

    const splitFee = config.splitFees.find(sf => sf.artist.toLowerCase() === lowerKey)
    const splitPercentage = clampSplitPercentage(splitFee?.percentage ?? 100)

    // Per-type split overrides: when set on the SplitFee entry they override the
    // base percentage for that specific revenue type.
    const digitalSplitPct = resolveSplitPercentage(splitFee, 'digital')
    const physicalSplitPct = resolveSplitPercentage(splitFee, 'physical')

    // Expenses and distribution fee are deducted from the streaming/physical base
    // before the split percentage is applied. Manual revenues (sync deals, etc.)
    // pass through in full.
    const finalPayout =
      digitalRecoupable * (digitalSplitPct / 100) +
      physicalRecoupable * (physicalSplitPct / 100) +
      manualRevenue

    artistData.push({
      artist,
      transactions: artistTransactions,
      totalDigitalRevenue: digitalRevenue,
      totalPhysicalRevenue: physicalRevenue,
      manualRevenue,
      grossRevenue,
      splitPercentage,
      finalPayout,
      totalQuantity,
      totalExpenses,
      distributionFeeDeducted,
      platformBreakdown: buildPlatformBreakdown(eurTransactions),
      countryBreakdown: buildCountryBreakdown(eurTransactions),
      monthlyBreakdown: buildMonthlyBreakdown(eurTransactions),
      releaseBreakdown: buildReleaseBreakdown(eurTransactions),
    })
  }

  artistData.sort((a, b) => b.finalPayout - a.finalPayout)

  return { artistData, filteredCompilations }
}

export function getUniqueArtistsFromTransactions(
  transactions: SalesTransaction[],
  mappings: ArtistMapping[]
): string[] {
  const artistSet = new Set<string>()
  for (const t of transactions) {
    artistSet.add(resolveMainArtist(t.original_artist, mappings))
  }
  return Array.from(artistSet).sort()
}

// ── Tree view builder ──────────────────────────────────────────────────────────

import type { ArtistTreeNode, ReleaseWithTracks, TrackData } from './types'

/**
 * Builds a full artist → release → track hierarchy from processed data.
 * Used by the ArtistTreeView component.
 */
export function buildArtistTree(
  artistData: ProcessedArtistData[]
): ArtistTreeNode[] {
  return artistData.map(data => {
    // Group transactions by release key
    const releaseMap = new Map<string, { meta: Omit<ReleaseWithTracks, 'tracks'>; trackMap: Map<string, TrackData> }>()

    for (const t of data.transactions) {
      const releaseKey = t.upc_ean || t.catalog_number || t.release_title || 'Unknown'
      let release = releaseMap.get(releaseKey)
      if (!release) {
        release = {
          meta: {
            releaseTitle: t.release_title || 'Unknown',
            upcEan: t.upc_ean || '',
            catalogNumber: t.catalog_number || '',
            isPhysical: t.is_physical,
            revenue: 0,
            quantity: 0,
          },
          trackMap: new Map(),
        }
        releaseMap.set(releaseKey, release)
      }
      release.meta.revenue += t.net_revenue
      release.meta.quantity += t.quantity

      // Group by track
      const trackKey = t.isrc || t.track_title || 'Unknown Track'
      const existingTrack = release.trackMap.get(trackKey)
      if (existingTrack) {
        existingTrack.revenue += t.net_revenue
        existingTrack.quantity += t.quantity
        if (t.platform && !existingTrack.platforms.includes(t.platform)) {
          existingTrack.platforms.push(t.platform)
        }
      } else {
        release.trackMap.set(trackKey, {
          trackTitle: t.track_title || 'Unknown Track',
          isrc: t.isrc || '',
          revenue: t.net_revenue,
          quantity: t.quantity,
          platforms: t.platform ? [t.platform] : [],
        })
      }
    }

    const releases: ReleaseWithTracks[] = Array.from(releaseMap.values())
      .map(({ meta, trackMap }) => ({
        ...meta,
        tracks: Array.from(trackMap.values()).sort((a, b) => b.revenue - a.revenue),
      }))
      .sort((a, b) => b.revenue - a.revenue)

    return {
      artist: data.artist,
      totalRevenue: data.grossRevenue,
      finalPayout: data.finalPayout,
      splitPercentage: data.splitPercentage,
      quantity: data.totalQuantity,
      releases,
    }
  })
}

/**
 * Extracts the main artist and guest artists from a title/artist string.
 * Handles: feat., ft., featuring, versus, vs., x (standalone word)
 */
export function extractCollabs(title: string): { mainArtist: string; guestArtists: string[] } {
  if (!title || !title.trim()) return { mainArtist: '', guestArtists: [] }

  const featRegex = /\s*[[(]?\s*(?:feat(?:uring)?\.?|ft\.?)\s*/gi
  const versusRegex = /\s+(?:versus|vs\.?)\s+/gi

  const featParts = title.split(featRegex).map(p => p.replace(/[\])\s]+$/, '').trim()).filter(Boolean)
  if (featParts.length > 1) {
    const mainArtist = featParts[0]
    const guestArtists = featParts.slice(1).flatMap(p =>
      p.split(/\s*[,&]\s*|\s+and\s+/gi).map(a => a.trim()).filter(Boolean)
    )
    return { mainArtist, guestArtists }
  }

  const versusParts = title.split(versusRegex).map(p => p.trim()).filter(Boolean)
  if (versusParts.length > 1) {
    return { mainArtist: versusParts[0], guestArtists: versusParts.slice(1) }
  }

  return { mainArtist: title.trim(), guestArtists: [] }
}


