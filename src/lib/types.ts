/** An artist signed to the label roster. */
export interface LabelArtist {
  id: string
  name: string
  /** Contact e-mail address for sending statements. */
  email?: string
  /** VAT identification number (EU artists outside Germany). */
  vatNumber?: string
  /** Free-text notes, special contract terms, or other label-internal remarks. */
  notes?: string
  /** When true, EU reverse-charge rules apply (no German VAT on invoice). */
  isEuNonGerman?: boolean
  /**
   * Per-artist VAT rate as an integer percentage, e.g. 19 for 19 % MwSt.
   * Overrides the global labelInfo.vatRate when set.
   * Set to 0 when the artist is not VAT-liable (e.g. Kleinunternehmer).
   */
  vatRate?: number
  /** Legal account holder name as it appears on the bank account. */
  accountHolder?: string
  /**
   * International Bank Account Number (IBAN) for SEPA credit transfers.
   * Stored without spaces in uppercase, e.g. "DE89370400440532013000".
   */
  iban?: string
  /**
   * Bank Identifier Code (BIC / SWIFT code) for the artist's bank.
   * Optional since SEPA transactions within the EU/EEA no longer require
   * a BIC when both accounts are in SEPA countries (IBAN-only since 2016).
   */
  bic?: string
}

/**
 * A recoupable expense entry that is deducted from an artist's gross revenue
 * before the split percentage is applied.
 */
export interface ExpenseEntry {
  id: string
  /** Artist name this expense is attributed to. */
  artist: string
  /** Short description, e.g. "Musikvideo-Produktion" or "PR-Agentur Q3". */
  description: string
  /** Expense amount in EUR (positive number = deducted from revenue). */
  amount: number
  /** ISO 8601 date string of when the expense was incurred. */
  date: string
}

/**
 * An entry (artist + optional release) that has been explicitly ignored in the
 * statement of sales. Ignored entries are excluded from all revenue calculations.
 */
export interface IgnoredEntry {
  id: string
  /** Artist name as it appears in the processed data. */
  artist: string
  /**
   * Optional release title. When set, only that release is ignored for the artist.
   * When omitted, ALL transactions for the artist are ignored.
   */
  releaseTitle?: string
  /** Human-readable note for why this entry was ignored. */
  note?: string
  /** ISO 8601 timestamp when the entry was created. */
  createdAt: string
}

/** A single Shopify order line item mapped to a sales transaction. */
export interface ShopifySale {
  id: string
  orderId: string
  orderDate: string
  productTitle: string
  sku: string
  quantity: number
  grossRevenue: number
  currency: string
  netRevenue: number
}

/** Raw file record persisted in KV storage. uploadedAt is stored as ISO string. */
export interface UploadedFile {
  id: string
  name: string
  size: number
  type: 'believe' | 'bandcamp' | 'shopify' | 'printful'
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
  /** Legacy logo field (data URL) — used by PDF generation. */
  logo?: string
  /** Base64-encoded logo image used for display and export. Kept in sync with logo. */
  logoBase64?: string
  /** Steuernummer (domestic German tax number, e.g. "123/456/78901"). */
  taxNumber?: string
  /** Umsatzsteuer-Identifikationsnummer (EU VAT ID, e.g. "DE123456789"). */
  taxId?: string
  /** Rechtsform und Geschäftsführer, e.g. "GmbH · Geschäftsführer: Max Mustermann". */
  legalForm?: string
  /** Kontakt-E-Mail-Adresse des Labels. */
  email?: string
  /** Bankverbindung im Freitext, z.B. "IBAN: DE89… · BIC: DEUTDEDB". */
  bankAccount?: string
  /**
   * Structured IBAN for the label's own bank account used as the SEPA debitor
   * account (`<DbtrAcct>`) when generating batch payment XML files.
   * Stored without spaces in uppercase, e.g. "DE89370400440532013000".
   */
  sepaIban?: string
  /**
   * Legal name of the label as registered with its bank — used as `<Dbtr><Nm>`
   * in SEPA XML exports. Must exactly match the bank account holder name.
   */
  sepaAccountHolder?: string
  /** Rechtlicher Hinweistext für die Fußzeile von Abrechnungen. */
  footerText?: string
  /**
   * VAT rate as an integer percentage applied to all artist payouts, e.g. 19 for 19 % MwSt.
   * Set to 0 (or leave undefined) when the label is not VAT-liable.
   */
  vatRate?: number
  /**
   * Prefix used when generating invoice numbers, e.g. "SOS-2025".
   * Each statement gets a unique suffix appended (artist index or name).
   */
  invoiceNumberPrefix?: string
  /**
   * E-mail body template used when sending statement e-mails to artists.
   * Supports the following placeholders: {artist}, {period}, {amount},
   * {label_name}, {label_vat_id}, {invoice_email}, {deadline_date}.
   */
  emailTemplate?: string
}

