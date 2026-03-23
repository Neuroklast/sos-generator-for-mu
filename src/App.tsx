import { useCallback, useMemo, useState } from 'react'
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
  initial: { opacity: 0, x: 12 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.22, ease: 'easeOut' } },
  exit: { opacity: 0, x: -8, transition: { duration: 0.15 } },
}

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  accentClass,
  delay = 0,
}: {
  label: string
  value: string
  sub?: string
  icon: React.ComponentType<{ className?: string; size?: number }>
  accentClass: string
  delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35, ease: 'easeOut' }}
      className={`relative overflow-hidden rounded-2xl border bg-card/70 backdrop-blur-md p-5 transition-colors ${accentClass}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-1">{label}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
        </div>
        <div className="p-2 rounded-xl bg-primary/10">
          <Icon className="text-primary" size={20} />
        </div>
      </div>
    </motion.div>
  )
}

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
      whileTap={{ scale: 0.97 }}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group
        ${active
          ? 'bg-primary/15 text-primary border border-primary/25 shadow-md shadow-primary/10'
          : 'text-muted-foreground hover:text-foreground hover:bg-white/5 border border-transparent'
        }`}
      title={collapsed ? item.label : undefined}
    >
      <Icon
        className={`shrink-0 transition-colors ${active ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`}
        size={18}
      />
      {!collapsed && <span className="truncate">{item.label}</span>}
      {!collapsed && active && <ChevronRight className="ml-auto text-primary" size={14} />}
    </motion.button>
  )
}

