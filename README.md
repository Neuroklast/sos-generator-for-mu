# SOS Generator — Statement of Sales Tool

> **Fintech-Grade Royalty Reporting for Indie Labels**

A professional web application for music labels to process royalty reports from Believe, Bandcamp, and manual sources (Darkmerch, sync deals), aggregate revenue per artist, apply split fees, and export branded PDF/Excel statements.

---

## Screenshot

![SOS Generator Dashboard](https://github.com/user-attachments/assets/0c59bdda-8a31-45cc-8d5a-824ec24dbf49)

---

## Features

- **Multi-Source Ingestion**: Upload Believe and Bandcamp CSVs simultaneously. Merge unlimited files (e.g. 2x Believe for a full year).
- **Intelligent CSV Parsing**: Auto-detects delimiters, handles BOM, scientific notation revenue values, and quoted headers.
- **Semantic Column Mapping**: Columns are matched by meaning. Add custom synonyms in Settings.
- **Smart Artist Mapping**: Map featuring/alias names to the correct primary artist. Persistent across sessions.
- **Compilation Filter**: Exclude compilation revenue by EAN, catalog number, or title.
- **Physical Filter**: Toggle to exclude physical product sales from digital-only statements.
- **Split Fee Engine**: Define per-artist revenue percentages.
- **Manual Revenue Entries**: Add Darkmerch sales, sync deals, or any ad-hoc income directly in the UI.
- **Bento-Grid Dashboard**: At-a-glance overview of Total Net Revenue, Active Artists, Top Platform, and files loaded.
- **Analytics**: Platform breakdown, country split, and monthly revenue trend charts.
- **PDF and Excel Export**: Per-artist statements with your label branding (logo + address).
- **Upload History**: Full audit log of every uploaded file.
- **Persistent Settings**: All settings survive page reloads via IndexedDB.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + Vite 7 |
| UI | Tailwind CSS v4 + shadcn/ui |
| Animations | Framer Motion |
| Charts | Recharts |
| Persistence | IndexedDB via idb-keyval (Vercel KV ready) |
| CSV Parsing | Custom streaming parser + PapaParse |
| Export | jsPDF + xlsx (SheetJS) |
| Deployment | Vercel (Edge-compatible) |

---

## Getting Started

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

## Vercel KV Migration (Future)

The `useLocalKV` hook in `src/hooks/useLocalKV.ts` is designed as a drop-in swap for a server-side KV store. To migrate to Vercel KV (Redis):

1. Install: `npm install @vercel/kv`
2. Set environment variables in your Vercel project:
   - `KV_URL`
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN`
   - `KV_REST_API_READ_ONLY_TOKEN`
3. Create API routes in `/api/kv/[key].ts` backed by `@vercel/kv`
4. Update `useLocalKV.ts` to call the API routes instead of `idb-keyval`

This architecture is ready for multi-user / multi-label SaaS features.

---

## CSV Format Reference

### Believe Format

| Column | Required | Notes |
|--------|----------|-------|
| Sales Month | Yes | Format: MM/YYYY or YYYY-MM |
| Platform | Yes | DSP name (Spotify, Apple Music, etc.) |
| Country/Region | Yes | Country name |
| Artist Name | Yes | Main artist |
| Release title | Yes | Album or single title |
| Track title | Yes | Track name |
| ISRC | No | Used for deduplication |
| UPC/EAN | No | Used for compilation filtering |
| Catalog number | No | Alternative compilation filter key |
| Net Revenue | Yes | Decimal number (any format) |
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

## Workflow

1. **Ingestion** — Upload Believe and/or Bandcamp CSVs plus manual entries
2. **Settings** — Configure compilation filters, artist mappings, split fees
3. **Dashboard** — Review aggregated revenue per artist
4. **Analytics** — Inspect platform, country, and monthly breakdowns
5. **Reports** — Download per-artist PDF and Excel statements
6. **Branding** — Set your label logo and address for professional exports

---

## Label Branding

Upload your label logo (PNG/SVG) and enter your label address in the **Branding** section. These appear on all generated PDF and Excel statements.

---

## License

MIT
