/**
 * CsvProfileManager.tsx
 *
 * UI for managing CSV import profiles. Users can:
 *  - View system default profiles (read-only, marked with a lock badge)
 *  - Create new custom profiles
 *  - Edit existing custom profiles via an inline form
 *  - Delete custom profiles
 *
 * The column-mapping form follows the two-column layout described in the spec:
 *  Left  → our internal canonical field names (fixed, non-editable labels)
 *  Right → text inputs where the user enters the exact CSV column header name
 */

import { useState, useCallback } from 'react'
import {
  Plus,
  Trash,
  Lock,
  CaretDown,
  CaretUp,
  FloppyDisk,
  PencilSimple,
  FileCsv,
} from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import type { CsvImportProfile, FinancialFieldKey, MasterDataFieldKey } from '@/features/ingest/types'

// ── Field label maps ──────────────────────────────────────────────────────────

const FINANCIAL_FIELD_LABELS: Record<FinancialFieldKey, string> = {
  artistName:    'Artist Name',
  releaseTitle:  'Release Title',
  trackTitle:    'Track Title',
  quantity:      'Quantity',
  netRevenue:    'Net Revenue',
  currency:      'Currency',
  salesMonth:    'Sales Month / Date',
  platform:      'Platform / Store',
  country:       'Country / Territory',
  upcEan:        'UPC / EAN',
  isrc:          'ISRC',
  catalogNumber: 'Catalog Number',
  releaseType:   'Release Type',
  balanceEur:    'EUR Balance (Bandcamp)',
}

const MASTER_DATA_FIELD_LABELS: Record<MasterDataFieldKey, string> = {
  name:          'Name',
  email:         'E-Mail',
  vatNumber:     'VAT Number',
  isEuNonGerman: 'EU (non-DE)',
  notes:         'Notes',
}

const FINANCIAL_FIELDS = Object.keys(FINANCIAL_FIELD_LABELS) as FinancialFieldKey[]
const MASTER_DATA_FIELDS = Object.keys(MASTER_DATA_FIELD_LABELS) as MasterDataFieldKey[]

// ── Empty profile factory ─────────────────────────────────────────────────────

function emptyProfile(): Omit<CsvImportProfile, 'id' | 'isSystemDefault'> {
  return {
    name: '',
    type: 'financial',
    delimiter: ',',
    autoDetectHeaders: [],
    columnMapping: {},
  }
}

// ── Inline profile editor ─────────────────────────────────────────────────────

interface ProfileEditorProps {
  profile: Omit<CsvImportProfile, 'id' | 'isSystemDefault'>
  onChange: (patch: Partial<Omit<CsvImportProfile, 'id' | 'isSystemDefault'>>) => void
}

