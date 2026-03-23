import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useKV } from '@/hooks/useLocalKV'
import { motion, AnimatePresence } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { FileUploadZone } from '@/components/FileUploadZone'
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
  Disc3,
  Zap,
  TrendingUp,
  Sparkles,
  Download,
  CalendarDays,
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
  { id: 'analytics', label: 'Analytics', icon: BarChart2 },
  { id: 'artists', label: 'Artists', icon: Users },
  { id: 'reports', label: 'Reports', icon: FileText },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'history', label: 'History', icon: History },
  { id: 'branding', label: 'Branding', icon: Tag },
]

const pageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.22, ease: 'easeOut' } },
  exit: { opacity: 0, y: -6, transition: { duration: 0.15 } },
}

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
      className="relative overflow-hidden rounded-2xl border border-white/8 bg-card/70 backdrop-blur-md p-5 transition-all duration-300 hover:border-white/15 hover:shadow-lg group"
    >
      {/* accent glow */}
      <div aria-hidden="true" className={`absolute -top-6 -right-6 w-20 h-20 rounded-full blur-2xl opacity-25 group-hover:opacity-40 transition-opacity ${gradient}`} />
      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">{label}</p>
          <p className="text-2xl font-bold text-foreground leading-none">{value}</p>
          {sub && <p className="text-xs text-muted-foreground mt-1.5 leading-tight">{sub}</p>}
        </div>
        <div className={`p-2.5 rounded-xl bg-gradient-to-br ${gradient} opacity-80`}>
          <Icon className="text-white" size={18} />
        </div>
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
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative
        ${active
          ? 'bg-primary/15 text-primary border border-primary/25 shadow-md shadow-primary/10'
          : 'text-muted-foreground hover:text-foreground hover:bg-white/5 border border-transparent'
        }`}
      title={collapsed ? item.label : undefined}
    >
      {active && (
        <motion.div
          aria-hidden="true"
          layoutId="nav-pill"
          className="absolute inset-0 rounded-xl bg-primary/10 border border-primary/20"
          transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
        />
      )}
      <Icon
        className={`shrink-0 transition-colors relative z-10 ${active ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`}
        size={17}
      />
      {!collapsed && <span className="truncate relative z-10">{item.label}</span>}
      {!collapsed && active && <ChevronRight className="ml-auto text-primary relative z-10 shrink-0" size={13} />}
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
      className={`flex-1 flex flex-col items-center gap-0.5 py-2 px-1 transition-colors ${
        active ? 'text-primary' : 'text-muted-foreground'
      }`}
    >
      <Icon size={20} className={active ? 'text-primary' : 'text-muted-foreground'} />
      <span className="text-[9px] font-medium uppercase tracking-wide leading-none">{item.label}</span>
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

// ── Main App ──────────────────────────────────────────────────────────────────

function App() {
  const isMobile = useIsMobile()
  const [activeView, setActiveView] = useState<string>('dashboard')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const [compilationFilters, setCompilationFilters] = useKV<CompilationFilter[]>('compilation-filters', [])
  const [artistMappings, setArtistMappings] = useKV<ArtistMapping[]>('artist-mappings', [])
  const [splitFees, setSplitFees] = useKV<SplitFee[]>('split-fees', [])
  const [manualRevenues, setManualRevenues] = useKV<ManualRevenue[]>('manual-revenues', [])
  const [labelInfo, setLabelInfo] = useKV<LabelInfo>('label-info', { name: '', address: '' })
  const [excludePhysical, setExcludePhysical] = useKV<boolean>('exclude-physical', false)
  const [periodStart, setPeriodStart] = useKV<string>('period-start', '')
  const [periodEnd, setPeriodEnd] = useKV<string>('period-end', '')
  const [csvAliases, setCsvAliases] = useKV<CSVColumnAlias[]>('csv-aliases', [])

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

  const {
    uniqueArtists,
    processedData,
    filteredCompilations,
    revenues,
    isProcessing,
    detectedPeriodStart,
    detectedPeriodEnd,
  } = useCSVProcessor(
    believeManager.files,
    bandcampManager.files,
    {
      compilationFilters: compilationFilters ?? [],
      artistMappings: artistMappings ?? [],
      splitFees: splitFees ?? [],
      manualRevenues: manualRevenues ?? [],
      excludePhysical: excludePhysical ?? false,
      csvAliases: csvAliases ?? [],
    }
  )

  // Auto-apply detected period when new files are loaded and period is empty.
  // We use a ref to capture the current period values so the effect only
  // depends on the detected values (avoiding a potential circular dependency).
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
    if (!periodStartRef.current && !periodEndRef.current) {
      setPeriodStart(detectedPeriodStart)
      setPeriodEnd(detectedPeriodEnd)
      toast.success('Statement period auto-detected from CSV data', {
        description: `${detectedPeriodStart} → ${detectedPeriodEnd}`,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detectedPeriodStart, detectedPeriodEnd])

  useSplitFeeSync(uniqueArtists, splitFees ?? [], setSplitFees)

  const { handleDownloadPDF, handleDownloadExcel, handleDownloadAll } = useExports(
    processedData,
    labelInfo ?? { name: '', address: '' },
    periodStart ?? '',
    periodEnd ?? ''
  )

  const handleAddCompilationFilter = useCallback(
    (filter: Omit<CompilationFilter, 'id'>) => {
      setCompilationFilters(current => [...(current ?? []), { ...filter, id: crypto.randomUUID() }])
      toast.success('Compilation exclusion added')
    },
    [setCompilationFilters]
  )
  const handleRemoveCompilationFilter = useCallback(
    (id: string) => {
      setCompilationFilters(current => (current ?? []).filter(f => f.id !== id))
      toast.info('Compilation exclusion removed')
    },
    [setCompilationFilters]
  )
  const handleAddArtistMapping = useCallback(
    (mapping: Omit<ArtistMapping, 'id'>) => {
      setArtistMappings(current => [...(current ?? []), { ...mapping, id: crypto.randomUUID() }])
      toast.success('Artist mapping added')
    },
    [setArtistMappings]
  )
  const handleRemoveArtistMapping = useCallback(
    (id: string) => {
      setArtistMappings(current => (current ?? []).filter(m => m.id !== id))
      toast.info('Artist mapping removed')
    },
    [setArtistMappings]
  )
  const handleUpdateSplitFee = useCallback(
    (artist: string, percentage: number) => {
      setSplitFees(current =>
        (current ?? []).map(sf => (sf.artist === artist ? { ...sf, percentage } : sf))
      )
    },
    [setSplitFees]
  )
  const handleAddManualRevenue = useCallback(
    (revenue: Omit<ManualRevenue, 'id'>) => {
      setManualRevenues(current => [...(current ?? []), { ...revenue, id: crypto.randomUUID() }])
      toast.success('Manual revenue added')
    },
    [setManualRevenues]
  )
  const handleRemoveManualRevenue = useCallback(
    (id: string) => {
      setManualRevenues(current => (current ?? []).filter(r => r.id !== id))
      toast.info('Manual revenue removed')
    },
    [setManualRevenues]
  )
  const handleAddAlias = useCallback(
    (alias: Omit<CSVColumnAlias, 'id'>) => {
      setCsvAliases(current => [...(current ?? []), { ...alias, id: crypto.randomUUID() }])
      toast.success('Column synonym added')
    },
    [setCsvAliases]
  )
  const handleRemoveAlias = useCallback(
    (id: string) => {
      setCsvAliases(current => (current ?? []).filter(a => a.id !== id))
      toast.info('Column synonym removed')
    },
    [setCsvAliases]
  )

  const totalNetRevenue = useMemo(
    () => revenues.reduce((s, r) => s + r.finalAmount, 0),
    [revenues]
  )
  const totalFiles = useMemo(
    () => believeManager.files.length + bandcampManager.files.length,
    [believeManager.files.length, bandcampManager.files.length]
  )
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

  // Mobile nav items — only first 5 to fit bottom bar
  const mobileNavItems = NAV_ITEMS.slice(0, 5)

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <Toaster position="top-right" theme="dark" richColors />

      {/* ── Desktop Sidebar ─────────────────────────────── */}
      {!isMobile && (
        <motion.aside
          animate={{ width: sidebarCollapsed ? 64 : 240 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
          className="relative flex-none flex flex-col border-r border-border/60 bg-card/60 backdrop-blur-xl overflow-hidden z-20"
        >
          <div className="flex items-center gap-3 px-4 py-5 border-b border-border/40">
            <div className="shrink-0 p-2 rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/30">
              <Disc3 className="text-white" size={18} />
            </div>
            {!sidebarCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.18 }}
              >
                <p className="text-sm font-bold tracking-tight text-foreground leading-none">SOS Generator</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 font-medium uppercase tracking-widest">Label Suite</p>
              </motion.div>
            )}
          </div>

          <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
            {NAV_ITEMS.map(item => (
              <SideNavItem
                key={item.id}
                item={item}
                active={activeView === item.id}
                onClick={() => navigate(item.id)}
                collapsed={sidebarCollapsed}
              />
            ))}
          </nav>

          {!sidebarCollapsed && (
            <div className="px-3 pb-4 space-y-2">
              <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-colors ${
                isProcessing
                  ? 'bg-amber-500/10 border-amber-500/20'
                  : 'bg-emerald-500/10 border-emerald-500/20'
              }`}>
                <span className={`w-2 h-2 rounded-full animate-pulse ${isProcessing ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                <span className={`text-[10px] font-medium uppercase tracking-wider ${isProcessing ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {isProcessing ? 'Processing…' : 'Parser Ready'}
                </span>
              </div>
              {totalFiles > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/8 border border-primary/15">
                  <UploadCloud size={12} className="text-primary shrink-0" />
                  <span className="text-[10px] font-medium text-primary truncate">
                    {totalFiles} file{totalFiles !== 1 ? 's' : ''} loaded
                  </span>
                </div>
              )}
            </div>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarCollapsed(c => !c)}
            className="absolute top-4 right-2 h-7 w-7 text-muted-foreground hover:text-foreground opacity-50 hover:opacity-100"
          >
            {sidebarCollapsed ? <Menu size={14} /> : <X size={14} />}
          </Button>
        </motion.aside>
      )}

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
                initial={{ x: -260 }}
                animate={{ x: 0 }}
                exit={{ x: -260 }}
                transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                className="fixed top-0 left-0 h-full w-64 flex flex-col border-r border-border/60 bg-card/95 backdrop-blur-xl z-50 shadow-2xl"
              >
                <div className="flex items-center gap-3 px-4 py-5 border-b border-border/40">
                  <div className="shrink-0 p-2 rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/30">
                    <Disc3 className="text-white" size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold tracking-tight text-foreground leading-none">SOS Generator</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 font-medium uppercase tracking-widest">Label Suite</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setMobileMenuOpen(false)}
                    className="ml-auto h-8 w-8 text-muted-foreground"
                  >
                    <X size={16} />
                  </Button>
                </div>

                <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
                  {NAV_ITEMS.map(item => (
                    <SideNavItem
                      key={item.id}
                      item={item}
                      active={activeView === item.id}
                      onClick={() => navigate(item.id)}
                      collapsed={false}
                    />
                  ))}
                </nav>

                <div className="px-3 pb-6 space-y-2">
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${
                    isProcessing ? 'bg-amber-500/10 border-amber-500/20' : 'bg-emerald-500/10 border-emerald-500/20'
                  }`}>
                    <span className={`w-2 h-2 rounded-full animate-pulse ${isProcessing ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                    <span className={`text-[10px] font-medium uppercase tracking-wider ${isProcessing ? 'text-amber-400' : 'text-emerald-400'}`}>
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
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header */}
        <header className="shrink-0 flex items-center justify-between px-4 md:px-6 py-3.5 border-b border-border/40 bg-card/30 backdrop-blur-md">
          <div className="flex items-center gap-3">
            {isMobile && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(true)}
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
              >
                <Menu size={18} />
              </Button>
            )}
            <div>
              <div className="flex items-center gap-2">
                {!isMobile && (
                  <span className="text-xs text-muted-foreground">
                    {labelInfo?.name || 'SOS Generator'}
                  </span>
                )}
                {!isMobile && <ChevronRight size={12} className="text-muted-foreground/50" />}
                <h1 className="text-base font-bold text-foreground">
                  {NAV_ITEMS.find(n => n.id === activeView)?.label ?? 'Dashboard'}
                </h1>
              </div>
              {isMobile && labelInfo?.name && (
                <p className="text-xs text-muted-foreground">{labelInfo.name}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isProcessing && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/25"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-[10px] font-medium text-amber-400 uppercase tracking-wider hidden sm:block">Processing</span>
              </motion.div>
            )}
            {totalFiles > 0 && !isProcessing && (
              <span className="hidden sm:inline text-xs px-2.5 py-1 rounded-full bg-primary/12 text-primary border border-primary/20 font-medium">
                {totalFiles} file{totalFiles !== 1 ? 's' : ''}
              </span>
            )}
            <Button
              size="sm"
              className="bg-primary/90 hover:bg-primary text-primary-foreground text-xs h-8 gap-1.5 shadow-md shadow-primary/20"
              onClick={() => navigate('reports')}
            >
              <Download size={13} />
              <span className="hidden sm:inline">Export</span>
            </Button>
          </div>
        </header>

        {/* Page content */}
        <main className={`flex-1 overflow-y-auto px-4 md:px-8 lg:px-12 py-6 md:py-8 ${isMobile ? 'pb-20' : ''}`}>
          <div className="max-w-7xl mx-auto">
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
                <div className="space-y-6 md:space-y-8">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
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
                    <Card className="border border-border/60 bg-card/70 backdrop-blur-md rounded-2xl overflow-hidden">
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
                <div className="space-y-6">
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
                    <div className="flex items-center gap-2 mb-3">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">1</span>
                      <h2 className="text-sm font-semibold">Upload CSV Files</h2>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <Card className="p-5 border border-border/60 bg-card/70 backdrop-blur-md rounded-2xl">
                        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                          <span className="inline-block w-1.5 h-4 rounded-full bg-primary" />
                          Believe CSV Files
                        </h3>
                        <FileUploadZone
                          type="believe"
                          files={believeManager.files}
                          fileStates={believeManager.fileStates}
                          onFilesAdded={believeManager.addFiles}
                          onFileRemoved={believeManager.removeFile}
                          onFileReplaced={believeManager.replaceFile}
                        />
                      </Card>

                      <Card className="p-5 border border-border/60 bg-card/70 backdrop-blur-md rounded-2xl">
                        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                          <span className="inline-block w-1.5 h-4 rounded-full bg-cyan-400" />
                          Bandcamp CSV Files
                        </h3>
                        <FileUploadZone
                          type="bandcamp"
                          files={bandcampManager.files}
                          fileStates={bandcampManager.fileStates}
                          onFilesAdded={bandcampManager.addFiles}
                          onFileRemoved={bandcampManager.removeFile}
                          onFileReplaced={bandcampManager.replaceFile}
                        />
                      </Card>
                    </div>

                    {/* Summary stats after processing */}
                    {!isProcessing && revenues.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3"
                      >
                        {[
                          {
                            label: 'Total Rows',
                            value: (
                              [...believeManager.files, ...bandcampManager.files]
                                .reduce((s, f) => s + (f.rowsParsed ?? 0), 0)
                            ).toLocaleString(),
                          },
                          {
                            label: 'Unique Artists',
                            value: uniqueArtists.length.toLocaleString(),
                          },
                          {
                            label: 'Files Loaded',
                            value: (believeManager.files.length + bandcampManager.files.length).toString(),
                          },
                          {
                            label: 'Total Revenue',
                            value: revenues
                              .reduce((s, r) => s + r.totalRevenue, 0)
                              .toLocaleString('de-DE', { style: 'currency', currency: 'EUR' }),
                          },
                        ].map(stat => (
                          <div key={stat.label} className="p-3 rounded-xl bg-card/70 border border-border/50 text-center">
                            <p className="text-lg font-bold font-mono tabular-nums">{stat.value}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </div>

                  {/* ── Step 2: Configure Statement Period ── */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">2</span>
                      <h2 className="text-sm font-semibold">Configure Statement Period</h2>
                    </div>

                    <Card className="p-5 border border-border/60 bg-card/70 backdrop-blur-md rounded-2xl">
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
                            type="month"
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
                            type="month"
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
                    <div className="flex items-center gap-2 mb-3">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">3</span>
                      <h2 className="text-sm font-semibold">Manual Entries <span className="text-muted-foreground font-normal">(Darkmerch / Sync)</span></h2>
                    </div>

                    <Card className="p-5 border border-border/60 bg-card/70 backdrop-blur-md rounded-2xl">
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
                <Card className="border border-border/60 bg-card/70 backdrop-blur-md rounded-2xl overflow-hidden">
                  <AnalyticsDashboard revenues={revenues} />
                </Card>
              )}

              {/* ── Artists ─── */}
              {activeView === 'artists' && (
                <div className="space-y-4">
                  <Card className="border border-border/60 bg-card/70 backdrop-blur-md rounded-2xl overflow-hidden">
                    <ArtistTreeView processedData={processedData} />
                  </Card>
                  <Card className="p-5 border border-border/60 bg-card/70 backdrop-blur-md rounded-2xl">
                    <ArtistMappingManager
                      mappings={artistMappings ?? []}
                      onAddMapping={handleAddArtistMapping}
                      onRemoveMapping={handleRemoveArtistMapping}
                    />
                  </Card>
                </div>
              )}

              {/* ── Reports ─── */}
              {activeView === 'reports' && (
                <Card className="border border-border/60 bg-card/70 backdrop-blur-md rounded-2xl overflow-hidden">
                  <ReportingPanel revenues={revenues} />
                </Card>
              )}

              {/* ── Settings ─── */}
              {activeView === 'settings' && (
                <div className="space-y-4">
                  <Card className="p-5 border border-border/60 bg-card/70 backdrop-blur-md rounded-2xl">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <h3 className="font-semibold text-sm">Exclude Physical Products</h3>
                        <p className="text-xs text-muted-foreground">
                          Exclude physical sales (CD, Vinyl…) from revenue calculations.
                        </p>
                      </div>
                      <Switch
                        checked={excludePhysical ?? false}
                        onCheckedChange={checked => setExcludePhysical(checked)}
                      />
                    </div>
                  </Card>
                  <Card className="p-5 border border-border/60 bg-card/70 backdrop-blur-md rounded-2xl">
                    <CompilationFilterManager
                      filters={compilationFilters ?? []}
                      onAddFilter={handleAddCompilationFilter}
                      onRemoveFilter={handleRemoveCompilationFilter}
                    />
                  </Card>
                  <Card className="p-5 border border-border/60 bg-card/70 backdrop-blur-md rounded-2xl">
                    <SplitFeeManager
                      splitFees={splitFees ?? []}
                      onUpdateSplitFee={handleUpdateSplitFee}
                    />
                  </Card>
                  <Card className="p-5 border border-border/60 bg-card/70 backdrop-blur-md rounded-2xl">
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
                <Card className="border border-border/60 bg-card/70 backdrop-blur-md rounded-2xl overflow-hidden">
                  <HistoryPanel entries={historyEntries} onClearHistory={clearHistory} />
                </Card>
              )}

              {/* ── Branding ─── */}
              {activeView === 'branding' && (
                <Card className="border border-border/60 bg-card/70 backdrop-blur-md rounded-2xl overflow-hidden">
                  <LabelBranding
                    labelInfo={labelInfo ?? { name: '', address: '' }}
                    onUpdate={setLabelInfo}
                  />
                </Card>
              )}
            </motion.div>
          </AnimatePresence>
          </div>
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
              className={`flex-1 flex flex-col items-center gap-0.5 py-2 px-1 transition-colors ${
                !mobileNavItems.some(i => i.id === activeView) ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <Menu size={20} />
              <span className="text-[9px] font-medium uppercase tracking-wide leading-none">More</span>
            </button>
          </nav>
        )}
      </div>
    </div>
  )
}

export default App
