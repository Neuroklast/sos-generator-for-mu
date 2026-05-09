# Architecture Decision Records

This file documents significant architectural decisions made in this project,
following the ADR (Architecture Decision Record) pattern:
**Context → Decision → Consequences**.

---

## ADR-006 · Historical Monthly Exchange Rates for EUR Conversion

**Date:** 2026-05-09

### Context

Bandcamp exports revenue in the currency of each sale (USD, GBP, etc.). The
application must convert these amounts to EUR for consistent aggregation and
artist payout calculations. Previously, a single *current* exchange rate was
fetched from the Frankfurter API on page load and applied uniformly to every
transaction regardless of when it occurred.

For retrospective royalty statements covering months or an entire year, using
a current rate introduces systematic error: if the EUR/USD rate changed
significantly over the period, every month's revenue is mispriced by the same
factor. Standard accounting practice mandates using the ECB reference rate for
the month in which a transaction actually occurred.

### Decision

1. **Edge Function (`api/exchange-rates.ts`)**: Extended to accept optional
   `start` and `end` query parameters (format `YYYY-MM`). When both are
   provided, the function fetches the full daily time series from the
   Frankfurter time-series endpoint (`start_date..end_date?from=EUR`),
   aggregates all trading-day rates within each calendar month to their
   arithmetic mean, and returns a `{ base, rates: { "YYYY-MM": { ... } } }`
   object. Historical data is cached at the CDN edge for 24 hours. The
   no-parameter path retains the original `/latest` behaviour unchanged.

2. **`currency.ts`**: A new `HistoricalRates = Record<string, ExchangeRates>`
   type and a new exported function `fetchHistoricalExchangeRates(start, end)`
   were added alongside the existing `fetchExchangeRates()` function. A private
   `buildFallbackHistoricalRates` helper fills any month the API does not return
   (e.g. incomplete current month) with the static `FALLBACK_RATES`, ensuring
   callers always receive a complete map.

3. **`DataProcessorConfig` / `WorkerProcessConfig`**: A new optional field
   `historicalExchangeRates?: HistoricalRates` was added to both config shapes.
   The data processor prefers `historicalExchangeRates[t.sales_month]` over the
   flat `exchangeRates` fallback when converting Bandcamp transactions.

4. **`useCSVProcessor`**: A new effect watches `workerResult.periodStart` and
   `workerResult.periodEnd`. When the worker finishes processing and a valid
   billing period is detected, the hook automatically fetches historical rates
   for that period and triggers a lightweight re-process. The manual
   "Refresh exchange rates" action refreshes both flat and historical rates in
   parallel.

### Consequences

**Positive:**
- Each Bandcamp transaction is converted at the official ECB monthly average
  rate for its own sales month — the standard method for retrospective royalty
  accounting.
- A single Frankfurter API call covers the whole billing period (one request
  for up to 12 months), rather than one request per month.
- Historical data is edge-cached for 24 hours, keeping upstream request volume
  negligible.
- The existing flat-rate path is fully preserved as a fallback and for scenarios
  where no period is detected (e.g. only manual revenues).

**Negative / Trade-offs:**
- An extra re-processing pass occurs after historical rates are fetched (~500 ms
  worker round-trip for typical datasets). This is a one-time cost after file
  upload and is invisible to the user behind the existing loading indicators.
- If the billing period spans many years the Frankfurter time-series response
  can be large. The 15-second timeout and edge-cache mitigate this.

---

## ADR-005 · Route-Level Code Splitting (React.lazy + Suspense)

**Date:** 2026-05-09

### Context

All nine application views were statically imported at the top of `App.tsx`.
Vite therefore included every view — and their heavy transitive dependencies
(`recharts`, `jspdf`, `html2canvas`, `jszip`, `xlsx`) — in the initial JavaScript
bundle. This increased Time to Interactive because the browser had to download and
parse code for views the user had not yet visited.

### Decision

Convert every view import to a `React.lazy()` factory that resolves to the named
export via `.then(m => ({ default: m.ViewName }))`. A `<Suspense>` boundary with
a skeleton fallback (`ViewLoadingFallback`) is placed inside the `<motion.div>`
animation wrapper so:
1. The page-transition animation fires immediately on navigation.
2. The skeleton is shown inside the animated container during the one-time chunk
   fetch (subsequent visits use the cached chunk — no skeleton reappears).

Type-only imports from lazy modules (`MasterSortField`, `MasterSortDir`) are kept
as static `import type` statements; TypeScript erases these at compile time so they
carry no runtime cost and do not create a synchronous chunk dependency.

### Consequences

**Positive:**
- `AnalyticsView` (≈439 kB, includes `recharts`) is deferred until first visit.
- `IngestView` (≈128 kB) and `SettingsView` (≈99 kB) similarly deferred.
- Vite emits a separate named chunk per view, visible in the build output.
- No changes to existing view component APIs or test files.

**Negative / Trade-offs:**
- First navigation to a not-yet-cached view incurs a ~100–500 ms network round
  trip to fetch the chunk (mitigated by the skeleton fallback).
- The main bundle (`index-*.js`) still contains all shared UI primitives, hooks,
  and utilities; further splitting would require manual `rollupOptions.manualChunks`
  configuration.

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
- **Physical bucket exception:** an explicit per-artist `physicalPercentage` (configured in Split Fees) overrides an active Physical bucket split. This allows a label-wide physical default to be set in General Settings while still honouring artist-specific physical deals. The priority for the physical bucket is: (1) per-artist shopify/printful source override, (2) per-artist `physicalPercentage`, (3) `sourceSplits.physical` bucket split, (4) main chain fallback.
- For all other buckets (darkmerch, believe, bandcamp), the **only override** for an active bucket split is an explicit per-artist `sourceOverride` for that specific source. Per-artist base and type percentages do not apply.
- Implementation: computed inline per bucket before the payout formula, not routed through `resolveSplitPercentageWithSourceOverride`.

