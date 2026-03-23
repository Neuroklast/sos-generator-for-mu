import type { SalesTransaction } from './csv-parser'
import type { CompilationFilter, ArtistMapping, SplitFee, ManualRevenue } from './types'

export interface ProcessedArtistData {
  artist: string
  transactions: SalesTransaction[]
  totalDigitalRevenue: number
  totalPhysicalRevenue: number
  manualRevenue: number
  grossRevenue: number
  splitPercentage: number
  finalPayout: number
}

export interface DataProcessorConfig {
  compilationFilters: CompilationFilter[]
  artistMappings: ArtistMapping[]
  splitFees: SplitFee[]
  manualRevenues: ManualRevenue[]
  excludePhysical?: boolean
}

export function isCompilation(
  transaction: SalesTransaction,
  filters: CompilationFilter[]
): boolean {
  for (const filter of filters) {
    switch (filter.type) {
      case 'ean':
        if (transaction.upc_ean && 
            transaction.upc_ean.toLowerCase().includes(filter.identifier.toLowerCase())) {
          return true
        }
        break
      case 'catalog':
        if (transaction.catalog_number && 
            transaction.catalog_number.toLowerCase().includes(filter.identifier.toLowerCase())) {
          return true
        }
        break
      case 'title':
        if (transaction.release_title && 
            transaction.release_title.toLowerCase().includes(filter.identifier.toLowerCase())) {
          return true
        }
        break
    }
  }
  return false
}

export function resolveMainArtist(
  originalArtist: string,
  mappings: ArtistMapping[]
): string {
  const mapping = mappings.find(
    m => m.featuringName.toLowerCase() === originalArtist.toLowerCase()
  )
  return mapping ? mapping.primaryArtist : originalArtist
}

export function processTransactions(
  transactions: SalesTransaction[],
  config: DataProcessorConfig
): ProcessedArtistData[] {
  const filteredTransactions = transactions.filter(
    transaction =>
      !isCompilation(transaction, config.compilationFilters) &&
      !(config.excludePhysical && transaction.is_physical)
  )

  const transactionsWithResolvedArtists = filteredTransactions.map(transaction => ({
    ...transaction,
    main_artist: resolveMainArtist(transaction.original_artist, config.artistMappings)
  }))

  const artistGroups = new Map<string, SalesTransaction[]>()
  
  transactionsWithResolvedArtists.forEach(transaction => {
    const artist = transaction.main_artist
    if (!artistGroups.has(artist)) {
      artistGroups.set(artist, [])
    }
    artistGroups.get(artist)!.push(transaction)
  })

  const results: ProcessedArtistData[] = []

  for (const [artist, artistTransactions] of artistGroups.entries()) {
    let digitalRevenue = 0
    let physicalRevenue = 0

    for (const t of artistTransactions) {
      if (t.is_physical) {
        physicalRevenue += t.net_revenue
      } else {
        digitalRevenue += t.net_revenue
      }
    }

    let manualRevenue = 0
    for (const mr of config.manualRevenues) {
      if (mr.artist === artist) {
        manualRevenue += mr.amount
      }
    }

    const grossRevenue = digitalRevenue + physicalRevenue + manualRevenue

    const splitFee = config.splitFees.find(sf => sf.artist === artist)
    const splitPercentage = splitFee ? splitFee.percentage : 100

    const finalPayout = grossRevenue * (splitPercentage / 100)

    results.push({
      artist,
      transactions: artistTransactions,
      totalDigitalRevenue: digitalRevenue,
      totalPhysicalRevenue: physicalRevenue,
      manualRevenue,
      grossRevenue,
      splitPercentage,
      finalPayout
    })
  }

  return results.sort((a, b) => b.finalPayout - a.finalPayout)
}

export function getUniqueArtistsFromTransactions(
  transactions: SalesTransaction[],
  mappings: ArtistMapping[]
): string[] {
  const artistSet = new Set<string>()
  
  for (const transaction of transactions) {
    const mainArtist = resolveMainArtist(transaction.original_artist, mappings)
    artistSet.add(mainArtist)
  }

  return Array.from(artistSet).sort()
}
