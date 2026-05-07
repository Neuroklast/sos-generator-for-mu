/**
 * English translations for SOS Generator.
 * This file serves as the source of truth for all translation keys.
 */
export const en = {
  // ── Navigation ──────────────────────────────────────────────────────────────
  nav: {
    dashboard: 'Dashboard',
    ingestion: 'Ingestion',
    cockpit: 'Cockpit',
    analytics: 'Analytics',
    artists: 'Artists',
    reports: 'Reports',
    settings: 'Settings',
    history: 'History',
    branding: 'Branding',
    labelSuite: 'Label Suite',
  },

  // ── Step Navigation (Workflow) ──────────────────────────────────────────────
  steps: {
    upload: 'Upload',
    cockpit: 'Cockpit',
    analyze: 'Analyze',
    export: 'Export',
  },

  // ── Common UI Elements ──────────────────────────────────────────────────────
  common: {
    ready: 'Ready',
    processing: 'Processing…',
    parserReady: 'Parser Ready',
    export: 'Export',
    cancel: 'Cancel',
    save: 'Save',
    add: 'Add',
    remove: 'Remove',
    delete: 'Delete',
    upload: 'Upload',
    download: 'Download',
    import: 'Import',
    search: 'Search',
    close: 'Close',
    confirm: 'Confirm',
    apply: 'Apply',
    edit: 'Edit',
    clear: 'Clear',
    back: 'Back',
    next: 'Next',
    copyArtistName: 'Copy artist name',
    searchPlaceholder: 'Search artists…',
    file: 'file',
    files: 'files',
  },

  // ── Dashboard View ──────────────────────────────────────────────────────────
  dashboard: {
    title: 'Dashboard',
    netRevenue: 'Net Revenue',
    activeArtists: 'Active Artists',
    topPlatform: 'Top Platform',
    filesLoaded: 'Files Loaded',
    quickActions: 'Quick Actions',
    workflowProgress: 'Workflow Progress',
    currentStep: 'Current Step',
    readyToExport: 'Ready to export',
    uploadFiles: 'Upload Files',
    viewAnalytics: 'View Analytics',
    exportReports: 'Export Reports',
    recentActivity: 'Recent Activity',
    noFilesUploaded: 'No files uploaded yet',
    getStartedByUploading: 'Get started by uploading your CSV files',
  },

  // ── Ingestion View ──────────────────────────────────────────────────────────
  ingest: {
    uploadCSVFiles: 'Upload CSV Files',
    configureStatementPeriod: 'Configure Statement Period',
    periodStart: 'Period Start',
    periodEnd: 'Period End',
    periodApplied: 'Period applied from CSV data',
    manualRevenueAndExpenses: 'Manual Revenue & Expenses',
    refreshExchangeRates: 'Refresh exchange rates',
    updatingExchangeRates: 'Updating exchange rates…',
    exchangeRatesUpdated: 'Exchange rates updated',
    exchangeRatesFailed: 'Failed to update exchange rates',
    detectedPeriodBanner: 'Auto-detected statement period from CSV data',
    applyDetectedPeriod: 'Apply this period',
  },

  // ── Process Cockpit View ────────────────────────────────────────────────────
  process: {
    title: 'Process Cockpit',
    filesLoaded: 'Files Loaded',
    uniqueArtists: 'Unique Artists',
    totalPayout: 'Total Payout',
    excludePhysical: 'Exclude physical merch',
    compilationExclusions: 'Compilation Exclusions',
    artistMappings: 'Artist Mappings',
    manualRevenue: 'Manual Revenue',
    expenses: 'Expenses',
    masterTable: 'Master Table',
    searchPlaceholder: 'Search artists…',
    noArtistsFound: 'No artists match your search',
    sortByArtist: 'Sort by artist name',
    sortByQuantity: 'Sort by total quantity',
    sortByRevenue: 'Sort by total revenue',
    sortByFinalAmount: 'Sort by final amount',
  },

  // ── Analytics View ──────────────────────────────────────────────────────────
  analytics: {
    title: 'Analytics',
    overview: 'Overview',
    revenueDashboard: 'Revenue Dashboard',
    noDataAvailable: 'No data available',
    uploadFilesToStart: 'Upload files to start analyzing',
  },

  // ── Artists View ────────────────────────────────────────────────────────────
  artists: {
    title: 'Artists',
    labelRoster: 'Label Roster',
    artistMappings: 'Artist Mappings',
    splitFees: 'Split Fees',
    collaborations: 'Collaborations',
    noArtistsYet: 'No artists yet',
    uploadFilesToDiscover: 'Upload files to discover artists',
  },

  // ── Reports View ────────────────────────────────────────────────────────────
  reports: {
    title: 'Reports',
    exportOptions: 'Export Options',
    downloadAll: 'Download All',
    downloadSelected: 'Download Selected',
    exportPDF: 'Export PDF',
    exportExcel: 'Export Excel',
    noReportsAvailable: 'No reports available',
    uploadFilesToGenerate: 'Upload files to generate reports',
    selectArtists: 'Select artists to export',
    allArtistsSelected: 'All artists selected',
  },

  // ── Settings View ───────────────────────────────────────────────────────────
  settings: {
    title: 'Settings',
    workspace: 'Workspace',
    rules: 'Rules',
    exportSettings: 'Export Settings',
    dangerZone: 'Danger Zone',
    clearWorkspace: 'Clear Workspace',
    clearWorkspaceConfirm: 'Are you sure you want to clear the current workspace? This will remove all uploaded files and manual revenue entries.',
    clearAllStorage: 'Clear All Storage',
    clearAllStorageConfirm: 'This will delete ALL data including settings, rules, and configurations. This action cannot be undone.',
    workspaceCleared: 'Workspace cleared',
    workspaceDescription: 'All files and manual revenues removed. Ready for a new period.',
    allStorageCleared: 'All storage cleared – reloading page…',
    storageClearFailed: 'Failed to clear storage completely. Please try again.',
    applyDefaultSplitToAll: 'Apply default split to all artists',
    tabAppSystem: 'App System',
    tabLabelProfile: 'Label Profile',
    tabExportRules: 'Export & Rules',
    tabCsvProfiles: 'CSV Profiles',
    clearWorkspaceTitle: 'Clear Workspace & Start New Period',
    clearWorkspaceDescription: 'Removes all uploaded CSV files, manual revenue entries, and the current statement period. Label settings, split rates, and artist mappings are kept. Use this at the end of a quarter to start fresh.',
    clearWorkspaceAreYouSure: 'Are you sure? This cannot be undone.',
    confirmClearEverything: 'Yes, clear everything',
    clearAll: 'Clear All',
    clearAllStorageDescription: 'Deletes <strong>all stored data</strong> (CSV files, split rates, artist mappings, label settings, statement period, and other configuration data). The page will reload afterwards. <strong>This action is irreversible.</strong>',
    clearAllStorageAreYouSure: 'Really clear everything? This cannot be undone!',
    excludePhysicalProducts: 'Exclude Physical Products',
    excludePhysicalDescription: 'Exclude physical sales (CD, Vinyl…) from revenue calculations.',
  },

  // ── History View ────────────────────────────────────────────────────────────
  history: {
    title: 'History',
    fileHistory: 'File Upload History',
    noHistory: 'No upload history yet',
    uploadFilesToSeeHistory: 'Upload files to see history',
    clearHistory: 'Clear History',
    historyCleared: 'Upload history cleared',
  },

  // ── Branding View ───────────────────────────────────────────────────────────
  branding: {
    title: 'Branding',
    labelInformation: 'Label Information',
    logoSettings: 'Logo Settings',
    uploadLogo: 'Upload Logo',
    removeLogo: 'Remove Logo',
    labelName: 'Label Name',
    labelAddress: 'Label Address',
  },

  // ── Toast Messages ──────────────────────────────────────────────────────────
  toast: {
    // Compilation filters
    compilationAdded: 'Compilation exclusion added',
    compilationsAdded: '{{count}} compilation exclusion{{plural}} added',
    compilationRemoved: 'Compilation exclusion removed',
    
    // Artist mappings
    artistMappingAdded: 'Artist mapping added',
    artistMappingRemoved: 'Artist mapping removed',
    artistMappingUpdated: 'Artist mapping updated',
    
    // Manual revenue
    manualRevenueAdded: 'Manual revenue added',
    manualRevenueRemoved: 'Manual revenue removed',
    
    // Expenses
    expenseAdded: 'Expense added',
    expenseRemoved: 'Expense removed',
    
    // Column synonyms
    columnSynonymAdded: 'Column synonym added',
    columnSynonymRemoved: 'Column synonym removed',
    
    // CSV profiles
    profileCreated: 'Profile "{{name}}" created',
    profileRemoved: 'Profile removed',
    profileSaved: 'Profile "{{name}}" saved',
    profileNameRequired: 'Profile name cannot be empty',
    
    // Label artists
    labelArtistAdded: '"{{name}}" added to label roster',
    artistRemovedFromRoster: 'Artist removed from roster',
    artistAlreadyInRoster: 'Artist already in roster',
    artistsImportedFromCSV: '{{count}} artists imported from CSV.',
    noArtistsToExport: 'No artists to export',
    labelArtistRosterExported: 'Label artist roster exported',
    artistNameRequired: 'Artist name is required',
    importCSVViaUpload: 'Please import the CSV via the "Upload / Ingestion" tab',
    failedToReadCSV: 'Failed to read CSV',
    csvReadError: 'Failed to read CSV: {{message}}',
    
    // Workspace
    workspaceExported: 'Workspace exported',
    workspaceRestored: 'Workspace restored',
    unknownBackupFormat: 'Unknown backup format',
    invalidBackup: 'Invalid backup',
    importFailed: 'Import failed',
    failedToReadFile: 'Failed to read file',
    
    // Logo / Branding
    unsupportedFileType: 'Unsupported file type',
    unsupportedFileTypeDescription: 'Please upload PNG, JPEG, or SVG',
    logoTooLarge: 'Logo too large',
    logoTooLargeDescription: 'Please keep the file under 1 MB',
    failedToReadLogo: 'Failed to read logo file',
    
    // Undo
    undone: 'Undone: {{description}}',
    nothingToUndo: 'Nothing to undo',
    
    // Ignored entries
    entryIgnored: '"{{artist}}"{{release}} ignored',
    entryRemovedFromIgnoreList: 'Entry removed from ignore list',
    
    // Period detection
    periodAutoDetected: 'Statement period auto-detected from CSV data',
    periodAutoDetectedDescription: '{{start}} → {{end}}',
    
    // Default split
    defaultSplitApplied: 'Default split ({{percentage}}%) applied to all {{count}} artists',
  },

  // ── Compilation Filter Manager ──────────────────────────────────────────────
  compilationFilter: {
    title: 'Compilation Exclusions',
    description: 'Prevent specific releases from appearing in statements',
    addFilter: 'Add Exclusion',
    releaseTitle: 'Release Title',
    selectRelease: 'Select release…',
    autoDetected: 'Auto-detected candidates',
    addAllCandidates: 'Add all detected',
    noCandidatesDetected: 'No compilation candidates detected',
    noFiltersYet: 'No compilation filters yet',
  },

  // ── Artist Mapping Manager ──────────────────────────────────────────────────
  artistMapping: {
    title: 'Artist Mappings',
    description: 'Merge CSV artist names into canonical artist identities',
    addMapping: 'Add Mapping',
    sourceArtist: 'Source Artist (CSV)',
    targetArtist: 'Target Artist (Canonical)',
    autoMappings: 'Auto-detected mappings',
    applyAll: 'Apply all',
    noMappingsYet: 'No artist mappings yet',
    noAutoMappings: 'No auto-mappings detected',
  },

  // ── Manual Revenue Manager ──────────────────────────────────────────────────
  manualRevenue: {
    title: 'Manual Revenue',
    description: 'Add revenue entries not present in CSV files',
    addRevenue: 'Add Revenue',
    artist: 'Artist',
    amount: 'Amount (EUR)',
    revenueDescription: 'Description',
    noRevenuesYet: 'No manual revenue entries yet',
  },

  // ── Expense Manager ─────────────────────────────────────────────────────────
  expense: {
    title: 'Expenses',
    description: 'Recoupable expenses deducted per artist before splits',
    addExpense: 'Add Expense',
    artist: 'Artist',
    amount: 'Amount (EUR)',
    expenseDescription: 'Description',
    category: 'Category',
    noExpensesYet: 'No expenses yet',
  },

  // ── Split Fee Manager ───────────────────────────────────────────────────────
  splitFee: {
    title: 'Split Fees',
    description: 'Artist revenue share percentages',
    splitPercentage: 'Split %',
    digitalOverride: 'Digital %',
    physicalOverride: 'Physical %',
    releaseOverrides: 'Release Overrides',
    addReleaseOverride: 'Add Release Override',
    noSplitFeesYet: 'No split fees configured yet',
  },

  // ── Ignored Entries Manager ─────────────────────────────────────────────────
  ignoredEntry: {
    title: 'Ignored Entries',
    description: 'Entries that will be excluded from statements',
    addEntry: 'Add Ignored Entry',
    artist: 'Artist',
    releaseTitle: 'Release Title (optional)',
    noIgnoredEntriesYet: 'No ignored entries yet',
  },

  // ── Label Artist Manager ────────────────────────────────────────────────────
  labelArtist: {
    title: 'Label Artist Roster',
    description: 'When non-empty, only these artists appear in reports',
    addArtist: 'Add Artist',
    artistName: 'Artist Name',
    exportRoster: 'Export Roster',
    importCSV: 'Import CSV',
    noArtistsYet: 'No artists in roster yet',
  },

  // ── Workspace Manager ───────────────────────────────────────────────────────
  workspace: {
    title: 'Workspace Backup',
    description: 'Export and import your configuration and rules',
    exportWorkspace: 'Export Workspace',
    importWorkspace: 'Import Workspace',
    exportSuccess: 'Configuration exported successfully',
    importSuccess: 'Configuration imported successfully',
  },

  // ── Default Settings ────────────────────────────────────────────────────────
  defaultSettings: {
    title: 'Default Settings',
    description: 'Global defaults for splits and distribution fees',
    distributionFee: 'Distribution Fee %',
    distributionFeeDigital: 'Distribution Fee (Digital) %',
    distributionFeePhysical: 'Distribution Fee (Physical) %',
    defaultSplit: 'Default Artist Split %',
    defaultSplitDigital: 'Default Split (Digital) %',
    defaultSplitPhysical: 'Default Split (Physical) %',
    applyToAll: 'Apply default split to all artists',
  },

  // ── Email Settings ──────────────────────────────────────────────────────────
  emailSettings: {
    title: 'Email Settings',
    description: 'SMTP configuration for sending statements',
    smtpHost: 'SMTP Host',
    smtpPort: 'SMTP Port',
    smtpUser: 'SMTP Username',
    smtpPassword: 'SMTP Password',
    fromEmail: 'From Email',
    fromName: 'From Name',
    testConnection: 'Test Connection',
  },

  // ── PDF Export Settings ─────────────────────────────────────────────────────
  pdfExport: {
    title: 'PDF Export Modules',
    modules: 'PDF Export Modules',
    contentTitle: 'Statement Content',
    contentDescription: 'Choose which sections to include in the exported PDF. Required fields (summary, artist info) are always included.',
    releaseBreakdown: 'Release Breakdown',
    releaseBreakdownDesc: 'Table of all releases with revenue and quantity per album / single.',
    hideCompilations: 'Hide Compilations',
    hideCompilationsDesc: 'Hides compilation releases (defined via the Compilation Filter) in the release breakdown of the statement.',
    platformBreakdown: 'Platform Breakdown',
    platformBreakdownDesc: 'Revenue per streaming service (Spotify, Apple Music, etc.).',
    countryBreakdown: 'Country Breakdown',
    countryBreakdownDesc: 'Revenue by country / territory of origin.',
    monthlyTrend: 'Monthly Trend',
    monthlyTrendDesc: 'Month-by-month development of streaming revenue in the statement period.',
    emailCoverLetter: 'Email Cover Letter as First Page',
    emailCoverLetterDesc: 'Appends the filled email text (from the branding template) as a cover page to the PDF.',
    revenuePieChart: 'Revenue Pie Chart',
    revenuePieChartDesc: 'Adds a pie chart showing the share of each revenue category in gross revenue.',
    description: 'Customize PDF statement appearance',
    includeReleaseBreakdown: 'Include release breakdown',
    includePlatformBreakdown: 'Include platform breakdown',
    includeCollaborators: 'Include collaborators',
    showDeductions: 'Show deductions',
    customFooter: 'Custom footer text',
  },

  // ── CSV Profile Manager ─────────────────────────────────────────────────────
  csvProfile: {
    title: 'CSV Import Profiles',
    description: 'Pre-configured column mappings for different providers',
    addProfile: 'Add Profile',
    editProfile: 'Edit Profile',
    profileName: 'Profile Name',
    systemDefault: 'System Default',
    userDefined: 'User-Defined',
    noProfilesYet: 'No custom profiles yet',
  },

  // ── History Panel ───────────────────────────────────────────────────────────
  historyPanel: {
    title: 'Upload History',
    filename: 'Filename',
    source: 'Source',
    rowsParsed: 'Rows Parsed',
    rowsSkipped: 'Rows Skipped',
    uniqueArtists: 'Unique Artists',
    uploadedAt: 'Uploaded At',
    noHistory: 'No upload history yet',
  },

  // ── Reporting Panel ─────────────────────────────────────────────────────────
  reporting: {
    title: 'Reporting',
    selectArtists: 'Select Artists',
    exportFormat: 'Export Format',
    pdf: 'PDF',
    excel: 'Excel',
    both: 'Both',
    generateReports: 'Generate Reports',
    emailReports: 'Email Reports',
    downloadReports: 'Download Reports',
  },

  // ── Payout Manager ──────────────────────────────────────────────────────────
  payout: {
    title: 'SEPA Payout Manager',
    description: 'Generate SEPA XML batch payment files for artist payouts',
    sepaExport: 'Export SEPA XML',
    artistsWithValidIban: '{{count}} artists with valid IBAN',
    artistsWithoutIban: '{{count}} without / invalid IBAN',
    totalSelectedAmount: '{{amount}} · {{count}} selected',
    labelIbanMissing: 'Label IBAN missing (Settings → Branding)',
    noPayoutsCalculated: 'No payouts calculated.',
    uploadFilesFirst: 'Upload CSV files first and calculate the statement.',
    selectAllValidArtists: 'Select all valid artists',
    colArtist: 'Artist',
    colAccountHolder: 'Account Holder',
    colIban: 'IBAN',
    colPayout: 'Payout',
    colStatus: 'Status',
    ibanMissing: 'IBAN missing',
    statusInvalid: 'Invalid',
    statusMissing: 'Missing',
    selectArtist: 'Select {{name}}',
    labelIbanMissingToast: 'Label IBAN missing',
    labelIbanMissingDesc: 'Please add the label\'s sender IBAN in Settings under "Branding → SEPA Sender Account".',
    invalidLabelIban: 'Invalid label IBAN',
    invalidLabelIbanDesc: 'The stored label IBAN does not pass the Modulo-97 check. Please correct it in Settings.',
    noArtistsSelected: 'No artists selected',
    noArtistsSelectedDesc: 'Please select at least one artist with a valid IBAN.',
    sepaExported: 'SEPA XML exported',
    sepaExportedDesc: '{{count}} transfers · {{total}} total',
    sepaExportFailed: 'SEPA export failed',
    unknownError: 'Unknown error',
    ibanValid: '✓ valid',
    ibanInvalid: '✗ invalid',
    checksumFailed: 'Checksum failed. SEPA export blocked.',
    currentPeriod: 'Current period',
  },

  // ── CSV Column Mapper ───────────────────────────────────────────────────────
  csvColumn: {
    title: 'CSV Column Mapping',
    description: 'Define additional column synonyms for CSV import',
    addAlias: 'Add Synonym',
    standardColumn: 'Standard Column',
    synonym: 'Synonym',
    noAliasesYet: 'No custom column synonyms yet',
  },

  // ── Universal File Upload Zone ──────────────────────────────────────────────
  upload: {
    dropFiles: 'Drop CSV files here or click to browse',
    supportedFormats: 'Supported formats: CSV, TSV',
    dragActive: 'Drop files now…',
    uploading: 'Uploading…',
    processingFile: 'Processing file…',
    fileUploaded: 'File uploaded successfully',
    uploadFailed: 'Upload failed',
    noFilesYet: 'No files uploaded yet',
    removeFile: 'Remove file',
    believeFiles: 'Believe CSV Files',
    bandcampFiles: 'Bandcamp CSV Files',
    shopifyFiles: 'Shopify CSV Files',
    printfulFiles: 'Printful CSV Files',
    darkmerchFiles: 'Darkmerch CSV Files',
  },

  // ── Analytics Dashboard ─────────────────────────────────────────────────────
  analyticsDashboard: {
    title: 'Analytics Dashboard',
    revenueOverview: 'Revenue Overview',
    topArtists: 'Top Artists',
    topPlatforms: 'Top Platforms',
    topReleases: 'Top Releases',
    growthTrends: 'Growth Trends',
  },

  // ── Revenue Dashboard ───────────────────────────────────────────────────────
  revenueDashboard: {
    title: 'Revenue Dashboard',
    totalRevenue: 'Total Revenue',
    netRevenue: 'Net Revenue',
    totalDeductions: 'Total Deductions',
    artistCount: 'Artist Count',
  },

  // ── Error Fallback ──────────────────────────────────────────────────────────
  error: {
    applicationError: 'Application Error',
    unexpectedError: 'Something unexpected happened while running the application. The error details are shown below. Please refresh the page or contact support.',
    errorDetails: 'Error Details:',
    tryAgain: 'Try Again',
  },

  // ── Label Branding ──────────────────────────────────────────────────────────
  labelBranding: {
    title: 'Label Branding',
    description: 'Customize your label information and logo',
    sectionBrandIdentity: 'Brand Identity',
    sectionMasterData: 'Master Data',
    sectionContact: 'Contact',
    sectionTaxInvoicing: 'Tax & Invoicing',
    sectionBankAccount: 'Bank Account',
    sectionSepaAccount: 'SEPA Sender Account (for XML batch payouts)',
    sectionLegalFooter: 'Legal Footer',
    sectionEmailTemplate: 'Email Cover Letter (Template)',
    logoUploadDesc: 'Upload logo (PNG, JPG, SVG or WebP) — stored as Base64.',
    logoSquareRecommended: 'Square format recommended · max. 5 MB',
    removeLogo: 'Remove Logo',
    legalForm: 'Legal Form & Managing Director',
    address: 'Address',
    emailAddress: 'Email Address',
    taxNumber: 'Tax Number',
    taxNumberDesc: 'Tax office registration number of the label',
    vatId: 'VAT ID (USt-IdNr.)',
    vatIdRequired: 'Required for EU business transactions',
    vatRate: 'VAT Rate (%)',
    vatRateDesc: 'e.g. 19 for 19% VAT',
    vatRateExempt: '0 = VAT exempt',
    invoicePrefix: 'Invoice Number Prefix',
    invoicePrefixDesc: 'Combined with artist index, e.g. SOS-2025-Q1-0001',
    sepaAccountDesc: 'These fields are embedded as <Dbtr> and <DbtrAcct> in SEPA XML files. The IBAN must match your business account.',
    sepaAccountHolder: 'Account Holder (SEPA)',
    sepaAccountHolderDesc: 'Exactly as registered with your bank (for <Dbtr><Nm>).',
    sepaIbanLabel: 'IBAN (SEPA Sender)',
    sepaIbanDesc: 'Your business account acting as the sender for all SEPA transfers.',
    legalFooterText: 'Legal Notice Text',
    legalFooterDesc: 'Appears in the footer of PDF statements',
    templateLabel: 'Template',
    loadDefaultTemplate: 'Load Default Template',
    templatePlaceholders: 'Available placeholders:',
    ibanValid: '✓ valid',
    ibanInvalid: '✗ invalid',
    checksumFailed: 'Checksum failed. SEPA export will be blocked.',
    labelName: 'Label Name',
    labelAddress: 'Address',
    logoUpload: 'Logo Upload',
    uploadLogo: 'Upload Logo',
    logoPreview: 'Logo Preview',
    recommendedSize: 'Recommended: PNG/JPEG/SVG, max 1 MB',
    placeholderLabelName: 'e.g. Neuroklast Records',
    placeholderLegalForm: 'e.g. GmbH · Managing Director: Max Mustermann',
    placeholderAddress: 'Street, Postcode, City',
    placeholderEmail: 'contact@label.com',
    placeholderTaxNumber: 'e.g. 123/456/78901',
    placeholderVatId: 'e.g. DE123456789',
    placeholderIban: 'e.g. DE89370400440532013000',
    placeholderBic: 'e.g. COBADEFFXXX',
    placeholderSepaHolder: 'e.g. darkTunes Music Group UG',
    placeholderFooter: 'e.g. This statement was generated automatically and is valid without a signature.',
    placeholderTemplate: 'Click "Load Default Template" to populate the template.',
  },

  // ── Detected Period Banner ──────────────────────────────────────────────────
  detectedPeriod: {
    autoDetected: 'Statement period auto-detected from your CSV files',
    currentPeriod: 'Current period',
    detectedPeriod: 'Detected period',
    applyPeriod: 'Apply this period',
  },

  // ── Artist Tree View ────────────────────────────────────────────────────────
  artistTree: {
    title: 'Artist Tree',
    collaborations: 'Collaborations',
    releases: 'Releases',
    platforms: 'Platforms',
    noDataAvailable: 'No data available',
  },

  // ── Stat Card ───────────────────────────────────────────────────────────────
  stat: {
    viewDetails: 'View details',
    trend: 'Trend',
    change: 'Change',
  },
} as const

/**
 * Recursively replaces all leaf string literal types with `string`.
 *
 * **Why this exists:** `en` is declared `as const`, so every translation value
 * becomes a narrow string literal type (e.g. `"Analytics"`). Without this
 * helper, `TranslationKeys` would require every other locale file to return the
 * exact English strings, making German (or any other) translations impossible
 * to type-check.
 *
 * **How it works:** For each key in `T`, if the value is a `string` leaf it is
 * widened to `string`; otherwise the same transformation is applied
 * recursively. This preserves the full key structure (so missing or extra keys
 * are still caught as type errors) while allowing locale files to provide any
 * translated string value.
 *
 * **Limitation:** Only handles plain `string` leaf values. Arrays and other
 * primitive types are not encountered in the current translation schema.
 */
type Stringify<T> = { [K in keyof T]: T[K] extends string ? string : Stringify<T[K]> }

export type TranslationKeys = Stringify<typeof en>
export default en
