import { useState, useCallback } from 'react'
import { EyeSlash, Plus, Trash } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import type { IgnoredEntry } from '@/lib/types'

interface IgnoredEntriesManagerProps {
  entries: IgnoredEntry[]
  artists: string[]
  onAdd: (entry: Omit<IgnoredEntry, 'id' | 'createdAt'>) => void
  onRemove: (id: string) => void
}

export function IgnoredEntriesManager({
  entries,
  artists,
  onAdd,
  onRemove,
}: IgnoredEntriesManagerProps) {
  const [artist, setArtist] = useState('')
  const [releaseTitle, setReleaseTitle] = useState('')
  const [note, setNote] = useState('')

  const handleAdd = useCallback(() => {
    const a = artist.trim()
    if (!a) {
      toast.error('Artist name is required')
      return
    }
    onAdd({ artist: a, releaseTitle: releaseTitle.trim() || undefined, note: note.trim() || undefined })
    setArtist('')
    setReleaseTitle('')
    setNote('')
  }, [artist, releaseTitle, note, onAdd])

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 rounded-xl bg-gradient-to-br from-red-500 to-rose-500 shrink-0 shadow-lg shadow-red-500/25">
          <EyeSlash size={20} className="text-white" weight="bold" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-lg font-['Space_Grotesk'] leading-tight">Ignored Entries</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Exclude specific artists or releases from statement of sales calculations.
          </p>
        </div>
      </div>

      {/* Add form */}
      <div className="space-y-2 mb-5">
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              list="ignored-artists-list"
              placeholder="Artist name *"
              value={artist}
              onChange={e => setArtist(e.target.value)}
              className="h-9 text-sm border-border/60 bg-background/50 focus:border-primary/60"
            />
            <datalist id="ignored-artists-list">
              {artists.map(a => <option key={a} value={a} />)}
            </datalist>
          </div>
          <Input
            placeholder="Release title (optional)"
            value={releaseTitle}
            onChange={e => setReleaseTitle(e.target.value)}
            className="h-9 text-sm border-border/60 bg-background/50 focus:border-primary/60 flex-1"
          />
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Note / reason (optional)"
            value={note}
            onChange={e => setNote(e.target.value)}
            className="h-9 text-sm border-border/60 bg-background/50 focus:border-primary/60 flex-1"
          />
          <Button
            size="sm"
            onClick={handleAdd}
            disabled={!artist.trim()}
            className="gap-1.5 shrink-0"
          >
            <Plus size={14} weight="bold" />
            Ignore
          </Button>
        </div>
      </div>

      {/* Entries list */}
      {entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 gap-2 rounded-xl border border-dashed border-border/50 bg-card/30">
          <EyeSlash size={28} className="text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No entries ignored</p>
          <p className="text-xs text-muted-foreground/60">Ignored entries are excluded from all revenue calculations.</p>
        </div>
      ) : (
        <ul className="space-y-1.5">
          <AnimatePresence initial={false}>
            {entries.map(entry => (
              <motion.li
                key={entry.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.15 }}
                className="flex items-start justify-between gap-2 px-3 py-2.5 rounded-lg bg-white/5 border border-white/8 group"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-sm font-medium text-foreground">{entry.artist}</span>
                    {entry.releaseTitle && (
                      <>
                        <span className="text-muted-foreground/50 text-xs">·</span>
                        <span className="text-xs text-muted-foreground italic truncate max-w-[200px]">{entry.releaseTitle}</span>
                      </>
                    )}
                  </div>
                  {entry.note && (
                    <p className="text-xs text-muted-foreground/70 mt-0.5 truncate">{entry.note}</p>
                  )}
                  <p className="text-[10px] text-muted-foreground/40 mt-0.5">Added {fmtDate(entry.createdAt)}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive shrink-0 mt-0.5"
                  onClick={() => onRemove(entry.id)}
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
