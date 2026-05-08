# Changelog

All notable changes to this project are documented in this file.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [Unreleased]

### Changed
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
