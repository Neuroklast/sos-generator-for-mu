import { useRef } from 'react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import i18next from 'i18next'
import { Download, Upload, DatabaseBackup } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type {
  CompilationFilter,
  ArtistMapping,
  SplitFee,
  ManualRevenue,
  CSVColumnAlias,
  LabelInfo,
  LabelArtist,
  IgnoredEntry,
} from '@/lib/types'

/** Shape written to / read from the backup JSON file. */
export interface WorkspaceBackup {
  /** Semver-style schema version for forward-compat guards. */
  schemaVersion: 1
  exportedAt: string
  compilationFilters: CompilationFilter[]
  artistMappings: ArtistMapping[]
  splitFees: SplitFee[]
  manualRevenues: ManualRevenue[]
  csvAliases: CSVColumnAlias[]
  labelInfo: LabelInfo
  labelArtists: LabelArtist[]
  ignoredEntries: IgnoredEntry[]
}

interface WorkspaceManagerProps {
  compilationFilters: CompilationFilter[]
  artistMappings: ArtistMapping[]
  splitFees: SplitFee[]
  manualRevenues: ManualRevenue[]
  csvAliases: CSVColumnAlias[]
  labelInfo: LabelInfo
  labelArtists: LabelArtist[]
  ignoredEntries: IgnoredEntry[]
  onImport: (backup: WorkspaceBackup) => void
}

export function WorkspaceManager({
  compilationFilters,
  artistMappings,
  splitFees,
  manualRevenues,
  csvAliases,
  labelInfo,
  labelArtists,
  ignoredEntries,
  onImport,
}: WorkspaceManagerProps) {
  const { t } = useTranslation()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Export ────────────────────────────────────────────────────────────────

  const handleExport = () => {
    const backup: WorkspaceBackup = {
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      compilationFilters,
      artistMappings,
      splitFees,
      manualRevenues,
      csvAliases,
      labelInfo,
      labelArtists,
      ignoredEntries,
    }

    const json = JSON.stringify(backup, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'sos_workspace_backup.json'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    setTimeout(() => URL.revokeObjectURL(url), 100)

    toast.success(i18next.t('toast.workspaceExported'), {
      description: 'sos_workspace_backup.json downloaded.',
    })
  }

  // ── Import ────────────────────────────────────────────────────────────────

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = event => {
      try {
        const raw = JSON.parse(event.target?.result as string) as Partial<WorkspaceBackup>

        if (raw.schemaVersion !== 1) {
          toast.error(i18next.t('toast.unknownBackupFormat'), {
            description: `Expected schemaVersion 1, received: ${raw.schemaVersion ?? 'unknown'}.`,
          })
          return
        }

        // Validate that all array fields are actually arrays to prevent injecting
        // unexpected shapes from a malformed or malicious backup file.
        const isArrayOf = (v: unknown): v is unknown[] => Array.isArray(v)
        if (
          (raw.compilationFilters !== undefined && !isArrayOf(raw.compilationFilters)) ||
          (raw.artistMappings !== undefined && !isArrayOf(raw.artistMappings)) ||
          (raw.splitFees !== undefined && !isArrayOf(raw.splitFees)) ||
          (raw.manualRevenues !== undefined && !isArrayOf(raw.manualRevenues)) ||
          (raw.csvAliases !== undefined && !isArrayOf(raw.csvAliases)) ||
          (raw.labelArtists !== undefined && !isArrayOf(raw.labelArtists)) ||
          (raw.ignoredEntries !== undefined && !isArrayOf(raw.ignoredEntries)) ||
          (raw.labelInfo !== null && raw.labelInfo !== undefined && typeof raw.labelInfo !== 'object')
        ) {
          toast.error(i18next.t('toast.invalidBackup'), {
            description: 'The backup file contains unexpected data types and cannot be imported.',
          })
          return
        }

        const backup: WorkspaceBackup = {
          schemaVersion: 1,
          exportedAt: raw.exportedAt ?? new Date().toISOString(),
          compilationFilters: Array.isArray(raw.compilationFilters) ? raw.compilationFilters : [],
          artistMappings: Array.isArray(raw.artistMappings) ? raw.artistMappings : [],
          splitFees: Array.isArray(raw.splitFees) ? raw.splitFees : [],
          manualRevenues: Array.isArray(raw.manualRevenues) ? raw.manualRevenues : [],
          csvAliases: Array.isArray(raw.csvAliases) ? raw.csvAliases : [],
          labelInfo: raw.labelInfo ?? { name: '', address: '' },
          labelArtists: Array.isArray(raw.labelArtists) ? raw.labelArtists : [],
          ignoredEntries: Array.isArray(raw.ignoredEntries) ? raw.ignoredEntries : [],
        }

        onImport(backup)
        toast.success(i18next.t('toast.workspaceRestored'), {
          description: `Backup from ${new Date(backup.exportedAt).toLocaleString('en-GB')} imported.`,
        })
      } catch {
        toast.error(i18next.t('toast.importFailed'), {
          description: 'The file could not be read as valid JSON.',
        })
      }
    }
    reader.onerror = () => {
      toast.error(i18next.t('toast.failedToReadFile'))
    }
    reader.readAsText(file)
    // Reset so the same file can be re-selected
    e.target.value = ''
  }

  return (
    <Card className="p-8 border border-white/10 bg-card backdrop-blur-md rounded-2xl">
      <div className="flex items-start gap-3 mb-6">
        <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 shrink-0 shadow-lg shadow-blue-500/25">
          <DatabaseBackup size={20} className="text-white" />
        </div>
        <div>
          <h3 className="font-bold text-lg font-['Space_Grotesk'] leading-tight">{t('workspace.title')}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t('workspace.description')}
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          variant="outline"
          className="gap-2 border-blue-500/40 text-blue-400 hover:bg-blue-500/10 hover:border-blue-500/60"
          onClick={handleExport}
        >
          <Download size={15} />
          {t('workspace.exportWorkspace')}
        </Button>

        <Button
          variant="outline"
          className="gap-2 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/60"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload size={15} />
          {t('workspace.importWorkspace')}
        </Button>

        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          onChange={handleFileSelected}
          className="hidden"
        />
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        Import overwrites all current settings irreversibly. CSV files are not included in the backup.
      </p>
    </Card>
  )
}
