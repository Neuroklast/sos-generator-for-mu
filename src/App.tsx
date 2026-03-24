import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useKV } from '@/hooks/useLocalKV'
import { motion, AnimatePresence } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  BarChart2,
  FileText,
  Settings,
  Menu,
  X,
  ChevronRight,
  Disc3,
  TrendingUp,
  Sparkles,
  Download,
  CalendarDays,
  Users,
  Check,
  ChevronLeft,
  Sliders,
  GitBranch,
  Clock,
  Tag,
  Layers,
} from 'lucide-react'
import { Toaster } from 'sonner'

// ── Workflow steps ─────────────────────────────────────────────────────────────

type WorkflowStep = 'upload' | 'adjust' | 'analyze' | 'export'

interface StepDef {
  id: WorkflowStep
  label: string
  num: number
  desc: string
  icon: React.ComponentType<{ className?: string; size?: number }>
}

const STEPS: StepDef[] = [
  { id: 'upload',  label: 'Upload',  num: 1, desc: 'Import CSV files',      icon: UploadCloud },
  { id: 'adjust',  label: 'Adjust',  num: 2, desc: 'Configure & filter',    icon: Sliders },
  { id: 'analyze', label: 'Analyze', num: 3, desc: 'View revenue insights', icon: BarChart2 },
  { id: 'export',  label: 'Export',  num: 4, desc: 'Generate statements',   icon: Download },
]

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.2 } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.12 } },
}

// ── KPI stat card ─────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
  delay = 0,
}: {
  label: string
  value: string
  sub?: string
  icon: React.ComponentType<{ className?: string; size?: number }>
  color: string
  delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35, ease: 'easeOut' }}
      className="relative overflow-hidden rounded-2xl border border-border/60 bg-card p-5 min-w-0"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">{label}</p>
          <p className="text-2xl font-bold text-foreground leading-none truncate">{value}</p>
          {sub && <p className="text-xs text-muted-foreground mt-1.5 leading-tight truncate">{sub}</p>}
        </div>
        <div className={`shrink-0 p-2.5 rounded-xl ${color}`}>
          <Icon className="text-white" size={16} />
        </div>
      </div>
    </motion.div>
  )
}

// ── Sidebar step item ─────────────────────────────────────────────────────────

function StepItem({
  step,
  isActive,
  isDone,
  collapsed,
  onClick,
}: {
  step: StepDef
  isActive: boolean
  isDone: boolean
  collapsed: boolean
  onClick: () => void
}) {
  const Icon = step.icon
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 rounded-xl transition-all duration-200 relative group
        ${collapsed ? 'px-2 py-2.5 justify-center' : 'px-3 py-2.5'}
        ${isActive
          ? 'bg-primary/15 text-primary border border-primary/25'
          : isDone
          ? 'text-emerald-400 hover:bg-emerald-500/8 border border-transparent'
          : 'text-muted-foreground hover:text-foreground hover:bg-white/5 border border-transparent'
        }`}
      title={collapsed ? `${step.num}. ${step.label}` : undefined}
    >
      {/* Step number / check */}
      <div className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border
        ${isActive  ? 'bg-primary text-white border-primary'
          : isDone  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
          : 'bg-muted/50 text-muted-foreground border-border/60'}`}
      >
        {isDone ? <Check size={11} /> : step.num}
      </div>

      {!collapsed && (
        <div className="flex-1 text-left min-w-0">
          <p className={`text-sm font-semibold leading-none ${isActive ? 'text-primary' : ''}`}>{step.label}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5 leading-none truncate">{step.desc}</p>
        </div>
      )}

      {!collapsed && isActive && <ChevronRight size={13} className="text-primary shrink-0" />}
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
      <Sparkles size={14} className="shrink-0" />
      <p className="text-sm flex-1">
        <span className="font-semibold">Period detected: </span>
        {fmt(detectedStart)} → {fmt(detectedEnd)}
      </p>
      <Button
        size="sm"
        variant="outline"
        className="border-amber-500/40 text-amber-400 hover:bg-amber-500/20 text-xs h-7"
        onClick={onApply}
      >
        Apply
      </Button>
    </motion.div>
  )
}

