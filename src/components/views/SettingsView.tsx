import { Trash2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { WorkspaceManager, type WorkspaceBackup } from '@/features/core/components/WorkspaceManager'
import { LabelBranding } from '@/features/core/components/LabelBranding'
import { IgnoredEntriesManager } from '@/features/rules/components/IgnoredEntriesManager'
import { CompilationFilterManager } from '@/features/rules/components/CompilationFilterManager'
import { CSVColumnMapper } from '@/features/ingest/components/CSVColumnMapper'
import { DefaultSettings } from '@/features/core/components/DefaultSettings'
import { EmailSettings } from '@/features/core/components/EmailSettings'
import { PdfExportSettingsPanel } from '@/features/export/components/PdfExportSettingsPanel'
import { CsvProfileManager } from '@/features/core/components/CsvProfileManager'
import type {
  CompilationFilter,
  LabelArtist,
  IgnoredEntry,
  ManualRevenue,
  ArtistMapping,
  SplitFee,
  CSVColumnAlias,
  LabelInfo,
  AppDefaults,
  PdfExportSettings,
  EmailConfig,
} from '@/lib/types'
import type { CsvImportProfile } from '@/features/ingest/types'

interface SettingsViewProps {
  // ── Workspace backup ─────────────────────────────────────────────────────
  compilationFilters: CompilationFilter[]
  artistMappings: ArtistMapping[]
  splitFees: SplitFee[]
  manualRevenues: ManualRevenue[]
  csvAliases: CSVColumnAlias[]
  labelInfo: LabelInfo
  labelArtists: LabelArtist[]
  ignoredEntries: IgnoredEntry[]
  onImport: (backup: WorkspaceBackup) => void

  // ── Label branding ───────────────────────────────────────────────────────
  onUpdateLabelInfo: (info: LabelInfo) => void

  // ── Danger zone ──────────────────────────────────────────────────────────
  clearConfirmOpen: boolean
  setClearConfirmOpen: (open: boolean) => void
  handleClearWorkspace: () => void
  totalFiles: number
  periodStart: string
  periodEnd: string

  // ── Rules ────────────────────────────────────────────────────────────────
  uniqueArtists: string[]
  handleAddIgnoredEntry: (entry: Omit<IgnoredEntry, 'id' | 'createdAt'>) => void
  handleRemoveIgnoredEntry: (id: string) => void
  excludePhysical: boolean
  setExcludePhysical: (checked: boolean) => void
  handleAddCompilationFilter: (filter: Omit<CompilationFilter, 'id'>) => void
  handleRemoveCompilationFilter: (id: string) => void
  handleAddAlias: (alias: Omit<CSVColumnAlias, 'id'>) => void
  handleRemoveAlias: (id: string) => void

  // ── Export settings ──────────────────────────────────────────────────────
  appDefaults: AppDefaults
  setAppDefaults: (defaults: AppDefaults) => void
  emailConfig: EmailConfig
  setEmailConfig: (config: EmailConfig) => void
  pdfExportSettings: PdfExportSettings
  setPdfExportSettings: (settings: PdfExportSettings) => void

  // ── CSV Import Profiles ──────────────────────────────────────────────────
  csvImportProfiles: CsvImportProfile[]
  onAddCsvProfile: (profile: Omit<CsvImportProfile, 'id'>) => void
  onUpdateCsvProfile: (id: string, patch: Omit<CsvImportProfile, 'id' | 'isSystemDefault'>) => void
  onDeleteCsvProfile: (id: string) => void
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
  onUpdateLabelInfo,
  clearConfirmOpen,
  setClearConfirmOpen,
  handleClearWorkspace,
  totalFiles,
  periodStart,
  periodEnd,
  uniqueArtists,
  handleAddIgnoredEntry,
  handleRemoveIgnoredEntry,
  excludePhysical,
  setExcludePhysical,
  handleAddCompilationFilter,
  handleRemoveCompilationFilter,
  handleAddAlias,
  handleRemoveAlias,
  appDefaults,
  setAppDefaults,
  emailConfig,
  setEmailConfig,
  pdfExportSettings,
  setPdfExportSettings,
  csvImportProfiles,
  onAddCsvProfile,
  onUpdateCsvProfile,
  onDeleteCsvProfile,
}: SettingsViewProps) {
  return (
    <Tabs defaultValue="app-system" className="flex flex-col h-full">
      <TabsList className="grid grid-cols-4 w-full max-w-xl shrink-0 mb-6">
        <TabsTrigger value="app-system">App-System</TabsTrigger>
        <TabsTrigger value="label-profil">Label-Profil</TabsTrigger>
        <TabsTrigger value="export-regeln">Export &amp; Regeln</TabsTrigger>
        <TabsTrigger value="csv-profile">CSV-Profile</TabsTrigger>
      </TabsList>

      {/* ── App-System Tab ── */}
      <TabsContent
        value="app-system"
        className="flex-1 overflow-y-auto space-y-8 pr-1"
        style={{ maxHeight: 'calc(100vh - 12rem)' }}
      >
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

        {/* Danger Zone */}
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

      {/* ── Label-Profil Tab ── */}
      <TabsContent
        value="label-profil"
        className="flex-1 overflow-y-auto space-y-8 pr-1"
        style={{ maxHeight: 'calc(100vh - 12rem)' }}
      >
        <Card className="border border-white/10 bg-card backdrop-blur-md rounded-2xl overflow-hidden">
          <LabelBranding labelInfo={labelInfo} onUpdate={onUpdateLabelInfo} />
        </Card>

        <Card className="border border-white/10 bg-card backdrop-blur-md rounded-2xl overflow-hidden">
          <EmailSettings config={emailConfig} onUpdate={setEmailConfig} />
        </Card>
      </TabsContent>

      {/* ── Export & Regeln Tab ── */}
      <TabsContent
        value="export-regeln"
        className="flex-1 overflow-y-auto space-y-8 pr-1"
        style={{ maxHeight: 'calc(100vh - 12rem)' }}
      >
        <Card className="border border-white/10 bg-card backdrop-blur-md rounded-2xl overflow-hidden">
          <PdfExportSettingsPanel settings={pdfExportSettings} onUpdate={setPdfExportSettings} />
        </Card>

        <Card className="border border-white/10 bg-card backdrop-blur-md rounded-2xl overflow-hidden">
          <DefaultSettings defaults={appDefaults} onUpdate={setAppDefaults} />
        </Card>

        <Card className="p-8 border border-white/10 bg-card backdrop-blur-md rounded-2xl">
          <CSVColumnMapper
            aliases={csvAliases}
            onAddAlias={handleAddAlias}
            onRemoveAlias={handleRemoveAlias}
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
      </TabsContent>

      {/* ── CSV-Profile Tab ── */}
      <TabsContent
        value="csv-profile"
        className="flex-1 overflow-y-auto space-y-8 pr-1"
        style={{ maxHeight: 'calc(100vh - 12rem)' }}
      >
        <Card className="p-8 border border-white/10 bg-card backdrop-blur-md rounded-2xl">
          <CsvProfileManager
            profiles={csvImportProfiles}
            onAdd={onAddCsvProfile}
            onUpdate={onUpdateCsvProfile}
            onDelete={onDeleteCsvProfile}
          />
        </Card>
      </TabsContent>
    </Tabs>
  )
}
