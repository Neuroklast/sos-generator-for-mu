import { Trash2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { WorkspaceManager, type WorkspaceBackup } from '@/components/WorkspaceManager'
import { LabelArtistManager } from '@/components/LabelArtistManager'
import { IgnoredEntriesManager } from '@/components/IgnoredEntriesManager'
import { CompilationFilterManager } from '@/components/CompilationFilterManager'
import { SplitFeeManager } from '@/components/SplitFeeManager'
import { CSVColumnMapper } from '@/components/CSVColumnMapper'
import { DefaultSettings } from '@/components/DefaultSettings'
import { EmailSettings } from '@/components/EmailSettings'
import { PdfExportSettingsPanel } from '@/components/PdfExportSettingsPanel'
import type {
  CompilationFilter,
  LabelArtist,
  IgnoredEntry,
  SplitFee,
  ManualRevenue,
  ArtistMapping,
  CSVColumnAlias,
  LabelInfo,
  AppDefaults,
  PdfExportSettings,
  EmailConfig,
} from '@/lib/types'

interface SettingsViewProps {
  compilationFilters: CompilationFilter[]
  artistMappings: ArtistMapping[]
  splitFees: SplitFee[]
  manualRevenues: ManualRevenue[]
  csvAliases: CSVColumnAlias[]
  labelInfo: LabelInfo
  labelArtists: LabelArtist[]
  ignoredEntries: IgnoredEntry[]
  onImport: (backup: WorkspaceBackup) => void
  handleAddLabelArtist: (name: string) => void
  handleRemoveLabelArtist: (id: string) => void
  handleUpdateLabelArtist: (id: string, patch: Omit<LabelArtist, 'id'>) => void
  handleImportLabelArtistsCSV: (artists: Omit<LabelArtist, 'id'>[]) => void
  uniqueArtists: string[]
  handleAddIgnoredEntry: (entry: Omit<IgnoredEntry, 'id' | 'createdAt'>) => void
  handleRemoveIgnoredEntry: (id: string) => void
  clearConfirmOpen: boolean
  setClearConfirmOpen: (open: boolean) => void
  handleClearWorkspace: () => void
  totalFiles: number
  periodStart: string
  periodEnd: string
  excludePhysical: boolean
  setExcludePhysical: (checked: boolean) => void
  handleAddCompilationFilter: (filter: Omit<CompilationFilter, 'id'>) => void
  handleRemoveCompilationFilter: (id: string) => void
  handleUpdateSplitFee: (artist: string, percentage: number) => void
  handleBulkUpdateSplitFee: (artists: string[], percentage: number) => void
  handleAddAlias: (alias: Omit<CSVColumnAlias, 'id'>) => void
  handleRemoveAlias: (id: string) => void
  appDefaults: AppDefaults
  setAppDefaults: (defaults: AppDefaults) => void
  emailConfig: EmailConfig
  setEmailConfig: (config: EmailConfig) => void
  pdfExportSettings: PdfExportSettings
  setPdfExportSettings: (settings: PdfExportSettings) => void
}

export function SettingsView({
  compilationFilters,
  artistMappings,
  splitFees,
  manualRevenues,
  csvAliases,
  labelInfo,
  labelArtists,
  ignoredEntries,
  onImport,
  handleAddLabelArtist,
  handleRemoveLabelArtist,
  handleUpdateLabelArtist,
  handleImportLabelArtistsCSV,
  uniqueArtists,
  handleAddIgnoredEntry,
  handleRemoveIgnoredEntry,
  clearConfirmOpen,
  setClearConfirmOpen,
  handleClearWorkspace,
  totalFiles,
  periodStart,
  periodEnd,
  excludePhysical,
  setExcludePhysical,
  handleAddCompilationFilter,
  handleRemoveCompilationFilter,
  handleUpdateSplitFee,
  handleBulkUpdateSplitFee,
  handleAddAlias,
  handleRemoveAlias,
  appDefaults,
  setAppDefaults,
  emailConfig,
  setEmailConfig,
  pdfExportSettings,
  setPdfExportSettings,
}: SettingsViewProps) {
  return (
    <Tabs defaultValue="workspace" className="space-y-6">
      <TabsList className="grid grid-cols-4 w-full max-w-2xl">
        <TabsTrigger value="workspace">Workspace</TabsTrigger>
        <TabsTrigger value="artists">Artists &amp; Rules</TabsTrigger>
        <TabsTrigger value="csv">CSV &amp; Defaults</TabsTrigger>
        <TabsTrigger value="export">Export &amp; Email</TabsTrigger>
      </TabsList>

      {/* ── Workspace Tab ── */}
      <TabsContent value="workspace" className="space-y-8">
        <WorkspaceManager
          compilationFilters={compilationFilters}
          artistMappings={artistMappings}
          splitFees={splitFees}
          manualRevenues={manualRevenues}
          csvAliases={csvAliases}
          labelInfo={labelInfo}
          labelArtists={labelArtists}
          ignoredEntries={ignoredEntries}
          onImport={onImport}
        />

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
                disabled={totalFiles === 0 && manualRevenues.length === 0 && !periodStart && !periodEnd}
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
      </TabsContent>

      {/* ── Artists & Rules Tab ── */}
      <TabsContent value="artists" className="space-y-8">
        <Card className="p-8 border border-white/10 bg-card backdrop-blur-md rounded-2xl">
          <LabelArtistManager
            artists={labelArtists}
            onAdd={handleAddLabelArtist}
            onRemove={handleRemoveLabelArtist}
            onUpdate={handleUpdateLabelArtist}
            onImportCSV={handleImportLabelArtistsCSV}
          />
        </Card>

        <Card className="p-8 border border-white/10 bg-card backdrop-blur-md rounded-2xl">
          <IgnoredEntriesManager
            entries={ignoredEntries}
            artists={uniqueArtists}
            onAdd={handleAddIgnoredEntry}
            onRemove={handleRemoveIgnoredEntry}
          />
        </Card>

        <Card className="p-8 border border-white/10 bg-card backdrop-blur-md rounded-2xl">
          <CompilationFilterManager
            filters={compilationFilters}
            onAddFilter={handleAddCompilationFilter}
            onRemoveFilter={handleRemoveCompilationFilter}
          />
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
              checked={excludePhysical}
              onCheckedChange={checked => setExcludePhysical(checked)}
            />
          </div>
        </Card>

        <Card className="p-8 border border-white/10 bg-card backdrop-blur-md rounded-2xl">
          <SplitFeeManager
            splitFees={splitFees}
            onUpdateSplitFee={handleUpdateSplitFee}
            onBulkUpdateSplitFee={handleBulkUpdateSplitFee}
          />
        </Card>
      </TabsContent>

      {/* ── CSV & Defaults Tab ── */}
      <TabsContent value="csv" className="space-y-8">
        <Card className="p-8 border border-white/10 bg-card backdrop-blur-md rounded-2xl">
          <CSVColumnMapper
            aliases={csvAliases}
            onAddAlias={handleAddAlias}
            onRemoveAlias={handleRemoveAlias}
          />
        </Card>

        <Card className="border border-white/10 bg-card backdrop-blur-md rounded-2xl overflow-hidden">
          <DefaultSettings
            defaults={appDefaults}
            onUpdate={setAppDefaults}
          />
        </Card>
      </TabsContent>

      {/* ── Export & Email Tab ── */}
      <TabsContent value="export" className="space-y-8">
        <Card className="border border-white/10 bg-card backdrop-blur-md rounded-2xl overflow-hidden">
          <EmailSettings
            config={emailConfig}
            onUpdate={setEmailConfig}
          />
        </Card>

        <Card className="border border-white/10 bg-card backdrop-blur-md rounded-2xl overflow-hidden">
          <PdfExportSettingsPanel
            settings={pdfExportSettings}
            onUpdate={setPdfExportSettings}
          />
        </Card>
      </TabsContent>
    </Tabs>
  )
}
