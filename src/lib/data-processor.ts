import type { SalesTransaction } from './csv-parser'
import type {
  CompilationFilter,
  ArtistMapping,
  SplitFee,
  ManualRevenue,
  PlatformRevenue,
  CountryRevenue,
  MonthlyRevenue,
  ReleaseRevenue,
  FilteredCompilation,
  ForecastPoint,
} from './types'

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
  excludePhysical?: boolean
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
  // DD/MM/YYYY or D/M/YYYY
  const dmyMatch = month.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (dmyMatch) {
    return new Date(
      parseInt(dmyMatch[3]),
      parseInt(dmyMatch[2]) - 1,
      parseInt(dmyMatch[1])
    ).getTime()
  }
  // YYYY-MM or YYYY-MM-DD
  const d = new Date(month)
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
    const key = t.upc_ean || t.catalog_number || t.release_title || 'Unknown'
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

  // Group by resolved artist
  const artistGroups = new Map<string, SalesTransaction[]>()
  for (const t of resolved) {
    const group = artistGroups.get(t.main_artist)
    if (group) {
      group.push(t)
    } else {
      artistGroups.set(t.main_artist, [t])
    }
  }

  // Build per-artist data with all breakdowns
  const artistData: ProcessedArtistData[] = []

  for (const [artist, artistTransactions] of artistGroups.entries()) {
    let digitalRevenue = 0
    let physicalRevenue = 0
    let totalQuantity = 0

    for (const t of artistTransactions) {
      totalQuantity += t.quantity
      if (t.is_physical) {
        physicalRevenue += t.net_revenue
      } else {
        digitalRevenue += t.net_revenue
      }
    }

    const manualRevenue = config.manualRevenues
      .filter(mr => mr.artist === artist)
      .reduce((sum, mr) => sum + mr.amount, 0)

    const grossRevenue = digitalRevenue + physicalRevenue + manualRevenue

    const splitFee = config.splitFees.find(sf => sf.artist === artist)
    const splitPercentage = clampSplitPercentage(splitFee?.percentage ?? 100)

    // Bug 10 fix: split percentage applies only to streaming/physical revenue;
    // manual revenues (sync deals, etc.) are passed through in full.
    const finalPayout = (digitalRevenue + physicalRevenue) * (splitPercentage / 100) + manualRevenue

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
      platformBreakdown: buildPlatformBreakdown(artistTransactions),
      countryBreakdown: buildCountryBreakdown(artistTransactions),
      monthlyBreakdown: buildMonthlyBreakdown(artistTransactions),
      releaseBreakdown: buildReleaseBreakdown(artistTransactions),
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

/**
 * Flags monthly revenue entries that deviate by more than 2 standard
 * deviations from the artist's mean monthly revenue.
 */
export function detectOutliers(monthlyBreakdown: MonthlyRevenue[]): MonthlyRevenue[] {
  if (monthlyBreakdown.length < 3) return monthlyBreakdown

  const revenues = monthlyBreakdown.map(m => m.revenue)
  const mean = revenues.reduce((s, v) => s + v, 0) / revenues.length
  const variance = revenues.reduce((s, v) => s + (v - mean) ** 2, 0) / revenues.length
  const stdDev = Math.sqrt(variance)

  return monthlyBreakdown.map(m => ({
    ...m,
    isOutlier: stdDev > 0 && Math.abs(m.revenue - mean) > 2 * stdDev,
    expectedRevenue: mean,
  }))
}

/** Advances a YYYY-MM month string by `h` months and returns the new YYYY-MM label. */
function addMonths(yearMonthStr: string, h: number): string {
  const [y, m] = yearMonthStr.includes('-')
    ? yearMonthStr.split('-').map(Number)
    : [new Date().getFullYear(), new Date().getMonth() + 1]
  const d = new Date(y, m - 1 + h, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

/**
 * Forecasts the next 3 months of revenue using Holt-Winters double
 * exponential smoothing (level + trend). Returns both the three
 * individual monthly forecasts and their sum (the quarterly forecast).
 */
export function calculateForecast(
  monthlyBreakdown: MonthlyRevenue[]
): { forecastData: ForecastPoint[]; quarterForecast: number } {
  const sorted = [...monthlyBreakdown].sort((a, b) => a.month.localeCompare(b.month))
  if (sorted.length < 2) {
    const base = sorted[0]?.revenue ?? 0
    const baseMonth = sorted[0]?.month ?? 'unknown'
    return {
      forecastData: [1, 2, 3].map(i => ({
        month: addMonths(baseMonth, i),
        forecastRevenue: parseFloat(base.toFixed(2)),
      })),
      quarterForecast: parseFloat((base * 3).toFixed(2)),
    }
  }

  const α = 0.3 // level smoothing
  const β = 0.1 // trend smoothing

  // Initialise
  let level = sorted[0].revenue
  let trend = sorted[1].revenue - sorted[0].revenue

  for (let i = 1; i < sorted.length; i++) {
    const y = sorted[i].revenue
    const prevLevel = level
    level = α * y + (1 - α) * (level + trend)
    trend = β * (level - prevLevel) + (1 - β) * trend
  }

  // Generate the next 3 calendar months after the last known month
  const lastMonth = sorted[sorted.length - 1].month
  const forecastData: ForecastPoint[] = []
  let quarterForecast = 0

  for (let h = 1; h <= 3; h++) {
    const forecastRevenue = parseFloat(Math.max(0, level + h * trend).toFixed(2))
    quarterForecast += forecastRevenue
    forecastData.push({ month: addMonths(lastMonth, h), forecastRevenue })
  }

  return { forecastData, quarterForecast: parseFloat(quarterForecast.toFixed(2)) }
}
