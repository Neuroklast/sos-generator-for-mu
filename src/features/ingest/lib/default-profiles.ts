/**
 * default-profiles.ts
 *
 * Pre-populated system CsvImportProfiles shipped with the application.
 * These are always available and serve as the initial state for the profile
 * store. They are marked `isSystemDefault: true` so the UI can render them
 * with a lock indicator.
 *
 * IMPORTANT: Do not change the `id` fields — they are used as stable
 * identifiers in parser routing logic (e.g. SYSTEM_BANDCAMP_PROFILE_ID).
 */
import type { CsvImportProfile, FinancialFieldKey } from '@/features/ingest/types'

// ── Stable IDs for system profiles ───────────────────────────────────────────

export const SYSTEM_BANDCAMP_PROFILE_ID = 'system-bandcamp'
export const SYSTEM_BELIEVE_PROFILE_ID = 'system-believe'
export const SYSTEM_SHOPIFY_PROFILE_ID = 'system-shopify'
export const SYSTEM_PRINTFUL_PROFILE_ID = 'system-printful'
export const SYSTEM_LABEL_ARTISTS_PROFILE_ID = 'system-label-artists'

// ── Internal field key → streaming-parser internal field name mapping ─────────

/**
 * Translates a `FinancialFieldKey` (our profile schema) to the snake_case
 * field name used internally by the streaming CSV parser and SalesTransaction.
 *
 * This map is the single source of truth for the key translation. Any new
 * financial field must be added here.
 */
export const FINANCIAL_KEY_TO_INTERNAL: Readonly<Record<FinancialFieldKey, string>> = {
  artistName:    'original_artist',
  releaseTitle:  'release_title',
  trackTitle:    'track_title',
  quantity:      'quantity',
  netRevenue:    'net_revenue',
  currency:      'currency',
  salesMonth:    'sales_month',
  platform:      'platform',
  country:       'country',
  upcEan:        'upc_ean',
  isrc:          'isrc',
  catalogNumber: 'catalog_number',
  releaseType:   'release_type',
  balanceEur:    'balance_eur',
}

// ── System default profiles ───────────────────────────────────────────────────

const BANDCAMP_STANDARD: CsvImportProfile = {
  id: SYSTEM_BANDCAMP_PROFILE_ID,
  name: 'Bandcamp Standard',
  type: 'financial',
  delimiter: ',',
  autoDetectHeaders: ['date', 'paid to', 'item type', 'item name', 'artist'],
  columnMapping: {
    salesMonth:    'date',
    artistName:    'artist',
    releaseTitle:  'item name',
    netRevenue:    'net amount',
    releaseType:   'item type',
    catalogNumber: 'catalog number',
    balanceEur:    'balance of revenue share (EUR)',
    currency:      'currency',
    country:       'country',
  },
  isSystemDefault: true,
}

const BELIEVE_DIGITAL: CsvImportProfile = {
  id: SYSTEM_BELIEVE_PROFILE_ID,
  name: 'Believe Digital',
  type: 'financial',
  delimiter: ';',
  autoDetectHeaders: ['Sales Month', 'Platform', 'Country/Region', 'Label Name', 'Artist Name'],
  columnMapping: {
    salesMonth:    'Sales Month',
    platform:      'Platform',
    country:       'Country/Region',
    artistName:    'Artist Name',
    releaseTitle:  'Release title',
    trackTitle:    'Track title',
    isrc:          'ISRC',
    upcEan:        'UPC/EAN',
    catalogNumber: 'Release Catalog nb',
    netRevenue:    'Net Revenue',
    currency:      'Currency',
    releaseType:   'Release Type',
    quantity:      'Quantity',
  },
  isSystemDefault: true,
}

const SHOPIFY_ORDERS: CsvImportProfile = {
  id: SYSTEM_SHOPIFY_PROFILE_ID,
  name: 'Shopify Orders',
  type: 'financial',
  delimiter: ',',
  autoDetectHeaders: ['Name', 'Email', 'Financial Status', 'Paid at', 'Fulfillment Status'],
  columnMapping: {
    salesMonth:   'Paid at',
    netRevenue:   'Total',
    currency:     'Currency',
    releaseTitle: 'Lineitem name',
    quantity:     'Lineitem quantity',
  },
  isSystemDefault: true,
}

const PRINTFUL_COSTS: CsvImportProfile = {
  id: SYSTEM_PRINTFUL_PROFILE_ID,
  name: 'Printful Costs',
  type: 'financial',
  delimiter: ',',
  autoDetectHeaders: ['Order', 'Status', 'Total', 'Date', 'Address'],
  columnMapping: {
    salesMonth:   'Date',
    netRevenue:   'Total',
    releaseTitle: 'Order',
    releaseType:  'Status',
  },
  isSystemDefault: true,
}

const LABEL_ARTISTS_MASTER_DATA: CsvImportProfile = {
  id: SYSTEM_LABEL_ARTISTS_PROFILE_ID,
  name: 'Label Artists (Stammdaten)',
  type: 'master-data',
  delimiter: ',',
  autoDetectHeaders: ['name', 'email', 'vatNumber', 'isEuNonGerman', 'notes'],
  columnMapping: {
    name:          'name',
    email:         'email',
    vatNumber:     'vatNumber',
    isEuNonGerman: 'isEuNonGerman',
    notes:         'notes',
    accountHolder: 'accountHolder',
    iban:          'iban',
    bic:           'bic',
  },
  isSystemDefault: true,
}

/** All five system default profiles in priority order for auto-detection. */
export const DEFAULT_CSV_PROFILES: CsvImportProfile[] = [
  BELIEVE_DIGITAL,
  BANDCAMP_STANDARD,
  SHOPIFY_ORDERS,
  PRINTFUL_COSTS,
  LABEL_ARTISTS_MASTER_DATA,
]