### Consequences

**Positive:**
- Label-wide policies ("Darkmerch 100 % to artist", "Physical 15 %") always apply regardless of per-artist general split entries.
- `useSplitFeeSync` can auto-create per-artist entries without silently overriding bucket policies.
- The two systems are independently understandable and testable.
- Per-artist source overrides remain the correct escape hatch for individual exceptions to a bucket policy.
- For the physical bucket specifically, a per-artist `physicalPercentage` also overrides the bucket split, giving per-artist physical deals full priority over the label-wide physical rate.

**Negative / Trade-offs:**
- `sourceSplits.believe` and `sourceSplits.bandcamp` currently apply to the aggregated digital bucket as a whole. If different rates per digital source are needed, the digital bucket computation must be split per source (future work).
- Bucket split activation is binary (set / not set). There is no intermediate priority level between "global bucket" and "per-artist source override" for bucket-based revenue — except for the physical bucket where `physicalPercentage` provides such an intermediate level.

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

---

## ADR-004 · resolveSplitPercentage Priority: Label Type Default Above Per-Artist Base

**Date:** 2026-05-08

### Context

`defaultSplitPercentagePhysical` and `defaultSplitPercentageDigital` are explicit label-wide
policies intended to set a single split rate for all physical (or digital) revenue across every
artist. However, `useSplitFeeSync` auto-creates a per-artist `SplitFee` entry for every newly
discovered artist using `percentage = defaultSplitPercentage` (the base). The old priority chain
in `resolveSplitPercentage` placed `splitFee.percentage` (per-artist base, step 2) above
`defaultTypeOverride` (label-wide type default, step 3). As a result, the auto-created base rate
of 50 % silently overrode a configured `defaultSplitPercentagePhysical` of 15 %, causing the PDF
to display "× Physical Split (50 %)" instead of 15 %.

### Decision

Reorder the fallback chain in `resolveSplitPercentage` so that the label-wide type default
(`defaultTypeOverride`) ranks **above** the per-artist base percentage (`splitFee.percentage`):

1. Per-artist type override (`physicalPercentage` / `digitalPercentage`) — highest priority
2. **Label-wide type default** (`defaultSplitPercentagePhysical` / `defaultSplitPercentageDigital`)
3. Per-artist base (`percentage`)
4. Label-wide base default (`defaultSplitPercentage`) — lowest priority

Only an explicit per-artist `physicalPercentage` / `digitalPercentage` can override a configured
label-wide type policy.

### Consequences

- `defaultSplitPercentagePhysical = 15 %` now correctly applies to ALL artists (including those
  with an auto-assigned or manually set base rate) unless they have an explicit `physicalPercentage`.
- Artists with a manually configured base percentage that ALSO want a different physical rate
  must set `physicalPercentage` explicitly — the base alone no longer overrides the label policy.
- The bucket split system (`sourceSplits.*`) is unaffected; it is a completely independent path.
- Five new regression tests added to `data-processor.test.ts` covering the exact bug scenario and
  the cases where explicit per-artist type overrides still win.

---

## ADR-005 · Bandcamp Physical/Digital Detection: "package" Column as Primary Signal

**Date:** 2026-05-08

### Context

Bandcamp CSVs include two columns relevant to product classification:
- `item type` — Bandcamp's internal category (`album`, `track`, `package`, `payout`, …)
- `package` — the product title the customer purchased (e.g. `digital download`,
  `digital bundle`, `Limited Digipac CD`, `BLACKBOOK Confession T-Shirt`)

The previous implementation used `item type === "package"` to flag physical products.
This was brittle because it relied on a Bandcamp-internal category name rather than the
explicit product description.

Additionally, the previous code preferred the "balance of revenue share (EUR)" column
for Bandcamp revenue.  That column is the collection-society running balance (per-session
total), NOT the per-transaction net revenue received by the label.  The correct column is
"net amount".

### Decision

1. **Physical/digital detection** is now driven exclusively by the `package` column:
   - Contains the word "digital" (case-insensitive) → digital download (`is_physical = false`)
   - Any other non-empty value → physical product (`is_physical = true`, physical-split bucket)
   - Empty package column → fallback to old `release_type` keyword matching for compatibility
     with non-standard or custom CSV formats

2. **Revenue column** for Bandcamp is now explicitly `net amount` (`mappedData.net_revenue`).
   The `balance_eur` field is retained in the semantic dictionary and `FinancialFieldKey` for
   backward compatibility with user-defined profiles, but it is no longer used for revenue.

3. A new semantic-dictionary field `bandcamp_package` (synonym: `"package"`) and a new
   `FinancialFieldKey` `bandcampPackage` are introduced.  The `BANDCAMP_STANDARD` system
   profile maps `bandcampPackage → 'package'`.

### Consequences

- Physical Bandcamp items (CDs, vinyl, T-shirts, bundles) are now correctly counted in the
  physical-split bucket (same as physical Believe transactions) instead of being treated as
  digital revenue.
- Bandcamp revenue figures are now accurate: the label's actual net payout per sale is used
  rather than the collection-society running balance.
- The `balance of revenue share (EUR)` column is no longer mapped in the `BANDCAMP_STANDARD`
  profile; existing user-defined profiles that mapped `balanceEur` are unaffected (the field
  remains valid but has no effect on financial calculations).
