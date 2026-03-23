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
import { MusicNotes } from '@phosphor-icons/react'
import { useFileManager } from '@/hooks/useFileManager'
import { useCSVProcessor } from '@/hooks/useCSVProcessor'
import { useExports } from '@/hooks/useExports'
import { useSplitFeeSync } from '@/hooks/useSplitFeeSync'
import type { CompilationFilter, ArtistMapping, SplitFee, ManualRevenue, LabelInfo } from '@/lib/types'
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

  // ── File management ────────────────────────────────────────────────────────
  const believeManager = useFileManager('believe')
  const bandcampManager = useFileManager('bandcamp')

  // ── CSV processing pipeline ────────────────────────────────────────────────
  const { uniqueArtists, processedData, revenues } = useCSVProcessor(
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

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-10 flex items-center gap-4">
          <div className="p-4 bg-gradient-to-br from-primary to-accent rounded-xl shadow-lg shadow-primary/20">
            <MusicNotes size={40} weight="duotone" className="text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-5xl font-bold font-['Space_Grotesk'] tracking-tight bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              SOS Generator
            </h1>
            <p className="text-muted-foreground text-lg mt-1">Statement of Sales Tool</p>
          </div>
        </div>

        <Tabs defaultValue="upload" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-card/50 backdrop-blur-sm border border-border p-1.5 h-auto">
            <TabsTrigger value="upload" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=active]:shadow-primary/20 transition-all duration-300">Upload & Process</TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=active]:shadow-primary/20 transition-all duration-300">Settings</TabsTrigger>
            <TabsTrigger value="branding" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=active]:shadow-primary/20 transition-all duration-300">Branding</TabsTrigger>
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=active]:shadow-primary/20 transition-all duration-300">Dashboard</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-6">
            <Card className="p-8 border-2 shadow-xl shadow-primary/5 backdrop-blur-sm bg-card/95">
              <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-gradient-to-b from-primary to-accent rounded-full" />
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

            <Card className="p-8 border-2 shadow-xl shadow-primary/5 backdrop-blur-sm bg-card/95">
              <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-gradient-to-b from-primary to-accent rounded-full" />
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

            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Statement Period</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Define the reporting period to include in generated PDF and Excel statements.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="period-start">Period Start</Label>
                  <Input
                    id="period-start"
                    type="month"
                    value={periodStart ?? ''}
                    onChange={e => setPeriodStart(e.target.value)}
                    placeholder="YYYY-MM"
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <Label htmlFor="period-end">Period End</Label>
                  <Input
                    id="period-end"
                    type="month"
                    value={periodEnd ?? ''}
                    onChange={e => setPeriodEnd(e.target.value)}
                    placeholder="YYYY-MM"
                  />
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card className="p-8 border-2 shadow-xl shadow-primary/5 backdrop-blur-sm bg-card/95">
              <CompilationFilterManager
                filters={compilationFilters ?? []}
                onAddFilter={handleAddCompilationFilter}
                onRemoveFilter={handleRemoveCompilationFilter}
              />
            </Card>

            <Card className="p-8 border-2 shadow-xl shadow-primary/5 backdrop-blur-sm bg-card/95">
              <ArtistMappingManager
                mappings={artistMappings ?? []}
                onAddMapping={handleAddArtistMapping}
                onRemoveMapping={handleRemoveArtistMapping}
              />
            </Card>

            <Card className="p-8 border-2 shadow-xl shadow-primary/5 backdrop-blur-sm bg-card/95">
              <SplitFeeManager
                splitFees={splitFees ?? []}
                onUpdateSplitFee={handleUpdateSplitFee}
              />
            </Card>

            <Card className="p-8 border-2 shadow-xl shadow-primary/5 backdrop-blur-sm bg-card/95">
              <ManualRevenueManager
                revenues={manualRevenues ?? []}
                artists={uniqueArtists}
                onAddRevenue={handleAddManualRevenue}
                onRemoveRevenue={handleRemoveManualRevenue}
              />
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="font-semibold">Exclude Physical Products</h3>
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

          <TabsContent value="branding">
            <Card className="border-2 shadow-xl shadow-primary/5 backdrop-blur-sm bg-card/95">
              <LabelBranding
                labelInfo={labelInfo ?? { name: '', address: '' }}
                onUpdate={setLabelInfo}
              />
            </Card>
          </TabsContent>

          <TabsContent value="dashboard">
            <Card className="border-2 shadow-xl shadow-primary/5 backdrop-blur-sm bg-card/95">
              <RevenueDashboard
                revenues={revenues}
                onDownloadAll={handleDownloadAll}
                onDownloadPDF={handleDownloadPDF}
                onDownloadExcel={handleDownloadExcel}
              />
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default App
