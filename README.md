# NeuroStat — Statement of Sales Generator

> **Fintech-Grade Royalty Reporting for Indie Labels · Software powered by Neuroklast**

A professional web application for music labels to process royalty reports from Believe, Bandcamp, and Shopify, aggregate revenue per artist, apply split fees and recoupable expenses, and export fully branded PDF/Excel statements — including German VAT compliance (Gutschrift, Reverse Charge).

---

## Screenshot

![NeuroStat Dashboard](https://github.com/user-attachments/assets/0c59bdda-8a31-45cc-8d5a-824ec24dbf49)

---

## 📚 Documentation

| Document | Language | Description |
|----------|----------|-------------|
| [Quick Start Guide](./docs/QUICKSTART_EN.md) | 🇬🇧 English | Up and running in 10 minutes |
| [Schnellstart-Anleitung](./docs/QUICKSTART_DE.md) | 🇩🇪 Deutsch | In 10 Minuten einsatzbereit |
| [User Manual](./docs/USER_MANUAL.md) | 🇬🇧 English | Comprehensive reference for all features |
| [Benutzerhandbuch](./docs/BENUTZERHANDBUCH.md) | 🇩🇪 Deutsch | Ausführliches Handbuch aller Funktionen |
| [Architecture Decisions](./ARCHITECTURE.md) | 🇬🇧 English | ADR records for significant design decisions |
| [Changelog](./CHANGELOG.md) | 🇬🇧 English | Version history |

---

## Features

- **Multi-Source Ingestion** — Upload Believe, Bandcamp, and Shopify CSVs simultaneously. Merge unlimited files (e.g. 2× Believe for a full year).
- **Intelligent CSV Parsing** — Auto-detects delimiters, handles BOM, scientific notation revenue values, and quoted headers. Processed in a Web Worker so the UI stays responsive.
- **Semantic Column Mapping** — Columns are matched by meaning. Add custom synonyms in Settings.
- **Smart Artist Mapping** — Map featuring/alias names to the correct primary artist using Jaro-Winkler auto-suggestions. Persistent across sessions.
- **Compilation Filter** — Exclude compilation revenue by EAN, catalog number, or title.
- **Split Fee Engine** — Define per-artist revenue split percentages (0–100 %).
- **Expense & Advance Recoupment** — Log recoupable costs (studio fees, advances, PR) per artist; deducted before the split is applied.
- **Manual Revenue Entries** — Add Darkmerch sales, sync deals, or any ad-hoc income directly in the UI.
- **Ignored Entries** — Exclude specific artists or individual releases from billing without deleting source data.
- **Bento-Grid Dashboard** — At-a-glance: Total Net Revenue, Active Artists, Top Platform, and files loaded.
- **Analytics** — Platform breakdown, country split, and monthly revenue trend charts (Recharts).
- **Artist Roster** — Maintain label artist records with VAT settings, contact email, and notes.
- **German Tax Compliance** — Auto-generates Gutschrift (§ 14 Abs. 2 UStG) text and EU Reverse Charge notice.
- **Per-Artist VAT Rates** — Override global VAT rate per artist; zero-rate EU non-German artists automatically.
- **Email Cover Letter** — Template-driven cover letter (with `{{ARTIST}}`, `{{AMOUNT}}`, `{{PERIOD}}` placeholders) prepended as first PDF page.
- **PDF Export** — Per-artist branded statements: label logo (right-third header), NeuroStat watermark (bottom-left, 50 % opacity).
- **Excel Export** — Multi-sheet workbook: Summary, Releases, Platforms, Countries, Monthly.
- **Bulk ZIP Export** — Download all artist PDFs + Excel files in one ZIP with progress tracking.
- **Upload History** — Full audit log of every uploaded file (rows parsed, artists detected).
- **Workspace Manager** — Save and restore named billing state snapshots.
- **Persistent Settings** — All settings survive page reloads via IndexedDB. No account or server needed.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + Vite 7 |
| Language | TypeScript (strict mode) |
| UI | Tailwind CSS v4 + shadcn/ui |
| Animations | Framer Motion |
| Charts | Recharts |
| Persistence | IndexedDB via idb-keyval (Vercel KV ready) |
| CSV Parsing | Custom streaming parser + Web Worker |
| PDF Export | jsPDF 4 + jspdf-autotable 5 |
| Excel Export | xlsx (SheetJS) |
| ZIP Export | JSZip |
| Deployment | Vercel (Edge-compatible) |

---

## Getting Started

See the **[Quick Start Guide (EN)](./docs/QUICKSTART_EN.md)** or **[Schnellstart-Anleitung (DE)](./docs/QUICKSTART_DE.md)** for a step-by-step walkthrough.

### Prerequisites

- Node.js 20+
- npm 10+

### Local Development

```bash
git clone https://github.com/Neuroklast/sos-generator-for-mu.git
cd sos-generator-for-mu
npm install
npm run dev
```

The app runs at `http://localhost:5173`.

### Production Build

```bash
npm run build
npm run preview
```

### Deploy to Vercel

```bash
npx vercel --prod
```

No environment variables are required for basic usage. All settings are stored client-side in IndexedDB.

---

## Workflow

```
1. Ingest      → Upload Believe / Bandcamp / Shopify CSVs
2. Settings    → Set split fees, artist mappings, compilation filters
3. Artists     → Log expenses, manual revenues, configure VAT per artist
4. Dashboard   → Review aggregated revenue and KPI tiles
5. Analytics   → Inspect platform, country, and monthly breakdowns
6. Reports     → Download per-artist PDF and Excel statements (or bulk ZIP)
7. Branding    → Label logo + address printed on every exported document
```

---

## Label Branding

Upload your label logo (PNG, JPG, SVG, or WebP — max. 5 MB) and enter your label address in the **Branding** section. The logo is placed in the **right third of the PDF header**, scaled proportionally. A semi-transparent NeuroStat software logo appears on the bottom-left of every page.

---

## CSV Format Reference

### Believe Format

| Column | Required | Notes |
|--------|----------|-------|
| Sales Month | Yes | Format: `MM/YYYY` or `YYYY-MM` |
| Platform | Yes | DSP name (Spotify, Apple Music, etc.) |
| Country/Region | Yes | Country name |
| Artist Name | Yes | Main artist |
| Release title | Yes | Album or single title |
| Track title | Yes | Track name |
| ISRC | No | Used for deduplication |
| UPC/EAN | No | Used for compilation filtering |
| Catalog number | No | Alternative compilation filter key |
| Net Revenue | Yes | Decimal number (any format, incl. scientific notation) |
| Quantity | No | Stream or download count |
| Product type | No | Audio Stream, Digital Download, Physical, etc. |

### Bandcamp Format

| Column | Required | Notes |
|--------|----------|-------|
| date | Yes | Sale date |
| artist | Yes | Artist name |
| album title | No | Album name |
| item title | Yes | Track or album title |
| net revenue | Yes | After Bandcamp fees |
| currency | No | Default: EUR |

### Multi-File Upload

Believe only exports 6 months at a time. Upload multiple Believe CSVs to cover a full year — the app merges them automatically.

---

## Vercel KV Migration (Future)

The `useLocalKV` hook in `src/hooks/useLocalKV.ts` is a drop-in swap for a server-side KV store. To migrate to Vercel KV (Redis):

1. `npm install @vercel/kv`
2. Set environment variables in Vercel: `KV_URL`, `KV_REST_API_URL`, `KV_REST_API_TOKEN`, `KV_REST_API_READ_ONLY_TOKEN`
3. Create API routes in `/api/kv/[key].ts` backed by `@vercel/kv`
4. Update `useLocalKV.ts` to call the API routes instead of `idb-keyval`

This architecture is ready for multi-user / multi-label SaaS features.

---

## License

MIT