// ── Section header ─────────────────────────────────────────────────────────────

function SectionHeader({ title, desc, icon: Icon }: { title: string; desc?: string; icon?: React.ComponentType<{ className?: string; size?: number }> }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      {Icon && (
        <div className="p-2.5 rounded-xl bg-primary/12 border border-primary/20 shrink-0">
          <Icon className="text-primary" size={18} />
        </div>
      )}
      <div>
        <h2 className="text-lg font-bold text-foreground leading-tight">{title}</h2>
        {desc && <p className="text-sm text-muted-foreground mt-0.5">{desc}</p>}
      </div>
    </div>
  )
}

// ── Main App ──────────────────────────────────────────────────────────────────

function App() {
  const isMobile = useIsMobile()
  const [step, setStep] = useState<WorkflowStep>('upload')
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
    }, [setCompilationFilters]
  )
  const handleRemoveCompilationFilter = useCallback(
    (id: string) => {
      setCompilationFilters(current => (current ?? []).filter(f => f.id !== id))
      toast.info('Compilation exclusion removed')
    }, [setCompilationFilters]
  )
  const handleAddArtistMapping = useCallback(
    (mapping: Omit<ArtistMapping, 'id'>) => {
      setArtistMappings(current => [...(current ?? []), { ...mapping, id: crypto.randomUUID() }])
      toast.success('Artist mapping added')
    }, [setArtistMappings]
  )
  const handleRemoveArtistMapping = useCallback(
    (id: string) => {
      setArtistMappings(current => (current ?? []).filter(m => m.id !== id))
      toast.info('Artist mapping removed')
    }, [setArtistMappings]
  )
  const handleUpdateSplitFee = useCallback(
    (artist: string, percentage: number) => {
      setSplitFees(current =>
        (current ?? []).map(sf => (sf.artist === artist ? { ...sf, percentage } : sf))
      )
    }, [setSplitFees]
  )
  const handleAddManualRevenue = useCallback(
    (revenue: Omit<ManualRevenue, 'id'>) => {
      setManualRevenues(current => [...(current ?? []), { ...revenue, id: crypto.randomUUID() }])
      toast.success('Manual revenue added')
    }, [setManualRevenues]
  )
  const handleRemoveManualRevenue = useCallback(
    (id: string) => {
      setManualRevenues(current => (current ?? []).filter(r => r.id !== id))
      toast.info('Manual revenue removed')
    }, [setManualRevenues]
  )
  const handleAddAlias = useCallback(
    (alias: Omit<CSVColumnAlias, 'id'>) => {
      setCsvAliases(current => [...(current ?? []), { ...alias, id: crypto.randomUUID() }])
      toast.success('Column synonym added')
    }, [setCsvAliases]
  )
  const handleRemoveAlias = useCallback(
    (id: string) => {
      setCsvAliases(current => (current ?? []).filter(a => a.id !== id))
      toast.info('Column synonym removed')
    }, [setCsvAliases]
  )

  // ── Derived values ─────────────────────────────────────────────────────────

  const totalFiles = useMemo(
    () => believeManager.files.length + bandcampManager.files.length,
    [believeManager.files.length, bandcampManager.files.length]
  )
  const totalNetRevenue = useMemo(
    () => revenues.reduce((s, r) => s + r.finalAmount, 0),
    [revenues]
  )
  const topPlatform = useMemo(() => {
    const map: Record<string, number> = {}
    revenues.forEach(r => r.platformBreakdown.forEach(p => {
      map[p.platform] = (map[p.platform] ?? 0) + p.revenue
    }))
    const sorted = Object.entries(map).sort((a, b) => b[1] - a[1])
    return sorted[0]?.[0] ?? '—'
  }, [revenues])

  const stepIndex = STEPS.findIndex(s => s.id === step)
  const currentStep = STEPS[stepIndex]
  const nextStep = STEPS[stepIndex + 1]
  const prevStep = STEPS[stepIndex - 1]

  const hasData = revenues.length > 0 || totalFiles > 0

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <Toaster position="top-right" theme="dark" richColors />

      {/* ── Desktop Sidebar ───────────────────────────────────────────────── */}
      {!isMobile && (
        <motion.aside
          animate={{ width: sidebarCollapsed ? 64 : 224 }}
          transition={{ duration: 0.22, ease: 'easeInOut' }}
          className="relative flex-none flex flex-col border-r border-border/60 bg-card/60 backdrop-blur-xl overflow-hidden z-20"
        >
          {/* Logo */}
          <div className="flex items-center gap-3 px-3 py-5 border-b border-border/40 shrink-0">
            <div className="shrink-0 p-2 rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/30">
              <Disc3 className="text-white" size={18} />
            </div>
            {!sidebarCollapsed && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }}>
                <p className="text-sm font-bold tracking-tight text-foreground leading-none">SOS Generator</p>
                <p className="text-[9px] text-muted-foreground mt-0.5 font-medium uppercase tracking-widest">Label Suite</p>
              </motion.div>
            )}
          </div>

          {/* Steps */}
          <nav className="flex-1 px-2 py-5 space-y-1.5">
            {!sidebarCollapsed && (
              <p className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground/60 px-3 mb-3">Workflow</p>
            )}
            {STEPS.map((s, i) => (
              <StepItem
                key={s.id}
                step={s}
                isActive={step === s.id}
                isDone={stepIndex > i}
                collapsed={sidebarCollapsed}
                onClick={() => setStep(s.id)}
              />
            ))}
          </nav>

          {/* Status footer */}
          {!sidebarCollapsed && (
            <div className="px-3 pb-4 space-y-2">
              <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium uppercase tracking-wider transition-colors ${
                isProcessing
                  ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                  : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${isProcessing ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                {isProcessing ? 'Processing…' : 'Ready'}
              </div>
              {totalFiles > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/8 border border-primary/15">
                  <UploadCloud size={11} className="text-primary shrink-0" />
                  <span className="text-[10px] font-medium text-primary truncate">
                    {totalFiles} file{totalFiles !== 1 ? 's' : ''} loaded
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Collapse toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarCollapsed(c => !c)}
            className="absolute top-4 right-1 h-7 w-7 text-muted-foreground hover:text-foreground opacity-40 hover:opacity-100"
          >
            {sidebarCollapsed ? <ChevronRight size={13} /> : <X size={13} />}
          </Button>
        </motion.aside>
      )}

      {/* ── Mobile Sidebar Drawer ─────────────────────────────────────────── */}
      {isMobile && (
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              <motion.div
                key="backdrop"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                onClick={() => setMobileMenuOpen(false)}
              />
              <motion.aside
                key="drawer"
                initial={{ x: -260 }} animate={{ x: 0 }} exit={{ x: -260 }}
                transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                className="fixed top-0 left-0 h-full w-64 flex flex-col border-r border-border/60 bg-card/95 backdrop-blur-xl z-50 shadow-2xl"
              >
                <div className="flex items-center gap-3 px-4 py-5 border-b border-border/40">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/30">
                    <Disc3 className="text-white" size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground leading-none">SOS Generator</p>
                    <p className="text-[9px] text-muted-foreground mt-0.5 font-medium uppercase tracking-widest">Label Suite</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)} className="ml-auto h-8 w-8">
                    <X size={16} />
                  </Button>
                </div>
                <nav className="flex-1 px-2 py-4 space-y-1.5">
                  {STEPS.map((s, i) => (
                    <StepItem
                      key={s.id}
                      step={s}
                      isActive={step === s.id}
                      isDone={stepIndex > i}
                      collapsed={false}
                      onClick={() => { setStep(s.id); setMobileMenuOpen(false) }}
                    />
                  ))}
                </nav>
              </motion.aside>
            </>
          )}
        </AnimatePresence>
      )}

      {/* ── Main content ──────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Topbar */}
        <header className="shrink-0 flex items-center justify-between gap-4 px-4 md:px-6 py-3.5 border-b border-border/40 bg-card/30 backdrop-blur-md">
          <div className="flex items-center gap-3 min-w-0">
            {isMobile && (
              <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(true)} className="h-8 w-8 shrink-0">
                <Menu size={18} />
              </Button>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground/60 font-medium shrink-0">
                  Step {currentStep.num}
                </span>
                <span className="text-muted-foreground/40 text-xs">/</span>
                <h1 className="text-base font-bold text-foreground truncate">{currentStep.label}</h1>
              </div>
              <p className="text-[11px] text-muted-foreground leading-none mt-0.5">{currentStep.desc}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isProcessing && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/25">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-[10px] font-medium text-amber-400 uppercase tracking-wider hidden sm:block">Processing</span>
              </div>
            )}
            {totalFiles > 0 && !isProcessing && (
              <span className="hidden sm:inline text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 font-medium">
                {totalFiles} file{totalFiles !== 1 ? 's' : ''}
              </span>
            )}
            {prevStep && (
              <Button variant="ghost" size="sm" onClick={() => setStep(prevStep.id)} className="h-8 text-xs gap-1.5 text-muted-foreground hidden sm:flex">
                <ChevronLeft size={13} />
                {prevStep.label}
              </Button>
            )}
            {nextStep && (
              <Button
                size="sm"
                onClick={() => setStep(nextStep.id)}
                className="h-8 text-xs gap-1.5 bg-primary/90 hover:bg-primary text-primary-foreground shadow-md shadow-primary/20"
              >
                {nextStep.label}
                <ChevronRight size={13} />
              </Button>
            )}
            {!nextStep && (
              <Button size="sm" onClick={handleDownloadAll} className="h-8 text-xs gap-1.5 bg-primary/90 hover:bg-primary text-primary-foreground shadow-md shadow-primary/20">
                <Download size={13} />
                <span className="hidden sm:inline">Export All</span>
              </Button>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className={`flex-1 overflow-y-auto overflow-x-hidden ${isMobile ? 'pb-4' : ''}`}>
          <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >

                {/* ══════════════════════════════════════════════════════════ */}
                {/* STEP 1 — UPLOAD                                           */}
                {/* ══════════════════════════════════════════════════════════ */}
                {step === 'upload' && (
                  <div className="space-y-8">
                    <SectionHeader
                      title="Upload CSV Files"
                      desc="Import your Believe and Bandcamp revenue reports to get started"
                      icon={UploadCloud}
                    />

                    {/* Auto-detected period banner */}
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

                    {/* Upload zones */}
                    <div className="grid md:grid-cols-2 gap-5">
                      <Card className="p-6 border border-border/60 bg-card/70 rounded-2xl space-y-4">
                        <div className="flex items-center gap-2.5">
                          <span className="inline-block w-1.5 h-5 rounded-full bg-primary shrink-0" />
                          <h3 className="text-sm font-semibold">Believe CSV</h3>
                          {believeManager.files.length > 0 && (
                            <Badge variant="secondary" className="ml-auto text-xs">
                              {believeManager.files.length} file{believeManager.files.length !== 1 ? 's' : ''}
                            </Badge>
                          )}
                        </div>
                        <FileUploadZone
                          type="believe"
                          files={believeManager.files}
                          fileStates={believeManager.fileStates}
                          onFilesAdded={believeManager.addFiles}
                          onFileRemoved={believeManager.removeFile}
                          onFileReplaced={believeManager.replaceFile}
                        />
                      </Card>

                      <Card className="p-6 border border-border/60 bg-card/70 rounded-2xl space-y-4">
                        <div className="flex items-center gap-2.5">
                          <span className="inline-block w-1.5 h-5 rounded-full bg-cyan-400 shrink-0" />
                          <h3 className="text-sm font-semibold">Bandcamp CSV</h3>
                          {bandcampManager.files.length > 0 && (
                            <Badge variant="secondary" className="ml-auto text-xs">
                              {bandcampManager.files.length} file{bandcampManager.files.length !== 1 ? 's' : ''}
                            </Badge>
                          )}
                        </div>
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

                    {/* Stats row after processing */}
                    {!isProcessing && revenues.length > 0 && (
                      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                          { label: 'Rows parsed', value: [...believeManager.files, ...bandcampManager.files].reduce((s, f) => s + (f.rowsParsed ?? 0), 0).toLocaleString() },
                          { label: 'Unique artists', value: uniqueArtists.length.toLocaleString() },
                          { label: 'Total revenue', value: `€${revenues.reduce((s, r) => s + r.totalRevenue, 0).toFixed(2)}` },
                          { label: 'Compilations filtered', value: filteredCompilations.length.toLocaleString() },
                        ].map(stat => (
                          <div key={stat.label} className="rounded-xl border border-border/50 bg-card/50 p-4">
                            <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
                            <p className="text-xl font-bold mt-1">{stat.value}</p>
                          </div>
                        ))}
                      </motion.div>
                    )}

                    {/* Empty state */}
                    {totalFiles === 0 && (
                      <div className="flex flex-col items-center justify-center min-h-[30vh] gap-5 rounded-2xl border border-dashed border-border/50 bg-card/20 py-16">
                        <div className="p-5 rounded-2xl bg-primary/10 border border-primary/20">
                          <UploadCloud size={40} className="text-primary/80" />
                        </div>
                        <div className="text-center space-y-2">
                          <p className="text-lg font-semibold">No files loaded yet</p>
                          <p className="text-sm text-muted-foreground max-w-xs">
                            Upload your Believe or Bandcamp CSV export files above to get started
                          </p>
                        </div>
                      </div>
                    )}

                    {/* CTA to next step */}
                    {hasData && (
                      <div className="flex justify-end pt-2">
                        <Button onClick={() => setStep('adjust')} className="gap-2 bg-primary/90 hover:bg-primary shadow-lg shadow-primary/20">
                          Continue to Adjust
                          <ChevronRight size={15} />
                        </Button>
                      </div>
                    )}

                    {/* History panel */}
                    {historyEntries.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Clock size={14} className="text-muted-foreground" />
                          <h3 className="text-sm font-semibold text-muted-foreground">Upload History</h3>
                        </div>
                        <Card className="border border-border/60 bg-card/70 rounded-2xl overflow-hidden">
                          <HistoryPanel entries={historyEntries} onClearHistory={clearHistory} />
                        </Card>
                      </div>
                    )}
                  </div>
                )}

                {/* ══════════════════════════════════════════════════════════ */}
                {/* STEP 2 — ADJUST                                           */}
                {/* ══════════════════════════════════════════════════════════ */}
                {step === 'adjust' && (
                  <div className="space-y-6">
                    <SectionHeader
                      title="Configure & Filter"
                      desc="Set the statement period, configure artist splits, and filter compilations"
                      icon={Sliders}
                    />

                    <Tabs defaultValue="period" className="space-y-6">
                      <TabsList className="flex flex-wrap gap-1 h-auto p-1 bg-card/50 border border-border/50 rounded-xl">
                        <TabsTrigger value="period" className="text-xs h-8 rounded-lg gap-1.5">
                          <CalendarDays size={12} /> Period
                        </TabsTrigger>
                        <TabsTrigger value="compilations" className="text-xs h-8 rounded-lg gap-1.5">
                          <Layers size={12} /> Compilations
                          {(compilationFilters ?? []).length > 0 && (
                            <Badge variant="secondary" className="h-4 text-[9px] px-1.5 ml-1">{(compilationFilters ?? []).length}</Badge>
                          )}
                        </TabsTrigger>
                        <TabsTrigger value="artists" className="text-xs h-8 rounded-lg gap-1.5">
                          <GitBranch size={12} /> Artist Mappings
                          {(artistMappings ?? []).length > 0 && (
                            <Badge variant="secondary" className="h-4 text-[9px] px-1.5 ml-1">{(artistMappings ?? []).length}</Badge>
                          )}
                        </TabsTrigger>
                        <TabsTrigger value="splits" className="text-xs h-8 rounded-lg gap-1.5">
                          <Users size={12} /> Splits
                        </TabsTrigger>
                        <TabsTrigger value="manual" className="text-xs h-8 rounded-lg gap-1.5">
                          <TrendingUp size={12} /> Manual Revenue
                        </TabsTrigger>
                        <TabsTrigger value="branding" className="text-xs h-8 rounded-lg gap-1.5">
                          <Tag size={12} /> Branding
                        </TabsTrigger>
                        <TabsTrigger value="columns" className="text-xs h-8 rounded-lg gap-1.5">
                          <Settings size={12} /> Columns
                        </TabsTrigger>
                      </TabsList>

                      {/* Period */}
                      <TabsContent value="period">
                        <Card className="p-6 border border-border/60 bg-card/70 rounded-2xl space-y-6">
                          <div>
                            <h3 className="text-sm font-semibold mb-1">Statement Period</h3>
                            <p className="text-xs text-muted-foreground">Define the reporting period for generated statements</p>
                          </div>
                          <div className="grid sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="period-start" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">From (YYYY-MM)</Label>
                              <Input
                                id="period-start"
                                placeholder="2024-01"
                                value={periodStart ?? ''}
                                onChange={e => setPeriodStart(e.target.value)}
                                className="font-mono"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="period-end" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">To (YYYY-MM)</Label>
                              <Input
                                id="period-end"
                                placeholder="2024-12"
                                value={periodEnd ?? ''}
                                onChange={e => setPeriodEnd(e.target.value)}
                                className="font-mono"
                              />
                            </div>
                          </div>
                          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/40">
                            <div>
                              <p className="text-sm font-medium">Exclude physical sales</p>
                              <p className="text-xs text-muted-foreground mt-0.5">Remove physical product transactions from revenue totals</p>
                            </div>
                            <Switch
                              checked={excludePhysical ?? false}
                              onCheckedChange={setExcludePhysical}
                            />
                          </div>
                        </Card>
                      </TabsContent>

                      {/* Compilations */}
                      <TabsContent value="compilations">
                        <Card className="border border-border/60 bg-card/70 rounded-2xl overflow-hidden">
                          <CompilationFilterManager
                            filters={compilationFilters ?? []}
                            onAddFilter={handleAddCompilationFilter}
                            onRemoveFilter={handleRemoveCompilationFilter}
                          />
                        </Card>
                      </TabsContent>

                      {/* Artist Mappings */}
                      <TabsContent value="artists">
                        <Card className="border border-border/60 bg-card/70 rounded-2xl overflow-hidden">
                          <ArtistMappingManager
                            mappings={artistMappings ?? []}
                            onAddMapping={handleAddArtistMapping}
                            onRemoveMapping={handleRemoveArtistMapping}
                          />
                        </Card>
                      </TabsContent>

                      {/* Split Fees */}
                      <TabsContent value="splits">
                        <Card className="border border-border/60 bg-card/70 rounded-2xl overflow-hidden">
                          <SplitFeeManager
                            splitFees={splitFees ?? []}
                            onUpdateSplitFee={handleUpdateSplitFee}
                          />
                        </Card>
                      </TabsContent>

                      {/* Manual Revenue */}
                      <TabsContent value="manual">
                        <Card className="border border-border/60 bg-card/70 rounded-2xl overflow-hidden">
                          <ManualRevenueManager
                            revenues={manualRevenues ?? []}
                            artists={uniqueArtists}
                            onAddRevenue={handleAddManualRevenue}
                            onRemoveRevenue={handleRemoveManualRevenue}
                          />
                        </Card>
                      </TabsContent>

                      {/* Branding */}
                      <TabsContent value="branding">
                        <Card className="border border-border/60 bg-card/70 rounded-2xl overflow-hidden">
                          <LabelBranding
                            labelInfo={labelInfo ?? { name: '', address: '' }}
                            onUpdate={setLabelInfo}
                          />
                        </Card>
                      </TabsContent>

                      {/* Column Mapper */}
                      <TabsContent value="columns">
                        <Card className="border border-border/60 bg-card/70 rounded-2xl overflow-hidden">
                          <CSVColumnMapper
                            aliases={csvAliases ?? []}
                            onAddAlias={handleAddAlias}
                            onRemoveAlias={handleRemoveAlias}
                          />
                        </Card>
                      </TabsContent>
                    </Tabs>

                    <div className="flex justify-end pt-2">
                      <Button onClick={() => setStep('analyze')} className="gap-2 bg-primary/90 hover:bg-primary shadow-lg shadow-primary/20">
                        Continue to Analyze
                        <ChevronRight size={15} />
                      </Button>
                    </div>
                  </div>
                )}

                {/* ══════════════════════════════════════════════════════════ */}
                {/* STEP 3 — ANALYZE                                          */}
                {/* ══════════════════════════════════════════════════════════ */}
                {step === 'analyze' && (
                  <div className="space-y-6">
                    <SectionHeader
                      title="Revenue Analysis"
                      desc="Explore artist payouts, platform breakdown, and revenue trends"
                      icon={BarChart2}
                    />

                    {revenues.length === 0 && !isProcessing ? (
                      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-5 rounded-2xl border border-dashed border-border/50 bg-card/20">
                        <div className="p-5 rounded-2xl bg-primary/10 border border-primary/20">
                          <BarChart2 size={40} className="text-primary/80" />
                        </div>
                        <div className="text-center space-y-2">
                          <p className="text-lg font-semibold">No data to analyze</p>
                          <p className="text-sm text-muted-foreground max-w-xs">
                            Upload your CSV files in the Upload step first
                          </p>
                        </div>
                        <Button onClick={() => setStep('upload')} variant="outline" className="gap-2">
                          <UploadCloud size={14} />
                          Go to Upload
                        </Button>
                      </div>
                    ) : (
                      <>
                        {/* KPI Cards */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                          <StatCard
                            label="Net Revenue"
                            value={`€${totalNetRevenue.toFixed(2)}`}
                            sub={`${revenues.length} artist${revenues.length !== 1 ? 's' : ''}`}
                            icon={TrendingUp}
                            color="bg-gradient-to-br from-primary to-violet-600"
                            delay={0}
                          />
                          <StatCard
                            label="Active Artists"
                            value={String(uniqueArtists.length)}
                            sub={`${(splitFees ?? []).length} split rules`}
                            icon={Users}
                            color="bg-gradient-to-br from-violet-500 to-fuchsia-600"
                            delay={0.06}
                          />
                          <StatCard
                            label="Top Platform"
                            value={topPlatform}
                            sub="by gross revenue"
                            icon={BarChart2}
                            color="bg-gradient-to-br from-cyan-500 to-blue-600"
                            delay={0.12}
                          />
                          <StatCard
                            label="Files Loaded"
                            value={String(totalFiles)}
                            sub={`${believeManager.files.length} Believe · ${bandcampManager.files.length} Bandcamp`}
                            icon={UploadCloud}
                            color="bg-gradient-to-br from-emerald-500 to-teal-600"
                            delay={0.18}
                          />
                        </div>

                        {/* Period info */}
                        {(periodStart || periodEnd) && (
                          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-card/50 border border-border/40 text-sm text-muted-foreground">
                            <CalendarDays size={14} className="text-primary shrink-0" />
                            <span>Statement period: <span className="text-foreground font-medium">{periodStart || '—'}</span> → <span className="text-foreground font-medium">{periodEnd || '—'}</span></span>
                          </div>
                        )}

                        {/* Analysis tabs */}
                        <Tabs defaultValue="artists" className="space-y-5">
                          <TabsList className="bg-card/50 border border-border/50 rounded-xl p-1">
                            <TabsTrigger value="artists" className="text-xs h-8 rounded-lg gap-1.5">
                              <Users size={12} /> Artists & Releases
                            </TabsTrigger>
                            <TabsTrigger value="revenue" className="text-xs h-8 rounded-lg gap-1.5">
                              <TrendingUp size={12} /> Revenue Table
                            </TabsTrigger>
                            <TabsTrigger value="analytics" className="text-xs h-8 rounded-lg gap-1.5">
                              <BarChart2 size={12} /> Charts
                            </TabsTrigger>
                          </TabsList>

                          <TabsContent value="artists">
                            <Card className="border border-border/60 bg-card/70 rounded-2xl overflow-hidden">
                              <ArtistTreeView processedData={processedData} />
                            </Card>
                          </TabsContent>

                          <TabsContent value="revenue">
                            <Card className="border border-border/60 bg-card/70 rounded-2xl overflow-hidden">
                              <RevenueDashboard
                                revenues={revenues}
                                filteredCompilations={filteredCompilations}
                                onDownloadAll={handleDownloadAll}
                                onDownloadPDF={handleDownloadPDF}
                                onDownloadExcel={handleDownloadExcel}
                              />
                            </Card>
                          </TabsContent>

                          <TabsContent value="analytics">
                            <Card className="border border-border/60 bg-card/70 rounded-2xl overflow-hidden">
                              <AnalyticsDashboard revenues={revenues} />
                            </Card>
                          </TabsContent>
                        </Tabs>
                      </>
                    )}

                    {revenues.length > 0 && (
                      <div className="flex justify-end pt-2">
                        <Button onClick={() => setStep('export')} className="gap-2 bg-primary/90 hover:bg-primary shadow-lg shadow-primary/20">
                          Continue to Export
                          <ChevronRight size={15} />
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* ══════════════════════════════════════════════════════════ */}
                {/* STEP 4 — EXPORT                                           */}
                {/* ══════════════════════════════════════════════════════════ */}
                {step === 'export' && (
                  <div className="space-y-6">
                    <SectionHeader
                      title="Generate Statements"
                      desc="Export revenue statements as PDF or Excel for each artist"
                      icon={FileText}
                    />

                    {revenues.length === 0 ? (
                      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-5 rounded-2xl border border-dashed border-border/50 bg-card/20">
                        <div className="p-5 rounded-2xl bg-primary/10 border border-primary/20">
                          <FileText size={40} className="text-primary/80" />
                        </div>
                        <div className="text-center space-y-2">
                          <p className="text-lg font-semibold">No data to export</p>
                          <p className="text-sm text-muted-foreground max-w-xs">
                            Upload and process your CSV files before exporting
                          </p>
                        </div>
                        <Button onClick={() => setStep('upload')} variant="outline" className="gap-2">
                          <UploadCloud size={14} />
                          Go to Upload
                        </Button>
                      </div>
                    ) : (
                      <Card className="border border-border/60 bg-card/70 rounded-2xl overflow-hidden">
                        <ReportingPanel
                          revenues={revenues}
                        />
                      </Card>
                    )}
                  </div>
                )}

              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  )
}

export default App
