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

## ADR-003 · Split Rate Resolution: Two Independent Systems

**Date:** 2026-05-08

### Context

The split fee engine must handle four overlapping configuration dimensions:
1. Label-wide defaults (global base, global type-specific digital/physical)
2. Per-artist configuration (base %, type-specific %, source-specific overrides)
3. Per-release overrides
4. Bucket-specific label policies (e.g. "artists keep 100 % of Darkmerch revenue", "Physical always at 15 %")

The initial implementation mixed all four into a single linear priority chain, which caused
bucket-specific label policies (`sourceSplits`) to be overridden by per-artist base rates
(auto-created by `useSplitFeeSync`). This made it impossible to set a label-wide Darkmerch
or Physical rate that applied regardless of individual artist contracts.

### Decision

Implement two fully independent systems that run in parallel:

**System A — Main Chain** (digital and physical revenue when no bucket split is set):
```
globalBase → globalDigital/Physical → perArtistBase → perArtistType → perRelease
```
Per-artist settings always win over label-wide defaults. Per-release overrides win over everything.

**System B — Bucket Splits** (`sourceSplits` — completely parallel to the main chain):
- Each bucket (`darkmerch`, `physical`, `believe`, `bandcamp`) has an independent fixed rate.
- A bucket split is **only active when explicitly set** (`!= null`). When absent, the bucket falls through to the normal main chain.
- When active, the bucket split **bypasses the main chain entirely**.
- The **only override** for an active bucket split is an explicit per-artist `sourceOverride` for that specific source. Per-artist base and type percentages do not apply.
- Implementation: computed inline per bucket before the payout formula, not routed through `resolveSplitPercentageWithSourceOverride`.

### Consequences

**Positive:**
- Label-wide policies ("Darkmerch 100 % to artist", "Physical 15 %") always apply regardless of per-artist general split entries.
- `useSplitFeeSync` can auto-create per-artist entries without silently overriding bucket policies.
- The two systems are independently understandable and testable.
- Per-artist source overrides remain the correct escape hatch for individual exceptions to a bucket policy.

**Negative / Trade-offs:**
- `sourceSplits.believe` and `sourceSplits.bandcamp` currently apply to the aggregated digital bucket as a whole. If different rates per digital source are needed, the digital bucket computation must be split per source (future work).
- Bucket split activation is binary (set / not set). There is no intermediate priority level between "global bucket" and "per-artist source override" for bucket-based revenue.

---

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
