# Changelog

All notable changes to this project are documented in this file.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [Unreleased]

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
