import { useRef, useState, useCallback } from 'react'
import { Users, Plus, Trash, Upload, Download } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import type { LabelArtist } from '@/lib/types'

interface LabelArtistManagerProps {
  artists: LabelArtist[]
  onAdd: (name: string) => void
  onRemove: (id: string) => void
  onImportCSV: (artists: Omit<LabelArtist, 'id'>[]) => void
}

export function LabelArtistManager({
  artists,
  onAdd,
  onRemove,
  onImportCSV,
}: LabelArtistManagerProps) {
  const [newName, setNewName] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  // ── CSV Export ────────────────────────────────────────────────────────────

  const handleExport = useCallback(() => {
    if (artists.length === 0) {
      toast.error('No artists to export')
      return
    }
    const csv = ['name', ...artists.map(a => `"${a.name.replace(/"/g, '""')}"`)]
    const blob = new Blob([csv.join('\n')], { type: 'text/csv' })
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

  // ── CSV Import ────────────────────────────────────────────────────────────

  const handleFileSelected = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = event => {
        try {
          const text = event.target?.result as string
          const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
          // Skip a header row if it equals "name" (case-insensitive)
          const dataLines = lines[0]?.toLowerCase() === 'name' ? lines.slice(1) : lines
          const parsed: Omit<LabelArtist, 'id'>[] = dataLines
            .map(l => l.replace(/^"(.*)"$/, '$1').replace(/""/g, '"').trim())
            .filter(Boolean)
            .map(name => ({ name }))
          if (parsed.length === 0) {
            toast.error('No artist names found in CSV')
            return
          }
          onImportCSV(parsed)
          toast.success(`${parsed.length} artist${parsed.length !== 1 ? 's' : ''} imported`)
        } catch {
          toast.error('Failed to parse CSV file')
        }
      }
      reader.onerror = () => toast.error('Could not read file')
      reader.readAsText(file)
      e.target.value = ''
    },
    [onImportCSV]
  )

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
            Artists signed to your label. Only their releases will appear in reports. Co-artists not on the roster become features.
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

      {/* Import / Export */}
      <div className="flex gap-2 mb-5">
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 border-violet-500/40 text-violet-400 hover:bg-violet-500/10 hover:border-violet-500/60"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload size={13} weight="bold" />
          Import CSV
        </Button>
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
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          onChange={handleFileSelected}
          className="hidden"
        />
      </div>

      {/* Artist list */}
      {artists.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 gap-2 rounded-xl border border-dashed border-border/50 bg-card/30">
          <Users size={28} className="text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No artists in roster yet</p>
          <p className="text-xs text-muted-foreground/60">Add artists manually or import a CSV. When the roster is empty, all artists are shown.</p>
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
                className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/8 group"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-2 h-2 rounded-full bg-violet-400 shrink-0" />
                  <span className="text-sm font-medium truncate">{artist.name}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive shrink-0"
                  onClick={() => onRemove(artist.id)}
                >
                  <Trash size={13} />
                </Button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  )
}
