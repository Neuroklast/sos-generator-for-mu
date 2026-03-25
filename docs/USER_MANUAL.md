# NeuroStat — User Manual

**Software powered by Neuroklast · Version 1.0.0**

> Comprehensive reference manual for all features of the NeuroStat Statement of Sales Generator

---

## Table of Contents

1. [Overview](#1-overview)
2. [Installation & System Requirements](#2-installation--system-requirements)
3. [Navigation Overview](#3-navigation-overview)
4. [Branding Configuration](#4-branding-configuration)
5. [File Upload (Ingest)](#5-file-upload-ingest)
6. [Settings](#6-settings)
   - 6.1 [Split Fees](#61-split-fees)
   - 6.2 [Artist Mapping](#62-artist-mapping)
   - 6.3 [Compilation Filter](#63-compilation-filter)
   - 6.4 [CSV Column Mapping](#64-csv-column-mapping)
   - 6.5 [App Defaults](#65-app-defaults)
   - 6.6 [Email Templates](#66-email-templates)
7. [Artist Management](#7-artist-management)
   - 7.1 [Expenses & Advances](#71-expenses--advances)
   - 7.2 [Manual Revenue Entries](#72-manual-revenue-entries)
   - 7.3 [Ignored Entries](#73-ignored-entries)
8. [Dashboard](#8-dashboard)
9. [Process Cockpit](#9-process-cockpit)
10. [Analytics](#10-analytics)
11. [Reports & Export](#11-reports--export)
    - 11.1 [PDF Settings](#111-pdf-settings)
    - 11.2 [Single Export](#112-single-export)
    - 11.3 [Bulk Export (Download All)](#113-bulk-export-download-all)
12. [Upload History](#12-upload-history)
13. [Workspace Management](#13-workspace-management)
14. [CSV Format Reference](#14-csv-format-reference)
15. [Frequently Asked Questions & Troubleshooting](#15-frequently-asked-questions--troubleshooting)

---

## 1. Overview

**NeuroStat** is a professional web application for music label managers that automates the entire artist royalty statement process:

- Import revenue data from **Believe**, **Bandcamp**, and **Shopify**
- Aggregate and break down revenue per artist
- Apply custom **split percentages**, **expenses/advances**, and **manual revenue entries**
- Export professionally branded **PDF and Excel statements**

**Data storage:** All data (settings, mappings, branding) is persisted locally in the browser via IndexedDB. No server, cloud connection, or login is required.

**Privacy:** CSV data is processed exclusively in the local browser. No revenue data ever leaves your machine.

---

## 2. Installation & System Requirements

### System Requirements

| Requirement | Minimum |
|-------------|---------|
| Node.js | 20 LTS or later |
| npm | 10 or later |
| Browser | Chrome 120+, Firefox 120+, Edge 120+, Safari 17+ |
| Screen resolution | 1280 × 720 (recommended: 1440 × 900) |

### Local Installation

```bash
# 1. Clone the repository
git clone https://github.com/Neuroklast/sos-generator-for-mu.git
cd sos-generator-for-mu

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev
```

The application is then available at **http://localhost:5173**.

### Creating a Production Build

```bash
npm run build       # Generate optimised build
npm run preview     # Test the build locally
```

### Deploying to Vercel

```bash
npx vercel --prod
```

No environment variables are required for basic usage. All settings are stored client-side in IndexedDB.

---

## 3. Navigation Overview

The application has a sidebar navigation (desktop) and a bottom navigation bar (mobile) with the following sections:

| Navigation item | Description |
|----------------|-------------|
| **Dashboard** | Overview tiles showing total revenue, active artists, top platform |
| **Ingest** | Upload CSV files (Believe, Bandcamp, Shopify) |
| **Process Cockpit** | Detailed artist data table with filtering and sorting |
| **Analytics** | Charts: platform, country, and monthly revenue breakdown |
| **Artists** | Manage artist roster, expenses, manual revenues |
| **Reports** | Generate and download PDF and Excel statements |
| **Settings** | Split fees, artist mapping, compilation filter, column mapping |
| **History** | Upload log of all imported files |
| **Branding** | Configure label logo and address details |

---

## 4. Branding Configuration

Branding data appears on all exported PDFs and Excel files.

### Step-by-Step

1. Click **Branding** in the navigation.
2. **Upload logo:**
   - Click the logo upload area or drag and drop a file.
   - Supported formats: PNG, JPG, JPEG, SVG, WebP
   - Maximum file size: 5 MB
   - The logo appears in the header of exported PDFs on the right-hand side (filling the right third of the header).
3. **Fill in label information:**

   | Field | Description | Example |
   |-------|-------------|---------|
   | Label Name | Official name of your label | "Sunshine Records Ltd." |
   | Legal Form | Company type | "Ltd.", "GmbH", "LLC" |
   | Address | Multi-line address | "1 Example Street\nLondon W1A 1AA" |
   | Email | Contact email | "info@sunshine-records.com" |
   | Tax Number | Tax authority number | "12/345/67890" |
   | VAT ID | VAT identification number | "DE123456789" |
   | Bank Account | IBAN, BIC, account holder | Appears in the PDF footer |
   | Footer Text | Custom footer text | Overrides bank details in footer |
   | Invoice Number Prefix | Prefix for statement numbers | "SOS" → "SOS-2025-KUNS" |
   | VAT Rate (%) | Default VAT rate | 19 |

4. Click **Save**.

### Logo Positioning in PDF
- **Label logo:** Top right in the header, filling the right third (max. 50 mm wide, 30 mm tall), scaled proportionally without distortion.
- **Software logo (NeuroStat):** Bottom left on every page, 50% opacity as a subtle watermark.

---

## 5. File Upload (Ingest)

### Supported Sources

| Source | File format | Notes |
|--------|-------------|-------|
| **Believe** | `.csv` | Multiple files at once (annual merge) |
| **Bandcamp** | `.csv` | Fan merchandise and music sales |
| **Shopify** | `.csv` | Physical merchandise sales |

### Uploading Files

1. Navigate to **Ingest**.
2. **Drag & Drop:** Drag one or more CSV files into the appropriate drop zone (Believe, Bandcamp, or Shopify).
3. **Click:** Alternatively, click the drop zone to open the file browser.
4. The file is automatically processed — a progress bar shows the status.
5. After processing, the following is shown:
   - Number of rows processed
   - Number of rows skipped (parsing errors)
   - Number of artists detected

### Multiple Believe Files (Annual Report)

Believe exports data for a maximum of 6 months at a time. To create a full annual report:

1. Upload January–June as one Believe CSV.
2. Upload July–December as another Believe CSV.
3. NeuroStat automatically merges all files into a single dataset.

### Technical Details on CSV Processing

The built-in parser handles:
- **BOM** (Byte Order Mark) — no manual removal needed
- **Various delimiters** — comma, semicolon, and tab are auto-detected
- **Scientific notation** — e.g. `1.23e-4` for very small revenue amounts
- **Quoted headers** — column headers with quotation marks
- **Decimal separators** — both period and comma are recognised

---

## 6. Settings

### 6.1 Split Fees

Split fees determine what percentage of the **net revenue** (after deducting distribution fees and expenses) an artist receives.

**Setting up:**
1. Go to **Settings → Split Fees**.
2. Click **Add Artist** or select an existing one.
3. Enter the percentage (0–100).
4. Save.

**Calculation formula:**

```
Net Payout = (Gross Revenue − Distribution Fee − Expenses) × (Split% / 100)
```

**Example:**
- Gross revenue: €1,000
- Distribution fee: €150
- Advance recoupment: €200
- Split: 70%
- → Net payout = (1,000 − 150 − 200) × 0.70 = **€455**

---

### 6.2 Artist Mapping

Artist Mapping automatically resolves featuring credits and alias names to the correct primary artist.

**Example:** "Max Sample feat. DJ X" should be attributed to the artist "Max Sample".

**Setting up:**
1. Go to **Settings → Artist Mapping**.
2. Click **Add Mapping**.
3. In the **Featuring Name** field, enter the value as it appears in the CSV (e.g. "Max Sample feat. DJ X").
4. In the **Primary Artist** field, select the target artist.
5. Save.

**Auto-Mapping:** The app uses the Jaro-Winkler algorithm to automatically suggest similar-sounding name matches. Auto-mappings are marked with a similarity score (0–1).

**Management:**
- All mappings are displayed in a searchable list.
- Individual mappings can be deleted.
- Auto-mappings can be manually overridden or removed.

---

### 6.3 Compilation Filter

The Compilation Filter lets you completely exclude revenue from compilation releases that do not belong to the label or should not be included in statements.

**Filter types:**

| Type | Description | Example |
|------|-------------|---------|
| **EAN** | International Article Number / UPC | `0123456789012` |
| **Catalog number** | Label-internal catalog number | `SUN-001` |
| **Title** | Full or partial release title | `Various Artists Vol. 3` |

**Adding a filter:**
1. Go to **Settings → Compilation Filter**.
2. Click **Add Filter**.
3. Select the type (EAN, Catalog, Title) and enter the value.
4. (Optional) Enter a **label** for easy identification.
5. Save.

Filtered releases do not appear in the dashboard or exported statements.

---

### 6.4 CSV Column Mapping

If your Believe CSV uses different column headers than the standard, you can define custom synonyms here.

**Setting up:**
1. Go to **Settings → Column Mapping** (CSV Column Mapper).
2. Select the target field (e.g. "Artist Name").
3. Enter alternative column names as a comma-separated list.
4. Save.

The app will then recognise both names as the same field.

---

### 6.5 App Defaults

Under **Settings → Defaults** you can set application-wide default values:

| Setting | Description |
|---------|-------------|
| Finance Email | Email address for payment enquiries |
| Invoice Deadline | Default date for payment deadlines |
| Donation Organisation | Name of a royalty donation organisation (for email templates) |

These values are used as placeholders in email templates.

---

### 6.6 Email Templates

Under **Branding → Email Template** (or the corresponding settings section) you can define a template for the cover letter prepended to the statement.

**Supported placeholders:**

| Placeholder | Description |
|-------------|-------------|
| `{{ARTIST}}` | Artist name |
| `{{PERIOD}}` | Reporting period |
| `{{AMOUNT}}` | Net payout amount (formatted) |
| `{{LABEL_NAME}}` | Label name |
| `{{LABEL_EMAIL}}` | Label email |
| `{{FINANCE_EMAIL}}` | Finance email (from App Defaults) |
| `{{INVOICE_DEADLINE_DATE}}` | Invoice deadline |
| `{{ROYALTY_DONATION_ORG}}` | Donation organisation |

The template is inserted as the first page of the PDF when the **Email Cover Letter** option is enabled in PDF export settings.

---

## 7. Artist Management

The Artists page provides a complete roster of all artists with advanced management functions.

### Artist Roster

Here you maintain the official artist entries for your label:

| Field | Description |
|-------|-------------|
| **Name** | Artist name (must match CSV data exactly) |
| **Email** | Contact email for statement delivery |
| **VAT ID** | EU VAT identification number (for reverse-charge invoices) |
| **EU (non-DE)** | Enable for EU artists outside Germany (reverse charge) |
| **VAT Rate** | Individual VAT rate (overrides label default) |
| **Notes** | Contractual specifics, internal remarks |

### 7.1 Expenses & Advances

Expenses are recoupable costs deducted from an artist's gross revenue before the split percentage is applied.

**Use cases:**
- Music video production costs
- PR agency fees
- Studio costs / advance payments
- Tour support contributions

**Adding an expense:**
1. Go to **Artists**.
2. Select the relevant artist.
3. Click **Add Expense**.
4. Enter the **description**, **amount (EUR)**, and **date**.
5. Save.

Expenses are shown as a separate line in the statement and displayed in the PDF.

---

### 7.2 Manual Revenue Entries

Manual revenue entries supplement CSV-based revenue with non-digital sources.

**Use cases:**
- Darkmerch / own merchandise shop
- Sync deals (licensing fees from film/TV)
- Live performance fees to be included in statements
- Guest appearance fees

**Adding a manual revenue entry:**
1. Go to **Artists**.
2. Select the artist or open the global **Manual Revenue** section.
3. Click **Add Revenue Entry**.
4. Enter the **description**, **amount (EUR)**, and (optionally) **date**.
5. Save.

Manual revenues flow into the "Manual Revenue" line of the statement summary.

---

### 7.3 Ignored Entries

Individual artists or specific releases can be completely excluded from billing without deleting the raw data.

**Entry types:**
- **Ignore entire artist:** All transactions for the artist are removed from billing.
- **Ignore single release:** Only transactions for a specific release title are removed.

**Ignoring an entry:**
1. Go to **Artists** or **Process Cockpit**.
2. Click the ignore icon (🚫) next to the artist/release.
3. (Optional) Enter a note explaining why the entry is being ignored.
4. Save.

Ignored entries appear in a separate list under **Ignored Entries** and can be re-activated at any time.

---

## 8. Dashboard

The Dashboard provides an instant overview of the current billing state.

### Bento-Grid Tiles

| Tile | Description |
|------|-------------|
| **Total Net Revenue** | Sum of all net payouts to artists (in EUR) |
| **Active Artists** | Number of artists with positive revenue |
| **Top Platform** | DSP with the highest total revenue (e.g. Spotify) |
| **Files Loaded** | Number of successfully imported CSV files |
| **Detected Period** | Auto-detected billing period from CSV data |

### Detected Billing Period

A banner at the top of the page automatically shows the period detected in the uploaded CSV files (e.g. "January – June 2025"). This value is used as the default period for exports but can be adjusted manually.

---

## 9. Process Cockpit

The Process Cockpit displays fully processed artist data in an interactive table.

### Features

| Feature | Description |
|---------|-------------|
| **Search** | Real-time text search by artist name |
| **Sorting** | All columns sortable ascending or descending |
| **Filters** | Filter by platform, country, source (Believe/Bandcamp), and date range |
| **Expand** | Click an artist to see the breakdown by release, platform, and country |
| **Artist Tree** | Hierarchical view: Artist → Release → Track → Platform |
| **Group View** | Group data by artist, album, song, platform, country, or month |

### Column Overview

| Column | Description |
|--------|-------------|
| Artist | Artist name |
| Digital Revenue | Revenue from Believe (streaming/download) |
| Physical Revenue | Revenue from physical sales |
| Bandcamp Revenue | Revenue from Bandcamp |
| Manual Revenue | Manually added revenue |
| Gross Revenue | Sum of all revenue |
| Split % | Applied split percentage |
| Net Payout | Final payout amount |

---

## 10. Analytics

The Analytics page offers three interactive chart sections:

### Platform Breakdown
- Bar or pie chart of revenue by DSP (Spotify, Apple Music, Amazon, Deezer, YouTube, etc.)
- Absolute EUR amount and percentage share per platform

### Country Breakdown
- Revenue by territory (country/region)
- Useful for international revenue structure and tax reporting

### Monthly Trend
- Revenue development over the entire billing period
- Line or bar chart with monthly values

### Interactivity
- Click legend items to show/hide individual data series
- Hover over data points for precise values
- All charts are based on the currently filtered and processed data

---

## 11. Reports & Export

### 11.1 PDF Settings

Before exporting, you can configure which sections to include in the PDF using the **PDF Export Settings** panel:

| Option | Description | Default |
|--------|-------------|---------|
| **Release Breakdown** | Table with all releases and their revenues | ✅ On |
| **Platform Breakdown** | Table with revenues by DSP | ✅ On |
| **Country Breakdown** | Table with revenues by country | ❌ Off |
| **Monthly Breakdown** | Table with monthly revenues | ❌ Off |
| **Email Cover Letter** | Email template as first page | ❌ Off |

### 11.2 Single Export

**Export PDF:**
1. Go to **Reports**.
2. Set the **reporting period** (from – to date).
3. Click the **PDF icon** (🖨️) next to the desired artist.
4. The PDF is immediately downloaded in the browser.

**Export Excel:**
1. Click the **Excel icon** (📊) next to the artist.
2. An `.xlsx` file is downloaded.

**Excel workbook contains the following sheets:**
- **Summary** — Summary of all revenues and net payout
- **Releases** — Release breakdown with revenue and sales quantities
- **Platforms** — Platform breakdown
- **Countries** — Country breakdown
- **Monthly** — Monthly revenue development

### 11.3 Bulk Export (Download All)

**Download All** downloads all artist statements as a ZIP file in a single step.

**Process:**
1. Click **Download All** (or "Download Selected" for a subset).
2. A progress bar shows the status for each artist.
3. After completion, a `.zip` file is downloaded containing for each artist:
   - `[artist-name]_statement.pdf`
   - `[artist-name]_statement.xlsx`

**Note:** Processing is sequential to avoid overloading the browser's main thread. With many artists (> 20), the export may take several minutes.

### PDF Content in Detail

A generated PDF contains:

```
┌─────────────────────────────────────────────┐
│ [Label Logo right] [Label Address left]      │
│ Tax Number · VAT ID                          │
├─────────────────────────────────────────────┤
│ Statement Number: SOS-2025-KUNS             │
│ Billing Period: 01/2025 – 06/2025           │
├─────────────────────────────────────────────┤
│ GUTSCHRIFT / STATEMENT OF SALES             │
│ Artist: Max Sample                          │
│ [VAT info / Reverse Charge if applicable]   │
├─────────────────────────────────────────────┤
│ Digital Revenue:           €1,234.56        │
│ Physical Revenue:            €123.45        │
│ Manual Revenue:              €200.00        │
│ Gross Revenue:             €1,558.01        │
│ Label Distribution Fee:   −€150.00          │
│ Recoupable Costs:         −€300.00          │
│ Split Percentage:               70%         │
│ Net Payout:                  €774.61        │
│ [VAT if applicable]                         │
├─────────────────────────────────────────────┤
│ [Release Breakdown]                         │
│ [Platform Breakdown]                        │
│ [Country Breakdown]                         │
│ [Monthly Breakdown]                         │
├─────────────────────────────────────────────┤
│ [Footer: bank details / footer text] Page 1 │
│ [NeuroStat logo bottom left, 50% opacity]   │
└─────────────────────────────────────────────┘
```

### Tax Notes in PDF

The PDF automatically includes mandatory text under German VAT law:

- **"Gutschrift im Sinne des Umsatzsteuergesetzes (§ 14 Abs. 2 UStG)"** — Mandatory notice for self-billing (issued by the label)
- **Reverse Charge:** For EU artists outside Germany, the notice "Steuerschuldnerschaft des Leistungsempfängers (Reverse Charge, Art. 196 MwStSystRL)" is inserted.
- **VAT calculation:** Only shown when a VAT rate > 0 is configured.

---

## 12. Upload History

The History page logs all uploaded files as a complete audit trail.

**Information displayed:**

| Column | Description |
|--------|-------------|
| Filename | Original filename of the uploaded CSV |
| Type | Source (Believe, Bandcamp, Shopify) |
| Upload time | Date and time of upload |
| Rows processed | Number of successfully parsed data rows |
| Rows skipped | Rows with parsing errors |
| Artists detected | Number of unique artists in the file |

**Note:** Historical entries (metadata) are persistently stored. The actual CSV raw data is **not** permanently stored — it only exists in memory during the active browser session.

---

## 13. Workspace Management

The **Workspace Manager** allows you to save and restore different billing states.

**Features:**
- **Save Workspace:** Saves all current settings, mappings, and processed data as a named snapshot.
- **Load Workspace:** Fully restores a saved state.
- **Delete Workspace:** Removes a saved snapshot.

**Use case:** Create a separate workspace for each quarter or year to keep a traceable billing history.

---

## 14. CSV Format Reference

### Believe Format

| Column | Required | Description |
|--------|----------|-------------|
| Sales Month | ✅ | Billing month: `MM/YYYY` or `YYYY-MM` |
| Platform | ✅ | DSP name (Spotify, Apple Music, etc.) |
| Country/Region | ✅ | Country name |
| Artist Name | ✅ | Main artist |
| Release title | ✅ | Album or single title |
| Track title | ✅ | Track title |
| ISRC | ❌ | For deduplication |
| UPC/EAN | ❌ | For compilation filter |
| Catalog number | ❌ | Alternative compilation filter key |
| Net Revenue | ✅ | Decimal number (any format) |
| Quantity | ❌ | Streams or download count |
| Product type | ❌ | Audio Stream, Digital Download, Physical, etc. |

### Bandcamp Format

| Column | Required | Description |
|--------|----------|-------------|
| date | ✅ | Sale date |
| artist | ✅ | Artist name |
| album title | ❌ | Album name |
| item title | ✅ | Track or album title |
| net revenue | ✅ | Net revenue after Bandcamp fees |
| currency | ❌ | Default: EUR |

### Shopify Format

| Column | Required | Description |
|--------|----------|-------------|
| Order ID | ✅ | Unique order ID |
| Order Date | ✅ | Order date |
| Product Title | ✅ | Product name |
| SKU | ❌ | Stock-keeping unit |
| Quantity | ✅ | Quantity sold |
| Gross Revenue | ✅ | Gross revenue |
| Net Revenue | ✅ | Net revenue after fees |
| Currency | ❌ | Default: EUR |

---

## 15. Frequently Asked Questions & Troubleshooting

### My CSV is not being recognised

**Possible causes:**
1. The file has an unexpected encoding (UTF-16 instead of UTF-8). Convert it to UTF-8 in a text editor.
2. Delimiter detection is failing. Check whether the file uses comma, semicolon, or tab as delimiter.
3. The file has no header row. Believe exports always include a header row — check third-party exports.

**Solution:** Open the CSV in a text editor and check the structure of the first 5 rows.

---

### Artists are not being matched correctly

**Cause:** The artist name in the CSV differs from the name in settings (e.g. capitalisation, special characters, featuring additions).

**Solution:** Create a mapping under **Settings → Artist Mapping** from the CSV spelling to the correct artist name.

---

### Split percentage is not being applied

**Cause:** The artist name in the split fee entry does not exactly match the processed name.

**Solution:** Make sure the name in the split fee entry exactly matches the artist name shown after artist mapping (case-sensitive).

---

### The label logo does not appear in the PDF

**Possible causes:**
1. The logo format is not supported (only PNG, JPG, SVG, WebP).
2. The file exceeds 5 MB.
3. The logo data URL is corrupted.

**Solution:** Re-upload the logo and make sure it is in one of the supported formats and smaller than 5 MB.

---

### Calculations appear incorrect

**Checklist:**
1. Is the Compilation Filter set correctly? Unintended filters can hide revenue.
2. Are Ignored Entries active that accidentally exclude revenue?
3. Is the split percentage correct? Check under Settings → Split Fees.
4. Are there expenses/advances reducing the amount?

---

### Bulk export is taking a very long time

**Explanation:** Bulk export (Download All) processes artists sequentially to avoid blocking the browser's main thread. With many artists (> 20), this can take several minutes.

**Recommendation:** For very large label rosters, export individual artists in small groups or use the "Export Selected" feature.

---

### Data disappeared after page reload

**Explanation:** Settings, mappings, and branding data are persistently stored in IndexedDB — they survive a browser reload.

**CSV data is not persistent:** Uploaded CSV raw data is held **in memory only** and is lost on reload. You will need to re-upload CSV files after a reload.

**Recommendation:** Use the **Workspace Manager** to save the current processing state.

---

*This manual corresponds to NeuroStat Version 1.0.0 | Software powered by Neuroklast*
