/** Raw file record persisted in KV storage. uploadedAt is stored as ISO string. */
export interface UploadedFile {
  id: string
  name: string
  size: number
  type: 'believe' | 'bandcamp'
  /** Raw CSV string — kept in memory only, NOT persisted to IndexedDB. */
  data?: string
  /** ISO 8601 timestamp string (YYYY-MM-DDTHH:mm:ss.sssZ) */
  uploadedAt: string
  /** Number of successfully parsed data rows. */
  rowsParsed?: number
  /** Number of rows skipped due to parse errors. */
  rowsSkipped?: number
  /** Number of unique artists found. */
  uniqueArtistsCount?: number
}

/** Transient per-file processing state (not persisted). */
export type FileStatus = 'idle' | 'uploading' | 'processing' | 'done' | 'error'

export interface FileProcessingState {
  status: FileStatus
  progress: number
  error?: string
}

export interface CompilationFilter {
  id: string
  identifier: string
  type: 'ean' | 'title' | 'catalog'
  label: string
}

export interface ArtistMapping {
  id: string
  featuringName: string
  primaryArtist: string
}

export interface SplitFee {
  artist: string
  percentage: number
}

export interface ManualRevenue {
  id: string
  artist: string
  description: string
  amount: number
}

export interface LabelInfo {
  name: string
  address: string
  logo?: string
}

/** Revenue aggregated by streaming/download platform. */
export interface PlatformRevenue {
  platform: string
  revenue: number
  quantity: number
}

/** Revenue aggregated by territory/country. */
export interface CountryRevenue {
  country: string
  revenue: number
  quantity: number
}

/** Revenue aggregated by calendar month (YYYY-MM). */
export interface MonthlyRevenue {
  month: string
  revenue: number
}

/** Revenue aggregated by release (album / single). */
export interface ReleaseRevenue {
  releaseTitle: string
  upcEan: string
  catalogNumber: string
  revenue: number
  quantity: number
  isPhysical: boolean
}

/** Compilation release that was filtered out, with its accumulated revenue. */
export interface FilteredCompilation {
  releaseTitle: string
  identifier: string
  filterType: 'ean' | 'title' | 'catalog'
  revenue: number
  transactionCount: number
}

export interface ArtistRevenue {
  artist: string
  believeRevenue: number
  bandcampRevenue: number
  manualRevenue: number
  totalRevenue: number
  splitPercentage: number
  finalAmount: number
  totalQuantity: number
  platformBreakdown: PlatformRevenue[]
  countryBreakdown: CountryRevenue[]
  monthlyBreakdown: MonthlyRevenue[]
  releaseBreakdown: ReleaseRevenue[]
}

// ── History ────────────────────────────────────────────────────────────────────

/** One upload event recorded in KV for the history panel. */
export interface HistoryEntry {
  id: string
  /** ISO 8601 timestamp */
  timestamp: string
  filename: string
  source: 'believe' | 'bandcamp'
  sizeBytes: number
  rowsParsed: number
  rowsSkipped: number
  uniqueArtists: number
  /** ISO 8601 timestamp the file was removed, if applicable */
  removedAt?: string
}

// ── CSV column customisation ───────────────────────────────────────────────────

/**
 * User-defined additional synonym for a semantic CSV field.
 * These are merged with the built-in semanticDictionary at parse time.
 */
export interface CSVColumnAlias {
  id: string
  fieldName: string
  synonym: string
}

// ── Dashboard filter / sort state ─────────────────────────────────────────────

export type DashboardSortField =
  | 'artist'
  | 'believeRevenue'
  | 'bandcampRevenue'
  | 'totalRevenue'
  | 'finalAmount'
  | 'totalQuantity'
  | 'splitPercentage'

export type SortDirection = 'asc' | 'desc'

export interface DashboardFilter {
  searchQuery: string
  minRevenue: number
  maxRevenue: number
  sortField: DashboardSortField
  sortDirection: SortDirection
}

// ── Track-level data (for tree view) ──────────────────────────────────────────

export interface TrackData {
  trackTitle: string
  isrc: string
  revenue: number
  quantity: number
  platforms: string[]
}

export interface ReleaseWithTracks {
  releaseTitle: string
  upcEan: string
  catalogNumber: string
  isPhysical: boolean
  revenue: number
  quantity: number
  tracks: TrackData[]
}

export interface ArtistTreeNode {
  artist: string
  totalRevenue: number
  finalPayout: number
  splitPercentage: number
  quantity: number
  releases: ReleaseWithTracks[]
}
