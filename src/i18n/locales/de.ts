/**
 * German translations for SOS Generator.
 * Must match the structure of the English translation file exactly.
 */
import type { TranslationKeys } from './en'

export const de: TranslationKeys = {
  // ── Navigation ──────────────────────────────────────────────────────────────
  nav: {
    dashboard: 'Dashboard',
    ingestion: 'Ingestion',
    cockpit: 'Cockpit',
    analytics: 'Analyse',
    artists: 'Künstler',
    reports: 'Berichte',
    settings: 'Einstellungen',
    history: 'Verlauf',
    branding: 'Branding',
    labelSuite: 'Label Suite',
  },

  // ── Step Navigation (Workflow) ──────────────────────────────────────────────
  steps: {
    upload: 'Hochladen',
    cockpit: 'Cockpit',
    analyze: 'Analysieren',
    export: 'Exportieren',
  },

  // ── Common UI Elements ──────────────────────────────────────────────────────
  common: {
    ready: 'Bereit',
    processing: 'Verarbeitung…',
    parserReady: 'Parser bereit',
    export: 'Exportieren',
    cancel: 'Abbrechen',
    save: 'Speichern',
    add: 'Hinzufügen',
    remove: 'Entfernen',
    delete: 'Löschen',
    upload: 'Hochladen',
    download: 'Herunterladen',
    import: 'Importieren',
    search: 'Suchen',
    close: 'Schließen',
    confirm: 'Bestätigen',
    apply: 'Anwenden',
    edit: 'Bearbeiten',
    clear: 'Leeren',
    back: 'Zurück',
    next: 'Weiter',
    copyArtistName: 'Künstlername kopieren',
    searchPlaceholder: 'Künstler suchen…',
    file: 'Datei',
    files: 'Dateien',
  },

  // ── Dashboard View ──────────────────────────────────────────────────────────
  dashboard: {
    title: 'Dashboard',
    netRevenue: 'Nettoeinnahmen',
    activeArtists: 'Aktive Künstler',
    topPlatform: 'Top-Plattform',
    filesLoaded: 'Dateien geladen',
    quickActions: 'Schnellzugriff',
    workflowProgress: 'Workflow-Status',
    currentStep: 'Aktueller Schritt',
    readyToExport: 'Bereit zum Exportieren',
    uploadFiles: 'Dateien hochladen',
    viewAnalytics: 'Analyse anzeigen',
    exportReports: 'Berichte exportieren',
    recentActivity: 'Letzte Aktivität',
    noFilesUploaded: 'Noch keine Dateien hochgeladen',
    getStartedByUploading: 'Starten Sie, indem Sie Ihre CSV-Dateien hochladen',
  },

  // ── Ingestion View ──────────────────────────────────────────────────────────
  ingest: {
    uploadCSVFiles: 'CSV-Dateien hochladen',
    configureStatementPeriod: 'Abrechnungszeitraum konfigurieren',
    periodStart: 'Zeitraum Beginn',
    periodEnd: 'Zeitraum Ende',
    periodApplied: 'Zeitraum aus CSV-Daten übernommen',
    manualRevenueAndExpenses: 'Manuelle Einnahmen & Ausgaben',
    refreshExchangeRates: 'Wechselkurse aktualisieren',
    updatingExchangeRates: 'Wechselkurse werden aktualisiert…',
    exchangeRatesUpdated: 'Wechselkurse aktualisiert',
    exchangeRatesFailed: 'Fehler beim Aktualisieren der Wechselkurse',
    detectedPeriodBanner: 'Abrechnungszeitraum automatisch aus CSV-Daten erkannt',
    applyDetectedPeriod: 'Diesen Zeitraum übernehmen',
  },

  // ── Process Cockpit View ────────────────────────────────────────────────────
  process: {
    title: 'Prozesskontrolle',
    filesLoaded: 'Dateien geladen',
    uniqueArtists: 'Einzelne Künstler',
    totalPayout: 'Gesamtauszahlung',
    excludePhysical: 'Physische Merch ausschließen',
    compilationExclusions: 'Compilation-Ausschlüsse',
    artistMappings: 'Künstler-Zuordnungen',
    manualRevenue: 'Manuelle Einnahmen',
    expenses: 'Ausgaben',
    masterTable: 'Master-Tabelle',
    searchPlaceholder: 'Künstler suchen…',
    noArtistsFound: 'Keine Künstler gefunden',
    sortByArtist: 'Nach Künstlername sortieren',
    sortByQuantity: 'Nach Gesamtmenge sortieren',
    sortByRevenue: 'Nach Gesamteinnahmen sortieren',
    sortByFinalAmount: 'Nach Endbetrag sortieren',
  },

  // ── Analytics View ──────────────────────────────────────────────────────────
  analytics: {
    title: 'Analyse',
    overview: 'Übersicht',
    revenueDashboard: 'Einnahmen-Dashboard',
    noDataAvailable: 'Keine Daten verfügbar',
    uploadFilesToStart: 'Dateien hochladen, um mit der Analyse zu beginnen',
  },

  // ── Artists View ────────────────────────────────────────────────────────────
  artists: {
    title: 'Künstler',
    labelRoster: 'Label-Künstler',
    artistMappings: 'Künstler-Zuordnungen',
    splitFees: 'Split-Anteile',
    collaborations: 'Kollaborationen',
    noArtistsYet: 'Noch keine Künstler',
    uploadFilesToDiscover: 'Dateien hochladen, um Künstler zu finden',
  },

  // ── Reports View ────────────────────────────────────────────────────────────
  reports: {
    title: 'Berichte',
    exportOptions: 'Export-Optionen',
    downloadAll: 'Alle herunterladen',
    downloadSelected: 'Ausgewählte herunterladen',
    exportPDF: 'PDF exportieren',
    exportExcel: 'Excel exportieren',
    noReportsAvailable: 'Keine Berichte verfügbar',
    uploadFilesToGenerate: 'Dateien hochladen, um Berichte zu generieren',
    selectArtists: 'Künstler auswählen',
    allArtistsSelected: 'Alle Künstler ausgewählt',
  },

  // ── Settings View ───────────────────────────────────────────────────────────
  settings: {
    title: 'Einstellungen',
    workspace: 'Workspace',
    rules: 'Regeln',
    exportSettings: 'Export-Einstellungen',
    dangerZone: 'Gefahrenbereich',
    clearWorkspace: 'Workspace leeren',
    clearWorkspaceConfirm: 'Möchten Sie den Workspace wirklich leeren? Alle hochgeladenen Dateien und manuellen Einträge werden entfernt.',
    clearAllStorage: 'Kompletten Speicher löschen',
    clearAllStorageConfirm: 'Dies löscht ALLE Daten einschließlich Einstellungen, Regeln und Konfigurationen. Diese Aktion kann nicht rückgängig gemacht werden.',
    workspaceCleared: 'Workspace geleert',
    workspaceDescription: 'Alle Dateien und manuellen Einnahmen entfernt. Bereit für einen neuen Zeitraum.',
    allStorageCleared: 'Kompletter Speicher geleert – Seite wird neu geladen…',
    storageClearFailed: 'Speicher konnte nicht vollständig gelöscht werden. Bitte erneut versuchen.',
    applyDefaultSplitToAll: 'Standard-Split auf alle Künstler anwenden',
    tabAppSystem: 'App-System',
    tabLabelProfile: 'Label-Profil',
    tabExportRules: 'Export & Regeln',
    tabCsvProfiles: 'CSV-Profile',
    clearWorkspaceTitle: 'Workspace leeren & Neuen Zeitraum beginnen',
    clearWorkspaceDescription: 'Entfernt alle hochgeladenen CSV-Dateien, manuellen Einnahmeeinträge und den aktuellen Abrechnungszeitraum. Label-Einstellungen, Split-Raten und Künstler-Zuordnungen bleiben erhalten. Verwenden Sie dies am Ende eines Quartals, um neu zu beginnen.',
    clearWorkspaceAreYouSure: 'Sind Sie sicher? Dies kann nicht rückgängig gemacht werden.',
    confirmClearEverything: 'Ja, alles löschen',
    clearAll: 'Alles löschen',
    clearAllStorageDescription: 'Löscht <strong>alle gespeicherten Daten</strong> (CSV-Dateien, Split-Raten, Künstler-Zuordnungen, Label-Einstellungen, Abrechnungszeitraum und andere Konfigurationsdaten). Die Seite wird danach neu geladen. <strong>Diese Aktion ist unwiderruflich.</strong>',
    clearAllStorageAreYouSure: 'Wirklich alles löschen? Dies kann nicht rückgängig gemacht werden!',
    excludePhysicalProducts: 'Physische Produkte ausschließen',
    excludePhysicalDescription: 'Physische Verkäufe (CD, Vinyl…) von Erlösberechnungen ausschließen.',
  },

  // ── History View ────────────────────────────────────────────────────────────
  history: {
    title: 'Verlauf',
    fileHistory: 'Datei-Upload-Verlauf',
    noHistory: 'Noch kein Upload-Verlauf',
    uploadFilesToSeeHistory: 'Dateien hochladen, um Verlauf anzuzeigen',
    clearHistory: 'Verlauf löschen',
    historyCleared: 'Upload-Verlauf gelöscht',
  },

  // ── Branding View ───────────────────────────────────────────────────────────
  branding: {
    title: 'Branding',
    labelInformation: 'Label-Informationen',
    logoSettings: 'Logo-Einstellungen',
    uploadLogo: 'Logo hochladen',
    removeLogo: 'Logo entfernen',
    labelName: 'Label-Name',
    labelAddress: 'Label-Adresse',
  },

  // ── Toast Messages ──────────────────────────────────────────────────────────
  toast: {
    // Compilation filters
    compilationAdded: 'Compilation-Ausschluss hinzugefügt',
    compilationsAdded: '{{count}} Compilation-Ausschlüsse{{plural}} hinzugefügt',
    compilationRemoved: 'Compilation-Ausschluss entfernt',
    
    // Artist mappings
    artistMappingAdded: 'Künstler-Zuordnung hinzugefügt',
    artistMappingRemoved: 'Künstler-Zuordnung entfernt',
    artistMappingUpdated: 'Künstler-Zuordnung aktualisiert',
    
    // Manual revenue
    manualRevenueAdded: 'Manuelle Einnahme hinzugefügt',
    manualRevenueRemoved: 'Manuelle Einnahme entfernt',
    
    // Expenses
    expenseAdded: 'Ausgabe hinzugefügt',
    expenseRemoved: 'Ausgabe entfernt',
    
    // Column synonyms
    columnSynonymAdded: 'Spalten-Synonym hinzugefügt',
    columnSynonymRemoved: 'Spalten-Synonym entfernt',
    
    // CSV profiles
    profileCreated: 'Profil "{{name}}" erstellt',
    profileRemoved: 'Profil entfernt',
    profileSaved: 'Profil "{{name}}" gespeichert',
    profileNameRequired: 'Profilname darf nicht leer sein',
    
    // Label artists
    labelArtistAdded: '"{{name}}" zur Label-Liste hinzugefügt',
    artistRemovedFromRoster: 'Künstler aus der Liste entfernt',
    artistAlreadyInRoster: 'Künstler bereits in der Liste',
    artistsImportedFromCSV: '{{count}} Künstler aus CSV importiert.',
    noArtistsToExport: 'Keine Künstler zum Exportieren',
    labelArtistRosterExported: 'Label-Künstler-Liste exportiert',
    artistNameRequired: 'Künstlername erforderlich',
    importCSVViaUpload: 'Bitte importieren Sie die CSV über den Tab "Upload / Ingestion"',
    failedToReadCSV: 'Fehler beim Lesen der CSV',
    csvReadError: 'Fehler beim Lesen der CSV: {{message}}',
    
    // Workspace
    workspaceExported: 'Workspace exportiert',
    workspaceRestored: 'Workspace wiederhergestellt',
    unknownBackupFormat: 'Unbekanntes Backup-Format',
    invalidBackup: 'Ungültiges Backup',
    importFailed: 'Import fehlgeschlagen',
    failedToReadFile: 'Fehler beim Lesen der Datei',
    
    // Logo / Branding
    unsupportedFileType: 'Nicht unterstützter Dateityp',
    unsupportedFileTypeDescription: 'Bitte PNG, JPEG oder SVG hochladen',
    logoTooLarge: 'Logo zu groß',
    logoTooLargeDescription: 'Bitte Dateigröße unter 1 MB halten',
    failedToReadLogo: 'Fehler beim Lesen der Logo-Datei',
    
    // Undo
    undone: 'Rückgängig gemacht: {{description}}',
    nothingToUndo: 'Nichts rückgängig zu machen',
    
    // Ignored entries
    entryIgnored: '"{{artist}}"{{release}} ignoriert',
    entryRemovedFromIgnoreList: 'Eintrag aus Ignorierliste entfernt',

    // Track revenue assignments
    trackRevenueAssignmentAdded: '"{{trackTitle}}" → {{ownerArtist}} zugewiesen',
    trackRevenueAssignmentRemoved: 'Track-Zuweisung entfernt',
    
    // Period detection
    periodAutoDetected: 'Abrechnungszeitraum automatisch aus CSV-Daten erkannt',
    periodAutoDetectedDescription: '{{start}} → {{end}}',
    
    // Default split
    defaultSplitApplied: 'Standard-Split ({{percentage}}%) auf alle {{count}} Künstler angewendet',
  },

  // ── Compilation Filter Manager ──────────────────────────────────────────────
  compilationFilter: {
    title: 'Compilation-Ausschlüsse',
    description: 'Verhindere, dass bestimmte Releases in Abrechnungen erscheinen',
    addFilter: 'Ausschluss hinzufügen',
    releaseTitle: 'Release-Titel',
    selectRelease: 'Release auswählen…',
    autoDetected: 'Automatisch erkannte Kandidaten',
    addAllCandidates: 'Alle erkannten hinzufügen',
    noCandidatesDetected: 'Keine Compilation-Kandidaten erkannt',
    noFiltersYet: 'Noch keine Compilation-Filter',
  },

  // ── Artist Mapping Manager ──────────────────────────────────────────────────
  artistMapping: {
    title: 'Künstler-Zuordnungen',
    description: 'CSV-Künstlernamen zu kanonischen Künstleridentitäten zusammenführen',
    addMapping: 'Zuordnung hinzufügen',
    sourceArtist: 'Quell-Künstler (CSV)',
    targetArtist: 'Ziel-Künstler (Kanonisch)',
    autoMappings: 'Automatisch erkannte Zuordnungen',
    applyAll: 'Alle anwenden',
    noMappingsYet: 'Noch keine Künstler-Zuordnungen',
    noAutoMappings: 'Keine automatischen Zuordnungen erkannt',
  },

  // ── Manual Revenue Manager ──────────────────────────────────────────────────
  manualRevenue: {
    title: 'Manuelle Einnahmen',
    description: 'Einnahmen hinzufügen, die nicht in CSV-Dateien enthalten sind',
    addRevenue: 'Einnahme hinzufügen',
    artist: 'Künstler',
    amount: 'Betrag (EUR)',
    revenueDescription: 'Beschreibung',
    noRevenuesYet: 'Noch keine manuellen Einnahmen',
  },

  // ── Expense Manager ─────────────────────────────────────────────────────────
  expense: {
    title: 'Ausgaben',
    description: 'Rückvergütbare Ausgaben, die pro Künstler vor Splits abgezogen werden',
    addExpense: 'Ausgabe hinzufügen',
    artist: 'Künstler',
    amount: 'Betrag (EUR)',
    expenseDescription: 'Beschreibung',
    category: 'Kategorie',
    noExpensesYet: 'Noch keine Ausgaben',
  },

  // ── Split Fee Manager ───────────────────────────────────────────────────────
  splitFee: {
    title: 'Split-Anteile',
    description: 'Künstler-Einnahmen-Prozentsätze',
    splitPercentage: 'Split %',
    digitalOverride: 'Digital %',
    physicalOverride: 'Physisch %',
    releaseOverrides: 'Release-Überschreibungen',
    addReleaseOverride: 'Release-Überschreibung hinzufügen',
    noSplitFeesYet: 'Noch keine Split-Anteile konfiguriert',
  },

  // ── Ignored Entries Manager ─────────────────────────────────────────────────
  ignoredEntry: {
    title: 'Ignorierte Einträge',
    description: 'Einträge, die von Abrechnungen ausgeschlossen werden',
    addEntry: 'Ignorierten Eintrag hinzufügen',
    artist: 'Künstler',
    releaseTitle: 'Release-Titel (optional)',
    noIgnoredEntriesYet: 'Noch keine ignorierten Einträge',
  },

  // ── Track Revenue Assignment Manager ───────────────────────────────────────
  trackRevenueAssignment: {
    title: 'Track-Revenue-Zuweisungen',
    description: 'Revenue eines Tracks wird ausschließlich einem Künstler zugewiesen — der Track erscheint nicht mehr im Statement anderer Künstler',
    trackTitlePlaceholder: 'Track- / Release-Titel (oder Teilstring)',
    ownerArtistPlaceholder: 'Berechtigter Künstler',
    addEntry: 'Zuweisung hinzufügen',
    noEntriesYet: 'Noch keine Track-Zuweisungen',
    noEntriesHint: 'Revenue passender Tracks wird ausschließlich dem berechtigten Künstler zugerechnet.',
    hint: 'Groß-/Kleinschreibung wird ignoriert; Teilstring-Abgleich gegen Release- und Track-Titel. Die erste passende Regel gewinnt.',
    trackTitleRequired: 'Track-Titel ist erforderlich',
    ownerArtistRequired: 'Berechtigter Künstler ist erforderlich',
  },

  // ── Label Artist Manager ────────────────────────────────────────────────────
  labelArtist: {
    title: 'Label-Künstler-Liste',
    description: 'Wenn nicht leer, erscheinen nur diese Künstler in Berichten',
    addArtist: 'Künstler hinzufügen',
    artistName: 'Künstlername',
    exportRoster: 'Liste exportieren',
    importCSV: 'CSV importieren',
    noArtistsYet: 'Noch keine Künstler in der Liste',
  },

  // ── Workspace Manager ───────────────────────────────────────────────────────
  workspace: {
    title: 'Workspace-Backup',
    description: 'Exportieren und importieren Sie Ihre Konfiguration und Regeln',
    exportWorkspace: 'Workspace exportieren',
    importWorkspace: 'Workspace importieren',
    exportSuccess: 'Konfiguration erfolgreich exportiert',
    importSuccess: 'Konfiguration erfolgreich importiert',
  },

  // ── Default Settings ────────────────────────────────────────────────────────
  defaultSettings: {
    title: 'Standardeinstellungen',
    description: 'Globale Standards für Splits und Vertriebsgebühren',
    distributionFee: 'Vertriebsgebühr %',
    distributionFeeDigital: 'Vertriebsgebühr (Digital) %',
    distributionFeePhysical: 'Vertriebsgebühr (Physisch) %',
    defaultSplit: 'Standard-Künstler-Split %',
    defaultSplitDigital: 'Standard-Split (Digital) %',
    defaultSplitPhysical: 'Standard-Split (Physisch) %',
    applyToAll: 'Standard-Split auf alle Künstler anwenden',
  },

  // ── Email Settings ──────────────────────────────────────────────────────────
  emailSettings: {
    title: 'E-Mail-Einstellungen',
    description: 'SMTP-Konfiguration zum Versenden von Abrechnungen',
    smtpHost: 'SMTP-Host',
    smtpPort: 'SMTP-Port',
    smtpUser: 'SMTP-Benutzername',
    smtpPassword: 'SMTP-Passwort',
    fromEmail: 'Absender-E-Mail',
    fromName: 'Absender-Name',
    testConnection: 'Verbindung testen',
  },

  // ── PDF Export Settings ─────────────────────────────────────────────────────
  pdfExport: {
    title: 'PDF-Export-Module',
    modules: 'PDF-Export-Module',
    contentTitle: 'Inhalt der Abrechnung',
    contentDescription: 'Wähle aus, welche Abschnitte im exportierten PDF enthalten sein sollen. Pflichtfelder (Zusammenfassung, Künstler-Info) sind immer enthalten.',
    releaseBreakdown: 'Release-Aufschlüsselung',
    releaseBreakdownDesc: 'Tabelle aller Releases mit Umsatz und Menge pro Album / Single.',
    hideCompilations: 'Compilations ausblenden',
    hideCompilationsDesc: 'Versteckt Sampler-Releases (die über den Compilation-Filter definiert sind) in der Release-Aufschlüsselung des Statements.',
    platformBreakdown: 'Plattform-Aufschlüsselung',
    platformBreakdownDesc: 'Umsatz pro Streaming-Dienst (Spotify, Apple Music, etc.).',
    countryBreakdown: 'Länder-Aufschlüsselung',
    countryBreakdownDesc: 'Umsatz nach Herkunftsland / Territorium.',
    monthlyTrend: 'Monatlicher Verlauf',
    monthlyTrendDesc: 'Monat-für-Monat-Entwicklung der Stream-Einnahmen im Abrechnungszeitraum.',
    emailCoverLetter: 'E-Mail-Anschreiben als erste Seite',
    emailCoverLetterDesc: 'Hängt den ausgefüllten E-Mail-Text (aus der Branding-Vorlage) als Deckblatt ans PDF.',
    revenuePieChart: 'Umsatz-Kuchendiagramm',
    revenuePieChartDesc: 'Fügt ein Kuchendiagramm ein, das den Anteil jeder Umsatzkategorie am Bruttoerlös zeigt.',
    description: 'PDF-Abrechnungsdarstellung anpassen',
    includeReleaseBreakdown: 'Release-Aufschlüsselung einschließen',
    includePlatformBreakdown: 'Plattform-Aufschlüsselung einschließen',
    includeCollaborators: 'Mitwirkende einschließen',
    showDeductions: 'Abzüge anzeigen',
    customFooter: 'Benutzerdefinierter Fußzeilentext',
  },

  // ── CSV Profile Manager ─────────────────────────────────────────────────────
  csvProfile: {
    title: 'CSV-Import-Profile',
    description: 'Vorkonfigurierte Spaltenzuordnungen für verschiedene Anbieter',
    addProfile: 'Profil hinzufügen',
    editProfile: 'Profil bearbeiten',
    profileName: 'Profilname',
    systemDefault: 'System-Standard',
    userDefined: 'Benutzerdefiniert',
    noProfilesYet: 'Noch keine benutzerdefinierten Profile',
  },

  // ── History Panel ───────────────────────────────────────────────────────────
  historyPanel: {
    title: 'Upload-Verlauf',
    filename: 'Dateiname',
    source: 'Quelle',
    rowsParsed: 'Zeilen verarbeitet',
    rowsSkipped: 'Zeilen übersprungen',
    uniqueArtists: 'Einzelne Künstler',
    uploadedAt: 'Hochgeladen am',
    noHistory: 'Noch kein Upload-Verlauf',
  },

  // ── Reporting Panel ─────────────────────────────────────────────────────────
  reporting: {
    title: 'Berichterstattung',
    selectArtists: 'Künstler auswählen',
    exportFormat: 'Export-Format',
    pdf: 'PDF',
    excel: 'Excel',
    both: 'Beide',
    generateReports: 'Berichte erstellen',
    emailReports: 'Berichte per E-Mail versenden',
    downloadReports: 'Berichte herunterladen',
  },

  // ── Payout Manager ──────────────────────────────────────────────────────────
  payout: {
    title: 'SEPA-Auszahlungs-Manager',
    description: 'SEPA-XML-Batch-Zahlungsdateien für Künstler-Auszahlungen erstellen',
    sepaExport: 'SEPA XML exportieren',
    artistsWithValidIban: '{{count}} Künstler mit gültiger IBAN',
    artistsWithoutIban: '{{count}} ohne / ungültige IBAN',
    totalSelectedAmount: '{{amount}} · {{count}} ausgewählt',
    labelIbanMissing: 'Label-IBAN fehlt (Einstellungen → Branding)',
    noPayoutsCalculated: 'Keine Auszahlungen berechnet.',
    uploadFilesFirst: 'Lade zunächst CSV-Dateien hoch und berechne die Abrechnung.',
    selectAllValidArtists: 'Alle gültigen Künstler auswählen',
    colArtist: 'Künstler',
    colAccountHolder: 'Kontoinhaber',
    colIban: 'IBAN',
    colPayout: 'Auszahlung',
    colStatus: 'Status',
    ibanMissing: 'IBAN fehlt',
    statusInvalid: 'Ungültig',
    statusMissing: 'Fehlt',
    selectArtist: '{{name}} auswählen',
    labelIbanMissingToast: 'Label-IBAN fehlt',
    labelIbanMissingDesc: 'Bitte trage die Absender-IBAN des Labels in den Einstellungen unter „Branding → SEPA-Absenderkonto" ein.',
    invalidLabelIban: 'Ungültige Label-IBAN',
    invalidLabelIbanDesc: 'Die hinterlegte IBAN des Labels besteht die Modulo-97-Prüfung nicht. Bitte korrigiere sie in den Einstellungen.',
    noArtistsSelected: 'Keine Künstler ausgewählt',
    noArtistsSelectedDesc: 'Wähle mindestens einen Künstler mit gültiger IBAN aus.',
    sepaExported: 'SEPA XML exportiert',
    sepaExportedDesc: '{{count}} Überweisungen · {{total}} gesamt',
    sepaExportFailed: 'SEPA-Export fehlgeschlagen',
    unknownError: 'Unbekannter Fehler',
    ibanValid: '✓ gültig',
    ibanInvalid: '✗ fehlerhaft',
    checksumFailed: 'Prüfsumme fehlerhaft. SEPA-Export blockiert.',
    currentPeriod: 'Aktueller Zeitraum',
  },

  // ── CSV Column Mapper ───────────────────────────────────────────────────────
  csvColumn: {
    title: 'CSV-Spaltenzuordnung',
    description: 'Zusätzliche Spalten-Synonyme für CSV-Import definieren',
    addAlias: 'Synonym hinzufügen',
    standardColumn: 'Standardspalte',
    synonym: 'Synonym',
    noAliasesYet: 'Noch keine benutzerdefinierten Spalten-Synonyme',
  },

  // ── Universal File Upload Zone ──────────────────────────────────────────────
  upload: {
    dropFiles: 'CSV-Dateien hier ablegen oder klicken zum Durchsuchen',
    supportedFormats: 'Unterstützte Formate: CSV, TSV',
    dragActive: 'Dateien jetzt ablegen…',
    uploading: 'Hochladen…',
    processingFile: 'Datei wird verarbeitet…',
    fileUploaded: 'Datei erfolgreich hochgeladen',
    uploadFailed: 'Upload fehlgeschlagen',
    noFilesYet: 'Noch keine Dateien hochgeladen',
    removeFile: 'Datei entfernen',
    believeFiles: 'Believe-CSV-Dateien',
    bandcampFiles: 'Bandcamp-CSV-Dateien',
    shopifyFiles: 'Shopify-CSV-Dateien',
    printfulFiles: 'Printful-CSV-Dateien',
    darkmerchFiles: 'Darkmerch-CSV-Dateien',
  },

  // ── Analytics Dashboard ─────────────────────────────────────────────────────
  analyticsDashboard: {
    title: 'Analyse-Dashboard',
    revenueOverview: 'Einnahmenübersicht',
    topArtists: 'Top-Künstler',
    topPlatforms: 'Top-Plattformen',
    topReleases: 'Top-Releases',
    growthTrends: 'Wachstumstrends',
  },

  // ── Revenue Dashboard ───────────────────────────────────────────────────────
  revenueDashboard: {
    title: 'Einnahmen-Dashboard',
    totalRevenue: 'Gesamteinnahmen',
    netRevenue: 'Nettoeinnahmen',
    totalDeductions: 'Gesamtabzüge',
    artistCount: 'Künstleranzahl',
  },

  // ── Error Fallback ──────────────────────────────────────────────────────────
  error: {
    applicationError: 'Anwendungsfehler',
    unexpectedError: 'Ein unerwarteter Fehler ist beim Ausführen der Anwendung aufgetreten. Die Fehlerdetails werden unten angezeigt. Bitte aktualisieren Sie die Seite oder kontaktieren Sie den Support.',
    errorDetails: 'Fehlerdetails:',
    tryAgain: 'Erneut versuchen',
  },

  // ── Label Branding ──────────────────────────────────────────────────────────
  labelBranding: {
    title: 'Label-Branding',
    description: 'Passen Sie Ihre Label-Informationen und Ihr Logo an',
    sectionBrandIdentity: 'Markenidentität',
    sectionMasterData: 'Stammdaten',
    sectionContact: 'Kontakt',
    sectionTaxInvoicing: 'Steuer & Rechnungsstellung',
    sectionBankAccount: 'Bankkonto',
    sectionSepaAccount: 'SEPA-Absenderkonto (für XML-Batch-Auszahlungen)',
    sectionLegalFooter: 'Rechtlicher Hinweis',
    sectionEmailTemplate: 'E-Mail-Anschreiben (Vorlage)',
    logoUploadDesc: 'Logo hochladen (PNG, JPG, SVG oder WebP) – wird als Base64 gespeichert.',
    logoSquareRecommended: 'Quadratisches Format empfohlen · max. 5 MB',
    removeLogo: 'Logo entfernen',
    legalForm: 'Rechtsform & Geschäftsführung',
    address: 'Adresse',
    emailAddress: 'E-Mail-Adresse',
    taxNumber: 'Steuernummer',
    taxNumberDesc: 'Steuernummer beim zuständigen Finanzamt',
    vatId: 'USt-IdNr.',
    vatIdRequired: 'Erforderlich für EU-Geschäftstransaktionen',
    vatRate: 'USt-Satz (%)',
    vatRateDesc: 'z.B. 19 für 19 % USt',
    vatRateExempt: '0 = von der USt befreit',
    invoicePrefix: 'Rechnungsnummer-Präfix',
    invoicePrefixDesc: 'Kombiniert mit dem Künstler-Index, z.B. SOS-2025-Q1-0001',
    sepaAccountDesc: 'Diese Felder werden als <Dbtr> und <DbtrAcct> in SEPA-XML-Dateien eingebettet. Die IBAN muss mit Ihrem Geschäftskonto übereinstimmen.',
    sepaAccountHolder: 'Kontoinhaber (SEPA)',
    sepaAccountHolderDesc: 'Genau wie bei Ihrer Bank hinterlegt (für <Dbtr><Nm>).',
    sepaIbanLabel: 'IBAN (SEPA-Absender)',
    sepaIbanDesc: 'Ihr Geschäftskonto als Absender aller SEPA-Überweisungen.',
    legalFooterText: 'Rechtlicher Hinweistext',
    legalFooterDesc: 'Erscheint in der Fußzeile von PDF-Abrechnungen',
    templateLabel: 'Vorlage',
    loadDefaultTemplate: 'Standardvorlage laden',
    templatePlaceholders: 'Verfügbare Platzhalter:',
    ibanValid: '✓ gültig',
    ibanInvalid: '✗ fehlerhaft',
    checksumFailed: 'Prüfsumme fehlerhaft. SEPA-Export wird blockiert.',
    labelName: 'Label-Name',
    labelAddress: 'Adresse',
    logoUpload: 'Logo-Upload',
    uploadLogo: 'Logo hochladen',
    logoPreview: 'Logo-Vorschau',
    recommendedSize: 'Empfohlen: PNG/JPEG/SVG, max 1 MB',
    placeholderLabelName: 'z.B. Neuroklast Records',
    placeholderLegalForm: 'z.B. GmbH · Geschäftsführer: Max Mustermann',
    placeholderAddress: 'Straße, PLZ, Ort',
    placeholderEmail: 'kontakt@label.com',
    placeholderTaxNumber: 'z.B. 123/456/78901',
    placeholderVatId: 'z.B. DE123456789',
    placeholderIban: 'z.B. DE89370400440532013000',
    placeholderBic: 'z.B. COBADEFFXXX',
    placeholderSepaHolder: 'z.B. darkTunes Music Group UG',
    placeholderFooter: 'z.B. Diese Abrechnung wurde automatisch erstellt und ist ohne Unterschrift gültig.',
    placeholderTemplate: 'Klicken Sie auf „Standardvorlage laden", um die Vorlage zu befüllen.',
  },

  // ── Detected Period Banner ──────────────────────────────────────────────────
  detectedPeriod: {
    autoDetected: 'Abrechnungszeitraum automatisch aus Ihren CSV-Dateien erkannt',
    currentPeriod: 'Aktueller Zeitraum',
    detectedPeriod: 'Erkannter Zeitraum',
    applyPeriod: 'Diesen Zeitraum übernehmen',
  },

  // ── Artist Tree View ────────────────────────────────────────────────────────
  artistTree: {
    title: 'Künstlerbaum',
    collaborations: 'Kollaborationen',
    releases: 'Releases',
    platforms: 'Plattformen',
    noDataAvailable: 'Keine Daten verfügbar',
  },

  // ── Stat Card ───────────────────────────────────────────────────────────────
  stat: {
    viewDetails: 'Details anzeigen',
    trend: 'Trend',
    change: 'Änderung',
  },
} as const

export default de
