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
        if (transaction.upc_ean?.toLowerCase().includes(filter.identifier.toLowerCase())) return true
        break
      case 'catalog':
        if (transaction.catalog_number?.toLowerCase().includes(filter.identifier.toLowerCase())) return true
        break
      case 'title':
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

function buildMonthlyBreakdown(transactions: SalesTransaction[]): MonthlyRevenue[] {
  const map = new Map<string, number>()
  for (const t of transactions) {
    const month = t.sales_month || 'Unknown'
    map.set(month, (map.get(month) ?? 0) + t.net_revenue)
  }
  return Array.from(map.entries())
    .map(([month, revenue]) => ({ month, revenue }))
    .sort((a, b) => a.month.localeCompare(b.month))
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
  // Separate compilations first so we can report them
  const compilationTransactions: SalesTransaction[] = []
  const nonCompilationTransactions: SalesTransaction[] = []

  for (const t of transactions) {
    if (isCompilation(t, config.compilationFilters)) {
      compilationTransactions.push(t)
    } else {
      nonCompilationTransactions.push(t)
    }
  }

  // Build filtered compilation summary
  const compilationMap = new Map<string, FilteredCompilation>()
  for (const t of compilationTransactions) {
    const matchingFilter = config.compilationFilters.find(f => {
      switch (f.type) {
        case 'ean': return t.upc_ean?.toLowerCase().includes(f.identifier.toLowerCase())
        case 'catalog': return t.catalog_number?.toLowerCase().includes(f.identifier.toLowerCase())
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

  // Apply physical exclusion
  const workingTransactions = config.excludePhysical
    ? nonCompilationTransactions.filter(t => !t.is_physical)
    : nonCompilationTransactions

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
    const finalPayout = grossRevenue * (splitPercentage / 100)

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
