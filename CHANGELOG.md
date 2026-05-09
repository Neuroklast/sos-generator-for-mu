# Changelog

All notable changes to this project are documented in this file.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [Unreleased]

### Added
- **`agents.md`** — Mandatory end-of-session protocol for AI agents. Documents the documentation steps (CHANGELOG, USER_MANUAL, BENUTZERHANDBUCH, README, LICENSE, ARCHITECTURE) that MUST be completed at the end of every agent session involving a behaviour or feature change.
- **Artist Roster CSV Import** documented in `docs/USER_MANUAL.md` and `docs/BENUTZERHANDBUCH.md` (§5 File Upload / §5 Datei-Upload): uploading a CSV with a `name` column plus at least one companion field auto-imports artist master data directly from the Ingest view.

### Changed
- **LICENSE** — Copyright corrected from "GitHub, Inc." to "Neuroklast (c) 2024–2026".
- **README.md** — Added *Artist Roster CSV Import* to the Features list; updated the License section with correct copyright and a link to the LICENSE file.
- **docs/USER_MANUAL.md** — §5 adds the Artist Roster CSV Import subsection; §7 documents the two-tab layout (*Stammdaten* / *Abrechnungsregeln*); §6.1 documents the "Select all artists" checkbox in SplitFeeManager; §11 adds the *Negative Payouts* note (red bold display, SEPA exclusion).
- **docs/BENUTZERHANDBUCH.md** — Same sections updated in German.

### Fixed

### Fixed
- **Featured tracks now appear in release dropdown** when a featuring artist is selected as an owner in Track Revenue Assignments. The CSV Processor Worker now computes a `releaseTitlesByArtistIncFeaturing` map that includes releases where the artist appears as a featured artist (parsed via `extractFeaturedArtistsDetailed`). In `App.tsx` this is merged with the roster-based map into `releaseTitlesByArtistFull`, which is passed to both `TrackRevenueAssignmentManager` and `IgnoredEntriesManager`.
- **Track title no longer cleared** when selecting an owner artist after having already chosen a release title in Track Revenue Assignments. The `handleOwnerArtistChange` callback no longer calls `setTrackTitle('')` — the user-first-title workflow makes this automatic clear unnecessary.

### Added
- **Auto-pre-fill owners from selected release** in Track Revenue Assignments: selecting a known release title in the form pre-populates the owner rows with the known participating artists (primary + all featured) at equal percentage splits, which the user can then adjust before saving.
- **Track Revenue Assignments and Ignored Entries moved to Process Cockpit** — both panels are now accessible directly in the Cockpit view (after the Recoupable Expenses card) alongside Artist Mappings, Compilation Filters, and other pipeline rules, instead of being buried in Settings → Export & Rules.

- **Multi-artist release revenue split**: `TrackRevenueAssignment` now supports an `owners` array, allowing release revenue to be distributed proportionally among multiple co-owner artists before the label split and expenses are applied. Existing single-owner assignments continue to work unchanged (backward-compatible).
- **Historical monthly exchange rates for accurate EUR conversion.**
  The Vercel Edge Function (`api/exchange-rates.ts`) now accepts optional `start`
  and `end` query parameters (format `YYYY-MM`). When provided, it fetches the
  full daily time series from the Frankfurter API (backed by ECB reference rates)
  and aggregates the trading-day rates into **monthly averages** — the standard
  accounting method for retrospective royalty statements. Historical data is
  cached at the CDN edge for 24 hours (unchanged historical data never needs
  re-fetching).

  Once the billing period is detected from the uploaded CSV files, the application
  automatically fetches the corresponding historical rates. Each Bandcamp
  transaction is then converted to EUR using the ECB monthly average rate for the
  month in which the sale occurred, rather than a single current rate. Non-Bandcamp
  sources (Believe, Shopify, Darkmerch) already report in EUR and are unaffected.
  Flat FALLBACK_RATES are used for any month the API cannot supply (e.g. offline
  or partially completed month), ensuring processing always completes.

