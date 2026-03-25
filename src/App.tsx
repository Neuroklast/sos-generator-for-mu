import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useKV } from '@/hooks/useLocalKV'
import { useUndoStack } from '@/hooks/useUndoStack'
import { motion, AnimatePresence } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { FileUploadZone } from '@/components/FileUploadZone'
import { UniversalFileUploadZone } from '@/components/UniversalFileUploadZone'
import { CompilationFilterManager } from '@/components/CompilationFilterManager'
import { ArtistMappingManager } from '@/components/ArtistMappingManager'
import { SplitFeeManager } from '@/components/SplitFeeManager'
import { ManualRevenueManager } from '@/components/ManualRevenueManager'
import { LabelBranding } from '@/components/LabelBranding'
import { RevenueDashboard } from '@/components/RevenueDashboard'
import { ReportingPanel } from '@/components/ReportingPanel'
import { ArtistTreeView } from '@/components/ArtistTreeView'
import { CSVColumnMapper } from '@/components/CSVColumnMapper'
import { HistoryPanel } from '@/components/HistoryPanel'
import { AnalyticsDashboard } from '@/components/AnalyticsDashboard'
import { WorkspaceManager } from '@/components/WorkspaceManager'
import type { WorkspaceBackup } from '@/components/WorkspaceManager'
import { LabelArtistManager } from '@/components/LabelArtistManager'
import { IgnoredEntriesManager } from '@/components/IgnoredEntriesManager'
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
  LabelInfo,
  CSVColumnAlias,
  UploadedFile,
  GuestPayoutRule,
  LabelArtist,
  IgnoredEntry,
} from '@/lib/types'
import { toast } from 'sonner'
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
  Sparkles,
  Download,
  CalendarDays,
  Layers,
  Search,
  Copy,
  ArrowUpDown,
  Trash2,
  Loader2,
  ShoppingBag,
} from 'lucide-react'
import { Toaster } from 'sonner'

type NavItem = {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string; size?: number }>
}

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

// ── Formatting helpers ────────────────────────────────────────────────────────

const fmtEur = (n: number) =>
  n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const fmtPct = (part: number, total: number) =>
  total > 0 ? ((part / total) * 100).toFixed(1) : '0.0'

// ── KPI stat card ─────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  gradient,
  delay = 0,
}: {
  label: string
  value: string
  sub?: string
  icon: React.ComponentType<{ className?: string; size?: number }>
  gradient: string
  delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.38, ease: 'easeOut' }}
      className="relative overflow-hidden rounded-2xl border border-white/10 bg-card backdrop-blur-md p-6 md:p-8 min-h-[120px] flex flex-col justify-between transition-all duration-300 hover:border-white/20 hover:shadow-lg group"
    >
      {/* accent glow */}
      <div aria-hidden="true" className={`absolute -top-6 -right-6 w-24 h-24 rounded-full blur-2xl opacity-25 group-hover:opacity-40 transition-opacity ${gradient}`} />
      <div className="flex items-start justify-between relative z-10">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
        <div className={`p-2.5 rounded-xl bg-gradient-to-br ${gradient} opacity-80 shrink-0`}>
          <Icon className="text-white" size={20} />
        </div>
      </div>
      <div className="relative z-10 mt-3">
        <p className="text-3xl font-bold text-foreground leading-none truncate font-mono tabular-nums">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-2 leading-tight">{sub}</p>}
      </div>
    </motion.div>
  )
}

// ── Sidebar nav item ──────────────────────────────────────────────────────────

function SideNavItem({
  item,
  active,
  onClick,
  collapsed,
}: {
  item: NavItem
  active: boolean
  onClick: () => void
  collapsed: boolean
}) {
  const Icon = item.icon
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.96 }}
      className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 group relative
        ${active
          ? 'bg-primary/15 text-primary border border-primary/30 shadow-md shadow-primary/10'
          : 'text-muted-foreground hover:text-foreground hover:bg-white/5 border border-transparent'
        }`}
      title={collapsed ? item.label : undefined}
    >
      {active && (
        <motion.div
          aria-hidden="true"
          layoutId="nav-pill"
          className="absolute inset-0 rounded-xl bg-primary/10 border border-primary/25"
          transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
        />
      )}
      <Icon
        className={`shrink-0 transition-colors relative z-10 ${active ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`}
        size={18}
      />
      {!collapsed && <span className="truncate relative z-10">{item.label}</span>}
      {!collapsed && active && <ChevronRight className="ml-auto text-primary relative z-10 shrink-0" size={14} />}
    </motion.button>
  )
}

// ── Step nav item ─────────────────────────────────────────────────────────────

function StepNavItem({
  item,
  stepNum,
  active,
  onClick,
  collapsed,
  completed,
}: {
  item: { id: string; label: string; icon: React.ComponentType<{ className?: string; size?: number }> }
  stepNum: number
  active: boolean
  onClick: () => void
  collapsed: boolean
  completed: boolean
}) {
  const Icon = item.icon
  const badgeClass = completed
    ? 'bg-emerald-500 text-white'
    : active
    ? 'bg-primary text-primary-foreground'
    : 'bg-muted text-muted-foreground'

  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.96 }}
      className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 group relative
        ${active
          ? 'bg-primary/15 text-primary border border-primary/30 shadow-md shadow-primary/10'
          : 'text-muted-foreground hover:text-foreground hover:bg-white/5 border border-transparent'
        }`}
      title={collapsed ? item.label : undefined}
    >
      {active && (
        <motion.div
          aria-hidden="true"
          layoutId="step-nav-pill"
          className="absolute inset-0 rounded-xl bg-primary/10 border border-primary/25"
          transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
        />
      )}
      <div className="relative shrink-0 z-10">
        <Icon
          className={`transition-colors ${active ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`}
          size={18}
        />
        {collapsed && (
          <span className={`absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center ${badgeClass}`}>
            {completed ? '✓' : stepNum}
          </span>
        )}
      </div>
      {!collapsed && (
        <>
          <span className="truncate relative z-10 flex-1">{item.label}</span>
          <span className={`w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center relative z-10 shrink-0 ${badgeClass}`}>
            {completed ? '✓' : stepNum}
          </span>
        </>
      )}
    </motion.button>
  )
}

// ── Mobile bottom nav item ────────────────────────────────────────────────────