function ProfileEditor({ profile, onChange }: ProfileEditorProps) {
  const fields = profile.type === 'financial' ? FINANCIAL_FIELDS : MASTER_DATA_FIELDS
  const labels = profile.type === 'financial'
    ? (FINANCIAL_FIELD_LABELS as Record<string, string>)
    : (MASTER_DATA_FIELD_LABELS as Record<string, string>)

  const updateMapping = (key: string, value: string) => {
    onChange({
      columnMapping: {
        ...profile.columnMapping,
        [key]: value || undefined,
      },
    })
  }

  return (
    <div className="space-y-4 border-t border-white/8 pt-3 px-3 pb-3">
      {/* Name */}
      <div className="space-y-1">
        <Label className="text-xs font-medium text-muted-foreground">Profile Name</Label>
        <Input
          value={profile.name}
          onChange={e => onChange({ name: e.target.value })}
          placeholder="e.g. My Distro Export"
          className="h-8 text-xs"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Type */}
        <div className="space-y-1">
          <Label className="text-xs font-medium text-muted-foreground">Profile Type</Label>
          <Select
            value={profile.type}
            onValueChange={v => onChange({ type: v as CsvImportProfile['type'], columnMapping: {} })}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="financial">Financial (Revenue)</SelectItem>
              <SelectItem value="master-data">Master Data (Artists)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Delimiter */}
        <div className="space-y-1">
          <Label className="text-xs font-medium text-muted-foreground">Delimiter</Label>
          <Select
            value={profile.delimiter}
            onValueChange={v => onChange({ delimiter: v as CsvImportProfile['delimiter'] })}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value=",">Comma (,)</SelectItem>
              <SelectItem value=";">Semicolon (;)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Auto-detect headers */}
      <div className="space-y-1">
        <Label className="text-xs font-medium text-muted-foreground">
          Auto-Detect Headers <span className="text-muted-foreground/60">(comma-separated)</span>
        </Label>
        <Input
          value={profile.autoDetectHeaders.join(', ')}
          onChange={e => {
            const raw = e.target.value
            const parsed = raw.split(',').map(h => h.trim()).filter(Boolean)
            onChange({ autoDetectHeaders: parsed })
          }}
          placeholder="e.g. Sales Month, Platform, Artist Name"
          className="h-8 text-xs"
        />
        <p className="text-[11px] text-muted-foreground/70">
          Columns that uniquely identify this CSV format. Include 4–6 distinctive headers.
        </p>
      </div>

      {/* Column mapping: internal field → CSV column name */}
      <div className="space-y-2">
        <Label className="text-xs font-medium text-muted-foreground">Column Mapping</Label>
        <div className="rounded-lg border border-white/8 overflow-hidden">
          <div className="grid grid-cols-2 gap-0 bg-white/5 px-3 py-1.5 text-[11px] font-medium text-muted-foreground">
            <span>Internal Field</span>
            <span>CSV Column Name in your file</span>
          </div>
          <div className="divide-y divide-white/5">
            {fields.map(field => (
              <div key={field} className="grid grid-cols-2 gap-3 items-center px-3 py-1.5">
                <span className="text-xs text-foreground/70">{labels[field]}</span>
                <Input
                  value={(profile.columnMapping as Record<string, string>)[field] ?? ''}
                  onChange={e => updateMapping(field, e.target.value)}
                  placeholder="Column header…"
                  className="h-7 text-xs border-border/50"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Profile list item ─────────────────────────────────────────────────────────

interface ProfileItemProps {
  profile: CsvImportProfile
  onEdit: (draft: Omit<CsvImportProfile, 'id' | 'isSystemDefault'>) => void
  onDelete: () => void
  index: number
}

function ProfileItem({ profile, onEdit, onDelete, index }: ProfileItemProps) {
  const [expanded, setExpanded] = useState(false)
  const [draft, setDraft] = useState<Omit<CsvImportProfile, 'id' | 'isSystemDefault'>>({
    name: profile.name,
    type: profile.type,
    delimiter: profile.delimiter,
    autoDetectHeaders: profile.autoDetectHeaders,
    columnMapping: { ...profile.columnMapping },
  })

  const handleSave = () => {
    if (!draft.name.trim()) {
      toast.error('Profile name cannot be empty')
      return
    }
    onEdit(draft)
    setExpanded(false)
    toast.success(`Profile "${draft.name}" saved`)
  }

  return (
    <motion.li
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.15 }}
      className="rounded-lg bg-white/5 border border-white/8 overflow-hidden"
    >
      {/* Header row */}
      <div className="flex items-center justify-between gap-2 px-3 py-2 group">
        <button
          type="button"
          className="flex items-center gap-2 min-w-0 flex-1 text-left"
          onClick={() => setExpanded(prev => !prev)}
          aria-expanded={expanded}
        >
          <div className={`w-2 h-2 rounded-full shrink-0 ${profile.type === 'financial' ? 'bg-emerald-400' : 'bg-violet-400'}`} />
          <span className="text-sm font-medium truncate">{profile.name}</span>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0">
            {profile.type === 'financial' ? 'Financial' : 'Master Data'}
          </Badge>
          {profile.isSystemDefault && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 gap-0.5 shrink-0">
              <Lock size={9} />
              System
            </Badge>
          )}
          <span className="text-xs text-muted-foreground shrink-0 hidden sm:inline">
            {profile.delimiter === ',' ? 'CSV' : 'CSV (;)'}
          </span>
          {expanded
            ? <CaretUp size={12} className="text-muted-foreground shrink-0 ml-1" />
            : <CaretDown size={12} className="text-muted-foreground shrink-0 ml-1" />
          }
        </button>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-primary"
            title="Edit profile"
            onClick={() => setExpanded(prev => !prev)}
          >
            <PencilSimple size={13} />
          </Button>
          {!profile.isSystemDefault && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-destructive"
              title="Delete profile"
              onClick={onDelete}
            >
              <Trash size={13} />
            </Button>
          )}
        </div>
      </div>

      {/* Inline editor */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <ProfileEditor
              profile={draft}
              onChange={patch => setDraft(prev => ({ ...prev, ...patch }))}
            />
            <div className="flex justify-end gap-2 px-3 pb-3">
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-7"
                onClick={() => {
                  setDraft({
                    name: profile.name,
                    type: profile.type,
                    delimiter: profile.delimiter,
                    autoDetectHeaders: profile.autoDetectHeaders,
                    columnMapping: { ...profile.columnMapping },
                  })
                  setExpanded(false)
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="text-xs h-7 gap-1"
                onClick={handleSave}
              >
                <FloppyDisk size={12} />
                Save
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.li>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

interface CsvProfileManagerProps {
  profiles: CsvImportProfile[]
  onAdd: (profile: Omit<CsvImportProfile, 'id'>) => void
  onUpdate: (id: string, patch: Omit<CsvImportProfile, 'id' | 'isSystemDefault'>) => void
  onDelete: (id: string) => void
}

export function CsvProfileManager({
  profiles,
  onAdd,
  onUpdate,
  onDelete,
}: CsvProfileManagerProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [newProfile, setNewProfile] = useState<Omit<CsvImportProfile, 'id' | 'isSystemDefault'>>(emptyProfile())

  const handleCreate = useCallback(() => {
    if (!newProfile.name.trim()) {
      toast.error('Profile name cannot be empty')
      return
    }
    onAdd(newProfile)
    setNewProfile(emptyProfile())
    setIsCreating(false)
    toast.success(`Profile "${newProfile.name}" created`)
  }, [newProfile, onAdd])

  const systemProfiles = profiles.filter(p => p.isSystemDefault)
  const customProfiles = profiles.filter(p => !p.isSystemDefault)

  return (
    <div>
      {/* Header */}
      <div className="flex items-start gap-3 mb-6">
        <div className="p-2.5 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 shrink-0 shadow-lg shadow-orange-500/25">
          <FileCsv size={20} weight="fill" className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-lg font-['Space_Grotesk'] leading-tight">CSV Import Profiles</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Profiles tell the parser how to read CSV files from different distributors.
            System profiles are pre-installed; you can add custom ones for any format.
          </p>
        </div>
      </div>

      {/* System profiles */}
      {systemProfiles.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
            <Lock size={11} />
            System Defaults
          </p>
          <ul className="space-y-1.5">
            <AnimatePresence initial={false}>
              {systemProfiles.map((profile, idx) => (
                <ProfileItem
                  key={profile.id}
                  profile={profile}
                  index={idx}
                  onEdit={patch => onUpdate(profile.id, patch)}
                  onDelete={() => onDelete(profile.id)}
                />
              ))}
            </AnimatePresence>
          </ul>
        </div>
      )}

      {/* Custom profiles */}
      {customProfiles.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-medium text-muted-foreground mb-2">Custom Profiles</p>
          <ul className="space-y-1.5">
            <AnimatePresence initial={false}>
              {customProfiles.map((profile, idx) => (
                <ProfileItem
                  key={profile.id}
                  profile={profile}
                  index={idx}
                  onEdit={patch => onUpdate(profile.id, patch)}
                  onDelete={() => onDelete(profile.id)}
                />
              ))}
            </AnimatePresence>
          </ul>
        </div>
      )}

      {/* New profile form */}
      <AnimatePresence>
        {isCreating && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden rounded-lg bg-white/5 border border-primary/30 mb-3"
          >
            <div className="px-3 pt-2.5">
              <p className="text-xs font-semibold text-primary mb-2">New Profile</p>
            </div>
            <ProfileEditor
              profile={newProfile}
              onChange={patch => setNewProfile(prev => ({ ...prev, ...patch }))}
            />
            <div className="flex justify-end gap-2 px-3 pb-3">
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-7"
                onClick={() => { setIsCreating(false); setNewProfile(emptyProfile()) }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="text-xs h-7 gap-1"
                onClick={handleCreate}
                disabled={!newProfile.name.trim()}
              >
                <FloppyDisk size={12} />
                Create Profile
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add button */}
      {!isCreating && (
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 border-primary/40 text-primary hover:bg-primary/10 hover:border-primary/60"
          onClick={() => { setNewProfile(emptyProfile()); setIsCreating(true) }}
        >
          <Plus size={13} weight="bold" />
          New Profile
        </Button>
      )}

      {profiles.length === 0 && !isCreating && (
        <div className="flex flex-col items-center justify-center py-8 gap-2 rounded-xl border border-dashed border-border/50 bg-card/30">
          <p className="text-sm text-muted-foreground">No profiles configured yet</p>
          <p className="text-xs text-muted-foreground/60">Create a profile to auto-detect CSV formats on upload.</p>
        </div>
      )}
    </div>
  )
}
