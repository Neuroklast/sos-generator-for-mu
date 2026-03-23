# SOS Generator — Statement of Sales Tool

A web application for music labels to process CSV royalty reports (Believe, Bandcamp), aggregate revenue per artist, apply split fees, and export professional PDF/Excel statements.

## Features

- **CSV Upload & Auto-Parsing**: Drop Believe or Bandcamp CSV files. Columns are auto-detected by semantic matching — no manual configuration needed.
- **Custom Column Mapping**: If your CSV uses non-standard column headers, add synonyms in Settings → CSV Column Mapping.
- **Compilation Filtering**: Exclude compilation revenue by EAN, catalog number, or title.
- **Artist Mapping**: Map featuring/alias names (e.g. "Artist feat. XY") to the correct primary artist.
- **Split Fees**: Define per-artist revenue percentages.
- **Manual Revenues**: Add one-off payments not covered by the CSV data.
- **Analytics Dashboard**: Platform, country, and monthly breakdowns per artist.
- **PDF & Excel Export**: Generate individual or bulk artist statements.
- **Persistent Settings**: All settings (mappings, filters, fees) are stored server-side via the KV store.

---

## CSV Format Requirements

### Believe (Distributor) Format

| Column | Required | Notes |
|--------|----------|-------|
| `Sales Month` | Yes | Format: `MM/YYYY` or `YYYY-MM` |
| `Platform` | Yes | DSP name (Spotify, Apple Music, etc.) |
| `Country/Region` | Yes | Country name or "Worldwide" |
| `Artist Name` | Yes | Main artist on the release |
| `Release title` | Yes | Album or single title |
| `Track title` | Yes | Track name |
| `UPC` | No | Barcode |
| `ISRC` | No | Track identifier |
| `Release Catalog nb` | No | Internal catalog number |
| `Release Type` | No | e.g. "Music Release" |
| `Sales Type` | No | e.g. "Stream", "Platform Promotion" |
| `Quantity` | Yes | Number of streams/downloads |
| `Net Revenue` | Yes | Decimal number (dot or comma separator) |

**Supported delimiter:** Semicolon (`;`) or comma (`,`) — auto-detected.
**Supported number formats:** `0.003974`, `0,003974`, `1.234,56`, `3.49e-4`
**Encoding:** UTF-8 (with or without BOM)

### Bandcamp Format

Standard Bandcamp sales CSV export. Columns like `Item Name`, `Artist`, `Amount`, etc. are mapped automatically.

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+
- [GitHub Spark](https://githubnext.com/projects/github-spark) (for KV persistence) **or** a standalone Vercel deployment (see below)

### Local Development (GitHub Spark)

```bash
npm install
npm run dev
```

Open the URL shown by Vite. The Spark Workbench provides the KV service at `/_spark/kv` automatically.

### Vercel Deployment

1. Fork this repository and import it into Vercel.
2. **No additional environment variables are required** for the core CSV processing — all parsing happens in the browser.
3. **For persistent settings** (artist mappings, split fees, etc.) across page refreshes, choose one:

   **Option A — GitHub Spark (recommended):** Deploy via the Spark Workbench, which provides the KV service automatically.

   **Option B — Vercel KV:** Set up [Vercel KV](https://vercel.com/docs/storage/vercel-kv) and add a serverless function that proxies `/_spark/kv` to `@vercel/kv`. See [Vercel KV Setup](#vercel-kv-setup) below.

> **Note:** Without a KV backend, the app fully works within a single browser session. Settings are lost when the browser tab is closed or refreshed.

### Build for Production

```bash
npm run build
```

---

## Vercel KV Setup

To persist settings across page refreshes on a standalone Vercel deployment:

1. Create a Vercel KV store in your project dashboard.
2. Vercel automatically adds these environment variables:
   - `KV_URL`
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN`
   - `KV_REST_API_READ_ONLY_TOKEN`
3. Create an API route at `api/kv/[key].ts`:

```typescript
// api/kv/[key].ts
import { kv } from '@vercel/kv'
import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const key = req.query.key as string

  if (req.method === 'GET') {
    const value = await kv.get(key)
    if (value === null) return res.status(404).end()
    res.json(value)
  } else if (req.method === 'POST') {
    const body = req.body
    await kv.set(key, body)
    res.status(200).end()
  } else if (req.method === 'DELETE') {
    await kv.del(key)
    res.status(200).end()
  } else {
    res.status(405).end()
  }
}
```

4. Update `vercel.json` to route `/_spark/kv/:key` to `/api/kv/:key`:

```json
{
  "rewrites": [
    { "source": "/_spark/kv/:key", "destination": "/api/kv/:key" },
    { "source": "/((?!_spark/).*)", "destination": "/index.html" }
  ]
}
```

---

## Architecture Overview

```
src/
├── lib/
│   ├── csv-parser.ts           # Column header mapping (semantic dictionary + custom aliases)
│   ├── streaming-csv-parser.ts # Chunked streaming parser (keeps UI responsive)
│   ├── data-processor.ts       # Artist aggregation, split fee calculations
│   ├── export-utils.ts         # PDF and Excel generation
│   └── types.ts                # Shared TypeScript interfaces
├── hooks/
│   ├── useFileManager.ts       # File upload state and per-file parsing progress
│   ├── useCSVProcessor.ts      # Full data pipeline (parse -> aggregate -> calculate)
│   ├── useHistoryLog.ts        # Upload history (KV-persisted)
│   ├── useExports.ts           # PDF/Excel download handlers
│   └── useSplitFeeSync.ts      # Auto-register new artists in split fee list
└── components/
    ├── FileUploadZone.tsx       # Drag & drop upload with progress indicator
    ├── RevenueDashboard.tsx     # Main revenue table with per-artist detail
    ├── AnalyticsDashboard.tsx   # Charts: platform, country, monthly breakdowns
    ├── ReportingPanel.tsx       # Statement generation
    ├── ArtistTreeView.tsx       # Artist -> Release -> Track hierarchy
    ├── CSVColumnMapper.tsx      # Custom column synonym management
    └── ...                     # Settings panels (filters, mappings, fees)
```

### Data Flow

1. **Upload**: User drops a CSV onto `FileUploadZone`
2. **Parse**: `useFileManager` reads the file and calls `parseCSVContentStreaming`
   - Auto-detects delimiter (`;` or `,`) using consistency analysis across multiple lines
   - Maps column headers using `semanticDictionary` + any custom aliases from settings
   - Parses revenue values (EU/US decimal formats and scientific notation)
3. **Aggregate**: `useCSVProcessor` builds `allTransactions` from all uploaded files
4. **Process**: `data-processor.ts` applies compilation filters, artist mappings, split fees, and manual revenues
5. **Display**: Dashboard tabs show the processed data

---

## License

MIT — see [LICENSE](./LICENSE)