function MobileNavItem({
  item,
  active,
  onClick,
}: {
  item: NavItem
  active: boolean
  onClick: () => void
}) {
  const Icon = item.icon
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex flex-col items-center gap-1 py-3 px-1 transition-colors min-h-[56px] ${
        active ? 'text-primary' : 'text-muted-foreground'
      }`}
    >
      <Icon size={22} className={active ? 'text-primary' : 'text-muted-foreground'} />
      <span className="text-xs font-medium uppercase tracking-wide leading-none">{item.label}</span>
    </button>
  )
}

// ── Detected period banner ────────────────────────────────────────────────────

function DetectedPeriodBanner({
  detectedStart,
  detectedEnd,
  currentStart,
  currentEnd,
  onApply,
}: {
  detectedStart: string
  detectedEnd: string
  currentStart: string
  currentEnd: string
  onApply: () => void
}) {
  if (!detectedStart || !detectedEnd) return null
  if (detectedStart === currentStart && detectedEnd === currentEnd) return null

  const fmt = (m: string) => {
    if (!m) return ''
    const [y, mo] = m.split('-')
    const d = new Date(Number(y), Number(mo) - 1)
    return d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-400"
    >
      <Sparkles size={15} className="shrink-0" />
      <p className="text-sm flex-1">
        <span className="font-semibold">Period detected from CSV: </span>
        {fmt(detectedStart)} → {fmt(detectedEnd)}
      </p>
      <Button
        size="sm"
        variant="outline"
        className="border-amber-500/40 text-amber-400 hover:bg-amber-500/20 hover:border-amber-500/60 text-xs h-7"
        onClick={onApply}
      >
        Apply
      </Button>
    </motion.div>
  )
}

// ── Shopify Upload Card ──────────────────────────────────────────────────────

interface ShopifyManager {
  files: import('@/lib/types').UploadedFile[]
  addFiles: (files: File[]) => void
  removeFile: (id: string) => void
}

function ShopifyUploadCard({ shopifyManager }: { shopifyManager: ShopifyManager }) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files).filter(f => f.name.endsWith('.csv'))
    if (files.length > 0) shopifyManager.addFiles(files)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (files.length > 0) shopifyManager.addFiles(files)
    e.target.value = ''
  }

  return (
    <Card className="p-6 mt-4 border border-white/10 bg-card backdrop-blur-md rounded-2xl">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 shrink-0 shadow-lg shadow-green-500/25">
          <ShoppingBag size={16} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm font-['Space_Grotesk'] leading-tight">Shopify Merch Sales</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Import Shopify orders CSV for merch revenue tracking</p>
        </div>
        {shopifyManager.files.length > 0 && (
          <span className="text-xs text-muted-foreground bg-white/5 px-2 py-1 rounded-full shrink-0">
            {shopifyManager.files.length} file{shopifyManager.files.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        className="flex flex-col items-center justify-center gap-2 p-6 rounded-xl border border-dashed border-green-500/30 bg-green-500/5 hover:bg-green-500/10 hover:border-green-500/50 transition-colors cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && fileInputRef.current?.click()}
      >
        <ShoppingBag size={24} className="text-green-400/60" />
        <p className="text-sm text-muted-foreground">Drop Shopify order export here or click to browse</p>
        <p className="text-xs text-muted-foreground/60">Accepts Shopify orders CSV exports</p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          multiple
          onChange={handleChange}
          className="hidden"
        />
      </div>

      {/* Loaded files list */}
      <AnimatePresence>
        {shopifyManager.files.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 space-y-1.5 overflow-hidden"
          >
            {shopifyManager.files.map(f => (
              <li key={f.id} className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/8 text-sm">
                <span className="truncate text-foreground/80">{f.name}</span>
                <div className="flex items-center gap-2 shrink-0">
                  {f.rowsParsed !== undefined && (
                    <span className="text-xs text-muted-foreground">{f.rowsParsed} rows</span>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-destructive"
                    onClick={() => shopifyManager.removeFile(f.id)}
                  >
                    <Trash2 size={12} />
                  </Button>
                </div>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </Card>
  )
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
  const [labelInfo, setLabelInfo] = useKV<LabelInfo>('label-info', { name: '', address: '' })
  const [excludePhysical, setExcludePhysical] = useKV<boolean>('exclude-physical', false)
  const [labelArtists, setLabelArtists] = useKV<LabelArtist[]>('label-artists', [])
  const [ignoredEntries, setIgnoredEntries] = useKV<IgnoredEntry[]>('ignored-entries', [])
  // isLoaded flags prevent the auto-period effect from running before IndexedDB
  // has confirmed whether a saved period exists (Bug 5 fix).
  const [periodStart, setPeriodStart, , periodStartLoaded] = useKV<string>('period-start', '')
  const [periodEnd, setPeriodEnd, , periodEndLoaded] = useKV<string>('period-end', '')
  const [csvAliases, setCsvAliases] = useKV<CSVColumnAlias[]>('csv-aliases', [])
  const [guestPayoutRules, setGuestPayoutRules] = useKV<GuestPayoutRule[]>('guest-payout-rules', [])
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
      excludePhysical: excludePhysical ?? false,
      csvAliases: stableCsvAliases,
      labelArtists: stableLabelArtists,
      ignoredEntries: stableIgnoredEntries,
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
    periodEnd ?? ''
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
    setPeriodStart('')
    setPeriodEnd('')
    setClearConfirmOpen(false)
    toast.success('Workspace cleared', { description: 'All files and manual revenues removed. Ready for a new period.' })
  }, [believeManager, bandcampManager, shopifyManager, setManualRevenues, setPeriodStart, setPeriodEnd])

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
  type MasterSortField = 'artist' | 'totalQuantity' | 'totalRevenue' | 'finalAmount'
  type MasterSortDir = 'asc' | 'desc'
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
                <p className="text-sm font-bold tracking-tight text-foreground leading-none">SOS Generator</p>
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
                    <p className="text-sm font-bold tracking-tight text-foreground leading-none">SOS Generator</p>
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
                <div className="space-y-8 md:space-y-10">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                    <StatCard
                      label="Net Revenue"
                      value={`€${totalNetRevenue.toFixed(2)}`}
                      sub={`${revenues.length} artist${revenues.length !== 1 ? 's' : ''}`}
                      icon={TrendingUp}
                      gradient="from-primary to-violet-600"
                      delay={0}
                    />
                    <StatCard
                      label="Active Artists"
                      value={String(uniqueArtists.length)}
                      sub={`${(splitFees ?? []).length} split rules`}
                      icon={Users}
                      gradient="from-violet-500 to-fuchsia-600"
                      delay={0.06}
                    />
                    <StatCard
                      label="Top Platform"
                      value={topPlatform}
                      sub="by gross revenue"
                      icon={Zap}
                      gradient="from-cyan-500 to-blue-600"
                      delay={0.12}
                    />
                    <StatCard
                      label="Files Loaded"
                      value={String(totalFiles)}
                      sub={`${believeManager.files.length} Believe · ${bandcampManager.files.length} Bandcamp`}
                      icon={UploadCloud}
                      gradient="from-emerald-500 to-teal-600"
                      delay={0.18}
                    />
                  </div>

                  {revenues.length === 0 && !isProcessing && (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                      {STEP_ITEMS.map((step) => (
                        <motion.button
                          key={step.id}
                          onClick={() => navigate(step.id)}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={`relative flex flex-col items-start gap-3 p-5 rounded-2xl border text-left transition-all duration-200 group
                            ${currentStep > step.step ? 'border-emerald-500/30 bg-emerald-500/5' :
                              activeView === step.id || currentStep === step.step ? 'border-primary/40 bg-primary/5' :
                              'border-border/50 bg-card/50 hover:border-primary/25 hover:bg-primary/3'}`}
                        >
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                            ${currentStep > step.step ? 'bg-emerald-500 text-white' :
                              currentStep === step.step ? 'bg-primary text-primary-foreground' :
                              'bg-muted text-muted-foreground'}`}>
                            {currentStep > step.step ? '✓' : step.step}
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground">Step {step.step}</p>
                            <p className="text-sm font-bold">{step.label}</p>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  )}

                  {/* Period info banner */}
                  {(periodStart || periodEnd) && revenues.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-card/50 border border-border/40 text-sm text-muted-foreground"
                    >
                      <CalendarDays size={14} className="text-primary shrink-0" />
                      <span>Statement period: <span className="text-foreground font-medium">{periodStart || '—'}</span> → <span className="text-foreground font-medium">{periodEnd || '—'}</span></span>
                    </motion.div>
                  )}

                  {revenues.length === 0 && !isProcessing && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex flex-col items-center justify-center py-16 gap-4 rounded-2xl border border-dashed border-border/50 bg-card/30"
                    >
                      <div className="p-4 rounded-2xl bg-primary/10">
                        <UploadCloud size={36} className="text-primary/70" />
                      </div>
                      <div className="text-center space-y-1.5">
                        <p className="font-semibold text-foreground">No data loaded yet</p>
                        <p className="text-sm text-muted-foreground">Upload your Believe or Bandcamp CSV files to get started</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-primary/30 hover:border-primary/60 hover:bg-primary/10"
                        onClick={() => navigate('ingest')}
                      >
                        <UploadCloud size={14} className="mr-1.5" />
                        Go to Ingestion
                      </Button>
                    </motion.div>
                  )}

                  {revenues.length > 0 && (
                    <Card className="border border-white/10 bg-card backdrop-blur-md rounded-2xl overflow-hidden">
                      <RevenueDashboard
                        revenues={revenues}
                        filteredCompilations={filteredCompilations}
                        onDownloadAll={handleDownloadAll}
                        onDownloadPDF={handleDownloadPDF}
                        onDownloadExcel={handleDownloadExcel}
                      />
                    </Card>
                  )}
                </div>
              )}

              {/* ── Ingestion ─── */}
              {activeView === 'ingest' && (
                <div className="space-y-8">
                  {/* Detected period banner */}
                  <AnimatePresence>
                    <DetectedPeriodBanner
                      detectedStart={detectedPeriodStart}
                      detectedEnd={detectedPeriodEnd}
                      currentStart={periodStart ?? ''}
                      currentEnd={periodEnd ?? ''}
                      onApply={() => {
                        setPeriodStart(detectedPeriodStart)
                        setPeriodEnd(detectedPeriodEnd)
                        toast.success('Period applied from CSV data')
                      }}
                    />
                  </AnimatePresence>

                  {/* ── Step 1: Upload CSV files ── */}
                  <div>
                    <div className="flex items-center gap-2.5 mb-4">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary text-primary-foreground text-sm font-bold shrink-0">1</span>
                      <h2 className="text-base font-semibold">Upload CSV Files</h2>
                    </div>

                    <Card className="p-8 border border-white/10 bg-card backdrop-blur-md rounded-2xl relative">
                      {exchangeRatesLoading && (
                        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-2xl bg-card/90 backdrop-blur-sm">
                          <Loader2 size={28} className="text-primary animate-spin" />
                          <p className="text-sm font-medium text-muted-foreground">Lade aktuelle Wechselkurse (EZB)…</p>
                          <p className="text-xs text-muted-foreground/60">Datei-Upload ist verfügbar, sobald die Kurse geladen sind.</p>
                        </div>
                      )}
                      <UniversalFileUploadZone
                        believeManager={believeManager}
                        bandcampManager={bandcampManager}
                        onAddAliases={aliases => aliases.forEach(handleAddAlias)}
                      />
                    </Card>

                    {/* ── Shopify Merch Upload ── */}
                    <ShopifyUploadCard shopifyManager={shopifyManager} />

                    {/* Summary stats after processing */}
                    {!isProcessing && revenues.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4"
                      >
                        {[
                          {
                            label: 'Total Rows',
                            value: (
                              [...believeManager.files, ...bandcampManager.files, ...shopifyManager.files]
                                .reduce((s, f) => s + (f.rowsParsed ?? 0), 0)
                            ).toLocaleString(),
                          },
                          {
                            label: 'Unique Artists',
                            value: uniqueArtists.length.toLocaleString(),
                          },
                          {
                            label: 'Files Loaded',
                            value: totalFiles.toString(),
                          },
                          {
                            label: 'Total Revenue',
                            value: revenues
                              .reduce((s, r) => s + r.totalRevenue, 0)
                              .toLocaleString('de-DE', { style: 'currency', currency: 'EUR' }),
                          },
                        ].map(stat => (
                          <div key={stat.label} className="p-4 rounded-xl bg-card border border-white/10 text-center">
                            <p className="text-xl font-bold font-mono tabular-nums">{stat.value}</p>
                            <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </div>

                  {/* ── Step 2: Configure Statement Period ── */}
                  <div>
                    <div className="flex items-center gap-2.5 mb-4">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary text-primary-foreground text-sm font-bold shrink-0">2</span>
                      <h2 className="text-base font-semibold">Configure Statement Period</h2>
                    </div>

                    <Card className="p-8 border border-white/10 bg-card backdrop-blur-md rounded-2xl">
                      <p className="text-xs text-muted-foreground mb-4">
                        Define the reporting period for PDF and Excel statements. Automatically detected from your CSV data.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1 space-y-1.5">
                          <Label htmlFor="period-start" className="text-xs font-medium flex items-center gap-1.5">
                            <CalendarDays size={12} className="text-muted-foreground" />
                            Period Start
                          </Label>
                          <Input
                            id="period-start"
                            type="text"
                            placeholder="YYYY-MM"
                            value={periodStart ?? ''}
                            onChange={e => setPeriodStart(e.target.value)}
                            className="border border-border/60 bg-background/50 focus:border-primary/60 h-10"
                          />
                        </div>
                        <div className="flex-1 space-y-1.5">
                          <Label htmlFor="period-end" className="text-xs font-medium flex items-center gap-1.5">
                            <CalendarDays size={12} className="text-muted-foreground" />
                            Period End
                          </Label>
                          <Input
                            id="period-end"
                            type="text"
                            placeholder="YYYY-MM"
                            value={periodEnd ?? ''}
                            onChange={e => setPeriodEnd(e.target.value)}
                            className="border border-border/60 bg-background/50 focus:border-primary/60 h-10"
                          />
                        </div>
                      </div>
                      {detectedPeriodStart && detectedPeriodEnd && (
                        <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1.5">
                          <Sparkles size={11} className="text-amber-400" />
                          Detected range from CSV: <span className="font-mono text-foreground/70">{detectedPeriodStart}</span> → <span className="font-mono text-foreground/70">{detectedPeriodEnd}</span>
                        </p>
                      )}
                    </Card>
                  </div>

                  {/* ── Step 3: Manual Revenue Entries ── */}
                  <div>
                    <div className="flex items-center gap-2.5 mb-4">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary text-primary-foreground text-sm font-bold shrink-0">3</span>
                      <h2 className="text-base font-semibold">Manual Entries <span className="text-muted-foreground font-normal">(Darkmerch / Sync)</span></h2>
                    </div>

                    <Card className="p-8 border border-white/10 bg-card backdrop-blur-md rounded-2xl">
                      <ManualRevenueManager
                        revenues={manualRevenues ?? []}
                        artists={uniqueArtists}
                        onAddRevenue={handleAddManualRevenue}
                        onRemoveRevenue={handleRemoveManualRevenue}
                      />
                    </Card>
                  </div>
                </div>
              )}

              {/* ── Analytics ─── */}
              {activeView === 'analytics' && (
                <Card className="border border-white/10 bg-card backdrop-blur-md rounded-2xl overflow-hidden">
                  <AnalyticsDashboard revenues={revenues} />
                </Card>
              )}

              {/* ── Artists ─── */}
              {activeView === 'artists' && (
                <div className="space-y-8">
                  <Card className="border border-white/10 bg-card backdrop-blur-md rounded-2xl overflow-hidden">
                    <ArtistTreeView treeNodes={artistTrees} collabTree={collabTree} />
                  </Card>
                  <Card className="p-8 border border-white/10 bg-card backdrop-blur-md rounded-2xl">
                    <ArtistMappingManager
                      mappings={artistMappings ?? []}
                      onAddMapping={handleAddArtistMapping}
                      onRemoveMapping={handleRemoveArtistMapping}
                      onUpdateMapping={handleUpdateArtistMapping}
                      artists={uniqueArtists}
                      autoMappings={autoMappings}
                    />
                  </Card>
                </div>
              )}

              {/* ── Reports ─── */}
              {activeView === 'reports' && (
                <Card className="border border-white/10 bg-card backdrop-blur-md rounded-2xl overflow-hidden">
                  <ReportingPanel
                    revenues={revenues}
                    onDownloadPDF={handleDownloadPDF}
                    onDownloadExcel={handleDownloadExcel}
                    onDownloadAll={handleDownloadAll}
                    onDownloadSelected={handleDownloadSelected}
                  />
                </Card>
              )}

              {/* ── Process Cockpit ─── */}
              {activeView === 'process' && (
                <div className="flex flex-col min-h-full -mx-6 md:-mx-8 lg:-mx-12 -my-8 md:-my-10">
                  {/* Title */}
                  <div className="px-8 lg:px-12 pt-8 pb-6 border-b border-white/10">
                    <h2 className="text-2xl font-bold font-['Space_Grotesk']">Process Cockpit</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Upload data, configure rules, and generate statements in one place.
                    </p>
                  </div>

                  {/* 12-column dashboard grid */}
                  <div className="flex-1 grid grid-cols-12 gap-8 lg:gap-10 p-8 lg:p-12 pb-6">

                    {/* ─ Card 1: Data Ingest — 8 columns ─ */}
                    <Card className="col-span-12 lg:col-span-8 p-8 border border-white/10 bg-card backdrop-blur-md rounded-2xl flex flex-col gap-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 shrink-0 shadow-lg shadow-emerald-500/25">
                          <UploadCloud size={20} className="text-white" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-lg font-['Space_Grotesk'] leading-tight">Data Ingest</h3>
                          <p className="text-xs text-muted-foreground">Upload CSV files from your distributors</p>
                        </div>
                        {totalFiles > 0 && (
                          <div className="ml-auto shrink-0 text-right">
                            <p className="text-xs font-semibold text-emerald-400">{totalFiles} file{totalFiles !== 1 ? 's' : ''} loaded</p>
                          </div>
                        )}
                      </div>

                      {exchangeRatesLoading && (
                        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-400 text-sm">
                          <Loader2 size={15} className="animate-spin shrink-0" />
                          <span>Wechselkurse werden geladen – Datei-Upload wird gleich verfügbar…</span>
                        </div>
                      )}

                      <UniversalFileUploadZone
                        believeManager={believeManager}
                        bandcampManager={bandcampManager}
                        onAddAliases={aliases => aliases.forEach(handleAddAlias)}
                      />

                      {revenues.length > 0 && (
                        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border/40">
                          <div className="text-center p-3 rounded-xl bg-muted/30">
                            <p className="text-xl font-mono font-bold">{uniqueArtists.length}</p>
                            <p className="text-xs text-muted-foreground">Artists</p>
                          </div>
                          <div className="text-center p-3 rounded-xl bg-muted/30">
                            <p className="text-base font-mono font-bold text-primary">
                              {revenues.reduce((s, r) => s + r.finalAmount, 0)
                                .toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                            </p>
                            <p className="text-xs text-muted-foreground">Total Payout</p>
                          </div>
                        </div>
                      )}
                    </Card>

                    {/* ─ Card 2: Compilations & Rules — 4 columns ─ */}
                    <Card className="col-span-12 lg:col-span-4 p-8 border border-white/10 bg-card backdrop-blur-md rounded-2xl flex flex-col gap-6 overflow-hidden">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shrink-0 shadow-lg shadow-violet-500/25">
                          <Settings size={20} className="text-white" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg font-['Space_Grotesk'] leading-tight">Compilations & Rules</h3>
                          <p className="text-xs text-muted-foreground">Exclude compilations and label exceptions</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-muted/20 border border-border/40">
                        <div>
                          <p className="text-sm font-medium">Exclude Physical Products</p>
                          <p className="text-xs text-muted-foreground">Skip CD, Vinyl, Cassette from revenue</p>
                        </div>
                        <Switch
                          checked={excludePhysical ?? false}
                          onCheckedChange={checked => setExcludePhysical(checked)}
                        />
                      </div>
                      <div className="flex-1 overflow-y-auto min-h-0">
                        <CompilationFilterManager
                          filters={compilationFilters ?? []}
                          onAddFilter={handleAddCompilationFilter}
                          onRemoveFilter={handleRemoveCompilationFilter}
                        />
                      </div>
                    </Card>

                    {/* ─ Card 3: Finance Master Table — 12 columns ─ */}
                    <Card className="col-span-12 p-0 border border-white/10 bg-card backdrop-blur-md rounded-2xl flex flex-col overflow-hidden">
                      {/* Card Header */}
                      <div className="flex items-center gap-3 p-8 pb-6">
                        <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary to-accent shrink-0 shadow-lg shadow-primary/25">
                          <Users size={20} className="text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-lg font-['Space_Grotesk'] leading-tight">Finance Master Table</h3>
                          <p className="text-xs text-muted-foreground">Aggregated revenue per artist · click a row to expand</p>
                        </div>
                        {revenues.length > 0 && (
                          <div className="text-right shrink-0">
                            <p className="text-xs text-muted-foreground">Total Payout</p>
                            <p className="font-mono font-bold text-primary tabular-nums">
                              {revenues.reduce((s, r) => s + r.finalAmount, 0).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Expandable Data Grid */}
                      {revenues.length === 0 ? (
                        <div className="px-8 pb-8">
                          <div className="flex flex-col items-center justify-center py-12 rounded-xl border border-dashed border-border/40 bg-muted/10">
                            <Users size={28} className="text-muted-foreground/40 mb-3" />
                            <p className="text-sm text-muted-foreground">No revenue data yet</p>
                            <p className="text-xs text-muted-foreground/60 mt-1">Upload CSV files to see artist breakdowns</p>
                          </div>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          {/* Search bar */}
                          <div className="px-6 pb-4">
                            <div className="relative max-w-xs">
                              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                              <Input
                                type="text"
                                placeholder="Search artists…"
                                value={masterSearch}
                                onChange={e => setMasterSearch(e.target.value)}
                                className="pl-8 h-9 text-sm border-border/60 bg-background/50 focus:border-primary/60"
                              />
                            </div>
                          </div>
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-y border-white/10 bg-white/[0.02]">
                                <th className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground w-8"></th>
                                <th
                                  className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors"
                                  onClick={() => toggleMasterSort('artist')}
                                >
                                  <span className="inline-flex items-center gap-1">
                                    Artist
                                    {masterSortField === 'artist' ? (masterSortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />) : <ArrowUpDown size={12} className="opacity-40" />}
                                  </span>
                                </th>
                                <th
                                  className="py-3 px-4 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors"
                                  onClick={() => toggleMasterSort('totalQuantity')}
                                >
                                  <span className="inline-flex items-center justify-end gap-1">
                                    Units
                                    {masterSortField === 'totalQuantity' ? (masterSortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />) : <ArrowUpDown size={12} className="opacity-40" />}
                                  </span>
                                </th>
                                <th className="py-3 px-4 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Solo Revenue</th>
                                <th className="py-3 px-4 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Collab Revenue</th>
                                <th
                                  className="py-3 px-4 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors"
                                  onClick={() => toggleMasterSort('totalRevenue')}
                                >
                                  <span className="inline-flex items-center justify-end gap-1">
                                    Total Revenue
                                    {masterSortField === 'totalRevenue' ? (masterSortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />) : <ArrowUpDown size={12} className="opacity-40" />}
                                  </span>
                                </th>
                                <th className="py-3 px-4 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Split Rate</th>
                                <th
                                  className="py-3 px-4 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors"
                                  onClick={() => toggleMasterSort('finalAmount')}
                                >
                                  <span className="inline-flex items-center justify-end gap-1">
                                    Payout
                                    {masterSortField === 'finalAmount' ? (masterSortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />) : <ArrowUpDown size={12} className="opacity-40" />}
                                  </span>
                                </th>
                                <th className="py-3 px-4 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {masterTableRevenues.length === 0 ? (
                                <tr>
                                  <td colSpan={9} className="py-8 text-center text-sm text-muted-foreground">No artists match your search.</td>
                                </tr>
                              ) : masterTableRevenues.map(rev => {
                                const isExpanded = expandedArtists.has(rev.artist)
                                const collabNode = collabTree.find(c => c.primaryArtist === rev.artist)
                                const collabRevenue = collabNode?.collabEntries.reduce((s, e) => s + e.revenue, 0) ?? 0
                                const soloRevenue = rev.totalRevenue - collabRevenue

                                return (
                                  <Fragment key={rev.artist}>
                                    {/* Master Row */}
                                    <tr
                                      onClick={() => toggleArtistExpanded(rev.artist)}
                                      className={`border-b border-white/5 cursor-pointer transition-colors duration-150 hover:bg-white/[0.04] ${isExpanded ? 'bg-white/[0.03]' : ''}`}
                                    >
                                      <td className="py-4 px-4 text-muted-foreground">
                                        <ChevronDown
                                          size={14}
                                          className={`transition-transform duration-200 ${isExpanded ? 'rotate-0' : '-rotate-90'}`}
                                        />
                                      </td>
                                      <td className="py-4 px-4 font-medium text-foreground whitespace-nowrap">
                                        <span className="inline-flex items-center gap-1.5">
                                          {rev.artist}
                                          <button
                                            type="button"
                                            onClick={e => { e.stopPropagation(); navigator.clipboard.writeText(rev.artist).then(() => toast.success(`"${rev.artist}" copied`)) }}
                                            className="text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                                            title="Copy artist name"
                                          >
                                            <Copy size={12} />
                                          </button>
                                        </span>
                                      </td>
                                      <td className="py-4 px-4 text-right font-mono tabular-nums text-muted-foreground">{rev.totalQuantity.toLocaleString('de-DE')}</td>
                                      <td className="py-4 px-4 text-right font-mono tabular-nums text-foreground/80">€{fmtEur(soloRevenue)}</td>
                                      <td className="py-4 px-4 text-right font-mono tabular-nums text-foreground/60">
                                        {collabRevenue > 0 ? `€${fmtEur(collabRevenue)}` : '—'}
                                      </td>
                                      <td className="py-4 px-4 text-right font-mono tabular-nums font-semibold text-foreground">€{fmtEur(rev.totalRevenue)}</td>
                                      <td className="py-4 px-4 text-right font-mono tabular-nums text-primary">{rev.splitPercentage.toFixed(1)}%</td>
                                      <td className="py-4 px-4 text-right font-mono tabular-nums font-bold text-primary">€{fmtEur(rev.finalAmount)}</td>
                                      <td className="py-4 px-4 text-right" onClick={e => e.stopPropagation()}>
                                        <div className="inline-flex items-center gap-1">
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-7 px-2 gap-1 text-xs"
                                            onClick={() => handleDownloadPDF(rev.artist)}
                                            title={`PDF for ${rev.artist}`}
                                          >
                                            <FileText size={12} />
                                            PDF
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-7 px-2 gap-1 text-xs"
                                            onClick={() => handleDownloadExcel(rev.artist)}
                                            title={`Excel for ${rev.artist}`}
                                          >
                                            <Download size={12} />
                                            XLS
                                          </Button>
                                        </div>
                                      </td>
                                    </tr>

                                    {/* Sub Row (expanded) */}
                                    {isExpanded && (
                                      <tr>
                                        <td colSpan={9} className="p-0">
                                          <div className="bg-white/5 shadow-inner border-b border-white/10">
                                            <div className="px-8 lg:px-12 py-6 space-y-5">

                                              {/* Solo Revenue Section */}
                                              <div>
                                                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Solo Revenue</p>
                                                <div className="grid grid-cols-3 gap-6">
                                                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
                                                    <p className="text-xs text-muted-foreground mb-1">Believe</p>
                                                    <p className="font-mono tabular-nums font-semibold text-foreground">€{fmtEur(rev.believeRevenue)}</p>
                                                  </div>
                                                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
                                                    <p className="text-xs text-muted-foreground mb-1">Bandcamp</p>
                                                    <p className="font-mono tabular-nums font-semibold text-foreground">€{fmtEur(rev.bandcampRevenue)}</p>
                                                  </div>
                                                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
                                                    <p className="text-xs text-muted-foreground mb-1">Manual</p>
                                                    <p className="font-mono tabular-nums font-semibold text-foreground">€{fmtEur(rev.manualRevenue)}</p>
                                                  </div>
                                                </div>
                                              </div>

                                              {/* Feature Guests Section */}
                                              {collabNode && collabNode.collabEntries.length > 0 && (
                                                <div>
                                                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Feature Guests</p>
                                                  <div className="ml-4 overflow-hidden rounded-lg border border-white/5">
                                                    <table className="w-full text-sm">
                                                      <thead>
                                                        <tr className="bg-white/[0.02]">
                                                          <th className="py-2 px-4 text-left text-xs font-medium text-muted-foreground">Featured Artist</th>
                                                          <th className="py-2 px-4 text-right text-xs font-medium text-muted-foreground">Units</th>
                                                          <th className="py-2 px-4 text-right text-xs font-medium text-muted-foreground">Revenue</th>
                                                          <th className="py-2 px-4 text-right text-xs font-medium text-muted-foreground">Share</th>
                                                          <th className="py-2 px-4 text-right text-xs font-medium text-muted-foreground">Contract %</th>
                                                          <th className="py-2 px-4 text-right text-xs font-medium text-muted-foreground">Payout</th>
                                                        </tr>
                                                      </thead>
                                                      <tbody>
                                                        {collabNode.collabEntries.map(entry => {
                                                          const rule = (guestPayoutRules ?? []).find(
                                                            r => r.primaryArtist === rev.artist && r.guestName === entry.name
                                                          )
                                                          const contractPct = rule?.percentage ?? 0
                                                          const guestPayout = entry.revenue * (contractPct / 100)
                                                          return (
                                                            <tr key={entry.name} className="border-t border-white/5">
                                                              <td className="py-2.5 px-4 text-foreground/80">
                                                                <span className="inline-flex items-center gap-1.5">
                                                                  {entry.name}
                                                                  <button
                                                                    type="button"
                                                                    onClick={e => { e.stopPropagation(); navigator.clipboard.writeText(entry.name).then(() => toast.success(`"${entry.name}" copied`)) }}
                                                                    className="text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                                                                    title="Copy artist name"
                                                                  >
                                                                    <Copy size={12} />
                                                                  </button>
                                                                </span>
                                                              </td>
                                                              <td className="py-2.5 px-4 text-right font-mono tabular-nums text-muted-foreground">{entry.quantity.toLocaleString('de-DE')}</td>
                                                              <td className="py-2.5 px-4 text-right font-mono tabular-nums text-foreground/70">€{fmtEur(entry.revenue)}</td>
                                                              <td className="py-2.5 px-4 text-right font-mono tabular-nums text-muted-foreground">
                                                                {fmtPct(entry.revenue, rev.totalRevenue)}%
                                                              </td>
                                                              <td className="py-2.5 px-4 text-right" onClick={e => e.stopPropagation()}>
                                                                <div className="inline-flex items-center gap-1 justify-end">
                                                                  <Input
                                                                    type="number"
                                                                    min={0}
                                                                    max={100}
                                                                    step={0.1}
                                                                    defaultValue={contractPct}
                                                                    key={`${rev.artist}-${entry.name}`}
                                                                    onBlur={e => {
                                                                      const val = parseFloat(e.target.value)
                                                                      if (!Number.isNaN(val)) {
                                                                        handleUpdateGuestPayout(rev.artist, entry.name, Math.min(100, Math.max(0, val)))
                                                                      }
                                                                    }}
                                                                    className="w-20 h-7 text-xs font-mono tabular-nums text-right border-white/10 bg-white/5 focus:border-primary/60"
                                                                  />
                                                                  <span className="text-xs text-muted-foreground">%</span>
                                                                </div>
                                                              </td>
                                                              <td className="py-2.5 px-4 text-right font-mono tabular-nums font-semibold text-primary">
                                                                {contractPct > 0 ? `€${fmtEur(guestPayout)}` : '—'}
                                                              </td>
                                                            </tr>
                                                          )
                                                        })}
                                                      </tbody>
                                                    </table>
                                                  </div>
                                                </div>
                                              )}

                                              {/* Inline split rate edit */}
                                              <div className="flex items-center gap-4 pt-2 border-t border-white/5">
                                                <p className="text-xs font-medium text-muted-foreground">Split Rate</p>
                                                <div className="flex items-center gap-2">
                                                  <Input
                                                    type="number"
                                                    min={0}
                                                    max={100}
                                                    step={0.1}
                                                    defaultValue={rev.splitPercentage}
                                                    key={`${rev.artist}-${rev.splitPercentage}`}
                                                    onBlur={e => {
                                                      const val = parseFloat(e.target.value)
                                                      if (!Number.isNaN(val)) {
                                                        handleUpdateSplitFee(rev.artist, Math.min(100, Math.max(0, val)))
                                                      }
                                                    }}
                                                    className="w-24 h-8 text-sm font-mono tabular-nums text-right border-white/10 bg-white/5 focus:border-primary/60"
                                                  />
                                                  <span className="text-xs text-muted-foreground">%</span>
                                                </div>
                                                <div className="ml-auto text-right">
                                                  <p className="text-xs text-muted-foreground">Net Payout</p>
                                                  <p className="font-mono tabular-nums font-bold text-primary">€{fmtEur(rev.finalAmount)}</p>
                                                </div>
                                              </div>

                                            </div>
                                          </div>
                                        </td>
                                      </tr>
                                    )}
                                  </Fragment>
                                )
                              })}
                            </tbody>
                            {/* Table Footer with Totals */}
                            <tfoot>
                              <tr className="border-t border-white/10 bg-white/[0.02]">
                                <td className="py-4 px-4"></td>
                                <td className="py-4 px-4 font-semibold text-foreground text-xs uppercase tracking-wider">Total</td>
                                <td className="py-4 px-4 text-right font-mono tabular-nums font-semibold text-foreground">
                                  {revenues.reduce((s, r) => s + r.totalQuantity, 0).toLocaleString('de-DE')}
                                </td>
                                <td className="py-4 px-4 text-right font-mono tabular-nums font-semibold text-foreground/80">
                                  €{revenues.reduce((s, r) => {
                                    const cn = collabTree.find(c => c.primaryArtist === r.artist)
                                    const cr = cn?.collabEntries.reduce((a, e) => a + e.revenue, 0) ?? 0
                                    return s + (r.totalRevenue - cr)
                                  }, 0).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                                <td className="py-4 px-4 text-right font-mono tabular-nums font-semibold text-foreground/60">
                                  €{revenues.reduce((s, r) => {
                                    const cn = collabTree.find(c => c.primaryArtist === r.artist)
                                    return s + (cn?.collabEntries.reduce((a, e) => a + e.revenue, 0) ?? 0)
                                  }, 0).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                                <td className="py-4 px-4 text-right font-mono tabular-nums font-bold text-foreground">
                                  €{revenues.reduce((s, r) => s + r.totalRevenue, 0).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                                <td className="py-4 px-4"></td>
                                <td className="py-4 px-4 text-right font-mono tabular-nums font-bold text-primary text-base">
                                  €{revenues.reduce((s, r) => s + r.finalAmount, 0).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                                <td className="py-4 px-4"></td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      )}

                      {/* Artist Mapping Section */}
                      <div className="px-8 pb-8 pt-2 border-t border-white/5">
                        <ArtistMappingManager
                          mappings={artistMappings ?? []}
                          onAddMapping={handleAddArtistMapping}
                          onRemoveMapping={handleRemoveArtistMapping}
                          onUpdateMapping={handleUpdateArtistMapping}
                          artists={uniqueArtists}
                          autoMappings={autoMappings}
                        />
                      </div>
                    </Card>

                    {/* ─ Card 4: Manual Revenue — 6 columns ─ */}
                    <Card className="col-span-12 lg:col-span-6 p-8 border border-white/10 bg-card backdrop-blur-md rounded-2xl flex flex-col gap-6 overflow-hidden">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 shrink-0 shadow-lg shadow-amber-500/25">
                          <Download size={20} className="text-white" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg font-['Space_Grotesk'] leading-tight">Manual Revenue</h3>
                          <p className="text-xs text-muted-foreground">Darkmerch, sync deals & other income</p>
                        </div>
                      </div>
                      <div className="flex-1 overflow-y-auto min-h-0">
                        <ManualRevenueManager
                          revenues={manualRevenues ?? []}
                          artists={uniqueArtists}
                          onAddRevenue={handleAddManualRevenue}
                          onRemoveRevenue={handleRemoveManualRevenue}
                        />
                      </div>
                    </Card>
                  </div>

                  {/* ── Fixed bottom action bar ── */}
                  <div className="sticky bottom-0 z-20 bg-card/95 backdrop-blur-xl border-t border-white/10 px-8 lg:px-12 py-5 mt-2">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      <div className="flex items-center gap-3 flex-1 flex-wrap">
                        <div className="flex items-center gap-2 shrink-0">
                          <CalendarDays size={16} className="text-muted-foreground" />
                          <span className="text-sm font-medium text-muted-foreground">Report Period</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            type="text"
                            placeholder="YYYY-MM"
                            value={periodStart ?? ''}
                            onChange={e => setPeriodStart(e.target.value)}
                            className="w-38 h-9 text-sm border-border/60 bg-background/50 focus:border-primary/60"
                          />
                          <span className="text-muted-foreground text-sm">→</span>
                          <Input
                            type="text"
                            placeholder="YYYY-MM"
                            value={periodEnd ?? ''}
                            onChange={e => setPeriodEnd(e.target.value)}
                            className="w-38 h-9 text-sm border-border/60 bg-background/50 focus:border-primary/60"
                          />
                        </div>
                        {detectedPeriodStart && detectedPeriodEnd &&
                          (periodStart !== detectedPeriodStart || periodEnd !== detectedPeriodEnd) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-amber-400 hover:text-amber-300 gap-1 text-xs h-7"
                            onClick={() => {
                              setPeriodStart(detectedPeriodStart)
                              setPeriodEnd(detectedPeriodEnd)
                              toast.success('Period applied from CSV data')
                            }}
                          >
                            <Sparkles size={12} />
                            Use detected ({detectedPeriodStart} → {detectedPeriodEnd})
                          </Button>
                        )}
                      </div>

                      <Button
                        size="lg"
                        onClick={() => navigate('analytics')}
                        disabled={revenues.length === 0}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 font-bold px-10 h-14 text-lg shadow-lg shadow-primary/30 shrink-0 disabled:opacity-50 ring-2 ring-primary/20"
                      >
                        {isProcessing
                          ? <TrendingUp size={18} className="animate-pulse" />
                          : <Zap size={18} />}
                        {isProcessing ? 'Processing…' : 'Process Data'}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Settings ─── */}
              {activeView === 'settings' && (
                <div className="space-y-8">
                  {/* Workspace Backup */}
                  <WorkspaceManager
                    compilationFilters={compilationFilters ?? []}
                    artistMappings={artistMappings ?? []}
                    splitFees={splitFees ?? []}
                    manualRevenues={manualRevenues ?? []}
                    csvAliases={csvAliases ?? []}
                    labelInfo={labelInfo ?? { name: '', address: '' }}
                    labelArtists={labelArtists ?? []}
                    ignoredEntries={ignoredEntries ?? []}
                    onImport={handleWorkspaceImport}
                  />

                  {/* Label Artist Roster */}
                  <Card className="p-8 border border-white/10 bg-card backdrop-blur-md rounded-2xl">
                    <LabelArtistManager
                      artists={labelArtists ?? []}
                      onAdd={handleAddLabelArtist}
                      onRemove={handleRemoveLabelArtist}
                      onImportCSV={handleImportLabelArtistsCSV}
                    />
                  </Card>

                  {/* Ignored Entries */}
                  <Card className="p-8 border border-white/10 bg-card backdrop-blur-md rounded-2xl">
                    <IgnoredEntriesManager
                      entries={ignoredEntries ?? []}
                      artists={uniqueArtists}
                      onAdd={handleAddIgnoredEntry}
                      onRemove={handleRemoveIgnoredEntry}
                    />
                  </Card>

                  {/* Clear Workspace */}
                  <Card className="p-8 border border-red-500/20 bg-card backdrop-blur-md rounded-2xl">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1.5">
                        <h3 className="font-semibold text-foreground flex items-center gap-2">
                          <Trash2 size={16} className="text-red-400" />
                          Clear Workspace &amp; Start New Period
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Removes all uploaded CSV files, manual revenue entries, and the current statement period. Label settings, split rates, and artist mappings are kept. Use this at the end of a quarter to start fresh.
                        </p>
                      </div>
                      {!clearConfirmOpen ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="shrink-0 border-red-500/40 text-red-400 hover:bg-red-500/10 hover:border-red-500/60 gap-1.5"
                          onClick={() => setClearConfirmOpen(true)}
                          disabled={totalFiles === 0 && (manualRevenues ?? []).length === 0 && !periodStart && !periodEnd}
                        >
                          <Trash2 size={14} />
                          Clear Workspace
                        </Button>
                      ) : (
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <p className="text-xs text-red-400 font-medium">Are you sure? This cannot be undone.</p>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-muted-foreground hover:text-foreground"
                              onClick={() => setClearConfirmOpen(false)}
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              className="bg-red-500 hover:bg-red-600 text-white gap-1.5"
                              onClick={handleClearWorkspace}
                            >
                              <Trash2 size={14} />
                              Yes, clear everything
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>

                  <Card className="p-8 border border-white/10 bg-card backdrop-blur-md rounded-2xl">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1.5">
                        <h3 className="font-semibold">Exclude Physical Products</h3>
                        <p className="text-sm text-muted-foreground">
                          Exclude physical sales (CD, Vinyl…) from revenue calculations.
                        </p>
                      </div>
                      <Switch
                        checked={excludePhysical ?? false}
                        onCheckedChange={checked => setExcludePhysical(checked)}
                      />
                    </div>
                  </Card>
                  <Card className="p-8 border border-white/10 bg-card backdrop-blur-md rounded-2xl">
                    <CompilationFilterManager
                      filters={compilationFilters ?? []}
                      onAddFilter={handleAddCompilationFilter}
                      onRemoveFilter={handleRemoveCompilationFilter}
                    />
                  </Card>
                  <Card className="p-8 border border-white/10 bg-card backdrop-blur-md rounded-2xl">
                    <SplitFeeManager
                      splitFees={splitFees ?? []}
                      onUpdateSplitFee={handleUpdateSplitFee}
                      onBulkUpdateSplitFee={handleBulkUpdateSplitFee}
                    />
                  </Card>
                  <Card className="p-8 border border-white/10 bg-card backdrop-blur-md rounded-2xl">
                    <CSVColumnMapper
                      aliases={csvAliases ?? []}
                      onAddAlias={handleAddAlias}
                      onRemoveAlias={handleRemoveAlias}
                    />
                  </Card>
                </div>
              )}

              {/* ── History ─── */}
              {activeView === 'history' && (
                <Card className="border border-white/10 bg-card backdrop-blur-md rounded-2xl overflow-hidden">
                  <HistoryPanel entries={historyEntries} onClearHistory={clearHistory} />
                </Card>
              )}

              {/* ── Branding ─── */}
              {activeView === 'branding' && (
                <Card className="border border-white/10 bg-card backdrop-blur-md rounded-2xl overflow-hidden">
                  <LabelBranding
                    labelInfo={labelInfo ?? { name: '', address: '' }}
                    onUpdate={setLabelInfo}
                  />
                </Card>
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
    </div>
  )
}

export default App