### Changed
- **Route-level code splitting for all nine views.**
  All view components (`DashboardView`, `IngestView`, `ProcessCockpitView`,
  `AnalyticsView`, `ArtistsView`, `ReportsView`, `SettingsView`, `HistoryView`,
  `BrandingView`) are now loaded lazily via `React.lazy()`. Heavy dependencies
  such as `recharts`, `jspdf`/`html2canvas`, and `jszip` are only downloaded when
  the user first navigates to the relevant view, not on initial page load.
  A skeleton `ViewLoadingFallback` is shown inside the Suspense boundary during
  the one-time load. All type-only imports from view modules remain static (they
  are erased at compile time by TypeScript and carry no runtime cost).
  Note: a generic `createLazyView` helper was considered but rejected — it cannot
  preserve per-component prop types under strict TypeScript without using `any`.

- **`useDeferredValue` for the Finance Master Table search.**
  The `masterTableRevenues` memo now depends on a deferred copy of the `masterSearch`
  string. React schedules the expensive filter+sort pass as low-priority work, keeping
  the search input responsive at 60 fps regardless of dataset size. The displayed
  search term (`masterSearch`) is still updated immediately on every keystroke.

### Added
- **Searchable combobox dropdowns for Track Revenue Assignments and Ignored Entries.**
  Both the *Track Revenue Assignments* and *Ignored Entries* panels in Settings →
  Export & Rules now use full-text searchable combobox dropdowns (Popover + Command)
  instead of plain text inputs with `<datalist>` suggestions.
  - **Track Revenue Assignments**: selecting the owner artist first restricts the
    release-title dropdown to only the releases associated with that artist
    (including collabs and features); when no artist is selected all known releases
    are shown.
  - **Ignored Entries**: same artist-first filter for the release dropdown;
    switching the artist clears the previously selected release to avoid stale cross-
    artist values.
  - Shared `SearchableCombobox` UI component (`src/components/ui/combobox.tsx`)
    extracted for DRY reuse across both managers.
  - New i18n keys added for placeholder / empty-state text in both EN and DE locales.

- **Track Revenue Assignments** — new rule type in Settings → Export & Rules.
  Allows routing all revenue from a specific track or release exclusively to one
  designated owner artist. Any transaction whose `release_title` or `track_title`
  contains the configured substring (case-insensitive) is re-attributed to the
  owner artist before the roster filter runs. The track therefore appears only in
  the owner's statement (and PDF) and is invisible in every other artist's report.
  Rules are persisted via IndexedDB, included in workspace backup/restore, and
  support undo. The track-title input offers a dropdown of all known releases
  (populated from processed data) as well as free-form text entry.