/**
 * Application-wide defaults that apply to all new statements.
 * Stored separately from LabelInfo to keep concerns clean.
 */
export interface AppDefaults {
  /** Default artist split rate in percent (0–100). Applied when no per-artist rule exists. */
  defaultSplitPercentage: number
  /** Number of days after statement delivery within which an invoice must be received. */
  invoiceDeadlineDays: number
  /** E-mail address to which artists must send their invoice. */
  financeEmail: string
  /** Human-readable deadline date shown in e-mail templates, e.g. "December 20th". */
  invoiceDeadlineDate: string
  /** Organisation name that receives unclaimed royalties, e.g. "animal shelter". */
  royaltyDonationOrg: string
  /**
   * Label distribution fee as a percentage (0–100) deducted from each artist's
   * gross streaming/physical revenue before the individual split is applied.
   * Defaults to 0 (no distribution fee).
   */
  distributionFeePercentage: number
}

/**
 * Configuration for which sections are rendered in exported PDF statements.
 * All flags default to true for backward-compatibility.
 */
export interface PdfExportSettings {
  /** Include the release / album breakdown table. */
  includeReleaseBreakdown: boolean
  /** Include the streaming platform breakdown table. */
  includePlatformBreakdown: boolean
  /** Include the country / territory breakdown table. */
  includeCountryBreakdown: boolean
  /** Include the monthly revenue trend table. */
  includeMonthlyBreakdown: boolean
  /** Prepend the e-mail cover letter (rendered from emailTemplate) as the first page. */
  includeEmailCoverLetter: boolean
}

/**
 * E-mail service configuration.  Passwords are intentionally excluded — they
 * must never be stored in the browser.  The config is used to pre-fill the
 * mailto: link or display SMTP settings for external clients.
 */
export interface EmailConfig {
  /** Display name shown in the From field, e.g. "darkTunes Music Group". */
  fromName: string
  /** Sender address, e.g. "finance@label.com". */
  fromEmail: string
  /** Reply-to address (often the same as fromEmail). */
  replyTo: string
  /** Optional subject template. Placeholders: {artist}, {period}. */
  subjectTemplate: string
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
  /** Total recoupable expenses deducted from gross revenue before split. */
  totalExpenses: number
  /** Distribution fee amount deducted before the artist split was applied. */
  distributionFeeDeducted: number
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
  source: 'believe' | 'bandcamp' | 'shopify' | 'printful'
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
  selectedSources: ('believe' | 'bandcamp' | 'manual' | 'shopify')[]
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
  /** Total recoupable expenses deducted from gross revenue before split. */
  totalExpenses: number
  /** Label distribution fee (EUR) deducted from streaming/physical revenue before split. */
  distributionFeeDeducted: number
  platformBreakdown: PlatformRevenue[]
  countryBreakdown: CountryRevenue[]
  monthlyBreakdown: MonthlyRevenue[]
  releaseBreakdown: ReleaseRevenue[]
}
