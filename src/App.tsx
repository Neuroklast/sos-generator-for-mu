import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useKV } from '@/hooks/useLocalKV'
import { useUndoStack } from '@/hooks/useUndoStack'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { DEFAULT_APP_DEFAULTS, DEFAULT_EMAIL_CONFIG, DEFAULT_PDF_EXPORT_SETTINGS, DEFAULT_LABEL_INFO } from '@/lib/defaults'
import { DashboardView } from '@/components/views/DashboardView'
import { IngestView } from '@/components/views/IngestView'
import { ProcessCockpitView, type MasterSortField, type MasterSortDir } from '@/components/views/ProcessCockpitView'
import { AnalyticsView } from '@/components/views/AnalyticsView'
import { ArtistsView } from '@/components/views/ArtistsView'
import { ReportsView } from '@/components/views/ReportsView'
import { SettingsView } from '@/components/views/SettingsView'
import { HistoryView } from '@/components/views/HistoryView'
import { BrandingView } from '@/components/views/BrandingView'
import { SideNavItem, StepNavItem, MobileNavItem, type NavItem } from '@/components/nav/NavItems'
import type { WorkspaceBackup } from '@/features/core/components/WorkspaceManager'
import { useFileManager } from '@/hooks/useFileManager'
import { useCSVProcessor } from '@/hooks/useCSVProcessor'
import { useExports } from '@/hooks/useExports'
import { useSplitFeeSync } from '@/hooks/useSplitFeeSync'
import { useHistoryLog } from '@/hooks/useHistoryLog'
import { useIsMobile } from '@/hooks/use-mobile'
import type {
  CompilationFilter,
  ArtistMapping,
  SplitFee,
  ManualRevenue,
  ExpenseEntry,
  LabelInfo,
  CSVColumnAlias,
  UploadedFile,
  GuestPayoutRule,
  LabelArtist,
  IgnoredEntry,
  AppDefaults,
  PdfExportSettings,
  EmailConfig,
} from '@/lib/types'
import { toast } from 'sonner'
import { APP_NAME, APP_LOGO, APP_CREDITS } from '@/config/softwareBranding'
import {
  UploadCloud,
  LayoutDashboard,
  BarChart2,
  FileText,
  Users,
  Settings,
  History,
  Tag,
  Menu,
  X,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Disc3,
  Zap,
  TrendingUp,
  Download,
  CalendarDays,
  Layers,
} from 'lucide-react'
import { Toaster } from 'sonner'

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'ingest', label: 'Ingestion', icon: UploadCloud },
  { id: 'process', label: 'Cockpit', icon: Layers },
  { id: 'analytics', label: 'Analytics', icon: BarChart2 },
  { id: 'artists', label: 'Artists', icon: Users },
  { id: 'reports', label: 'Reports', icon: FileText },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'history', label: 'History', icon: History },
  { id: 'branding', label: 'Branding', icon: Tag },
]
const STEP_ITEMS = [
  { id: 'ingest', label: 'Upload', icon: UploadCloud, step: 1 },
  { id: 'process', label: 'Cockpit', icon: Layers, step: 2 },
  { id: 'analytics', label: 'Analyze', icon: BarChart2, step: 3 },
  { id: 'reports', label: 'Export', icon: FileText, step: 4 },
]
const SECONDARY_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'artists', label: 'Artists', icon: Users },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'history', label: 'History', icon: History },
  { id: 'branding', label: 'Branding', icon: Tag },
]

const pageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.22, ease: 'easeOut' as const } },
  exit: { opacity: 0, y: -6, transition: { duration: 0.15 } },
}

// ── Main App ──────────────────────────────────────────────────────────────────