### Fixed
- **Bandcamp: revenue now correctly uses the "net amount" column.**
  Previously the parser used the "balance of revenue share (EUR)" column which
  is the collection-society running balance, not the per-transaction revenue.
  The correct column is "net amount" (the label's net payout per sale).  This
  bug caused significantly under-reported Bandcamp revenue (e.g. 0.15 € instead
  of 1.06 €).

### Changed
- **Bandcamp physical vs. digital detection now driven by the "package" column.**
  Previously the parser used `item type = "package"` (a Bandcamp internal
  category) to flag physical products.  Detection is now based on the "package"
  column: if the value contains the word "digital" (e.g. "digital download",
  "digital bundle") the transaction is a digital download; any other value (e.g.
  "Limited Digipac CD", "BLACKBOOK Confession T-Shirt", "Jewelcase 2CDs") is
  treated as a physical product and counted in the physical-split bucket — the
  same way physical Believe transactions are handled.
  A new semantic-dictionary entry (`bandcamp_package`) and `FinancialFieldKey`
  (`bandcampPackage`) are introduced to map this column through the profile system.

- **Bandcamp digital sales now classified as downloads in the platform breakdown.**
  Previously, non-physical Bandcamp transactions received no `is_download` flag, causing
  them to appear as unclassified in the "Revenue by Platform" table (Downloads column showed 0).
  Bandcamp is a purchase/download platform, so all non-physical transactions (albums, tracks)
  are now marked `is_download = true` by default. Physical items (`package`, CD, vinyl, etc.)
  are unaffected. Explicitly stream-typed rows (`release_type` contains "stream") remain
  classified as streams.
- **Deductible expenses listed individually in PDF statements.**
  The waterfall table previously showed a single aggregated "– Deductible Costs / Advances" line.
  Each expense entry (with its description and date) is now shown as its own row, matching the
  per-item breakdown already provided for manual revenue entries.
- **Negative final payout now rendered in red bold in PDF statements.**
  When expenses or advances exceed the artist share, the resulting negative payout is displayed
  as a red bold amount (e.g. "- 3.210,49 €") instead of being clamped to 0 €. SEPA batch
  export continues to exclude artists with a zero or negative payout.
- **`finalPayout` no longer clamped to zero.**
  Previously `Math.max(0, …)` was applied to the computed net payout in the data processor,
  silently hiding an unrecouped balance. The raw signed value is now returned so the UI and
  PDF correctly reflect outstanding advances.

- **`defaultSplitPercentagePhysical` / `defaultSplitPercentageDigital` (global type defaults) now
  correctly override per-artist base rates in the main split chain.**
  Previously, when `useSplitFeeSync` auto-created a per-artist `SplitFee` entry with `percentage = 50`
  (the default base), that auto-assigned base silently overrode the label-wide type defaults
  (e.g. `defaultSplitPercentagePhysical = 15 %`). The PDF would display "× Physical Split (50%)"
  instead of the configured 15 %, because `splitFee.percentage` ranked above `defaultTypeOverride`
  in `resolveSplitPercentage`.

  The priority chain in `resolveSplitPercentage` is now:
  1. Per-artist type override (`physicalPercentage` / `digitalPercentage`) — highest
  2. **Label-wide type default (`defaultSplitPercentagePhysical` / `defaultSplitPercentageDigital`)**
  3. Per-artist base (`percentage`)
  4. Label-wide base default (`defaultSplitPercentage`) — lowest

  Only an explicit per-artist `physicalPercentage` / `digitalPercentage` can override a configured
  label-wide type policy. An auto-assigned or manually set artist base rate no longer suppresses it.


  Previously, `sourceSplits.darkmerch`, `sourceSplits.physical`, `sourceSplits.believe`, and
  `sourceSplits.bandcamp` were mixed into the per-artist main chain, allowing per-artist base
  percentages (auto-created by `useSplitFeeSync`) to silently override label-wide bucket
  policies (e.g. Darkmerch 100 %, Physical 15 %). The PDF would always show the per-artist
  base rate instead of the configured bucket rate.

  The split engine now runs two completely independent systems:
  - **Main chain** (digital + physical, when no bucket split is set):
    `globalBase → globalDigital/Physical → perArtistBase → perArtistType → perRelease`
  - **Bucket splits** (parallel, when `sourceSplits.{bucket}` is explicitly set): bypasses the
    main chain; the only override is an explicit per-artist source override for that source.

  Bucket splits are **conditional**: they activate only when the value is explicitly configured.
  When not set, the bucket falls through to the normal main chain as before.

### Fixed
- **PDF page number shows wrong total on pages 1 … N−1.**
  `drawPageFooter` was calling `doc.internal.getNumberOfPages()` inside the
  per-page `didDrawPage` callback, which only knows the number of pages created
  *so far* — not the final total. Switched to jsPDF's two-pass
  `putTotalPages('{total_pages}')` pattern: a placeholder string is written
  during each page draw and replaced with the correct final page count in a
  single `doc.putTotalPages()` call after all content has been generated.
- **Bold font bleeding into PDF footer text ("Page X of Y" rendered bold).**
  `drawPageFooter` now explicitly resets the font to `helvetica/normal` at the
  start of each invocation, preventing font state set by section headings or
  autoTable internals from carrying over.
- **Orphaned section headings at page bottoms (intelligent page-break).**
  Increased `MIN_SPACE_FOR_SECTION_HEADING_MM` from 30 mm to 60 mm.
  The threshold now accounts for the heading line (≈5 mm) plus the autoTable
  column-header row (≈8 mm) plus at least two data rows (≈12 mm) and a safety
  buffer, so section headings ("Revenue by Release", etc.) are never stranded
  at the bottom of a page without any accompanying table rows.

### Changed
- **`ArtistsView` rebuilt with shadcn/ui Tabs.**
  Two tabs replace the former flat layout:
  - *Stammdaten* — `ArtistTreeView` + `LabelArtistManager` (artist roster
    including CSV import, email, VAT number, notes).
  - *Abrechnungsregeln* — `SplitFeeManager` + `ArtistMappingManager`
    (split percentages, alias/group mappings).
  All existing Tailwind classes and spacings are preserved.
- **`SplitFeeManager` gains a "Select all artists" checkbox.**
  A single checkbox above the artist list selects or deselects the entire list
  in one immutable batch `Set` creation, avoiding per-item re-renders and
  keeping the main thread free during large rosters.
- **`UniversalFileUploadZone` now detects artist roster CSVs.**
  A header type-guard checks whether the first column is `name` and at least
  one companion field (`email`, `vatNumber`, `isEuNonGerman`, or `notes`) is
  present. Files matching this pattern are parsed and routed to the new
  `onImportLabelArtistsCSV` callback instead of opening the generic mapping
  dialog. Files that do not match any known format still fall through to the
  mapping dialog as before.
- **`IngestView` wires artist CSV upload into the existing drop zone.**
  Accepts the new `onImportLabelArtistsCSV` prop and forwards it to
  `UniversalFileUploadZone` so artist master data can be imported in the
  Ingest step alongside revenue data, without leaving the view.
- **`App.tsx` passes new props to `ArtistsView` and `IngestView`.**
  `handleImportLabelArtistsCSV`, `handleAddLabelArtist`, `handleRemoveLabelArtist`,
  `handleUpdateLabelArtist`, `handleBulkUpdateSplitFee`, and `stableSplitFees`
  are now forwarded to `ArtistsView`; `handleImportLabelArtistsCSV` is
  forwarded to `IngestView`. All data remains in IndexedDB-backed state
  (`useKV`) and is unaffected by tab navigation.

### Fixed
- Build failure on Vercel caused by `neuroLogo.png` stored at the wrong nested path
  (`src/assets/src/assets/neuroLogo.png` → `src/assets/neuroLogo.png`).
  The import in `src/config/softwareBranding.ts` expected `@/assets/neuroLogo.png`.

### Changed
- **App.tsx refactored from 2228 to 1016 lines (−55 %).**
  All nine page views (Dashboard, Ingest, ProcessCockpit, Analytics, Artists,
  Reports, Settings, History, Branding) are now rendered via the existing
  `src/components/views/*` components instead of inline JSX blocks.
- Inline duplicate component definitions removed from `App.tsx`:
  `StatCard`, `DetectedPeriodBanner`, `ShopifyUploadCard`.
  These already existed as standalone files in `src/components/`.
- Inline formatting helpers removed from `App.tsx`:
  `fmtEur`, `fmtPct`, `totalDeductions`.
  These already existed in `src/lib/formatters.ts` — App.tsx was a silent
  source of divergence.

### Added
- `src/components/nav/NavItems.tsx` — extracted `SideNavItem`, `StepNavItem`,
  and `MobileNavItem` nav sub-components from App.tsx into a dedicated module
  with strict TypeScript interfaces.