function App() {
  const [activeView, setActiveView] = useState<string>('dashboard')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

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

  const { uniqueArtists, processedData, filteredCompilations, revenues, isProcessing } = useCSVProcessor(
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

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <Toaster position="top-right" theme="dark" richColors />

      {/* Sidebar */}
      <motion.aside
        animate={{ width: sidebarCollapsed ? 64 : 240 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        className="relative flex-none flex flex-col border-r border-border/60 bg-card/60 backdrop-blur-xl overflow-hidden"
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

        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(item => (
            <SideNavItem
              key={item.id}
              item={item}
              active={activeView === item.id}
              onClick={() => setActiveView(item.id)}
              collapsed={sidebarCollapsed}
            />
          ))}
        </nav>

        {!sidebarCollapsed && (
          <div className="px-3 pb-4">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-medium text-emerald-400 uppercase tracking-wider">
                {isProcessing ? 'Processing...' : 'Parser Ready'}
              </span>
            </div>
          </div>
        )}

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarCollapsed(c => !c)}
          className="absolute top-4 right-3 h-7 w-7 text-muted-foreground hover:text-foreground opacity-60 hover:opacity-100"
        >
          {sidebarCollapsed ? <Menu size={14} /> : <X size={14} />}
        </Button>
      </motion.aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-border/40 bg-card/30 backdrop-blur-md">
          <div>
            <h1 className="text-lg font-bold text-foreground">
              {NAV_ITEMS.find(n => n.id === activeView)?.label ?? 'Dashboard'}
            </h1>
            {labelInfo?.name && (
              <p className="text-xs text-muted-foreground mt-0.5">{labelInfo.name}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            {totalFiles > 0 && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-primary/15 text-primary border border-primary/25 font-medium">
                {totalFiles} file{totalFiles !== 1 ? 's' : ''} loaded
              </span>
            )}
            <Button
              size="sm"
              variant="outline"
              className="border-primary/30 hover:border-primary/60 hover:bg-primary/10 text-xs"
              onClick={() => setActiveView('reports')}
            >
              <FileText size={13} className="mr-1.5" />
              Export
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-6 py-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              {activeView === 'dashboard' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard
                      label="Total Net Revenue"
                      value={`€${totalNetRevenue.toFixed(2)}`}
                      sub={`${revenues.length} artist${revenues.length !== 1 ? 's' : ''}`}
                      icon={TrendingUp}
                      accentClass="border-primary/20 hover:border-primary/40"
                      delay={0}
                    />
                    <StatCard
                      label="Active Artists"
                      value={String(uniqueArtists.length)}
                      sub={`${(splitFees ?? []).length} split rules`}
                      icon={Users}
                      accentClass="border-violet-500/20 hover:border-violet-500/40"
                      delay={0.06}
                    />
                    <StatCard
                      label="Top Platform"
                      value={topPlatform}
                      sub="by gross revenue"
                      icon={Zap}
                      accentClass="border-cyan-500/20 hover:border-cyan-500/40"
                      delay={0.12}
                    />
                    <StatCard
                      label="Files Loaded"
                      value={String(totalFiles)}
                      sub={`${believeManager.files.length} Believe · ${bandcampManager.files.length} Bandcamp`}
                      icon={UploadCloud}
                      accentClass="border-emerald-500/20 hover:border-emerald-500/40"
                      delay={0.18}
                    />
                  </div>
                  <Card className="border border-border/60 bg-card/70 backdrop-blur-md rounded-2xl overflow-hidden">
                    <RevenueDashboard
                      revenues={revenues}
                      filteredCompilations={filteredCompilations}
                      onDownloadAll={handleDownloadAll}
                      onDownloadPDF={handleDownloadPDF}
                      onDownloadExcel={handleDownloadExcel}
                    />
                  </Card>
                </div>
              )}

              {activeView === 'ingest' && (
                <div className="space-y-5">
                  <Card className="p-6 border border-border/60 bg-card/70 backdrop-blur-md rounded-2xl">
                    <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
                      <span className="inline-block w-1.5 h-5 rounded-full bg-primary" />
                      Believe CSV Files
                    </h2>
                    <FileUploadZone
                      type="believe"
                      files={believeManager.files}
                      fileStates={believeManager.fileStates}
                      onFilesAdded={believeManager.addFiles}
                      onFileRemoved={believeManager.removeFile}
                      onFileReplaced={believeManager.replaceFile}
                    />
                  </Card>
                  <Card className="p-6 border border-border/60 bg-card/70 backdrop-blur-md rounded-2xl">
                    <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
                      <span className="inline-block w-1.5 h-5 rounded-full bg-cyan-400" />
                      Bandcamp CSV Files
                    </h2>
                    <FileUploadZone
                      type="bandcamp"
                      files={bandcampManager.files}
                      fileStates={bandcampManager.fileStates}
                      onFilesAdded={bandcampManager.addFiles}
                      onFileRemoved={bandcampManager.removeFile}
                      onFileReplaced={bandcampManager.replaceFile}
                    />
                  </Card>
                  <Card className="p-6 border border-border/60 bg-card/70 backdrop-blur-md rounded-2xl">
                    <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
                      <span className="inline-block w-1.5 h-5 rounded-full bg-violet-400" />
                      Manual Entries (Darkmerch / Sync)
                    </h2>
                    <ManualRevenueManager
                      revenues={manualRevenues ?? []}
                      artists={uniqueArtists}
                      onAddRevenue={handleAddManualRevenue}
                      onRemoveRevenue={handleRemoveManualRevenue}
                    />
                  </Card>
                  <Card className="p-6 border border-border/60 bg-card/70 backdrop-blur-md rounded-2xl">
                    <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
                      <span className="inline-block w-1.5 h-5 rounded-full bg-amber-400" />
                      Statement Period
                    </h2>
                    <p className="text-sm text-muted-foreground mb-4">
                      Define the reporting period for generated PDF and Excel statements.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="flex-1 space-y-1.5">
                        <Label htmlFor="period-start" className="text-sm font-medium">Period Start</Label>
                        <Input
                          id="period-start"
                          type="month"
                          value={periodStart ?? ''}
                          onChange={e => setPeriodStart(e.target.value)}
                          className="border border-border/60 bg-background/50 focus:border-primary/60"
                        />
                      </div>
                      <div className="flex-1 space-y-1.5">
                        <Label htmlFor="period-end" className="text-sm font-medium">Period End</Label>
                        <Input
                          id="period-end"
                          type="month"
                          value={periodEnd ?? ''}
                          onChange={e => setPeriodEnd(e.target.value)}
                          className="border border-border/60 bg-background/50 focus:border-primary/60"
                        />
                      </div>
                    </div>
                  </Card>
                </div>
              )}

              {activeView === 'analytics' && (
                <Card className="border border-border/60 bg-card/70 backdrop-blur-md rounded-2xl overflow-hidden">
                  <AnalyticsDashboard revenues={revenues} />
                </Card>
              )}

              {activeView === 'artists' && (
                <div className="space-y-5">
                  <Card className="border border-border/60 bg-card/70 backdrop-blur-md rounded-2xl overflow-hidden">
                    <ArtistTreeView processedData={processedData} />
                  </Card>
                  <Card className="p-6 border border-border/60 bg-card/70 backdrop-blur-md rounded-2xl">
                    <ArtistMappingManager
                      mappings={artistMappings ?? []}
                      onAddMapping={handleAddArtistMapping}
                      onRemoveMapping={handleRemoveArtistMapping}
                    />
                  </Card>
                </div>
              )}

              {activeView === 'reports' && (
                <Card className="border border-border/60 bg-card/70 backdrop-blur-md rounded-2xl overflow-hidden">
                  <ReportingPanel revenues={revenues} />
                </Card>
              )}

              {activeView === 'settings' && (
                <div className="space-y-5">
                  <Card className="p-6 border border-border/60 bg-card/70 backdrop-blur-md rounded-2xl">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <h3 className="font-semibold">Exclude Physical Products</h3>
                        <p className="text-sm text-muted-foreground">
                          Exclude physical sales (CD, Vinyl...) from revenue calculations.
                        </p>
                      </div>
                      <Switch
                        checked={excludePhysical ?? false}
                        onCheckedChange={checked => setExcludePhysical(checked)}
                      />
                    </div>
                  </Card>
                  <Card className="p-6 border border-border/60 bg-card/70 backdrop-blur-md rounded-2xl">
                    <CompilationFilterManager
                      filters={compilationFilters ?? []}
                      onAddFilter={handleAddCompilationFilter}
                      onRemoveFilter={handleRemoveCompilationFilter}
                    />
                  </Card>
                  <Card className="p-6 border border-border/60 bg-card/70 backdrop-blur-md rounded-2xl">
                    <SplitFeeManager
                      splitFees={splitFees ?? []}
                      onUpdateSplitFee={handleUpdateSplitFee}
                    />
                  </Card>
                  <Card className="p-6 border border-border/60 bg-card/70 backdrop-blur-md rounded-2xl">
                    <CSVColumnMapper
                      aliases={csvAliases ?? []}
                      onAddAlias={handleAddAlias}
                      onRemoveAlias={handleRemoveAlias}
                    />
                  </Card>
                </div>
              )}

              {activeView === 'history' && (
                <Card className="border border-border/60 bg-card/70 backdrop-blur-md rounded-2xl overflow-hidden">
                  <HistoryPanel entries={historyEntries} onClearHistory={clearHistory} />
                </Card>
              )}

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
        </main>
      </div>
    </div>
  )
}

export default App