function App() {
  const isMobile = useIsMobile()
  const [activeView, setActiveView] = useState<string>('dashboard')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [expandedArtists, setExpandedArtists] = useState<Set<string>>(new Set())

  const [compilationFilters, setCompilationFilters] = useKV<CompilationFilter[]>('compilation-filters', [])
  const [artistMappings, setArtistMappings] = useKV<ArtistMapping[]>('artist-mappings', [])
  const [splitFees, setSplitFees] = useKV<SplitFee[]>('split-fees', [])
  const [manualRevenues, setManualRevenues] = useKV<ManualRevenue[]>('manual-revenues', [])
  const [expenses, setExpenses] = useKV<ExpenseEntry[]>('expenses', [])
  const [labelInfo, setLabelInfo] = useKV<LabelInfo>('label-info', DEFAULT_LABEL_INFO)
  const [excludePhysical, setExcludePhysical] = useKV<boolean>('exclude-physical', false)
  const [labelArtists, setLabelArtists] = useKV<LabelArtist[]>('label-artists', [])
  const [ignoredEntries, setIgnoredEntries] = useKV<IgnoredEntry[]>('ignored-entries', [])
  // isLoaded flags prevent the auto-period effect from running before IndexedDB
  // has confirmed whether a saved period exists (Bug 5 fix).
  const [periodStart, setPeriodStart, , periodStartLoaded] = useKV<string>('period-start', '')
  const [periodEnd, setPeriodEnd, , periodEndLoaded] = useKV<string>('period-end', '')
  const [csvAliases, setCsvAliases] = useKV<CSVColumnAlias[]>('csv-aliases', [])
  const [guestPayoutRules, setGuestPayoutRules] = useKV<GuestPayoutRule[]>('guest-payout-rules', [])
  const [appDefaults, setAppDefaults] = useKV<AppDefaults>('app-defaults', DEFAULT_APP_DEFAULTS)
  const [pdfExportSettings, setPdfExportSettings] = useKV<PdfExportSettings>('pdf-export-settings', DEFAULT_PDF_EXPORT_SETTINGS)
  const [emailConfig, setEmailConfig] = useKV<EmailConfig>('email-config', DEFAULT_EMAIL_CONFIG)
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false)

  const { push: pushUndo, undo } = useUndoStack()

  const { entries: historyEntries, addEntry, markRemoved, clearHistory } = useHistoryLog()

  const believeManager = useFileManager('believe', {
    onFileAdded: useCallback(
      (file: UploadedFile, rowsParsed: number, rowsSkipped: number, uniqueArtists: number) => {
        addEntry({ filename: file.name, source: 'believe', sizeBytes: file.size, rowsParsed, rowsSkipped, uniqueArtists })
      },
      [addEntry]
    ),
    onFileRemoved: markRemoved,
  })
  const bandcampManager = useFileManager('bandcamp', {
    onFileAdded: useCallback(
      (file: UploadedFile, rowsParsed: number, rowsSkipped: number, uniqueArtists: number) => {
        addEntry({ filename: file.name, source: 'bandcamp', sizeBytes: file.size, rowsParsed, rowsSkipped, uniqueArtists })
      },
      [addEntry]
    ),
    onFileRemoved: markRemoved,
  })
  const shopifyManager = useFileManager('shopify', {
    onFileAdded: useCallback(
      (file: UploadedFile, rowsParsed: number, rowsSkipped: number, uniqueArtists: number) => {
        addEntry({ filename: file.name, source: 'shopify', sizeBytes: file.size, rowsParsed, rowsSkipped, uniqueArtists })
      },
      [addEntry]
    ),
    onFileRemoved: markRemoved,
  })

  // Bug 1 fix: memoize stable empty-array fallbacks so `?? []` never creates a
  // new reference on every render (which would trigger infinite re-computations
  // in useCSVProcessor's memos when KV values are still loading from IndexedDB).
  const stableCompilationFilters = useMemo(() => compilationFilters ?? [], [compilationFilters])
  const stableArtistMappings = useMemo(() => artistMappings ?? [], [artistMappings])
  const stableSplitFees = useMemo(() => splitFees ?? [], [splitFees])
  const stableManualRevenues = useMemo(() => manualRevenues ?? [], [manualRevenues])
  const stableExpenses = useMemo(() => expenses ?? [], [expenses])
  const stableCsvAliases = useMemo(() => csvAliases ?? [], [csvAliases])
  const stableLabelArtists = useMemo(() => labelArtists ?? [], [labelArtists])
  const stableIgnoredEntries = useMemo(() => ignoredEntries ?? [], [ignoredEntries])

  const {
    uniqueArtists,
    processedData,
    artistTrees,
    collabTree,
    filteredCompilations,
    revenues,
    isProcessing,
    exchangeRatesLoading,
    detectedPeriodStart,
    detectedPeriodEnd,
    autoMappings,
  } = useCSVProcessor(
    believeManager.files,
    bandcampManager.files,
    {
      compilationFilters: stableCompilationFilters,
      artistMappings: stableArtistMappings,
      splitFees: stableSplitFees,
      manualRevenues: stableManualRevenues,
      expenses: stableExpenses,
      excludePhysical: excludePhysical ?? false,
      csvAliases: stableCsvAliases,
      labelArtists: stableLabelArtists,
      ignoredEntries: stableIgnoredEntries,
      distributionFeePercentage: appDefaults?.distributionFeePercentage ?? 0,
    },
    shopifyManager.files
  )

  // Auto-apply detected period when new files are loaded and period is empty.
  // We use a ref to capture the current period values so the effect only
  // depends on the detected values (avoiding a potential circular dependency).
  // Bug 5 fix: also require that both period KV values have been confirmed
  // loaded from IndexedDB before checking, to avoid overwriting a saved period
  // during the brief loading window where the value is still at its default ''.
  const periodStartRef = useRef(periodStart)
  const periodEndRef = useRef(periodEnd)
  useEffect(() => { periodStartRef.current = periodStart }, [periodStart])
  useEffect(() => { periodEndRef.current = periodEnd }, [periodEnd])

  const prevDetectedRef = useRef('')
  useEffect(() => {
    const key = `${detectedPeriodStart}|${detectedPeriodEnd}`
    if (key === prevDetectedRef.current) return
    prevDetectedRef.current = key

    if (!detectedPeriodStart || !detectedPeriodEnd) return
    // Wait until both KV values have been confirmed by IndexedDB before
    // deciding whether to auto-apply, to avoid overwriting a saved period.
    if (!periodStartLoaded || !periodEndLoaded) return
    if (!periodStartRef.current && !periodEndRef.current) {
      setPeriodStart(detectedPeriodStart)
      setPeriodEnd(detectedPeriodEnd)
      toast.success('Statement period auto-detected from CSV data', {
        description: `${detectedPeriodStart} → ${detectedPeriodEnd}`,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detectedPeriodStart, detectedPeriodEnd, periodStartLoaded, periodEndLoaded])

  useSplitFeeSync(uniqueArtists, stableSplitFees, setSplitFees)

  const { handleDownloadPDF, handleDownloadExcel, handleDownloadAll, handleDownloadSelected } = useExports(
    processedData,
    labelInfo ?? { name: '', address: '' },
    periodStart ?? '',
    periodEnd ?? '',
    pdfExportSettings ?? DEFAULT_PDF_EXPORT_SETTINGS,
    appDefaults ?? DEFAULT_APP_DEFAULTS,
    stableLabelArtists
  )

  const handleAddCompilationFilter = useCallback(
    (filter: Omit<CompilationFilter, 'id'>) => {
      const snapshot = compilationFilters ?? []
      setCompilationFilters(current => [...(current ?? []), { ...filter, id: crypto.randomUUID() }])
      pushUndo({ description: 'Add compilation filter', undo: () => setCompilationFilters(snapshot) })
      toast.success('Compilation exclusion added')
    },
    [compilationFilters, setCompilationFilters, pushUndo]
  )
  const handleRemoveCompilationFilter = useCallback(
    (id: string) => {
      const snapshot = compilationFilters ?? []
      setCompilationFilters(current => (current ?? []).filter(f => f.id !== id))
      pushUndo({ description: 'Remove compilation filter', undo: () => setCompilationFilters(snapshot) })
      toast.info('Compilation exclusion removed')
    },
    [compilationFilters, setCompilationFilters, pushUndo]
  )
  const handleAddArtistMapping = useCallback(
    (mapping: Omit<ArtistMapping, 'id'>) => {
      const snapshot = artistMappings ?? []
      setArtistMappings(current => [...(current ?? []), { ...mapping, id: crypto.randomUUID() }])
      pushUndo({ description: 'Add artist mapping', undo: () => setArtistMappings(snapshot) })
      toast.success('Artist mapping added')
    },
    [artistMappings, setArtistMappings, pushUndo]
  )
  const handleRemoveArtistMapping = useCallback(
    (id: string) => {
      const snapshot = artistMappings ?? []
      setArtistMappings(current => (current ?? []).filter(m => m.id !== id))
      pushUndo({ description: 'Remove artist mapping', undo: () => setArtistMappings(snapshot) })
      toast.info('Artist mapping removed')
    },
    [artistMappings, setArtistMappings, pushUndo]
  )
  const handleUpdateArtistMapping = useCallback(
    (id: string, update: Omit<ArtistMapping, 'id'>) => {
      const snapshot = artistMappings ?? []
      setArtistMappings(current => (current ?? []).map(m => m.id === id ? { ...m, ...update } : m))
      pushUndo({ description: 'Edit artist mapping', undo: () => setArtistMappings(snapshot) })
      toast.success('Artist mapping updated')
    },
    [artistMappings, setArtistMappings, pushUndo]
  )
  const handleUpdateSplitFee = useCallback(
    (artist: string, percentage: number) => {
      const snapshot = splitFees ?? []
      setSplitFees(current => {
        const fees = current ?? []
        const exists = fees.some(sf => sf.artist === artist)
        // Bug 4 fix: upsert — add the artist if they are not yet in the list
        // instead of silently dropping the update.
        if (exists) {
          return fees.map(sf => (sf.artist === artist ? { ...sf, percentage } : sf))
        }
        return [...fees, { artist, percentage }]
      })
      pushUndo({ description: `Edit split fee for ${artist}`, undo: () => setSplitFees(snapshot) })
    },
    [splitFees, setSplitFees, pushUndo]
  )
  const handleBulkUpdateSplitFee = useCallback(
    (artists: string[], percentage: number) => {
      const snapshot = splitFees ?? []
      setSplitFees(current => {
        const fees = current ?? []
        const artistSet = new Set(artists)
        const updated = fees.map(sf => artistSet.has(sf.artist) ? { ...sf, percentage } : sf)
        const existingArtists = new Set(fees.map(sf => sf.artist))
        const newEntries = artists
          .filter(a => !existingArtists.has(a))
          .map(a => ({ artist: a, percentage }))
        return [...updated, ...newEntries]
      })
      pushUndo({ description: `Bulk edit split fees (${artists.length} artists)`, undo: () => setSplitFees(snapshot) })
    },
    [splitFees, setSplitFees, pushUndo]
  )
  const handleAddManualRevenue = useCallback(
    (revenue: Omit<ManualRevenue, 'id'>) => {
      const snapshot = manualRevenues ?? []
      setManualRevenues(current => [...(current ?? []), { ...revenue, id: crypto.randomUUID() }])
      pushUndo({ description: 'Add manual revenue', undo: () => setManualRevenues(snapshot) })
      toast.success('Manual revenue added')
    },
    [manualRevenues, setManualRevenues, pushUndo]
  )
  const handleRemoveManualRevenue = useCallback(
    (id: string) => {
      const snapshot = manualRevenues ?? []
      setManualRevenues(current => (current ?? []).filter(r => r.id !== id))
      pushUndo({ description: 'Remove manual revenue', undo: () => setManualRevenues(snapshot) })
      toast.info('Manual revenue removed')
    },
    [manualRevenues, setManualRevenues, pushUndo]
  )
  const handleAddExpense = useCallback(
    (expense: Omit<ExpenseEntry, 'id'>) => {
      const snapshot = expenses ?? []
      setExpenses(current => [...(current ?? []), { ...expense, id: crypto.randomUUID() }])
      pushUndo({ description: 'Add expense', undo: () => setExpenses(snapshot) })
      toast.success('Expense added')
    },
    [expenses, setExpenses, pushUndo]
  )
  const handleRemoveExpense = useCallback(
    (id: string) => {
      const snapshot = expenses ?? []
      setExpenses(current => (current ?? []).filter(e => e.id !== id))
      pushUndo({ description: 'Remove expense', undo: () => setExpenses(snapshot) })
      toast.info('Expense removed')
    },
    [expenses, setExpenses, pushUndo]
  )
  const handleAddAlias = useCallback(
    (alias: Omit<CSVColumnAlias, 'id'>) => {
      const snapshot = csvAliases ?? []
      setCsvAliases(current => [...(current ?? []), { ...alias, id: crypto.randomUUID() }])
      pushUndo({ description: 'Add column synonym', undo: () => setCsvAliases(snapshot) })
      toast.success('Column synonym added')
    },
    [csvAliases, setCsvAliases, pushUndo]
  )
  const handleRemoveAlias = useCallback(
    (id: string) => {
      const snapshot = csvAliases ?? []
      setCsvAliases(current => (current ?? []).filter(a => a.id !== id))
      pushUndo({ description: 'Remove column synonym', undo: () => setCsvAliases(snapshot) })
      toast.info('Column synonym removed')
    },
    [csvAliases, setCsvAliases, pushUndo]
  )

  const handleUpdateGuestPayout = useCallback(
    (primaryArtist: string, guestName: string, percentage: number) => {
      const snapshot = guestPayoutRules ?? []
      setGuestPayoutRules(current => {
        const rules = current ?? []
        const exists = rules.some(r => r.primaryArtist === primaryArtist && r.guestName === guestName)
        if (exists) {
          return rules.map(r =>
            r.primaryArtist === primaryArtist && r.guestName === guestName ? { ...r, percentage } : r
          )
        }
        return [...rules, { primaryArtist, guestName, percentage }]
      })
      pushUndo({ description: `Edit guest payout for ${guestName}`, undo: () => setGuestPayoutRules(snapshot) })
    },
    [guestPayoutRules, setGuestPayoutRules, pushUndo]
  )

  const handleClearWorkspace = useCallback(() => {
    believeManager.clearAll()
    bandcampManager.clearAll()
    shopifyManager.clearAll()
    setManualRevenues([])
    setExpenses([])
    setPeriodStart('')
    setPeriodEnd('')
    setClearConfirmOpen(false)
    toast.success('Workspace cleared', { description: 'All files and manual revenues removed. Ready for a new period.' })
  }, [believeManager, bandcampManager, shopifyManager, setManualRevenues, setExpenses, setPeriodStart, setPeriodEnd])

  const handleWorkspaceImport = useCallback(
    (backup: WorkspaceBackup) => {
      setCompilationFilters(backup.compilationFilters ?? [])
      setArtistMappings(backup.artistMappings ?? [])
      setSplitFees(backup.splitFees ?? [])
      setManualRevenues(backup.manualRevenues ?? [])
      setCsvAliases(backup.csvAliases ?? [])
      if (backup.labelInfo) setLabelInfo(backup.labelInfo)
      setLabelArtists(backup.labelArtists ?? [])
      setIgnoredEntries(backup.ignoredEntries ?? [])
    },
    [setCompilationFilters, setArtistMappings, setSplitFees, setManualRevenues, setCsvAliases, setLabelInfo, setLabelArtists, setIgnoredEntries]
  )

  const handleAddLabelArtist = useCallback(
    (name: string) => {
      const snapshot = labelArtists ?? []
      setLabelArtists(current => [...(current ?? []), { id: crypto.randomUUID(), name }])
      pushUndo({ description: `Add "${name}" to label roster`, undo: () => setLabelArtists(snapshot) })
      toast.success(`"${name}" added to label roster`)
    },
    [labelArtists, setLabelArtists, pushUndo]
  )

  const handleRemoveLabelArtist = useCallback(
    (id: string) => {
      const snapshot = labelArtists ?? []
      setLabelArtists(current => (current ?? []).filter(a => a.id !== id))
      pushUndo({ description: 'Remove label artist', undo: () => setLabelArtists(snapshot) })
      toast.info('Artist removed from roster')
    },
    [labelArtists, setLabelArtists, pushUndo]
  )

  const handleUpdateLabelArtist = useCallback(
    (id: string, patch: Omit<LabelArtist, 'id'>) => {
      setLabelArtists(current => (current ?? []).map(a => (a.id === id ? { ...a, ...patch } : a)))
    },
    [setLabelArtists]
  )

  const handleImportLabelArtistsCSV = useCallback(
    (artists: Omit<LabelArtist, 'id'>[]) => {
      setLabelArtists(current => {
        const existing = current ?? []
        const existingNames = new Set(existing.map(a => a.name.toLowerCase()))
        const toAdd = artists
          .filter(a => !existingNames.has(a.name.toLowerCase()))
          .map(a => ({ ...a, id: crypto.randomUUID() }))
        return [...existing, ...toAdd]
      })
    },
    [setLabelArtists]
  )

  const handleAddIgnoredEntry = useCallback(
    (entry: Omit<IgnoredEntry, 'id' | 'createdAt'>) => {
      const snapshot = ignoredEntries ?? []
      setIgnoredEntries(current => [
        ...(current ?? []),
        { ...entry, id: crypto.randomUUID(), createdAt: new Date().toISOString() },
      ])
      pushUndo({ description: `Ignore "${entry.artist}"`, undo: () => setIgnoredEntries(snapshot) })
      toast.success(`"${entry.artist}"${entry.releaseTitle ? ` / "${entry.releaseTitle}"` : ''} ignored`)
    },
    [ignoredEntries, setIgnoredEntries, pushUndo]
  )

  const handleRemoveIgnoredEntry = useCallback(
    (id: string) => {
      const snapshot = ignoredEntries ?? []
      setIgnoredEntries(current => (current ?? []).filter(e => e.id !== id))
      pushUndo({ description: 'Remove ignored entry', undo: () => setIgnoredEntries(snapshot) })
      toast.info('Entry removed from ignore list')
    },
    [ignoredEntries, setIgnoredEntries, pushUndo]
  )

  // ── Global Ctrl+Z / Cmd+Z undo handler ──────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        // Don't intercept when the user is typing in an input or textarea.
        const tag = (e.target as HTMLElement)?.tagName
        if (tag === 'INPUT' || tag === 'TEXTAREA') return
        e.preventDefault()
        const action = undo()
        if (action) {
          toast.info(`Undone: ${action.description}`)
        } else {
          toast.info('Nothing to undo')
        }
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [undo])

  const totalNetRevenue = useMemo(
    () => revenues.reduce((s, r) => s + r.finalAmount, 0),
    [revenues]
  )
  const totalFiles = useMemo(
    () => believeManager.files.length + bandcampManager.files.length + shopifyManager.files.length,
    [believeManager.files.length, bandcampManager.files.length, shopifyManager.files.length]
  )

  // UX 1: auto-navigate to the analytics view the first time files are ready
  // and revenue data is available, so users land directly on actionable data.
  const prevTotalFiles = useRef(0)
  useEffect(() => {
    if (totalFiles > 0 && prevTotalFiles.current === 0 && revenues.length > 0) {
      setActiveView('analytics')
    }
    prevTotalFiles.current = totalFiles
  }, [totalFiles, revenues.length])
  const currentStep = useMemo(() => {
    if (totalFiles > 0 && revenues.length > 0) return 3
    if (totalFiles > 0) return 2
    return 1
  }, [totalFiles, revenues.length])
  const topPlatform = useMemo(() => {
    const map: Record<string, number> = {}
    revenues.forEach(r => r.platformBreakdown.forEach(p => {
      map[p.platform] = (map[p.platform] ?? 0) + p.revenue
    }))
    const sorted = Object.entries(map).sort((a, b) => b[1] - a[1])
    return sorted[0]?.[0] ?? '\u2014'
  }, [revenues])

  const navigate = useCallback((view: string) => {
    setActiveView(view)
    setMobileMenuOpen(false)
  }, [])

  const toggleArtistExpanded = useCallback((artist: string) => {
    setExpandedArtists(prev => {
      const next = new Set(prev)
      if (next.has(artist)) next.delete(artist)
      else next.add(artist)
      return next
    })
  }, [])

  // ── Finance Master Table search + sort ─────────────────────────────────────
  const [masterSearch, setMasterSearch] = useState('')
  const [masterSortField, setMasterSortField] = useState<MasterSortField>('artist')
  const [masterSortDir, setMasterSortDir] = useState<MasterSortDir>('asc')

  const toggleMasterSort = useCallback((field: MasterSortField) => {
    setMasterSortField(prev => {
      if (prev === field) {
        setMasterSortDir(d => d === 'asc' ? 'desc' : 'asc')
        return prev
      }
      setMasterSortDir('asc')
      return field
    })
  }, [])

  const masterTableRevenues = useMemo(() => {
    const q = masterSearch.toLowerCase()
    const filtered = q ? revenues.filter(r => r.artist.toLowerCase().includes(q)) : revenues
    return [...filtered].sort((a, b) => {
      let diff = 0
      if (masterSortField === 'artist') diff = a.artist.localeCompare(b.artist)
      else if (masterSortField === 'totalQuantity') diff = a.totalQuantity - b.totalQuantity
      else if (masterSortField === 'totalRevenue') diff = a.totalRevenue - b.totalRevenue
      else if (masterSortField === 'finalAmount') diff = a.finalAmount - b.finalAmount
      return masterSortDir === 'asc' ? diff : -diff
    })
  }, [revenues, masterSearch, masterSortField, masterSortDir])

  // UX 4: 4 core mobile nav items. Constructed from named ids instead of slice()
  // so items remain correct even if the NAV_ITEMS order changes.
  const mobileNavItems = useMemo(() => {
    const ids = ['ingest', 'analytics', 'reports', 'settings']
    return ids.map(id => NAV_ITEMS.find(n => n.id === id)).filter((n): n is typeof NAV_ITEMS[number] => n !== undefined)
  }, [])

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-background text-foreground">
      <Toaster position="top-right" theme="dark" richColors />

      {/* ── Fixed Top Navigation ─────────────────────────── */}
      <header className="shrink-0 sticky top-0 z-30 border-b border-white/10 bg-card/80 backdrop-blur-xl">
        <div className="flex items-center justify-between px-6 lg:px-12 h-16">
          <div className="flex items-center gap-4">
            {isMobile && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(true)}
                className="h-10 w-10 text-muted-foreground hover:text-foreground"
              >
                <Menu size={20} />
              </Button>
            )}
            <div className="flex items-center gap-3">
              <div className="shrink-0 p-2 rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/30">
                <Disc3 className="text-white" size={18} />
              </div>
              <div>
                <p className="text-sm font-bold tracking-tight text-foreground leading-none">{APP_NAME}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 font-medium uppercase tracking-widest">Label Suite</p>
              </div>
            </div>
            {!isMobile && (
              <div className="w-px h-8 bg-border/40 ml-2" />
            )}
          </div>

          {/* Desktop Navigation Tabs */}
          {!isMobile && (
            <nav className="flex items-center gap-1 mx-4">
              {STEP_ITEMS.map(item => {
                const Icon = item.icon
                const isActive = activeView === item.id
                const isCompleted = currentStep > item.step
                return (
                  <button
                    key={item.id}
                    onClick={() => navigate(item.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200
                      ${isActive
                        ? 'bg-primary/15 text-primary border border-primary/30'
                        : 'text-muted-foreground hover:text-foreground hover:bg-white/5 border border-transparent'
                      }`}
                  >
                    <Icon size={15} />
                    <span>{item.label}</span>
                    {isCompleted && <span className="w-4 h-4 rounded-full bg-emerald-500 text-white text-[9px] font-bold flex items-center justify-center">✓</span>}
                  </button>
                )
              })}
              <div className="w-px h-5 bg-border/40 mx-1" />
              {SECONDARY_ITEMS.map(item => {
                const Icon = item.icon
                const isActive = activeView === item.id
                return (
                  <button
                    key={item.id}
                    onClick={() => navigate(item.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-200
                      ${isActive
                        ? 'bg-primary/15 text-primary border border-primary/30'
                        : 'text-muted-foreground hover:text-foreground hover:bg-white/5 border border-transparent'
                      }`}
                  >
                    <Icon size={14} />
                    <span className="hidden xl:inline">{item.label}</span>
                  </button>
                )
              })}
            </nav>
          )}

          <div className="flex items-center gap-3">
            {isProcessing && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-xs font-medium text-amber-400 uppercase tracking-wider">Processing</span>
              </motion.div>
            )}
            {!isProcessing && (
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${
                isProcessing ? 'bg-amber-500/10 border-amber-500/25' : 'bg-emerald-500/10 border-emerald-500/25'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isProcessing ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
                <span className={`text-xs font-medium uppercase tracking-wider ${isProcessing ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {isProcessing ? 'Processing…' : 'Ready'}
                </span>
              </div>
            )}
            {totalFiles > 0 && !isProcessing && (
              <span className="text-xs px-3 py-1.5 rounded-full bg-primary/12 text-primary border border-primary/25 font-medium font-mono whitespace-nowrap">
                {totalFiles} file{totalFiles !== 1 ? 's' : ''}
              </span>
            )}
            <Button
              size="default"
              className="bg-primary/90 hover:bg-primary text-primary-foreground gap-2 shadow-md shadow-primary/20 h-9"
              onClick={() => navigate('reports')}
            >
              <Download size={15} />
              <span className="hidden sm:inline">Export</span>
            </Button>
          </div>
        </div>
      </header>

      {/* ── Mobile Sidebar Drawer ───────────────────────── */}
      {isMobile && (
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              <motion.div
                key="backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                onClick={() => setMobileMenuOpen(false)}
              />
              <motion.aside
                key="drawer"
                initial={{ x: -280 }}
                animate={{ x: 0 }}
                exit={{ x: -280 }}
                transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                className="fixed top-0 left-0 h-full w-72 flex flex-col border-r border-border/70 bg-card/95 backdrop-blur-xl z-50 shadow-2xl"
              >
                <div className="flex items-center gap-3 px-4 py-6 border-b border-border/50">
                  <div className="shrink-0 p-2.5 rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/30">
                    <Disc3 className="text-white" size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold tracking-tight text-foreground leading-none">{APP_NAME}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 font-medium uppercase tracking-widest">Label Suite</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setMobileMenuOpen(false)}
                    className="ml-auto h-9 w-9 text-muted-foreground"
                  >
                    <X size={18} />
                  </Button>
                </div>

                <nav className="flex-1 px-2 py-3 space-y-1 overflow-y-auto">
                  {/* Workflow steps */}
                  {STEP_ITEMS.map(item => (
                    <StepNavItem
                      key={item.id}
                      item={item}
                      stepNum={item.step}
                      active={activeView === item.id}
                      onClick={() => navigate(item.id)}
                      collapsed={false}
                      completed={currentStep > item.step}
                    />
                  ))}
                  <div className="my-3 border-t border-border/40" />
                  {/* Secondary nav */}
                  {SECONDARY_ITEMS.map(item => (
                    <SideNavItem
                      key={item.id}
                      item={item}
                      active={activeView === item.id}
                      onClick={() => navigate(item.id)}
                      collapsed={false}
                    />
                  ))}
                </nav>

                <div className="px-3 pb-8 space-y-2">
                  <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border ${
                    isProcessing ? 'bg-amber-500/10 border-amber-500/25' : 'bg-emerald-500/10 border-emerald-500/25'
                  }`}>
                    <span className={`w-2 h-2 rounded-full animate-pulse shrink-0 ${isProcessing ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                    <span className={`text-xs font-medium uppercase tracking-wider ${isProcessing ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {isProcessing ? 'Processing…' : 'Parser Ready'}
                    </span>
                  </div>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>
      )}

      {/* ── Main content ────────────────────────────────── */}
      <main className={`flex-1 overflow-y-auto px-6 md:px-8 lg:px-12 py-8 md:py-10 ${isMobile ? 'pb-24' : ''}`}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              {/* ── Dashboard ─── */}
              {activeView === 'dashboard' && (
                <DashboardView
                  revenues={revenues}
                  totalNetRevenue={totalNetRevenue}
                  uniqueArtists={uniqueArtists}
                  splitFees={stableSplitFees}
                  topPlatform={topPlatform}
                  totalFiles={totalFiles}
                  believeManager={believeManager}
                  bandcampManager={bandcampManager}
                  isProcessing={isProcessing}
                  currentStep={currentStep}
                  periodStart={periodStart ?? ''}
                  periodEnd={periodEnd ?? ''}
                  filteredCompilations={filteredCompilations}
                  navigate={navigate}
                  handleDownloadAll={handleDownloadAll}
                  handleDownloadPDF={handleDownloadPDF}
                  handleDownloadExcel={handleDownloadExcel}
                  STEP_ITEMS={STEP_ITEMS}
                />
              )}

              {/* ── Ingestion ─── */}
              {activeView === 'ingest' && (
                <IngestView
                  detectedPeriodStart={detectedPeriodStart}
                  detectedPeriodEnd={detectedPeriodEnd}
                  periodStart={periodStart ?? ''}
                  periodEnd={periodEnd ?? ''}
                  setPeriodStart={setPeriodStart}
                  setPeriodEnd={setPeriodEnd}
                  believeManager={believeManager}
                  bandcampManager={bandcampManager}
                  shopifyManager={shopifyManager}
                  exchangeRatesLoading={exchangeRatesLoading}
                  handleAddAlias={handleAddAlias}
                  isProcessing={isProcessing}
                  revenues={revenues}
                  uniqueArtists={uniqueArtists}
                  totalFiles={totalFiles}
                  manualRevenues={stableManualRevenues}
                  handleAddManualRevenue={handleAddManualRevenue}
                  handleRemoveManualRevenue={handleRemoveManualRevenue}
                  expenses={stableExpenses}
                  handleAddExpense={handleAddExpense}
                  handleRemoveExpense={handleRemoveExpense}
                  onImportLabelArtistsCSV={handleImportLabelArtistsCSV}
                />
              )}

              {/* ── Analytics ─── */}
              {activeView === 'analytics' && (
                <AnalyticsView revenues={revenues} />
              )}

              {/* ── Artists ─── */}
              {activeView === 'artists' && (
                <ArtistsView
                  artistTrees={artistTrees}
                  collabTree={collabTree}
                  artistMappings={stableArtistMappings}
                  onAddMapping={handleAddArtistMapping}
                  onRemoveMapping={handleRemoveArtistMapping}
                  onUpdateMapping={handleUpdateArtistMapping}
                  uniqueArtists={uniqueArtists}
                  autoMappings={autoMappings}
                  labelArtists={stableLabelArtists}
                  onAddLabelArtist={handleAddLabelArtist}
                  onRemoveLabelArtist={handleRemoveLabelArtist}
                  onUpdateLabelArtist={handleUpdateLabelArtist}
                  onImportLabelArtistsCSV={handleImportLabelArtistsCSV}
                  splitFees={stableSplitFees}
                  onUpdateSplitFee={handleUpdateSplitFee}
                  onBulkUpdateSplitFee={handleBulkUpdateSplitFee}
                />
              )}

              {/* ── Reports ─── */}
              {activeView === 'reports' && (
                <ReportsView
                  revenues={revenues}
                  onDownloadPDF={handleDownloadPDF}
                  onDownloadExcel={handleDownloadExcel}
                  onDownloadAll={handleDownloadAll}
                  onDownloadSelected={handleDownloadSelected}
                  labelArtists={stableLabelArtists}
                  labelInfo={labelInfo ?? { name: '', address: '' }}
                  appDefaults={appDefaults ?? DEFAULT_APP_DEFAULTS}
                  emailConfig={emailConfig ?? DEFAULT_EMAIL_CONFIG}
                  periodStart={periodStart ?? ''}
                  periodEnd={periodEnd ?? ''}
                />
              )}

              {/* ── Process Cockpit ─── */}
              {activeView === 'process' && (
                <ProcessCockpitView
                  revenues={revenues}
                  totalFiles={totalFiles}
                  uniqueArtists={uniqueArtists}
                  compilationFilters={stableCompilationFilters}
                  handleAddCompilationFilter={handleAddCompilationFilter}
                  handleRemoveCompilationFilter={handleRemoveCompilationFilter}
                  excludePhysical={excludePhysical ?? false}
                  setExcludePhysical={setExcludePhysical}
                  masterSearch={masterSearch}
                  setMasterSearch={setMasterSearch}
                  masterTableRevenues={masterTableRevenues}
                  toggleMasterSort={toggleMasterSort}
                  masterSortField={masterSortField}
                  masterSortDir={masterSortDir}
                  expandedArtists={expandedArtists}
                  toggleArtistExpanded={toggleArtistExpanded}
                  collabTree={collabTree}
                  guestPayoutRules={guestPayoutRules ?? []}
                  handleUpdateGuestPayout={handleUpdateGuestPayout}
                  handleUpdateSplitFee={handleUpdateSplitFee}
                  handleDownloadPDF={handleDownloadPDF}
                  handleDownloadExcel={handleDownloadExcel}
                  artistMappings={stableArtistMappings}
                  handleAddArtistMapping={handleAddArtistMapping}
                  handleRemoveArtistMapping={handleRemoveArtistMapping}
                  handleUpdateArtistMapping={handleUpdateArtistMapping}
                  autoMappings={autoMappings}
                  manualRevenues={stableManualRevenues}
                  handleAddManualRevenue={handleAddManualRevenue}
                  handleRemoveManualRevenue={handleRemoveManualRevenue}
                  expenses={stableExpenses}
                  handleAddExpense={handleAddExpense}
                  handleRemoveExpense={handleRemoveExpense}
                  periodStart={periodStart ?? ''}
                  periodEnd={periodEnd ?? ''}
                  setPeriodStart={setPeriodStart}
                  setPeriodEnd={setPeriodEnd}
                  detectedPeriodStart={detectedPeriodStart}
                  detectedPeriodEnd={detectedPeriodEnd}
                  isProcessing={isProcessing}
                  navigate={navigate}
                />
              )}

              {/* ── Settings ─── */}
              {activeView === 'settings' && (
                <SettingsView
                  compilationFilters={stableCompilationFilters}
                  artistMappings={stableArtistMappings}
                  splitFees={stableSplitFees}
                  manualRevenues={stableManualRevenues}
                  csvAliases={stableCsvAliases}
                  labelInfo={labelInfo ?? { name: '', address: '' }}
                  labelArtists={stableLabelArtists}
                  ignoredEntries={stableIgnoredEntries}
                  onImport={handleWorkspaceImport}
                  handleAddLabelArtist={handleAddLabelArtist}
                  handleRemoveLabelArtist={handleRemoveLabelArtist}
                  handleUpdateLabelArtist={handleUpdateLabelArtist}
                  handleImportLabelArtistsCSV={handleImportLabelArtistsCSV}
                  uniqueArtists={uniqueArtists}
                  handleAddIgnoredEntry={handleAddIgnoredEntry}
                  handleRemoveIgnoredEntry={handleRemoveIgnoredEntry}
                  clearConfirmOpen={clearConfirmOpen}
                  setClearConfirmOpen={setClearConfirmOpen}
                  handleClearWorkspace={handleClearWorkspace}
                  totalFiles={totalFiles}
                  periodStart={periodStart ?? ''}
                  periodEnd={periodEnd ?? ''}
                  excludePhysical={excludePhysical ?? false}
                  setExcludePhysical={setExcludePhysical}
                  handleAddCompilationFilter={handleAddCompilationFilter}
                  handleRemoveCompilationFilter={handleRemoveCompilationFilter}
                  handleUpdateSplitFee={handleUpdateSplitFee}
                  handleBulkUpdateSplitFee={handleBulkUpdateSplitFee}
                  handleAddAlias={handleAddAlias}
                  handleRemoveAlias={handleRemoveAlias}
                  appDefaults={appDefaults ?? DEFAULT_APP_DEFAULTS}
                  setAppDefaults={setAppDefaults}
                  emailConfig={emailConfig ?? DEFAULT_EMAIL_CONFIG}
                  setEmailConfig={setEmailConfig}
                  pdfExportSettings={pdfExportSettings ?? DEFAULT_PDF_EXPORT_SETTINGS}
                  setPdfExportSettings={setPdfExportSettings}
                />
              )}

              {/* ── History ─── */}
              {activeView === 'history' && (
                <HistoryView historyEntries={historyEntries} clearHistory={clearHistory} />
              )}

              {/* ── Branding ─── */}
              {activeView === 'branding' && (
                <BrandingView
                  labelInfo={labelInfo ?? { name: '', address: '' }}
                  onUpdate={setLabelInfo}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* ── Mobile bottom navigation ────────────── */}
        {isMobile && (
          <nav className="shrink-0 flex items-stretch border-t border-border/60 bg-card/80 backdrop-blur-xl" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
            {mobileNavItems.map(item => (
              <MobileNavItem
                key={item.id}
                item={item}
                active={activeView === item.id}
                onClick={() => navigate(item.id)}
              />
            ))}
            {/* More button for items 6-8 */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 px-1 transition-colors min-h-[56px] ${
                !mobileNavItems.some(i => i.id === activeView) ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <Menu size={22} />
              <span className="text-xs font-medium uppercase tracking-wide leading-none">More</span>
            </button>
          </nav>
        )}

        {/* ── Software branding ─────────────────────── */}
        <div className="fixed bottom-3 left-4 z-20 flex items-center gap-1.5 opacity-50 pointer-events-none select-none">
          <img src={APP_LOGO} alt="Neuroklast" className="h-5 w-5 object-contain shrink-0" />
          <span className="text-[10px] text-muted-foreground font-medium whitespace-nowrap">{APP_CREDITS}</span>
        </div>
    </div>
  )
}

export default App
