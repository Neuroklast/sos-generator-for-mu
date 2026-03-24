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
  /** Set to true when this mapping was created by the Jaro-Winkler auto-resolver. */
  autoMapped?: boolean
  /** Jaro-Winkler similarity score (0–1) for auto-mapped entries. */
  mappingScore?: number
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
  /** Steuernummer or USt-IdNr. of the label (mandatory for EU-compliant invoices). */
  taxNumber?: string
  /**
   * VAT rate as an integer percentage, e.g. 19 for 19 % MwSt.
   * Set to 0 (or leave undefined) when the artist is not VAT-liable.
   */
  vatRate?: number
  /**
   * Prefix used when generating invoice numbers, e.g. "SOS-2025".
   * Each statement gets a unique suffix appended (artist index or name).
   */
  invoiceNumberPrefix?: string
}

/** Contractual payout share assigned to a guest / featured artist. */
export interface GuestPayoutRule {
  primaryArtist: string
  guestName: string
  /** Percentage of the collab-track revenue that the guest receives (0–100). */
  percentage: number
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

// ── Grouping / filtering ───────────────────────────────────────────────────────

export type GroupByField = 'artist' | 'album' | 'song' | 'platform' | 'country' | 'month'

export interface GroupNode {
  key: string
  label: string
  revenue: number
  quantity: number
  transactionCount: number
  children?: GroupNode[]
}

export interface FilterState {
  searchQuery: string
  selectedPlatforms: string[]
  selectedCountries: string[]
  selectedSources: ('believe' | 'bandcamp' | 'manual')[]
  minRevenue: number
  maxRevenue: number
  dateFrom: string
  dateTo: string
}

export interface ArtistCollabNode {
  primaryArtist: string
  revenue: number
  quantity: number
  collabEntries: Array<{
    name: string
    revenue: number
    quantity: number
  }>
}

/**
 * Worker-safe version of ProcessedArtistData.
 *
 * Raw `SalesTransaction[]` rows are intentionally omitted so they can be
 * discarded inside the Web Worker after aggregation.  The two revenue split
 * fields (believeRevenue / bandcampRevenue) are pre-computed by the worker
 * before the transaction array is dropped.
 *
 * All other fields are fully serialisable and can be safely transferred via
 * postMessage without triggering memory issues on the main thread.
 */
export interface SafeProcessedArtistData {
  artist: string
  /** Revenue from Believe-sourced rows (pre-computed in worker). */
  believeRevenue: number
  /** Revenue from Bandcamp-sourced rows (pre-computed in worker). */
  bandcampRevenue: number
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
