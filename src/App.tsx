import { useCallback } from 'react'
import { useKV } from '@github/spark/hooks'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
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
import { MusicNotes } from '@phosphor-icons/react'
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

function App() {
  // ── Persistent settings ────────────────────────────────────────────────────
  const [compilationFilters, setCompilationFilters] = useKV<CompilationFilter[]>('compilation-filters', [])
  const [artistMappings, setArtistMappings] = useKV<ArtistMapping[]>('artist-mappings', [])
  const [splitFees, setSplitFees] = useKV<SplitFee[]>('split-fees', [])
  const [manualRevenues, setManualRevenues] = useKV<ManualRevenue[]>('manual-revenues', [])
  const [labelInfo, setLabelInfo] = useKV<LabelInfo>('label-info', { name: '', address: '' })
  const [excludePhysical, setExcludePhysical] = useKV<boolean>('exclude-physical', false)
  const [periodStart, setPeriodStart] = useKV<string>('period-start', '')
  const [periodEnd, setPeriodEnd] = useKV<string>('period-end', '')
  const [csvAliases, setCsvAliases] = useKV<CSVColumnAlias[]>('csv-aliases', [])

  // ── History ────────────────────────────────────────────────────────────────
  const { entries: historyEntries, addEntry, markRemoved, clearHistory } = useHistoryLog()

  // ── File management ────────────────────────────────────────────────────────
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

  // ── CSV processing pipeline ────────────────────────────────────────────────
  const { uniqueArtists, processedData, filteredCompilations, revenues } = useCSVProcessor(
    believeManager.files,
    bandcampManager.files,
    {
      compilationFilters: compilationFilters ?? [],
      artistMappings: artistMappings ?? [],
      splitFees: splitFees ?? [],
      manualRevenues: manualRevenues ?? [],
      excludePhysical: excludePhysical ?? false,
    }
  )

  // Auto-register newly discovered artists in split fees
  useSplitFeeSync(uniqueArtists, splitFees ?? [], setSplitFees)

  // ── Exports ────────────────────────────────────────────────────────────────
  const { handleDownloadPDF, handleDownloadExcel, handleDownloadAll } = useExports(
    processedData,
    labelInfo ?? { name: '', address: '' },
    periodStart ?? '',
    periodEnd ?? ''
  )

  // ── Compilation filter handlers ────────────────────────────────────────────
  const handleAddCompilationFilter = useCallback(
    (filter: Omit<CompilationFilter, 'id'>) => {
      setCompilationFilters(current => [
        ...(current ?? []),
        { ...filter, id: crypto.randomUUID() },
      ])
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

  // ── Artist mapping handlers ────────────────────────────────────────────────
  const handleAddArtistMapping = useCallback(
    (mapping: Omit<ArtistMapping, 'id'>) => {
      setArtistMappings(current => [
        ...(current ?? []),
        { ...mapping, id: crypto.randomUUID() },
      ])
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

  // ── Split fee handlers ─────────────────────────────────────────────────────
  const handleUpdateSplitFee = useCallback(
    (artist: string, percentage: number) => {
      setSplitFees(current =>
        (current ?? []).map(sf => (sf.artist === artist ? { ...sf, percentage } : sf))
      )
    },
    [setSplitFees]
  )

  // ── Manual revenue handlers ────────────────────────────────────────────────
  const handleAddManualRevenue = useCallback(
    (revenue: Omit<ManualRevenue, 'id'>) => {
      setManualRevenues(current => [
        ...(current ?? []),
        { ...revenue, id: crypto.randomUUID() },
      ])
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

  // ── CSV alias handlers ─────────────────────────────────────────────────────
  const handleAddAlias = useCallback(
    (alias: Omit<CSVColumnAlias, 'id'>) => {
      setCsvAliases(current => [
        ...(current ?? []),
        { ...alias, id: crypto.randomUUID() },
      ])
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

  // ── Tab trigger class ──────────────────────────────────────────────────────
  const triggerClass =
    'data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=active]:shadow-primary/30 transition-all duration-300 text-xs sm:text-sm hover:bg-primary/10'

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-10 flex items-center gap-4">
          <div className="p-4 bg-gradient-to-br from-primary via-primary to-accent rounded-2xl shadow-2xl shadow-primary/40 border border-primary/20">
            <MusicNotes size={40} weight="duotone" className="text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-5xl font-bold font-['Space_Grotesk'] tracking-tight bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-in slide-in-from-left duration-700">
              SOS Generator
            </h1>
            <p className="text-foreground/70 text-lg mt-1 font-medium">Statement of Sales Tool</p>
          </div>
        </div>

        <Tabs defaultValue="upload" className="space-y-6">
          <TabsList className="flex w-full bg-card/70 backdrop-blur-md border-2 border-primary/20 p-2 h-auto flex-wrap gap-2 rounded-2xl shadow-2xl shadow-primary/10">
            <TabsTrigger value="upload" className={triggerClass}>Upload</TabsTrigger>
            <TabsTrigger value="dashboard" className={triggerClass}>Dashboard</TabsTrigger>
            <TabsTrigger value="reports" className={triggerClass}>Reports</TabsTrigger>
            <TabsTrigger value="artists" className={triggerClass}>Artists</TabsTrigger>
            <TabsTrigger value="settings" className={triggerClass}>Settings</TabsTrigger>
            <TabsTrigger value="history" className={triggerClass}>History</TabsTrigger>
            <TabsTrigger value="branding" className={triggerClass}>Branding</TabsTrigger>
          </TabsList>

          {/* ── Upload ── */}
          <TabsContent value="upload" className="space-y-6 animate-in fade-in duration-500">
            <Card className="p-8 border-2 border-primary/30 shadow-2xl shadow-primary/20 backdrop-blur-md bg-card/95 rounded-2xl hover:border-primary/50 transition-all duration-300">
              <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3">
                <span className="w-2 h-8 bg-gradient-to-b from-primary via-accent to-primary rounded-full shadow-lg shadow-primary/50" />
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

            <Card className="p-8 border-2 border-primary/30 shadow-2xl shadow-primary/20 backdrop-blur-md bg-card/95 rounded-2xl hover:border-primary/50 transition-all duration-300">
              <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3">
                <span className="w-2 h-8 bg-gradient-to-b from-primary via-accent to-primary rounded-full shadow-lg shadow-primary/50" />
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

            <Card className="p-8 border-2 border-primary/30 shadow-2xl shadow-primary/20 backdrop-blur-md bg-card/95 rounded-2xl hover:border-primary/50 transition-all duration-300">
              <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3">
                <span className="w-2 h-8 bg-gradient-to-b from-primary via-accent to-primary rounded-full shadow-lg shadow-primary/50" />
                Statement Period
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                Define the reporting period to include in generated PDF and Excel statements.
              </p>
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="period-start" className="text-foreground/90 font-medium">Period Start</Label>
                  <Input
                    id="period-start"
                    type="month"
                    value={periodStart ?? ''}
                    onChange={e => setPeriodStart(e.target.value)}
                    placeholder="YYYY-MM"
                    className="border-2 border-primary/20 focus:border-primary/60 bg-background/50"
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <Label htmlFor="period-end" className="text-foreground/90 font-medium">Period End</Label>
                  <Input
                    id="period-end"
                    type="month"
                    value={periodEnd ?? ''}
                    onChange={e => setPeriodEnd(e.target.value)}
                    placeholder="YYYY-MM"
                    className="border-2 border-primary/20 focus:border-primary/60 bg-background/50"
                  />
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* ── Dashboard ── */}
          <TabsContent value="dashboard" className="animate-in fade-in duration-500">
            <Card className="border-2 border-primary/30 shadow-2xl shadow-primary/20 backdrop-blur-md bg-card/95 rounded-2xl hover:border-primary/50 transition-all duration-300">
              <RevenueDashboard
                revenues={revenues}
                filteredCompilations={filteredCompilations}
                onDownloadAll={handleDownloadAll}
                onDownloadPDF={handleDownloadPDF}
                onDownloadExcel={handleDownloadExcel}
              />
            </Card>
          </TabsContent>

          {/* ── Reports ── */}
          <TabsContent value="reports" className="animate-in fade-in duration-500">
            <Card className="border-2 border-primary/30 shadow-2xl shadow-primary/20 backdrop-blur-md bg-card/95 rounded-2xl hover:border-primary/50 transition-all duration-300">
              <ReportingPanel revenues={revenues} />
            </Card>
          </TabsContent>

          {/* ── Artists ── */}
          <TabsContent value="artists" className="animate-in fade-in duration-500">
            <Card className="border-2 border-primary/30 shadow-2xl shadow-primary/20 backdrop-blur-md bg-card/95 rounded-2xl hover:border-primary/50 transition-all duration-300">
              <ArtistTreeView processedData={processedData} />
            </Card>
          </TabsContent>

          {/* ── Settings ── */}
          <TabsContent value="settings" className="space-y-6 animate-in fade-in duration-500">
            <Card className="p-8 border-2 border-primary/30 shadow-2xl shadow-primary/20 backdrop-blur-md bg-card/95 rounded-2xl hover:border-primary/50 transition-all duration-300">
              <CompilationFilterManager
                filters={compilationFilters ?? []}
                onAddFilter={handleAddCompilationFilter}
                onRemoveFilter={handleRemoveCompilationFilter}
              />
            </Card>

            <Card className="p-8 border-2 border-primary/30 shadow-2xl shadow-primary/20 backdrop-blur-md bg-card/95 rounded-2xl hover:border-primary/50 transition-all duration-300">
              <ArtistMappingManager
                mappings={artistMappings ?? []}
                onAddMapping={handleAddArtistMapping}
                onRemoveMapping={handleRemoveArtistMapping}
              />
            </Card>

            <Card className="p-8 border-2 border-primary/30 shadow-2xl shadow-primary/20 backdrop-blur-md bg-card/95 rounded-2xl hover:border-primary/50 transition-all duration-300">
              <SplitFeeManager
                splitFees={splitFees ?? []}
                onUpdateSplitFee={handleUpdateSplitFee}
              />
            </Card>

            <Card className="p-8 border-2 border-primary/30 shadow-2xl shadow-primary/20 backdrop-blur-md bg-card/95 rounded-2xl hover:border-primary/50 transition-all duration-300">
              <ManualRevenueManager
                revenues={manualRevenues ?? []}
                artists={uniqueArtists}
                onAddRevenue={handleAddManualRevenue}
                onRemoveRevenue={handleRemoveManualRevenue}
              />
            </Card>

            <Card className="p-8 border-2 border-primary/30 shadow-2xl shadow-primary/20 backdrop-blur-md bg-card/95 rounded-2xl hover:border-primary/50 transition-all duration-300">
              <CSVColumnMapper
                aliases={csvAliases ?? []}
                onAddAlias={handleAddAlias}
                onRemoveAlias={handleRemoveAlias}
              />
            </Card>

            <Card className="p-8 border-2 border-primary/30 shadow-2xl shadow-primary/20 backdrop-blur-md bg-card/95 rounded-2xl hover:border-primary/50 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="font-semibold text-lg">Exclude Physical Products</h3>
                  <p className="text-sm text-muted-foreground">
                    When enabled, physical product sales (CD, Vinyl, etc.) are excluded from revenue calculations and statements.
                  </p>
                </div>
                <Switch
                  checked={excludePhysical ?? false}
                  onCheckedChange={checked => setExcludePhysical(checked)}
                />
              </div>
            </Card>
          </TabsContent>

          {/* ── History ── */}
          <TabsContent value="history" className="animate-in fade-in duration-500">
            <Card className="border-2 border-primary/30 shadow-2xl shadow-primary/20 backdrop-blur-md bg-card/95 rounded-2xl hover:border-primary/50 transition-all duration-300">
              <HistoryPanel entries={historyEntries} onClearHistory={clearHistory} />
            </Card>
          </TabsContent>

          {/* ── Branding ── */}
          <TabsContent value="branding" className="animate-in fade-in duration-500">
            <Card className="border-2 border-primary/30 shadow-2xl shadow-primary/20 backdrop-blur-md bg-card/95 rounded-2xl hover:border-primary/50 transition-all duration-300">
              <LabelBranding
                labelInfo={labelInfo ?? { name: '', address: '' }}
                onUpdate={setLabelInfo}
              />
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default App

