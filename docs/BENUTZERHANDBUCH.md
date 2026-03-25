# NeuroStat — Benutzerhandbuch

**Software powered by Neuroklast · Version 1.0.0**

> Ausführliches Handbuch für alle Funktionen des NeuroStat Statement of Sales Generators

---

## Inhaltsverzeichnis

1. [Überblick](#1-überblick)
2. [Installation & Systemanforderungen](#2-installation--systemanforderungen)
3. [Navigationsübersicht](#3-navigationsübersicht)
4. [Branding-Konfiguration](#4-branding-konfiguration)
5. [Datei-Upload (Ingest)](#5-datei-upload-ingest)
6. [Einstellungen (Settings)](#6-einstellungen-settings)
   - 6.1 [Split Fees](#61-split-fees)
   - 6.2 [Artist Mapping](#62-artist-mapping)
   - 6.3 [Compilation Filter](#63-compilation-filter)
   - 6.4 [CSV-Spalten-Mapping](#64-csv-spalten-mapping)
   - 6.5 [Standard-Einstellungen (App Defaults)](#65-standard-einstellungen-app-defaults)
   - 6.6 [E-Mail-Vorlagen](#66-e-mail-vorlagen)
7. [Künstlerverwaltung (Artists)](#7-künstlerverwaltung-artists)
   - 7.1 [Ausgaben & Vorschüsse (Expenses)](#71-ausgaben--vorschüsse-expenses)
   - 7.2 [Manuelle Einnahmen](#72-manuelle-einnahmen)
   - 7.3 [Ignorierte Einträge](#73-ignorierte-einträge)
8. [Dashboard](#8-dashboard)
9. [Process Cockpit](#9-process-cockpit)
10. [Analytics](#10-analytics)
11. [Berichte & Export (Reports)](#11-berichte--export-reports)
    - 11.1 [PDF-Einstellungen](#111-pdf-einstellungen)
    - 11.2 [Einzel-Export](#112-einzel-export)
    - 11.3 [Massen-Export (Download All)](#113-massen-export-download-all)
12. [Upload-Historie (History)](#12-upload-historie-history)
13. [Workspace-Verwaltung](#13-workspace-verwaltung)
14. [CSV-Formatreferenz](#14-csv-formatreferenz)
15. [Häufige Fragen & Fehlerbehebung](#15-häufige-fragen--fehlerbehebung)

---

## 1. Überblick

**NeuroStat** ist eine professionelle Webanwendung für Musik-Label-Manager, die den gesamten Prozess der Künstler-Abrechnung automatisiert:

- Umsatzdaten aus **Believe**, **Bandcamp** und **Shopify** importieren
- Einnahmen nach Künstler aggregieren und aufschlüsseln
- Benutzerdefinierte **Split-Anteile**, **Ausgaben/Vorschüsse** und **manuelle Einnahmen** anwenden
- Professionell gebrandete **PDF- und Excel-Statements** exportieren

**Datenspeicherung:** Alle Daten (Einstellungen, Mappings, Branding) werden persistent im Browser über IndexedDB gespeichert. Es ist kein Server, keine Cloud-Anbindung und keine Anmeldung erforderlich.

**Datenschutz:** Die CSV-Daten werden ausschließlich lokal im Browser verarbeitet. Keine Umsatzdaten verlassen deinen Rechner.

---

## 2. Installation & Systemanforderungen

### Systemanforderungen

| Anforderung | Minimum |
|-------------|---------|
| Node.js | 20 LTS oder neuer |
| npm | 10 oder neuer |
| Browser | Chrome 120+, Firefox 120+, Edge 120+, Safari 17+ |
| Bildschirmauflösung | 1280 × 720 (empfohlen: 1440 × 900) |

### Lokale Installation

```bash
# 1. Repository klonen
git clone https://github.com/Neuroklast/sos-generator-for-mu.git
cd sos-generator-for-mu

# 2. Abhängigkeiten installieren
npm install

# 3. Entwicklungsserver starten
npm run dev
```

Die Anwendung ist dann unter **http://localhost:5173** erreichbar.

### Produktiv-Build erstellen

```bash
npm run build       # Optimierten Build erzeugen
npm run preview     # Build lokal testen
```

### Deployment auf Vercel

```bash
npx vercel --prod
```

Keine Umgebungsvariablen erforderlich für die Basisnutzung. Alle Einstellungen werden clientseitig in IndexedDB gespeichert.

---

## 3. Navigationsübersicht

Die Anwendung hat eine seitliche Navigationsleiste (Desktop) bzw. eine untere Navigation (Mobil) mit folgenden Bereichen:

| Navigation | Beschreibung |
|-----------|--------------|
| **Dashboard** | Übersichts-Kacheln mit Gesamtumsatz, aktive Künstler, Top-Plattform |
| **Ingest** | CSV-Dateien hochladen (Believe, Bandcamp, Shopify) |
| **Process Cockpit** | Detaillierte Künstler-Datentabelle mit Filter- und Sortierfunktionen |
| **Analytics** | Diagramme: Plattform-, Länder- und Monats-Aufschlüsselung |
| **Artists** | Künstler-Roster verwalten, Ausgaben, manuelle Einnahmen |
| **Reports** | PDF- und Excel-Statements generieren und herunterladen |
| **Settings** | Split Fees, Artist Mapping, Compilation Filter, Spalten-Mapping |
| **History** | Upload-Protokoll aller hochgeladenen Dateien |
| **Branding** | Label-Logo und Adressdaten konfigurieren |

---

## 4. Branding-Konfiguration

Die Branding-Daten erscheinen auf allen exportierten PDFs und Excel-Dateien.

### Schritt-für-Schritt

1. Klicke in der Navigation auf **Branding**.
2. **Logo hochladen:**
   - Klicke auf den Logo-Upload-Bereich oder ziehe eine Datei per Drag & Drop hinein.
   - Unterstützte Formate: PNG, JPG, JPEG, SVG, WebP
   - Maximale Dateigröße: 5 MB
   - Das Logo erscheint auf exportierten PDFs im Kopfbereich des Dokuments rechts (füllt das rechte Drittel des Headers).
3. **Label-Informationen ausfüllen:**

   | Feld | Beschreibung | Beispiel |
   |------|--------------|---------|
   | Label-Name | Offizieller Name deines Labels | „Sunshine Records GmbH" |
   | Rechtsform | Gesellschaftsform | „GmbH", „UG (haftungsbeschränkt)" |
   | Adresse | Mehrzeilige Adresse | „Musterstraße 1\n12345 Berlin" |
   | E-Mail | Kontakt-E-Mail | „info@sunshine-records.de" |
   | Steuernummer | Finanzamt-Steuernummer | „12/345/67890" |
   | USt-IdNr. | Umsatzsteuer-Identifikationsnummer | „DE123456789" |
   | Bankverbindung | IBAN, BIC, Kontoinhaber | Erscheint im PDF-Footer |
   | Fußzeilentext | Individueller Footer-Text | Überschreibt Bankdaten im Footer |
   | Rechnungsnummer-Präfix | Präfix für Gutschrift-Nummern | „SOS" → „SOS-2025-KUNS" |
   | MwSt.-Satz (%) | Standard-Umsatzsteuersatz | 19 |

4. Klicke auf **Speichern** oder **Änderungen übernehmen**.

### Logo-Positionierung im PDF
- **Label-Logo:** Oben rechts im Header, füllt das rechte Drittel (max. 50 mm breit, 30 mm hoch), skaliert proportional ohne Verzerrung.
- **Software-Logo (NeuroStat):** Unten links auf jeder Seite, 50 % Transparenz als dezentes Wasserzeichen.

---

## 5. Datei-Upload (Ingest)

### Unterstützte Quellen

| Quelle | Dateiformat | Besonderheit |
|--------|-------------|--------------|
| **Believe** | `.csv` | Mehrere Dateien gleichzeitig möglich (Jahres-Merge) |
| **Bandcamp** | `.csv` | Fan-Merchandise und Musik-Verkäufe |
| **Shopify** | `.csv` | Physische Merchandise-Verkäufe |

### Dateien hochladen

1. Navigiere zu **Ingest**.
2. **Drag & Drop:** Ziehe eine oder mehrere CSV-Dateien in die entsprechende Dropzone (Believe, Bandcamp oder Shopify).
3. **Klicken:** Alternativ klicke auf die Dropzone, um den Datei-Browser zu öffnen.
4. Die Datei wird automatisch verarbeitet — ein Fortschrittsbalken zeigt den Status an.
5. Nach der Verarbeitung wird angezeigt:
   - Anzahl der verarbeiteten Zeilen
   - Anzahl übersprungener Zeilen (Parsing-Fehler)
   - Anzahl erkannter Künstler

### Mehrere Believe-Dateien (Jahresbericht)

Believe exportiert Daten maximal für 6 Monate. Um einen vollständigen Jahresbericht zu erstellen:

1. Lade Januar–Juni als eine Believe-CSV hoch.
2. Lade Juli–Dezember als weitere Believe-CSV hoch.
3. NeuroStat mergt alle Dateien automatisch zu einem Datensatz.

### Technische Details zur CSV-Verarbeitung

Der eingebaute Parser handhabt:
- **BOM** (Byte Order Mark) — kein manuelles Entfernen nötig
- **Verschiedene Trennzeichen** — Komma, Semikolon, Tabulator werden automatisch erkannt
- **Wissenschaftliche Notation** — z. B. `1.23e-4` bei sehr kleinen Beträgen
- **Gequotete Header** — Spaltenüberschriften mit Anführungszeichen
- **Dezimaltrennzeichen** — Punkt und Komma werden erkannt

---

## 6. Einstellungen (Settings)

### 6.1 Split Fees

Split Fees legen fest, welchen Prozentsatz des **Nettoumsatzes** (nach Abzug von Vertriebsprovisionen und Ausgaben) ein Künstler erhält.

**Einrichten:**
1. Gehe zu **Settings → Split Fees**.
2. Klicke auf **Künstler hinzufügen** oder wähle einen bestehenden.
3. Trage den Prozentsatz ein (0–100).
4. Speichere.

**Berechnungsformel:**

```
Netto-Auszahlung = (Bruttoumsatz − Vertriebsprovision − Ausgaben) × (Split% / 100)
```

**Beispiel:**
- Bruttoumsatz: 1.000 €
- Vertriebsprovision: 150 €
- Vorschuss: 200 €
- Split: 70 %
- → Netto-Auszahlung = (1.000 − 150 − 200) × 0,70 = **455 €**

---

### 6.2 Artist Mapping

Artist Mapping löst Featuring-Credits und Alias-Namen automatisch dem korrekten Hauptkünstler zu.

**Beispiel:** „Max Muster feat. DJ X" soll dem Künstler „Max Muster" zugeordnet werden.

**Einrichten:**
1. Gehe zu **Settings → Artist Mapping**.
2. Klicke auf **Mapping hinzufügen**.
3. Trage im Feld **Featuring-Name** den Wert ein, der in der CSV erscheint (z. B. „Max Muster feat. DJ X").
4. Wähle im Feld **Hauptkünstler** den Zielkünstler.
5. Speichere.

**Auto-Mapping:** Die App nutzt den Jaro-Winkler-Algorithmus, um ähnlich klingende Namen automatisch vorzuschlagen. Auto-Mappings werden mit einem Score (0–1) gekennzeichnet.

**Verwaltung:**
- Alle Mappings sind in einer durchsuchbaren Liste dargestellt.
- Einzelne Mappings können gelöscht werden.
- Auto-Mappings können manuell überschrieben oder entfernt werden.

---

### 6.3 Compilation Filter

Mit dem Compilation Filter kannst du Umsätze aus Sampler-Releases, die nicht dem Label gehören oder nicht abgerechnet werden sollen, vollständig aus der Abrechnung ausschließen.

**Filtertypen:**

| Typ | Beschreibung | Beispiel |
|-----|--------------|---------|
| **EAN** | International Article Number / UPC | `0123456789012` |
| **Katalognummer** | Label-interne Katalognummer | `SUN-001` |
| **Titel** | Vollständiger oder teilweiser Release-Titel | `Various Artists Vol. 3` |

**Filter hinzufügen:**
1. Gehe zu **Settings → Compilation Filter**.
2. Klicke auf **Filter hinzufügen**.
3. Wähle den Typ (EAN, Katalog, Titel) und trage den Wert ein.
4. (Optional) Trage ein **Label** zur einfachen Identifikation ein.
5. Speichere.

Gefilterte Releases erscheinen weder im Dashboard noch in den exportierten Statements.

---

### 6.4 CSV-Spalten-Mapping

Falls deine Believe-CSV andere Spaltenüberschriften verwendet als der Standard, kannst du hier eigene Synonyme definieren.

**Einrichten:**
1. Gehe zu **Settings → Column Mapping** (CSV Spalten-Mapper).
2. Wähle das Zielfeld (z. B. „Artist Name").
3. Trage alternative Spaltenbezeichnungen als kommaseparierte Liste ein.
4. Speichere.

Die App erkennt dann beide Bezeichnungen als dasselbe Feld.

---

### 6.5 Standard-Einstellungen (App Defaults)

Unter **Settings → Defaults** kannst du anwendungsweite Standardwerte setzen:

| Einstellung | Beschreibung |
|-------------|--------------|
| Finanz-E-Mail | E-Mail-Adresse für Auszahlungsanfragen |
| Abrechnungs-Deadline | Standarddatum für Zahlungsfristen |
| Spendenorganisation | Name einer Royalty-Spendenorganisation (für E-Mail-Vorlagen) |

Diese Werte werden in E-Mail-Vorlagen als Platzhalter eingesetzt.

---

### 6.6 E-Mail-Vorlagen

Unter **Branding → E-Mail-Vorlage** (oder im entsprechenden Einstellungsbereich) kannst du eine Vorlage für das Anschreiben definieren, das dem Statement vorangestellt wird.

**Unterstützte Platzhalter:**

| Platzhalter | Beschreibung |
|-------------|--------------|
| `{{ARTIST}}` | Name des Künstlers |
| `{{PERIOD}}` | Abrechnungszeitraum |
| `{{AMOUNT}}` | Netto-Auszahlungsbetrag (formatiert) |
| `{{LABEL_NAME}}` | Label-Name |
| `{{LABEL_EMAIL}}` | Label-E-Mail |
| `{{FINANCE_EMAIL}}` | Finanz-E-Mail (aus App Defaults) |
| `{{INVOICE_DEADLINE_DATE}}` | Abrechnungs-Deadline |
| `{{ROYALTY_DONATION_ORG}}` | Spendenorganisation |

Die Vorlage wird als erste Seite des PDFs eingefügt, wenn die Option **E-Mail-Anschreiben** im PDF-Export aktiviert ist.

---

## 7. Künstlerverwaltung (Artists)

Die Artists-Seite bietet einen vollständigen Roster aller Künstler mit erweiterten Verwaltungsfunktionen.

### Künstler-Roster

Hier pflegst du die offiziellen Künstler-Einträge deines Labels:

| Feld | Beschreibung |
|------|--------------|
| **Name** | Künstlername (muss exakt mit den CSV-Daten übereinstimmen) |
| **E-Mail** | Kontakt-E-Mail für Statement-Versand |
| **USt-IdNr.** | EU-Umsatzsteuer-ID (für Reverse-Charge-Rechnungen) |
| **EU (nicht DE)** | Aktivieren für EU-Künstler außerhalb Deutschlands (Reverse Charge) |
| **MwSt.-Satz** | Individueller Umsatzsteuersatz (überschreibt Label-Standard) |
| **Notizen** | Vertragliche Besonderheiten, interne Vermerke |

### 7.1 Ausgaben & Vorschüsse (Expenses)

Ausgaben sind recoupable Kosten, die vor der Split-Berechnung vom Bruttoumsatz eines Künstlers abgezogen werden.

**Anwendungsfälle:**
- Musikvideo-Produktionskosten
- PR-Agentur-Honorare
- Studiokosten / Vorschusszahlungen
- Tourneekostenzuschüsse

**Ausgabe hinzufügen:**
1. Gehe zu **Artists**.
2. Wähle den entsprechenden Künstler.
3. Klicke auf **Ausgabe hinzufügen**.
4. Trage **Beschreibung**, **Betrag (EUR)** und **Datum** ein.
5. Speichere.

Ausgaben werden in der Abrechnung als separate Zeile ausgewiesen und im PDF-Statement angezeigt.

---

### 7.2 Manuelle Einnahmen

Manuelle Einnahmen ergänzen CSV-basierte Umsätze um nicht-digitale Quellen.

**Anwendungsfälle:**
- Darkmerch / eigener Merchandise-Shop
- Sync-Deals (Lizenzgebühren aus Film/TV)
- Live-Gagen, die abgerechnet werden sollen
- Gastspiel-Honorare

**Manuelle Einnahme hinzufügen:**
1. Gehe zu **Artists**.
2. Wähle den Künstler oder öffne den globalen Bereich **Manual Revenue**.
3. Klicke auf **Einnahme hinzufügen**.
4. Trage **Beschreibung**, **Betrag (EUR)** und (optional) **Datum** ein.
5. Speichere.

Manuelle Einnahmen fließen in die `Manuelle Einnahmen`-Zeile der Zusammenfassung ein.

---

### 7.3 Ignorierte Einträge

Einzelne Künstler oder spezifische Releases können vollständig von der Abrechnung ausgeschlossen werden, ohne die Rohdaten zu löschen.

**Eintrags-Typen:**
- **Ganzer Künstler ignorieren:** Alle Transaktionen des Künstlers werden aus der Abrechnung entfernt.
- **Einzelnes Release ignorieren:** Nur Transaktionen eines bestimmten Release-Titels werden entfernt.

**Eintrag ignorieren:**
1. Gehe zu **Artists** oder **Process Cockpit**.
2. Klicke neben dem Künstler/Release auf das Ignore-Symbol (🚫).
3. (Optional) Trage eine Notiz ein, warum der Eintrag ignoriert wird.
4. Speichere.

Ignorierte Einträge erscheinen in einer separaten Liste unter **Ignored Entries** und können jederzeit wieder aktiviert werden.

---

## 8. Dashboard

Das Dashboard bietet eine sofortige Übersicht über den aktuellen Abrechnungszustand.

### Bento-Grid Kacheln

| Kachel | Beschreibung |
|--------|--------------|
| **Gesamter Nettoumsatz** | Summe aller Netto-Auszahlungen an Künstler (in EUR) |
| **Aktive Künstler** | Anzahl der Künstler mit positivem Umsatz |
| **Top-Plattform** | DSP mit dem höchsten Gesamtumsatz (z. B. Spotify) |
| **Geladene Dateien** | Anzahl der erfolgreich importierten CSV-Dateien |
| **Erkannter Zeitraum** | Automatisch erkannter Abrechnungszeitraum aus den CSV-Daten |

### Erkannter Abrechnungszeitraum

Ein Banner oben auf der Seite zeigt automatisch den Zeitraum an, der in den hochgeladenen CSV-Dateien erkannt wurde (z. B. „Januar – Juni 2025"). Dieser Wert wird als Standard-Zeitraum für die Exporte übernommen, kann aber manuell angepasst werden.

---

## 9. Process Cockpit

Das Process Cockpit zeigt die vollständig verarbeiteten Künstler-Daten in einer interaktiven Tabelle.

### Funktionen

| Funktion | Beschreibung |
|----------|--------------|
| **Suche** | Echtzeit-Textsuche nach Künstlernamen |
| **Sortierung** | Alle Spalten auf- oder absteigend sortierbar |
| **Filter** | Nach Plattform, Land, Quelle (Believe/Bandcamp) und Datumsbereich filtern |
| **Aufklappen** | Klicke auf einen Künstler, um die Aufschlüsselung nach Release, Plattform und Land zu sehen |
| **Künstlerbaum** | Hierarchische Ansicht: Künstler → Release → Track → Plattform |
| **Gruppenansicht** | Daten nach Künstler, Album, Song, Plattform, Land oder Monat gruppieren |

### Spaltenübersicht

| Spalte | Beschreibung |
|--------|--------------|
| Künstler | Name des Künstlers |
| Digitale Einnahmen | Umsatz aus Believe (Streaming/Download) |
| Physische Einnahmen | Umsatz aus physischen Verkäufen |
| Bandcamp-Einnahmen | Umsatz aus Bandcamp |
| Manuelle Einnahmen | Manuell hinzugefügte Einnahmen |
| Bruttoumsatz | Summe aller Einnahmen |
| Split % | Angewandter Split-Anteil |
| Netto-Auszahlung | Finaler Auszahlungsbetrag |

---

## 10. Analytics

Die Analytics-Seite bietet drei interaktive Diagramm-Bereiche:

### Plattform-Aufschlüsselung
- Balken- oder Kreisdiagramm der Umsätze nach DSP (Spotify, Apple Music, Amazon, Deezer, YouTube usw.)
- Absoluter EUR-Betrag und prozentualer Anteil pro Plattform

### Länder-Aufschlüsselung
- Umsatz nach Territorium (Land/Region)
- Hilfreich für internationale Umsatzstruktur und Steuerberichterstattung

### Monats-Trend
- Umsatzentwicklung über den gesamten Abrechnungszeitraum
- Linien- oder Balkendiagramm mit monatlichen Werten

### Interaktivität
- Klicke auf Legende-Einträge, um einzelne Datenreihen ein-/auszublenden
- Hovere über Datenpunkte für genaue Werte
- Alle Diagramme basieren auf den aktuell gefilterten und verarbeiteten Daten

---

## 11. Berichte & Export (Reports)

### 11.1 PDF-Einstellungen

Vor dem Export kannst du in der **PDF-Exporteinstellungen**-Leiste festlegen, welche Abschnitte im PDF enthalten sein sollen:

| Option | Beschreibung | Standard |
|--------|--------------|---------|
| **Release-Aufschlüsselung** | Tabelle mit allen Releases und deren Umsätzen | ✅ An |
| **Plattform-Aufschlüsselung** | Tabelle mit Umsätzen nach DSP | ✅ An |
| **Länder-Aufschlüsselung** | Tabelle mit Umsätzen nach Land | ❌ Aus |
| **Monats-Aufschlüsselung** | Tabelle mit monatlichen Umsätzen | ❌ Aus |
| **E-Mail-Anschreiben** | E-Mail-Vorlage als erste Seite | ❌ Aus |

### 11.2 Einzel-Export

**PDF exportieren:**
1. Gehe zu **Reports**.
2. Setze den **Abrechnungszeitraum** (von – bis Datum).
3. Klicke beim gewünschten Künstler auf das **PDF-Symbol** (🖨️).
4. Das PDF wird sofort im Browser heruntergeladen.

**Excel exportieren:**
1. Klicke auf das **Excel-Symbol** (📊) neben dem Künstler.
2. Eine `.xlsx`-Datei wird heruntergeladen.

**Excel-Arbeitsmappe enthält folgende Tabellenblätter:**
- **Summary** — Zusammenfassung aller Umsätze und der Netto-Auszahlung
- **Releases** — Release-Aufschlüsselung mit Umsatz und Verkaufsmengen
- **Platforms** — Plattform-Aufschlüsselung
- **Countries** — Länder-Aufschlüsselung
- **Monthly** — Monatliche Umsatzentwicklung

### 11.3 Massen-Export (Download All)

Mit **Download All** werden in einem Schritt alle Künstler-Statements als ZIP-Datei heruntergeladen.

**Ablauf:**
1. Klicke auf **Download All** (oder „Ausgewählte herunterladen" für eine Teilmenge).
2. Ein Fortschrittsbalken zeigt den Status jedes Künstlers an.
3. Nach Abschluss wird eine `.zip`-Datei heruntergeladen, die für jeden Künstler enthält:
   - `[Künstlername]_statement.pdf`
   - `[Künstlername]_statement.xlsx`

**Hinweis:** Die Verarbeitung erfolgt sequenziell, um den Browser nicht zu überlasten. Bei vielen Künstlern kann der Export einige Minuten dauern.

### PDF-Inhalt im Detail

Ein generiertes PDF enthält:

```
┌─────────────────────────────────────────────┐
│ [Label-Logo rechts] [Label-Adresse links]   │
│ Steuernummer · USt-IdNr.                    │
├─────────────────────────────────────────────┤
│ Rechnungsnummer: SOS-2025-KUNS              │
│ Abrechnungszeitraum: 01/2025 – 06/2025      │
├─────────────────────────────────────────────┤
│ GUTSCHRIFT / STATEMENT OF SALES             │
│ Künstler: Max Mustermann                    │
│ [USt-Infos / Reverse Charge falls relevant] │
├─────────────────────────────────────────────┤
│ Digitale Einnahmen:        1.234,56 €       │
│ Physische Einnahmen:          123,45 €      │
│ Manuelle Einnahmen:           200,00 €      │
│ Bruttoeinnahmen:           1.558,01 €       │
│ Label Vertriebsprovision: −  150,00 €       │
│ Recoupable Kosten:        −  300,00 €       │
│ Split-Prozentsatz:             70 %         │
│ Netto-Auszahlung:             774,61 €      │
│ [MwSt. falls anwendbar]                     │
├─────────────────────────────────────────────┤
│ [Release-Aufschlüsselung]                   │
│ [Plattform-Aufschlüsselung]                 │
│ [Länder-Aufschlüsselung]                    │
│ [Monats-Aufschlüsselung]                    │
├─────────────────────────────────────────────┤
│ [Footer: Bankdaten / Fußzeilentext] Seite 1 │
│ [NeuroStat-Logo unten links, 50% transparent]│
└─────────────────────────────────────────────┘
```

### Steuerliche Hinweise im PDF

Das PDF enthält automatisch den Pflichttext nach deutschem Umsatzsteuergesetz:

- **„Gutschrift im Sinne des Umsatzsteuergesetzes (§ 14 Abs. 2 UStG)"** — Pflichtausweis für Selbst-Abrechnungen (label-seitig ausgestellt)
- **Reverse Charge:** Bei EU-Künstlern außerhalb Deutschlands wird der Hinweis „Steuerschuldnerschaft des Leistungsempfängers (Reverse Charge, Art. 196 MwStSystRL)" eingefügt.
- **MwSt.-Berechnung:** Wird nur angezeigt, wenn ein Steuersatz > 0 konfiguriert ist.

---

## 12. Upload-Historie (History)

Die History-Seite protokolliert alle hochgeladenen Dateien als vollständiges Audit-Log.

**Angezeigte Informationen:**

| Spalte | Beschreibung |
|--------|--------------|
| Dateiname | Originaler Dateiname der hochgeladenen CSV |
| Typ | Quelle (Believe, Bandcamp, Shopify) |
| Upload-Zeitpunkt | Datum und Uhrzeit des Uploads |
| Verarbeitete Zeilen | Anzahl erfolgreich geparster Datenzeilen |
| Übersprungene Zeilen | Zeilen mit Parsing-Fehlern |
| Erkannte Künstler | Anzahl einzigartiger Künstler in der Datei |

**Hinweis:** Die historischen Einträge (Metadaten) sind persistent gespeichert. Die tatsächlichen CSV-Rohdaten werden **nicht** dauerhaft gespeichert — sie existieren nur während der aktiven Browser-Sitzung im Arbeitsspeicher.

---

## 13. Workspace-Verwaltung

Der **Workspace Manager** ermöglicht es, verschiedene Abrechnungszustände zu speichern und wiederherzustellen.

**Funktionen:**
- **Workspace speichern:** Sichert alle aktuellen Einstellungen, Mappings und verarbeiteten Daten als benannten Snapshot.
- **Workspace laden:** Stellt einen gespeicherten Zustand vollständig wieder her.
- **Workspace löschen:** Entfernt einen gespeicherten Snapshot.

**Anwendungsfall:** Erstelle für jedes Quartal oder jedes Jahr einen eigenen Workspace, um den Abrechnungsverlauf nachvollziehbar zu halten.

---

## 14. CSV-Formatreferenz

### Believe-Format

| Spalte | Pflicht | Beschreibung |
|--------|---------|--------------|
| Sales Month | ✅ | Abrechnungsmonat: `MM/YYYY` oder `YYYY-MM` |
| Platform | ✅ | DSP-Name (Spotify, Apple Music, usw.) |
| Country/Region | ✅ | Länderbezeichnung |
| Artist Name | ✅ | Hauptkünstler |
| Release title | ✅ | Album- oder Single-Titel |
| Track title | ✅ | Track-Titel |
| ISRC | ❌ | Für Deduplizierung |
| UPC/EAN | ❌ | Für Compilation-Filter |
| Catalog number | ❌ | Alternativ-Schlüssel für Compilation-Filter |
| Net Revenue | ✅ | Dezimalzahl (beliebiges Format) |
| Quantity | ❌ | Streams oder Download-Anzahl |
| Product type | ❌ | Audio Stream, Digital Download, Physical, usw. |

### Bandcamp-Format

| Spalte | Pflicht | Beschreibung |
|--------|---------|--------------|
| date | ✅ | Verkaufsdatum |
| artist | ✅ | Künstlername |
| album title | ❌ | Albumname |
| item title | ✅ | Track oder Album-Titel |
| net revenue | ✅ | Nettoeinnahme nach Bandcamp-Gebühren |
| currency | ❌ | Standard: EUR |

### Shopify-Format

| Spalte | Pflicht | Beschreibung |
|--------|---------|--------------|
| Order ID | ✅ | Eindeutige Bestell-ID |
| Order Date | ✅ | Bestelldatum |
| Product Title | ✅ | Produktname |
| SKU | ❌ | Lagereinheit |
| Quantity | ✅ | Verkaufte Stückzahl |
| Gross Revenue | ✅ | Bruttoerlös |
| Net Revenue | ✅ | Nettoerlös nach Gebühren |
| Currency | ❌ | Standard: EUR |

---

## 15. Häufige Fragen & Fehlerbehebung

### Meine CSV wird nicht erkannt

**Mögliche Ursachen:**
1. Die Datei hat eine unerwartete Kodierung (UTF-16 statt UTF-8). Konvertiere sie in einem Texteditor zu UTF-8.
2. Die Trennzeichen-Erkennung schlägt fehl. Überprüfe, ob die Datei Komma, Semikolon oder Tabulator als Trennzeichen verwendet.
3. Die Datei hat keine Kopfzeile. Believe-Exports enthalten immer eine Kopfzeile — bei Drittanbietern prüfen.

**Lösung:** Öffne die CSV in einem Texteditor und prüfe die Struktur der ersten 5 Zeilen.

---

### Künstler werden nicht korrekt zugeordnet

**Ursache:** Der Künstlername in der CSV weicht vom Namen in den Einstellungen ab (z. B. Groß-/Kleinschreibung, Sonderzeichen, Featuring-Zusätze).

**Lösung:** Erstelle unter **Settings → Artist Mapping** ein Mapping von der CSV-Schreibweise auf den korrekten Künstlernamen.

---

### Split-Prozentsatz wird nicht angewendet

**Ursache:** Der Künstlername im Split-Fee-Eintrag stimmt nicht genau mit dem verarbeiteten Namen überein.

**Lösung:** Stelle sicher, dass der Name im Split-Fee-Eintrag exakt dem Künstlernamen entspricht, der nach dem Artist Mapping angezeigt wird (Groß-/Kleinschreibung beachten).

---

### Das Label-Logo erscheint nicht im PDF

**Mögliche Ursachen:**
1. Das Logo-Format wird nicht unterstützt (nur PNG, JPG, SVG, WebP).
2. Die Datei überschreitet 5 MB.
3. Das Logo-Daten-URL ist beschädigt.

**Lösung:** Lade das Logo erneut hoch und stelle sicher, dass es eines der unterstützten Formate hat und kleiner als 5 MB ist.

---

### Berechnungen erscheinen falsch

**Checkliste:**
1. Ist der Compilation Filter korrekt eingestellt? Ungewollte Filter können Umsätze ausblenden.
2. Sind Ignorierte Einträge aktiv, die versehentlich Umsätze ausschließen?
3. Stimmt der Split-Prozentsatz? Prüfe unter Settings → Split Fees.
4. Gibt es Ausgaben/Vorschüsse, die den Betrag reduzieren?

---

### Der Massen-Export dauert sehr lange

**Erklärung:** Der Massen-Export (Download All) verarbeitet Künstler sequenziell, um den Browser-Hauptthread nicht zu blockieren. Bei vielen Künstlern (> 20) kann dies mehrere Minuten dauern.

**Empfehlung:** Exportiere für sehr große Label-Rosters einzelne Künstler in kleinen Gruppen oder nutze die „Ausgewählte exportieren"-Funktion.

---

### Daten nach Seiten-Reload verschwunden

**Erklärung:** Einstellungen, Mappings und Branding-Daten sind in IndexedDB persistent gespeichert — sie überleben einen Browser-Reload.

**CSV-Daten sind nicht persistent:** Die hochgeladenen CSV-Rohdaten werden **nur im Arbeitsspeicher** gehalten und gehen beim Reload verloren. Du musst die CSV-Dateien nach einem Reload erneut hochladen.

**Empfehlung:** Nutze den **Workspace Manager**, um den aktuellen Verarbeitungszustand zu sichern.

---

*Dieses Handbuch entspricht NeuroStat Version 1.0.0 | Software powered by Neuroklast*
