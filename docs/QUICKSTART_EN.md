# ⚡ NeuroStat — Quick Start Guide

> From first launch to your first artist statement in under 10 minutes.

---

## 1. Installation & Launch

### Prerequisites
- Node.js 20 or later
- npm 10 or later

### Start the local development server

```bash
git clone https://github.com/Neuroklast/sos-generator-for-mu.git
cd sos-generator-for-mu
npm install
npm run dev
```

Then open **http://localhost:5173** in your browser.

> **No backend required.** All data is stored locally in your browser's IndexedDB.

---

## 2. Set Up Label Branding (one-time)

1. Click **Branding** in the sidebar navigation.
2. Upload your **label logo** (PNG, JPG, SVG, or WebP — max. 5 MB).
3. Fill in **Label Name**, **Address**, **Email**, **Tax Number**, and **VAT ID**.
4. (Optional) Add bank account details or custom footer text.
5. Click **Save**.

Your logo and address will appear on all exported PDFs and Excel files.

---

## 3. Upload CSV Files

1. Go to **Ingest** (file upload).
2. Drag and drop your files into the respective drop zones, or click to browse:
   - **Believe reports** (`.csv`) — upload as many files as needed to cover a full year
   - **Bandcamp reports** (`.csv`)
   - **Shopify reports** (optional)
3. The app auto-detects the format and shows processing progress.

---

## 4. Review Split Fees & Settings

1. Go to **Settings → Split Fees**.
2. Assign a percentage to each artist (e.g. 70% → artist keeps 70% of net revenue).
3. (Optional) Under **Artist Mapping**, define alias names for featuring credits that should automatically resolve to the correct primary artist.
4. (Optional) Under **Compilation Filter**, exclude compilation releases by EAN, catalog number, or title.

---

## 5. Review the Dashboard

Open **Dashboard**. At a glance you will see:

| Card | Content |
|------|---------|
| Total Net Revenue | Sum of all artist payouts |
| Active Artists | Number of artists with revenue |
| Top Platform | Highest-earning DSP |
| Files Loaded | Number of source files processed |

---

## 6. Export Statements

1. Navigate to **Reports**.
2. Select a **reporting period** (from – to).
3. Click:
   - **Download All** → a ZIP file with all artist PDFs and Excel files
   - Individual **PDF** or **Excel** icon next to an artist for a single download

PDFs automatically include your label logo, address, and all revenue breakdowns.

---

## Next Steps

| Topic | Further Reading |
|-------|----------------|
| All features in detail | [User Manual (EN)](./USER_MANUAL.md) |
| Deutsches Benutzerhandbuch | [Benutzerhandbuch (DE)](./BENUTZERHANDBUCH.md) |
| Deutscher Schnellstart | [Schnellstart-Anleitung (DE)](./QUICKSTART_DE.md) |
| Technical architecture | [ARCHITECTURE.md](../ARCHITECTURE.md) |
