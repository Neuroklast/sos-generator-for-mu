import { useState, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import i18next from 'i18next'
import { Users, Plus, Trash, Download, CaretDown, CaretUp, EnvelopeSimple, IdentificationCard, NotePencil, Bank, SortAscending, LinkSimple } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import Papa from 'papaparse'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import type { LabelArtist } from '@/lib/types'
import { isValidIBAN, maskIBAN, sanitiseIBAN } from '@/lib/iban-validator'
import { useKV } from '@/hooks/useLocalKV'

/** Parses a VAT rate string into an integer percentage, or undefined if empty. */
function parseVatRate(value: string): number | undefined {
  if (value === '') return undefined
  const parsed = parseInt(value, 10)
  if (isNaN(parsed)) return undefined
  return Math.min(100, Math.max(0, parsed))
}

interface LabelArtistManagerProps {
  artists: LabelArtist[]
  onAdd: (name: string) => void
  onRemove: (id: string) => void
  onUpdate: (id: string, patch: Omit<LabelArtist, 'id'>) => void
}

/** Inline edit form shown when a roster row is expanded. */
function ArtistDetailEditor({
  artist,
  onUpdate,
}: {
  artist: LabelArtist
  onUpdate: (patch: Omit<LabelArtist, 'id'>) => void
}) {
  const patch = (partial: Partial<Omit<LabelArtist, 'id'>>) =>
    onUpdate({
      name: artist.name,
      email: artist.email,
      vatNumber: artist.vatNumber,
      notes: artist.notes,
      isEuNonGerman: artist.isEuNonGerman,
      vatRate: artist.vatRate,
      accountHolder: artist.accountHolder,
      iban: artist.iban,
      bic: artist.bic,
      artistId: artist.artistId,
      ...partial,
    })

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.18 }}
      className="overflow-hidden"
    >
      <div className="px-3 pt-2 pb-3 space-y-3 border-t border-white/8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor={`artist-email-${artist.id}`} className="text-xs flex items-center gap-1 text-muted-foreground">
              <EnvelopeSimple size={11} />
              Email
            </Label>
            <Input
              id={`artist-email-${artist.id}`}
              type="email"
              value={artist.email ?? ''}
              onChange={e => patch({ email: e.target.value || undefined })}
              placeholder="artist@example.com"
              className="h-8 text-xs"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor={`artist-vat-${artist.id}`} className="text-xs flex items-center gap-1 text-muted-foreground">
              <IdentificationCard size={11} />
              USt-IdNr. (VAT)
            </Label>
            <Input
              id={`artist-vat-${artist.id}`}
              type="text"
              value={artist.vatNumber ?? ''}
              onChange={e => patch({ vatNumber: e.target.value || undefined })}
              placeholder="e.g. DE123456789 or GB123456789"
              className="h-8 text-xs"
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/8">
          <div>
            <p className="text-xs font-medium">EU Artist (non-DE)</p>
            <p className="text-xs text-muted-foreground">Reverse charge — no German VAT on invoice</p>
          </div>
          <Switch
            checked={artist.isEuNonGerman ?? false}
            onCheckedChange={v => patch({ isEuNonGerman: v })}
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor={`artist-vatrate-${artist.id}`} className="text-xs flex items-center gap-1 text-muted-foreground">
            <IdentificationCard size={11} />
            VAT Rate (%) — overrides global setting
          </Label>
          <div className="flex items-center gap-2">
            <Input
              id={`artist-vatrate-${artist.id}`}
              type="number"
              min={0}
              max={100}
              step={1}
              value={artist.vatRate ?? ''}
              onChange={e => patch({ vatRate: parseVatRate(e.target.value) })}
              placeholder="e.g. 19 (empty = global)"
              className="h-8 text-xs max-w-[140px]"
            />
            <span className="text-xs text-muted-foreground">%</span>
            {artist.isEuNonGerman && (
              <span className="text-xs text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full">Reverse Charge → 0 %</span>
            )}
          </div>
        </div>

        <div className="space-y-1">
          <Label htmlFor={`artist-notes-${artist.id}`} className="text-xs flex items-center gap-1 text-muted-foreground">
            <NotePencil size={11} />
            Notes / Remarks
          </Label>
          <Textarea
            id={`artist-notes-${artist.id}`}
            value={artist.notes ?? ''}
            onChange={e => patch({ notes: e.target.value || undefined })}
            placeholder="Contract specifics, annotations, …"
            rows={2}
            className="text-xs resize-none"
          />
        </div>

        {/* ── Bank account for SEPA payouts ──────────────────── */}
        <div className="mt-1 pt-2 border-t border-white/8 space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
            <Bank size={10} weight="bold" />
            Bank Account (SEPA)
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor={`artist-accholder-${artist.id}`} className="text-xs flex items-center gap-1 text-muted-foreground">
                Account Holder
              </Label>
              <Input
                id={`artist-accholder-${artist.id}`}
                type="text"
                value={artist.accountHolder ?? ''}
                onChange={e => patch({ accountHolder: e.target.value || undefined })}
                placeholder="Full name (as registered with the bank)"
                className="h-8 text-xs"
              />
            </div>

            <TooltipProvider>
              <div className="space-y-1">
                <Label htmlFor={`artist-iban-${artist.id}`} className="text-xs flex items-center gap-1 text-muted-foreground">
                  IBAN
                  {artist.iban && (
                    isValidIBAN(artist.iban)
                      ? <span className="ml-1 text-emerald-400 text-[10px]">✓ valid</span>
                      : <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="ml-1 text-red-400 text-[10px] cursor-help underline decoration-dotted">✗ invalid</span>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-xs bg-red-900/90 text-red-100 border-red-700">
                            Checksum failed. SEPA export blocked.
                          </TooltipContent>
                        </Tooltip>
                  )}
                </Label>
                <Input
                  id={`artist-iban-${artist.id}`}
                  type="text"
                  value={artist.iban ?? ''}
                  onChange={e => {
                    const normalised = sanitiseIBAN(e.target.value)
                    patch({ iban: normalised || undefined })
                  }}
                  placeholder="e.g. DE89370400440532013000"
                  className="h-8 text-xs font-mono"
                />
                {artist.iban && (
                  <p className="text-[10px] text-muted-foreground">{maskIBAN(artist.iban)}</p>
                )}
              </div>
            </TooltipProvider>
          </div>

          <div className="space-y-1 max-w-[200px]">
            <Label htmlFor={`artist-bic-${artist.id}`} className="text-xs flex items-center gap-1 text-muted-foreground">
              BIC / SWIFT (optional)
            </Label>
            <Input
              id={`artist-bic-${artist.id}`}
              type="text"
              value={artist.bic ?? ''}
              onChange={e => patch({ bic: e.target.value.trim().toUpperCase() || undefined })}
              placeholder="e.g. COBADEFFXXX"
              className="h-8 text-xs font-mono"
            />
          </div>
        </div>

        {/* ── darkTunes Portal Link ──────────────────────────── */}
        <div className="mt-1 pt-2 border-t border-white/8 space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
            <LinkSimple size={10} weight="bold" />
            darkTunes Portal
          </p>
          <div className="space-y-1">
            <Label htmlFor={`artist-artistid-${artist.id}`} className="text-xs flex items-center gap-1 text-muted-foreground">
              Artist UUID (from darktunes-website.artists)
            </Label>
            <Input
              id={`artist-artistid-${artist.id}`}
              type="text"
              value={artist.artistId ?? ''}
              onChange={e => patch({ artistId: e.target.value.trim() || undefined })}
              placeholder="e.g. a1b2c3d4-e5f6-7890-abcd-ef1234567890"
              className="h-8 text-xs font-mono"
            />
            <p className="text-[10px] text-muted-foreground">Used to upload statements to the portal automatically.</p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export function LabelArtistManager({
  artists,
  onAdd,
  onRemove,
  onUpdate,
  onImportLabelArtistsCSV,
}: LabelArtistManagerProps & { onImportLabelArtistsCSV?: (artists: Omit<LabelArtist, 'id'>[]) => void }) {
  const { t } = useTranslation()
  const [newName, setNewName] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [sortAlpha, setSortAlpha] = useKV<boolean>('labelArtistsSortAlpha', false)

  const displayArtists = useMemo(() => {
    if (!sortAlpha) return artists
    return [...artists].sort((a, b) =>
      a.name.localeCompare(b.name, 'de', { sensitivity: 'base' })
    )
  }, [artists, sortAlpha])

  const handleAdd = useCallback(() => {
    const name = newName.trim()
    if (!name) return
    if (artists.some(a => a.name.toLowerCase() === name.toLowerCase())) {
      toast.error(i18next.t('toast.artistAlreadyInRoster'))
      return
    }
    onAdd(name)
    setNewName('')
  }, [newName, artists, onAdd])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAdd()
  }

  const toggleExpand = (id: string) =>
    setExpandedId(prev => (prev === id ? null : id))

  // ── CSV Export ────────────────────────────────────────────────────────────

  const handleExport = useCallback(() => {
    if (artists.length === 0) {
      toast.error(i18next.t('toast.noArtistsToExport'))
      return
    }
    const CSV_FIELDS = ['name', 'email', 'vatNumber', 'isEuNonGerman', 'notes', 'accountHolder', 'iban', 'bic', 'artistId'] as const
    const header = CSV_FIELDS.join(',')
    const rows = artists.map(a => {
      const fields = [
        `"${a.name.replace(/"/g, '""')}"`,
        `"${(a.email ?? '').replace(/"/g, '""')}"`,
        `"${(a.vatNumber ?? '').replace(/"/g, '""')}"`,
        a.isEuNonGerman ? 'true' : 'false',
        `"${(a.notes ?? '').replace(/"/g, '""')}"`,
        `"${(a.accountHolder ?? '').replace(/"/g, '""')}"`,
        `"${(a.iban ?? '').replace(/"/g, '""')}"`,
        `"${(a.bic ?? '').replace(/"/g, '""')}"`,
        `"${(a.artistId ?? '').replace(/"/g, '""')}"`,
      ]
      return fields.join(',')
    })
    const csv = [header, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'label_artists.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    setTimeout(() => URL.revokeObjectURL(url), 100)
    toast.success(i18next.t('toast.labelArtistRosterExported'))
  }, [artists])

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 shrink-0 shadow-lg shadow-violet-500/25">
          <Users size={20} className="text-white" weight="bold" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-lg font-['Space_Grotesk'] leading-tight">{t('labelArtist.title')}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t('labelArtist.description')}
          </p>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant={sortAlpha ? 'default' : 'outline'}
                onClick={() => setSortAlpha(v => !(v ?? false))}
                className="gap-1.5 shrink-0"
                aria-pressed={sortAlpha ?? false}
              >
                <SortAscending size={14} weight="bold" />
                A→Z
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {sortAlpha ? 'Sorted alphabetically — click to restore original order' : 'Sort artists A→Z'}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Add artist */}
      <div className="flex gap-2 mb-4">
        <Input
          placeholder={t('labelArtist.artistName')}
          value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyDown={handleKeyDown}
          className="h-9 text-sm border-border/60 bg-background/50 focus:border-primary/60 flex-1"
        />
        <Button
          size="sm"
          onClick={handleAdd}
          disabled={!newName.trim()}
          className="gap-1.5 shrink-0"
        >
          <Plus size={14} weight="bold" />
          {t('common.add')}
        </Button>
      </div>

      {/* Export */}
      <div className="flex gap-2 mb-5">
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/60"
          onClick={handleExport}
          disabled={artists.length === 0}
        >
          <Download size={13} weight="bold" />
          {t('labelArtist.exportRoster')}
        </Button>
        <div className="relative">
          <Input
            type="file"
            accept=".csv"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={async e => {
              const file = e.target.files?.[0]
              if (!file) return
              try {
                const text = await file.text()
                Papa.parse<string[]>(text, {
                  skipEmptyLines: true,
                  complete: (results) => {
                    const rows = results.data
                    if (rows.length === 0) return

                    // Detect header row and build column index map
                    const firstRow = rows[0] ?? []
                    const hasHeader = firstRow[0]?.toLowerCase().startsWith('name')
                    const headerRow = hasHeader ? firstRow.map(h => h.trim().toLowerCase()) : null
                    const dataRows = hasHeader ? rows.slice(1) : rows

                    // Header-aware column positions
                    const colIdx = (name: string, fallback: number): number =>
                      headerRow ? (headerRow.indexOf(name) >= 0 ? headerRow.indexOf(name) : -1) : fallback

                    const nameCol = colIdx('name', 0)
                    const emailCol = colIdx('email', 1)
                    const vatCol = colIdx('vatnumber', 2)
                    const euCol = colIdx('iseunongerman', 3)
                    const notesCol = colIdx('notes', 4)
                    const acctCol = colIdx('accountholder', 5)
                    const ibanCol = colIdx('iban', 6)
                    const bicCol = colIdx('bic', 7)
                    const artistIdCol = colIdx('artistid', -1)

                    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
                    const warnings: string[] = []

                    const parsed = dataRows.flatMap(cols => {
                      const name = nameCol >= 0 ? cols[nameCol]?.trim() : cols[0]?.trim()
                      if (!name) return []
                      const rawArtistId = artistIdCol >= 0 ? cols[artistIdCol]?.trim() : undefined
                      let artistId: string | undefined
                      if (rawArtistId) {
                        if (UUID_RE.test(rawArtistId)) {
                          artistId = rawArtistId
                        } else {
                          warnings.push(`"${name}": invalid UUID format "${rawArtistId}"`)
                        }
                      }
                      return [{
                        name,
                        email: emailCol >= 0 ? cols[emailCol]?.trim() || undefined : undefined,
                        vatNumber: vatCol >= 0 ? cols[vatCol]?.trim() || undefined : undefined,
                        isEuNonGerman: euCol >= 0 ? cols[euCol]?.trim() === 'true' : false,
                        notes: notesCol >= 0 ? cols[notesCol]?.trim() || undefined : undefined,
                        accountHolder: acctCol >= 0 ? cols[acctCol]?.trim() || undefined : undefined,
                        iban: ibanCol >= 0 ? cols[ibanCol]?.trim() || undefined : undefined,
                        bic: bicCol >= 0 ? cols[bicCol]?.trim() || undefined : undefined,
                        artistId,
                      }]
                    })

                    if (parsed.length > 0) {
                      if (onImportLabelArtistsCSV) {
                        onImportLabelArtistsCSV(parsed)
                        if (warnings.length > 0) {
                          toast.warning(`Imported ${parsed.length} artists. UUID warnings:\n${warnings.join('\n')}`)
                        } else {
                          toast.success(i18next.t('toast.artistsImportedFromCSV', { count: parsed.length }))
                        }
                      } else {
                        toast.error(i18next.t('toast.importCSVViaUpload'))
                      }
                    }
                  },
                  error: (err) => {
                    toast.error(i18next.t('toast.csvReadError', { message: err.message }))
                  }
                })
              } catch (e) {
                toast.error(i18next.t('toast.failedToReadCSV'))
              }
              e.target.value = ''
            }}
          />
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => {}}
          >
            {t('labelArtist.importCSV')}
          </Button>
        </div>
      </div>

      {/* Artist list */}
      {artists.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 gap-2 rounded-xl border border-dashed border-border/50 bg-card/30">
          <Users size={28} className="text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">{t('labelArtist.noArtistsYet')}</p>
          <p className="text-xs text-muted-foreground/60">Add artists manually or import a CSV via the Ingestion view. When the roster is empty, all artists are shown.</p>
        </div>
      ) : (
        <ul className="space-y-1.5">
          <AnimatePresence initial={false}>
            {displayArtists.map(artist => (
              <motion.li
                key={artist.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.15 }}
                className="rounded-lg bg-white/5 border border-white/8 overflow-hidden"
              >
                {/* Row header */}
                <div className="flex items-center justify-between gap-2 px-3 py-2 group">
                  <button
                    type="button"
                    className="flex items-center gap-2 min-w-0 flex-1 text-left"
                    onClick={() => toggleExpand(artist.id)}
                    aria-expanded={expandedId === artist.id}
                  >
                    <div className="w-2 h-2 rounded-full bg-violet-400 shrink-0" />
                    <span className="text-sm font-medium truncate">{artist.name}</span>
                    {artist.email && (
                      <span className="text-xs text-muted-foreground hidden sm:inline truncate max-w-[140px]">
                        {artist.email}
                      </span>
                    )}
                    {expandedId === artist.id
                      ? <CaretUp size={12} className="text-muted-foreground shrink-0 ml-1" />
                      : <CaretDown size={12} className="text-muted-foreground shrink-0 ml-1" />}
                  </button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive shrink-0"
                    onClick={() => onRemove(artist.id)}
                  >
                    <Trash size={13} />
                  </Button>
                </div>

                {/* Expandable detail editor */}
                <AnimatePresence initial={false}>
                  {expandedId === artist.id && (
                    <ArtistDetailEditor
                      key={artist.id}
                      artist={artist}
                      onUpdate={patch => onUpdate(artist.id, patch)}
                    />
                  )}
                </AnimatePresence>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  )
}
