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
   - 7.4 [Track-Revenue-Zuweisungen](#74-track-revenue-zuweisungen)
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
| **Künstler-Roster** | `.csv` | Künstler-Stammdaten importieren (Name, E-Mail, MwSt. usw.) |

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

### Künstler-Roster-CSV-Import

Du kannst deine vollständigen Künstler-Stammdaten direkt aus der Ingest-Ansicht neben den Umsatz-CSVs importieren.

**Erforderliches CSV-Format:**

| Spalte | Pflicht | Beschreibung |
|--------|---------|--------------|
| `name` | ✅ | Künstlername |
| `email` | ❌ | Kontakt-E-Mail |
| `vatNumber` | ❌ | EU-Umsatzsteuer-ID |
| `isEuNonGerman` | ❌ | `true` / `false` — EU-Künstler außerhalb Deutschlands |
| `notes` | ❌ | Interne Vermerke |

NeuroStat erkennt Künstler-Roster-CSVs automatisch anhand einer `name`-Spalte plus mindestens einem Begleitfeld (`email`, `vatNumber`, `isEuNonGerman`, `notes`). Solche Dateien werden direkt als Künstler-Stammdaten importiert — ohne zusätzlichen Dialog. Dateien, die nicht dem Muster entsprechen, werden wie gewohnt an den Spalten-Mapping-Dialog weitergeleitet.

### Technische Details zur CSV-Verarbeitung

Der eingebaute Parser handhabt:
- **BOM** (Byte Order Mark) — kein manuelles Entfernen nötig
- **Verschiedene Trennzeichen** — Komma, Semikolon, Tabulator werden automatisch erkannt
- **Wissenschaftliche Notation** — z. B. `1.23e-4` bei sehr kleinen Beträgen
- **Gequotete Header** — Spaltenüberschriften mit Anführungszeichen
- **Dezimaltrennzeichen** — Punkt und Komma werden erkannt

### Wechselkurshandhabung

NeuroStat verwendet die **Frankfurter API** (basierend auf den Referenzkursen der
Europäischen Zentralbank) für alle Währungsumrechnungen. Bandcamp ist die einzige
Quelle, die Einnahmen in Nicht-EUR-Währungen (USD, GBP usw.) ausweist.

**Historische Monatsdurchschnittskurse**

Sobald der Abrechnungszeitraum aus den hochgeladenen CSV-Dateien erkannt wird,
lädt die Anwendung automatisch den offiziellen EZB-Monatsdurchschnittskurs für
jeden Monat des Zeitraums. Jede Bandcamp-Transaktion wird anschließend zu dem
amtlichen Durchschnittskurs des Monats in EUR umgerechnet, in dem der Verkauf
stattgefunden hat.

Dieses Vorgehen entspricht der buchhalterischen Standardmethode für rückwirkende
Abrechnungen: Die EZB veröffentlicht Kurse an jedem Handelstag, und der
Monatsdurchschnitt ergibt den anerkannten **monatlichen Referenzkurs**.

Wenn die Frankfurter API nicht verfügbar ist (z. B. offline oder für unvollständige
Monate), werden automatisch Fallback-Näherungskurse verwendet und eine Warnung
angezeigt.

Der Abruf erfolgt automatisch nach der Dateiverarbeitung und erfordert keine
Benutzeraktion. Die Schaltfläche **Wechselkurse aktualisieren** in der Ingest-Ansicht
lädt sowohl die aktuellen Kurse als auch die historischen Monatsdurchschnitte für
den aktiven Abrechnungszeitraum neu.

---

## 6. Einstellungen (Settings)

### 6.1 Split Fees

Split Fees legen fest, welchen Prozentsatz des **Nettoumsatzes** (nach Abzug von Vertriebsprovisionen und Ausgaben) ein Künstler erhält.

Die Engine verwendet **zwei vollständig unabhängige Systeme**, die parallel laufen:

---

#### System A — Hauptkette (Digital- & Physisch-Umsatz)

Wird angewendet, wenn für den jeweiligen Umsatztyp **kein Bucket-Split** konfiguriert ist. Die folgende Prioritätskette wird von niedrigster bis höchster Priorität geprüft — der erste explizit gesetzte Wert gewinnt:

| Priorität | Einstellung | Wo konfigurieren |
|-----------|-------------|-----------------|
| 1 (niedrigste) | **Standard-Splitrate** | Settings → Defaults → Default Split % |
| 2 | **Digital-spezifischer Standard** | Settings → Defaults → Digital Split % |
| 2 | **Physisch-spezifischer Standard** | Settings → Defaults → Physical Split % |
| 3 | **Künstler-Basis-Prozentsatz** | Settings → Split Fees → Künstler-Basis |
| 4 | **Künstler Digital / Physisch %** | Settings → Split Fees → Typ-Override |
| 5 (höchste) | **Release-Override** | Settings → Split Fees → Release-Overrides |

> **Beispiel:** Standard = 50 %, Digital-Standard = 60 %, Künstler-Basis = 70 %, Künstler-Digital = 80 %  
> → Digitale Auszahlung: **80 %** (Künstler-Digital gewinnt).  
> → Physische Auszahlung: **70 %** (Künstler-Basis, kein Physisch-Override gesetzt).

---

#### System B — Bucket Splits (parallel, unabhängig)

Konfiguriert unter **Settings → Defaults → Source Split Rates**. Jeder Bucket-Split ist eine **Label-weite Festrate** für eine bestimmte Einnahmequelle. Er ist **vollständig unabhängig** von der Hauptkette und wird **nur aktiviert, wenn er explizit gesetzt ist**:

| Bucket | Einstellungsschlüssel | Abgedeckte Einnahmen |
|--------|-----------------------|----------------------|
| `believe` | Believe Split % | Believe Streaming & Download |
| `bandcamp` | Bandcamp Split % | Bandcamp-Verkäufe |
| `physical` | Physical Split % | Physische Releases (Shopify / Printful) |
| `darkmerch` | Darkmerch Split % | Darkmerch / Merchandise |

**Regeln wenn ein Bucket-Split GESETZT ist:**
- Die Hauptkette wird für diesen Bucket **vollständig umgangen**.
- Künstler-Basis-% und Typ-% (Digital/Physisch) werden **nicht** angewendet — **außer beim Physical-Bucket** (siehe unten).
- Der einzige Weg, einen Bucket-Split für einen einzelnen Künstler zu überschreiben, ist ein **Künstler-spezifischer Source-Override** für genau diese Quelle (z. B. ein `believe` Source-Override).
- **Believe und Bandcamp sind unabhängige Buckets:** `sourceSplits.believe` gilt nur für digitale Einnahmen aus Believe-Transaktionen; `sourceSplits.bandcamp` gilt nur für digitale Einnahmen aus Bandcamp-Transaktionen. Die Einstellung eines Buckets hat keinen Einfluss auf den anderen — beide können unterschiedliche Raten haben. Digitale Einnahmen aus anderen Quellen verwenden stets die Hauptkette.

**Priorität im Physical-Bucket (wenn `sourceSplits.physical` gesetzt ist):**

| Priorität | Einstellung | Gewinnt wenn … |
|-----------|-------------|----------------|
| 1 (höchste) | Künstler-spezifischer Source-Override (shopify / printful) | Immer |
| 2 | **Künstler-spezifische Physical %** (Split Fees → Künstler) | Explizit beim Künstler gesetzt |
| 3 | General Settings Physical Split % | Kein künstler-spezifischer Physical-%-Wert gesetzt |
| 4 | Hauptketten-Fallback | Nichts anderes konfiguriert |

> Wenn ein Künstler eine explizite **Physical %** in den Split Fees (Blackbook) konfiguriert hat, hat dieser Wert Vorrang vor der General Settings Physical Split %. Der General-Settings-Wert gilt nur, wenn beim Künstler kein expliziter Physical-Prozentsatz gesetzt ist.

**Regeln wenn ein Bucket-Split NICHT gesetzt ist:**
- Der Bucket verwendet die normale Hauptkette (System A) — Künstler-Einstellungen gelten wie gewohnt.

> **Typischer Anwendungsfall:** Darkmerch auf 100 % setzen → Künstler behalten alle Merchandise-Einnahmen, unabhängig von ihrem allgemeinen Splitvertrag. Physical auf 15 % setzen → Label behält 85 % der physischen Verkäufe als Label-Richtlinie, aber einzelne Künstler können ihren eigenen Physical-Satz durch die **Physical %**-Einstellung in Split Fees behalten.

---

#### Berechnungsformel

```
Netto-Auszahlung = (Bruttoumsatz − Vertriebsprovision − Ausgaben) × (Effektiver Split% / 100)
```

**Beispiel:**
- Bruttoumsatz: 1.000 €
- Vertriebsprovision: 150 €
- Vorschuss: 200 €
- Split: 70 %
- → Netto-Auszahlung = (1.000 − 150 − 200) × 0,70 = **455 €**

---

**Künstler-Splits einrichten:**
1. Gehe zu **Settings → Split Fees**.
2. Nutze die Checkbox **Alle Künstler auswählen** oben in der Liste, um alle Künstler auf einmal zu selektieren oder zu deselektieren, oder klicke einzelne Künstler an.
3. Klicke auf **Künstler hinzufügen** oder wähle einen bestehenden.
4. Trage den Basis-Prozentsatz ein (0–100). Optional separate Digital- und Physisch-Prozentsätze setzen.
5. Speichere.

**Bucket-Splits einrichten:**
1. Gehe zu **Settings → Defaults → Source Split Rates**.
2. Trage die Rate für den relevanten Bucket ein (z. B. Darkmerch = 100).
3. Lasse ein Feld leer, um für diesen Bucket auf die Hauptkette zurückzufallen.

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

#### Split-Raten-Standards

| Einstellung | Beschreibung |
|-------------|--------------|
| **Default Split %** | Basis-Splitrate für alle Künstler und alle Umsatztypen (0–100). Wird verwendet, wenn keine spezifischere Einstellung konfiguriert ist. |
| **Digital Split %** | Override für digitale Einnahmen (Streaming, Downloads). Überschreibt Default Split %. Teil der Hauptkette. |
| **Physical Split %** | Override für physische Release-Einnahmen. Überschreibt Default Split %. Teil der Hauptkette. |

#### Bucket-Split-Raten (Source Split Rates)

Diese sind **unabhängig** von der Hauptkette. Siehe [Abschnitt 6.1 — System B](#system-b--bucket-splits-parallel-unabhängig) für die vollständige Erklärung.

| Einstellung | Beschreibung |
|-------------|--------------|
| **Believe Split %** | Festrate nur für Believe-Digitaleinnahmen. Leer lassen → Hauptkette gilt. |
| **Bandcamp Split %** | Festrate nur für Bandcamp-Digitaleinnahmen. Leer lassen → Hauptkette gilt. Beide können auf unterschiedliche Werte gesetzt werden; sie werden unabhängig voneinander angewendet. |
| **Physical Split %** | Festrate für physische Releases. Leer lassen → Hauptkette gilt. |
| **Darkmerch Split %** | Festrate für Merchandise-Einnahmen. Leer lassen → Hauptkette gilt. |

#### Sonstige Standards

| Einstellung | Beschreibung |
|-------------|--------------|
| Finanz-E-Mail | E-Mail-Adresse für Auszahlungsanfragen |
| Abrechnungs-Deadline | Standarddatum für Zahlungsfristen |
| Spendenorganisation | Name einer Royalty-Spendenorganisation (für E-Mail-Vorlagen) |

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

Die Artists-Seite bietet einen vollständigen Roster aller Künstler mit erweiterten Verwaltungsfunktionen. Die Seite ist in zwei Tabs unterteilt:

- **Stammdaten** — Künstler-Roster (`ArtistTreeView` + `LabelArtistManager`): Name, E-Mail, USt-IdNr., EU-Status, Notizen und CSV-Import.
- **Abrechnungsregeln** — Abrechnungsregeln (`SplitFeeManager` + `ArtistMappingManager`): Split-Anteile, Alias-/Gruppen-Mappings.

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

**Eintrag hinzufügen (Process Cockpit → Ignorierte Einträge):**
1. Wähle im **Künstler**-Dropdown den gewünschten Künstler aus. Die Volltextsuche filtert die Auswahlliste sofort beim Tippen.
2. *(Optional)* Wähle im **Release-Titel**-Dropdown einen bestimmten Release. Die Liste wird automatisch auf Releases des gewählten Künstlers (inkl. Kollaborationen und Features) eingeschränkt. Lässt du dieses Feld leer, werden **alle** Releases dieses Künstlers ignoriert.
3. *(Optional)* Trage eine Notiz ein, warum der Eintrag ignoriert wird.
4. Klicke auf **Ignorierten Eintrag hinzufügen**.

Ignorierte Einträge erscheinen in einer separaten Liste und können jederzeit durch Klick auf das Papierkorb-Symbol entfernt werden.

> **Hinweis:** Der Panel „Ignorierte Einträge" befindet sich im **Process Cockpit**, nach der Karte „Wiedereinsparbare Kosten".

---

### 7.4 Track-Revenue-Zuweisungen

Mit **Track-Revenue-Zuweisungen** kannst du die Revenue eines bestimmten Tracks oder Releases anteilig auf einen oder mehrere Miteigentümer-Künstler aufteilen – **bevor** der Label-Split oder Kosten abgezogen werden. Das ist besonders nützlich für Kollaborations-Releases (z. B. ein Release, das zwei Künstlern zu gleichen Teilen gehört) oder für Releases, bei denen die CSV einen kombinierten Künstlernamen enthält.

**Funktionsweise:**
- Du definierst einen **Release- / Track-Titel (Teilstring, Groß-/Kleinschreibung egal)** und einen oder mehrere **Miteigentümer-Künstler mit Prozentanteilen**.
- Jede Transaktion, deren `release_title` oder `track_title` den Teilstring enthält, wird zugeordnet.
- Bei einem **einzigen Eigentümer** (100%) wird die Transaktion vollständig diesem Künstler zugeschrieben – sie erscheint nur in seinem Statement.
- Bei **mehreren Eigentümern** wird die Transaktion geklont und anteilig skaliert. Jeder Eigentümer-Anteil durchläuft dann unabhängig die Label-Split- und Kosten-Pipeline.
- Bei mehreren passenden Regeln gewinnt die erste.
- **Invariante:** Die Prozentanteile aller Eigentümer einer Regel müssen zusammen genau 100% ergeben.
- Das Release-Dropdown zeigt Releases für **Haupt- UND Featured-Auftritte** des gewählten Eigentümer-Künstlers. Wenn z. B. „Künstler B" als Featuring-Künstler in „Künstler A feat. Künstler B – Album X" erscheint, wird dieses Release ebenfalls im Dropdown angezeigt, wenn Künstler B als Eigentümer ausgewählt wird.

**Mehrere Eigentümer (`owners`-Array, neu):**

Jede Zuweisung kann ein `owners`-Array mit Einträgen wie diesem haben:
```json
{ "artist": "Künstler A", "percentage": 60 }
{ "artist": "Künstler B", "percentage": 40 }
```
Die Revenue wird anteilig aufgeteilt (60% → Künstler A, 40% → Künstler B), bevor Vertriebsgebühren oder Kosten abgezogen werden.

**Ältere Einzeleigentümer-Zuweisungen** (vor diesem Feature erstellt) werden automatisch wie `owners: [{ artist: ownerArtist, percentage: 100 }]` behandelt – keine Migration erforderlich.

**Mehrere Eigentümer hinzufügen (Process Cockpit → Track-Revenue-Zuweisungen):**
1. Gehe zum **Process Cockpit**.
2. Scrolle zur Karte **Track-Revenue-Zuweisungen**.
3. Wähle im Feld **Release- / Track-Titel** den gewünschten Release. Wenn du einen bekannten Release aus dem Dropdown wählst, werden die Eigentümer-Zeilen **automatisch vorbelegt** — mit allen beteiligten Künstlern (Haupt- und Featuring-Künstler) zu gleichen Anteilen.
4. Passe die Künstler und Prozentsätze in den Eigentümer-Zeilen nach Bedarf an.
5. Klicke auf **Beteiligten hinzufügen**, um weitere Eigentümer-Zeilen anzuhängen.
6. Beachte den **Prozentzahl-Indikator** — er wird grün, sobald die Summe genau 100% ergibt.
7. Klicke auf **Zuweisung hinzufügen** (nur aktiv, wenn die Summe 100% beträgt und ein Release-Titel gesetzt ist).

**Zuweisung entfernen:** Fahre über den Eintrag und klicke auf das Papierkorb-Symbol.

> **Hinweis:** Der Panel „Track-Revenue-Zuweisungen" befindet sich im **Process Cockpit**, nach der Karte „Ignorierte Einträge".
> Die Revenue-Aufteilung erfolgt auf Pipeline-Ebene, vor Label-Split und Kosten. Jeder Miteigentümer-Anteil unterliegt dann unabhängig seinen konfigurierten Split-Fees und Kostenregeln. Die Anzeige in der Listenansicht zeigt die Anteile: z. B. `„Künstler A 60% / Künstler B 40%"`.

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

### Negative Auszahlungen

Wenn Ausgaben oder Vorschüsse den Umsatz-Anteil eines Künstlers übersteigen, wird die resultierende **negative Netto-Auszahlung** im Process Cockpit und im PDF-Statement **fett und rot** dargestellt (z. B. `– 3.210,49 €`). Dies spiegelt den offenen, nicht rekoupierten Betrag exakt wider. Künstler mit null oder negativer Auszahlung werden automatisch aus SEPA-Batch-Exporten ausgeschlossen.

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

Der **Workspace Manager** ermöglicht es, alle Einstellungen als eine einzige JSON-Sicherungsdatei (`sos_workspace_backup.json`) zu exportieren und zu importieren.

### Was im Backup enthalten ist (Schema v2)

| Einstellung | Beschreibung |
|---|---|
| Kompilationsfilter | Regeln zum Ausschluss von Releases |
| Künstler-Mappings | Featuring-Name → Hauptkünstler-Aliase |
| Split-Gebühren | Royalty-Prozentsätze pro Künstler |
| Manuelle Erlöse | Manuell eingetragene Umsatzeinträge |
| CSV-Spalten-Aliase | Benutzerdefinierte Spaltenzuordnungen |
| Label-Info | Label-Name, Adresse, Branding |
| Label-Künstler | Label-Roster |
| Ignorierte Einträge | Von Abrechnungen ausgeschlossene Einträge |
| Track-Erlös-Zuordnungen | Release-zu-Künstler-Umsatzregeln |
| Physische Umsätze ausschließen | Schalter für Physical-Erlöse |
| Gast-Auszahlungsregeln | Auszahlungsanteile für Featured Artists |
| App-Standardwerte | Standard-Split %, Distributionsgebühr, Rechnungseinstellungen usw. |
| PDF-Exporteinstellungen | Welche Abschnitte im exportierten PDF erscheinen |
| E-Mail-Konfiguration | Absendername, Absender-E-Mail, Antwortadresse |
| CSV-Importprofile | Benutzerdefinierte CSV-Spaltenprofile |

> **Nicht enthalten:** Hochgeladene CSV-Dateien und Ausgabeneinträge – diese sind periodenspezifische Transaktionsdaten, keine Konfiguration.

### Exportieren

1. Gehe zu **Einstellungen → App & System**.
2. Klicke auf **Workspace exportieren**.
3. Die Datei `sos_workspace_backup.json` wird auf dein Gerät heruntergeladen.

### Importieren

1. Gehe zu **Einstellungen → App & System**.
2. Klicke auf **Workspace importieren**.
3. Wähle deine `sos_workspace_backup.json`-Datei aus.
4. Alle oben aufgeführten Einstellungen werden sofort wiederhergestellt.

> ⚠️ **Warnung:** Der Import überschreibt alle aktuellen Einstellungen unwiderruflich.

### Rückwärtskompatibilität

Backup-Dateien, die mit dem alten Schema (v1) exportiert wurden, können weiterhin importiert werden. Fehlende v2-Felder werden automatisch mit den Anwendungsstandards befüllt.

**Anwendungsfall:** Erstelle ein Backup, wenn du einen Abrechnungszeitraum abschließt, damit du deine genaue Konfiguration für jedes Quartal oder Jahr wiederherstellen kannst.

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
| date | ✅ | Verkaufsdatum (Format M/D/YY wie Bandcamp exportiert) |
| artist | ✅ | Künstlername |
| item name | ✅ | Album- oder Track-Titel |
| **net amount** | ✅ | **Nettoeinnahme pro Transaktion** (die Auszahlung des Labels nach Bandcamp-Gebühren — diese Spalte wird für alle Berechnungen verwendet) |
| currency | ❌ | Standard: EUR |
| package | ✅ | Produkt-Bezeichner für die Physisch/Digital-Klassifizierung (s. u.) |

#### Physisch vs. Digital (Bandcamp)

Die Spalte `package` bestimmt, ob eine Bandcamp-Transaktion ein digitaler Download oder ein physisches Produkt ist:

| Wert in `package` | Klassifizierung | Split-Bucket |
|------------------|-----------------|--------------|
| Enthält das Wort **„digital"** (z. B. `digital download`, `digital bundle`) | Digitaler Download | Digital-Split |
| Jeder andere Wert (z. B. `Limited Digipac CD`, `BLACKBOOK Confession T-Shirt`, `Jewelcase 2CDs`) | **Physisches Produkt** | Physisch-Split (wie Believe Physical) |

> **Hinweis:** Die Spalte „balance of revenue share (EUR)" ist der kumulierte Laufendsaldo der
> Verwertungsgesellschaft — sie ist **nicht** die Transaktion-Nettoeinnahme und wird bei der
> Verarbeitung ignoriert. Bitte immer den Standard-Bandcamp-CSV-Export verwenden, der die
> Spalte `net amount` enthält.

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

**Ursache 1:** Der Künstlername im Split-Fee-Eintrag stimmt nicht genau mit dem verarbeiteten Namen überein.

**Lösung:** Stelle sicher, dass der Name im Split-Fee-Eintrag exakt dem Künstlernamen entspricht, der nach dem Artist Mapping angezeigt wird (Groß-/Kleinschreibung beachten).

---

### Das PDF zeigt eine Splitrate, die ich nicht erwartet habe

**Die Split-Engine verwendet zwei unabhängige Systeme. Prüfe, welches für deinen Fall aktiv ist:**

**Fall A — Bucket-Split ist gesetzt (z. B. Darkmerch 100 %, Physical 15 %):**
- Gehe zu **Settings → Defaults → Source Split Rates**.
- Wenn dort ein Wert für den entsprechenden Bucket (Darkmerch, Physical, Believe, Bandcamp) konfiguriert ist, gilt diese Rate direkt — die Hauptkette und Künstler-Basis-% werden **umgangen**.
- **Ausnahme beim Physical-Bucket:** Wenn der Künstler eine explizite **Physical %** in den Split Fees gesetzt hat, hat dieser Wert Vorrang vor der General Settings Physical Split %. Nur ein Source-Override (shopify / printful) schlägt ihn noch.
- Um einen Bucket-Split für einen einzelnen Künstler zu überschreiben: Bei Darkmerch/Believe/Bandcamp füge einen **Source-Override** unter Settings → Split Fees hinzu. Bei Physical kannst du auch direkt die **Physical %** des Künstlers in Split Fees setzen.

**Fall B — Kein Bucket-Split konfiguriert:**
- Die Hauptkette gilt: Default Split % → Digital/Physisch Split % → Künstler-Basis → Künstler-Typ → Release.
- Prüfe jede Ebene der Reihe nach. Der höchste explizit gesetzte Wert in der Kette gewinnt.

**Schnell-Checkliste:**
1. Ist ein Bucket-Split konfiguriert? (**Settings → Defaults → Source Split Rates**)
2. Wenn ja und es ist der **Physical**-Bucket: Hat der Künstler eine **Physical %** in Split Fees gesetzt? Wenn ja, hat diese Vorrang vor der General Settings Physical Split %.
3. Wenn ja (kein Physical-Bucket): Hat der Künstler einen **Source-Override** für diesen Bucket? (Settings → Split Fees → Source-Overrides)
4. Wenn kein Bucket-Split: Ist der Künstler-Split-Fee korrekt konfiguriert?
5. Gibt es Ausgaben/Vorschüsse, die die Auszahlung reduzieren?

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
