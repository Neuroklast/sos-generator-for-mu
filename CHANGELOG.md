# Changelog

All notable changes to this project are documented in this file.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [Unreleased]

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
