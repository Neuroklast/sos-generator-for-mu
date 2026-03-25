/**
 * types/index.ts — Domain types for the CSV Profile Engine.
 *
 * A CsvImportProfile maps CSV column names from a specific distributor or
 * data source to the application's internal canonical field keys.
 * Profiles drive both auto-detection (via header fingerprinting) and column
 * mapping so the rest of the pipeline can stay source-agnostic.
 */

/**
 * Determines how parsed rows are routed after ingestion.
 *  - 'financial'   → rows go to the transaction / revenue store.
 *  - 'master-data' → rows go to the label-artist roster store.
 */
export type ProfileType = 'financial' | 'master-data'

/** Field delimiter character used in the CSV file. */
export type ProfileDelimiter = ',' | ';'

/**
 * Canonical internal field keys for financial (revenue/transaction) CSVs.
 * These map one-to-one to the fields on SalesTransaction used by the
 * streaming CSV parser.
 */
export type FinancialFieldKey =
  | 'artistName'
  | 'releaseTitle'
  | 'trackTitle'
  | 'quantity'
  | 'netRevenue'
  | 'currency'
  | 'salesMonth'
  | 'platform'
  | 'country'
  | 'upcEan'
  | 'isrc'
  | 'catalogNumber'
  | 'releaseType'
  | 'balanceEur'

/**
 * Canonical internal field keys for master-data (artist roster) CSVs.
 * These map to the fields on LabelArtist.
 */
export type MasterDataFieldKey =
  | 'name'
  | 'email'
  | 'vatNumber'
  | 'isEuNonGerman'
  | 'notes'
  | 'accountHolder'
  | 'iban'
  | 'bic'

/**
 * A CSV Import Profile describes how a specific CSV format (e.g. from
 * Bandcamp, Believe, Shopify, or a user-defined source) is auto-detected
 * and how its columns are translated into the app's internal data model.
 *
 * @example
 * ```ts
 * const believeProfile: CsvImportProfile = {
 *   id: 'system-believe',
 *   name: 'Believe Digital',
 *   type: 'financial',
 *   delimiter: ';',
 *   autoDetectHeaders: ['Sales Month', 'Platform', 'Artist Name'],
 *   columnMapping: {
 *     salesMonth: 'Sales Month',
 *     artistName: 'Artist Name',
 *     netRevenue: 'Net Revenue',
 *   },
 *   isSystemDefault: true,
 * }
 * ```
 */
export interface CsvImportProfile {
  /** Unique identifier — UUID for user profiles, fixed string for system defaults. */
  id: string

  /** Human-readable display name shown in the UI. */
  name: string

  /**
   * Controls data routing after parsing:
   *  - 'financial'   → revenue / transaction store (SalesTransaction[])
   *  - 'master-data' → artist roster store (LabelArtist[])
   */
  type: ProfileType

  /** Delimiter character used in the CSV. Auto-detected profiles may confirm this. */
  delimiter: ProfileDelimiter

  /**
   * Header tokens used to fingerprint this profile during auto-detection.
   * A profile matches when the majority of these strings are found in the
   * CSV's header row (case-insensitive comparison).
   *
   * **Rule of thumb**: include 4–6 columns that are unique to this format
   * and unlikely to appear in other CSV formats.
   */
  autoDetectHeaders: string[]

  /**
   * Maps the app's internal canonical field keys to the exact CSV column
   * header name used by the distributor/source.
   *
   * Financial profiles use FinancialFieldKey keys.
   * Master-data profiles use MasterDataFieldKey keys.
   *
   * Only columns that exist in the CSV need to be mapped; unmapped internal
   * fields will be left empty or fall back to fuzzy matching.
   */
  columnMapping: Partial<Record<FinancialFieldKey | MasterDataFieldKey, string>>

  /**
   * When true this profile was shipped with the app and cannot be deleted.
   * Users may edit it or create a custom profile that overrides it.
   */
  isSystemDefault?: boolean
}
