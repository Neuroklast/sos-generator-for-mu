# Architecture Decision Records

This file documents significant architectural decisions made in this project,
following the ADR (Architecture Decision Record) pattern:
**Context → Decision → Consequences**.

---

## ADR-001 · God-Component Decomposition (App.tsx)

**Date:** 2026-03-25

### Context

`App.tsx` grew to 2228 lines and became a God Component, violating the
Single Responsibility Principle (ISO/IEC 25010 — Maintainability).
The file mixed:
- Application-level state and orchestration logic (useKV, useCSVProcessor, etc.)
- Presentation layout (header, sidebar, mobile nav)
- Full inline JSX for all nine application views (Dashboard, Ingest, Cockpit,
  Analytics, Artists, Reports, Settings, History, Branding)
- Utility functions and sub-component definitions duplicated from other files

Separate view files (`src/components/views/*.tsx`) already existed as
complete implementations but were not wired into App.tsx.

### Decision

Refactor App.tsx to act as a pure **orchestration layer**:

1. **State & ViewModel layer** — All `useKV`, `useMemo`, `useCallback` blocks
   remain in App.tsx. This is the single source of truth for persisted state
   and derived values.
2. **View layer** — Each route renders its dedicated view component from
   `src/components/views/`. No view-level JSX exists in App.tsx.
3. **Navigation layer** — `SideNavItem`, `StepNavItem`, `MobileNavItem`
   extracted to `src/components/nav/NavItems.tsx`.
4. **Formatters** — `fmtEur`, `fmtPct`, `totalDeductions` removed from
   App.tsx; single canonical source is `src/lib/formatters.ts`.

### Consequences

**Positive:**
- App.tsx reduced from 2228 → 1016 lines.
- Each view is independently testable and clearly bounded.
- No more silent divergence between duplicate formatter definitions.
- Adding a new view requires touching only the view file and a single
  `{activeView === 'x' && <XView ... />}` call-site in App.tsx.

**Negative / Trade-offs:**
- App.tsx still passes a large number of handler props into view components.
  A future improvement would introduce feature-level context providers
  (e.g., `ArtistContext`, `RevenueContext`) to reduce prop-drilling depth.
- The orchestration layer (App.tsx) still exceeds 300 lines because of the
  volume of CRUD handlers. This is acceptable as long as each handler is a
  thin `useCallback` wrapper with no embedded business logic.

---

## ADR-002 · Web Worker for CSV Processing

**Date:** pre-existing decision (documented for completeness)

### Context

Processing large CSV files (Believe, Bandcamp, Shopify) on the main thread
would block the UI and violate Rule 5 of the project quality standards
(React Performance).

### Decision

All CSV parsing and financial aggregation runs inside
`src/workers/csv-processor.worker.ts` (a `Vite`-compiled ES module worker).
The worker communicates via a typed message protocol
(`WorkerRequest` / `WorkerResponse`).

Raw `SalesTransaction[]` arrays are never transferred to the main thread.
Only the serialisable, pre-aggregated `SafeProcessedArtistData` objects
cross the worker boundary.

### Consequences

- Main thread remains responsive during processing.
- `SafeProcessedArtistData` (vs. `ProcessedArtistData`) is a required type
  contract: worker consumers must never assume `transactions[]` is available.
- Worker must be re-instantiated when column alias configuration changes
  (handled by `useCSVProcessor` reset logic).
