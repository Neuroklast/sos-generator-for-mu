import { useState, useCallback } from 'react'
import { Users, Plus, Trash, Download, CaretDown, CaretUp, EnvelopeSimple, IdentificationCard, NotePencil } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import type { LabelArtist } from '@/lib/types'

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
              E-Mail
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
              placeholder="z.B. DE123456789 oder GB123456789"
              className="h-8 text-xs"
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/8">
          <div>
            <p className="text-xs font-medium">EU-Künstler (nicht-DE)</p>
            <p className="text-xs text-muted-foreground">Reverse-Charge-Verfahren — keine deutsche MwSt. auf Rechnung</p>
          </div>
          <Switch
            checked={artist.isEuNonGerman ?? false}
            onCheckedChange={v => patch({ isEuNonGerman: v })}
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor={`artist-vatrate-${artist.id}`} className="text-xs flex items-center gap-1 text-muted-foreground">
            <IdentificationCard size={11} />
            MwSt.-Satz (%) — überschreibt globale Einstellung
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
              placeholder="z.B. 19 (leer = global)"
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
            Notizen / Besonderheiten
          </Label>
          <Textarea
            id={`artist-notes-${artist.id}`}
            value={artist.notes ?? ''}
            onChange={e => patch({ notes: e.target.value || undefined })}
            placeholder="Vertragsbesonderheiten, Anmerkungen, …"
            rows={2}
            className="text-xs resize-none"
          />
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
}: LabelArtistManagerProps) {
  const [newName, setNewName] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const handleAdd = useCallback(() => {
    const name = newName.trim()
    if (!name) return
    if (artists.some(a => a.name.toLowerCase() === name.toLowerCase())) {
      toast.error('Artist already in roster')
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
      toast.error('No artists to export')
      return
    }
    const header = 'name,email,vatNumber,isEuNonGerman,notes'
    const rows = artists.map(a => {
      const fields = [
        `"${a.name.replace(/"/g, '""')}"`,
        `"${(a.email ?? '').replace(/"/g, '""')}"`,
        `"${(a.vatNumber ?? '').replace(/"/g, '""')}"`,
        a.isEuNonGerman ? 'true' : 'false',
        `"${(a.notes ?? '').replace(/"/g, '""')}"`,
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
    toast.success('Label artist roster exported')
  }, [artists])

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 shrink-0 shadow-lg shadow-violet-500/25">
          <Users size={20} className="text-white" weight="bold" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-lg font-['Space_Grotesk'] leading-tight">Label Artist Roster</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Artists signed to your label. Click a row to edit email, VAT number, and notes.
          </p>
        </div>
      </div>

      {/* Add artist */}
      <div className="flex gap-2 mb-4">
        <Input
          placeholder="Artist name…"
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
          Add
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
          Export CSV
        </Button>
      </div>

      {/* Artist list */}
      {artists.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 gap-2 rounded-xl border border-dashed border-border/50 bg-card/30">
          <Users size={28} className="text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No artists in roster yet</p>
          <p className="text-xs text-muted-foreground/60">Add artists manually or import a CSV via the Ingestion view. When the roster is empty, all artists are shown.</p>
        </div>
      ) : (
        <ul className="space-y-1.5">
          <AnimatePresence initial={false}>
            {artists.map(artist => (
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
