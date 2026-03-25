# ⚡ NeuroStat — Schnellstart-Anleitung

> Vom ersten Start bis zum fertigen Künstler-Statement in unter 10 Minuten.

---

## 1. Installation & Start

### Voraussetzungen
- Node.js 20 oder neuer
- npm 10 oder neuer

### Lokale Entwicklungsinstanz starten

```bash
git clone https://github.com/Neuroklast/sos-generator-for-mu.git
cd sos-generator-for-mu
npm install
npm run dev
```

Öffne anschließend **http://localhost:5173** im Browser.

> **Kein Backend erforderlich.** Alle Daten werden lokal in der IndexedDB des Browsers gespeichert.

---

## 2. Label-Branding einrichten (einmalig)

1. Klicke in der Seitennavigation auf **Branding**.
2. Lade dein **Label-Logo** hoch (PNG, JPG, SVG, WebP — max. 5 MB).
3. Fülle die Felder **Label-Name**, **Adresse**, **E-Mail**, **Steuernummer** und **USt-IdNr.** aus.
4. (Optional) Trage Bankdaten oder einen individuellen Fußzeilentext ein.
5. Klicke auf **Speichern**.

Das Logo und die Adressdaten erscheinen auf allen exportierten PDFs und Excel-Dateien.

---

## 3. CSV-Dateien hochladen

1. Gehe zu **Ingest** (Datei-Upload).
2. Ziehe deine Dateien per Drag & Drop in die jeweilige Dropzone, oder klicke zum Durchsuchen:
   - **Believe-Berichte** (`.csv`) — beliebig viele Dateien gleichzeitig für einen Jahresbericht
   - **Bandcamp-Berichte** (`.csv`)
   - **Shopify-Berichte** (optional)
3. Die App erkennt das Format automatisch und zeigt den Verarbeitungsfortschritt an.

---

## 4. Split-Anteile & Einstellungen prüfen

1. Wechsle zu **Settings → Split Fees**.
2. Weise jedem Künstler seinen Prozentsatz zu (z. B. 70 % → Künstler behält 70 % des Netto-Erlöses).
3. (Optional) Definiere unter **Artist Mapping** Alias-Namen für Featuring-Credits, die automatisch dem Hauptkünstler zugeordnet werden sollen.
4. (Optional) Filtere unerwünschte Sampler-Releases unter **Compilation Filter** per EAN, Katalognummer oder Titel heraus.

---

## 5. Dashboard prüfen

Öffne **Dashboard**. Hier siehst du auf einen Blick:

| Kachel | Inhalt |
|--------|--------|
| Gesamter Nettoumsatz | Summe aller Künstler-Auszahlungen |
| Aktive Künstler | Anzahl der Künstler mit Umsatz |
| Top-Plattform | Umsatzstärkste DSP |
| Geladene Dateien | Anzahl der verarbeiteten Quell-Dateien |

---

## 6. Statements exportieren

1. Navigiere zu **Reports**.
2. Wähle einen **Abrechnungszeitraum** (von – bis).
3. Klicke auf:
   - **Download All** → ZIP-Datei mit allen Künstler-PDFs und Excel-Dateien
   - Einzelnes **PDF** oder **Excel** Symbol neben einem Künstler für einen Einzel-Download

Die PDFs enthalten automatisch dein Label-Logo, die Adresse und alle Umsatzaufschlüsselungen.

---

## Nächste Schritte

| Thema | Weiterführende Dokumentation |
|-------|------------------------------|
| Alle Funktionen im Detail | [Benutzerhandbuch (DE)](./BENUTZERHANDBUCH.md) |
| Full English documentation | [User Manual (EN)](./USER_MANUAL.md) |
| English Quick Start | [Quick Start Guide (EN)](./QUICKSTART_EN.md) |
| Technische Architektur | [ARCHITECTURE.md](../ARCHITECTURE.md) |
