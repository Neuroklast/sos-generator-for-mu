import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import i18next from 'i18next'
import { ArrowsSplit, Plus, Trash } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import type { TrackRevenueAssignment } from '@/lib/types'

interface TrackRevenueAssignmentManagerProps {
  assignments: TrackRevenueAssignment[]
  /** All known release titles — used to populate the datalist for quick selection. */
  availableReleases: string[]
  /** All known artist names — used to populate the owner artist datalist. */
  artists: string[]
  onAdd: (entry: Omit<TrackRevenueAssignment, 'id'>) => void
  onRemove: (id: string) => void
}

export function TrackRevenueAssignmentManager({
  assignments,
  availableReleases,
  artists,
  onAdd,
  onRemove,
}: TrackRevenueAssignmentManagerProps) {
  const { t } = useTranslation()
  const [trackTitle, setTrackTitle] = useState('')
  const [ownerArtist, setOwnerArtist] = useState('')

  const handleAdd = useCallback(() => {
    const title = trackTitle.trim()
    const owner = ownerArtist.trim()
    if (!title) {
      toast.error(i18next.t('trackRevenueAssignment.trackTitleRequired'))
      return
    }
    if (!owner) {
      toast.error(i18next.t('trackRevenueAssignment.ownerArtistRequired'))
      return
    }
    onAdd({ trackTitle: title, ownerArtist: owner })
    setTrackTitle('')
    setOwnerArtist('')
  }, [trackTitle, ownerArtist, onAdd])

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 shrink-0 shadow-lg shadow-violet-500/25">
          <ArrowsSplit size={20} className="text-white" weight="bold" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-lg font-['Space_Grotesk'] leading-tight">
            {t('trackRevenueAssignment.title')}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t('trackRevenueAssignment.description')}
          </p>
        </div>
      </div>

      {/* Add form */}
      <div className="space-y-2 mb-5">
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              list="tra-track-titles-list"
              placeholder={t('trackRevenueAssignment.trackTitlePlaceholder')}
              value={trackTitle}
              onChange={e => setTrackTitle(e.target.value)}
              className="h-9 text-sm border-border/60 bg-background/50 focus:border-primary/60"
            />
            {/* Datalist provides dropdown suggestions from all known releases while
                still allowing the user to type any custom substring freely. */}
            <datalist id="tra-track-titles-list">
              {availableReleases.map(r => (
                <option key={r} value={r} />
              ))}
            </datalist>
          </div>
          <div className="flex-1">
            <Input
              list="tra-owner-artists-list"
              placeholder={t('trackRevenueAssignment.ownerArtistPlaceholder')}
              value={ownerArtist}
              onChange={e => setOwnerArtist(e.target.value)}
              className="h-9 text-sm border-border/60 bg-background/50 focus:border-primary/60"
            />
            <datalist id="tra-owner-artists-list">
              {artists.map(a => (
                <option key={a} value={a} />
              ))}
            </datalist>
          </div>
          <Button
            size="sm"
            onClick={handleAdd}
            disabled={!trackTitle.trim() || !ownerArtist.trim()}
            className="gap-1.5 shrink-0"
          >
            <Plus size={14} weight="bold" />
            {t('trackRevenueAssignment.addEntry')}
          </Button>
        </div>
        <p className="text-[11px] text-muted-foreground/60 leading-snug">
          {t('trackRevenueAssignment.hint')}
        </p>
      </div>

      {/* Entries list */}
      {assignments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 gap-2 rounded-xl border border-dashed border-border/50 bg-card/30">
          <ArrowsSplit size={28} className="text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">{t('trackRevenueAssignment.noEntriesYet')}</p>
          <p className="text-xs text-muted-foreground/60">
            {t('trackRevenueAssignment.noEntriesHint')}
          </p>
        </div>
      ) : (
        <ul className="space-y-1.5">
          <AnimatePresence initial={false}>
            {assignments.map(entry => (
              <motion.li
                key={entry.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.15 }}
                className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg bg-white/5 border border-white/8 group"
              >
                <div className="min-w-0 flex-1 flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-foreground truncate max-w-[220px]">
                    {entry.trackTitle}
                  </span>
                  <span className="text-muted-foreground/50 text-xs shrink-0">→</span>
                  <span className="text-sm text-primary font-medium truncate max-w-[180px]">
                    {entry.ownerArtist}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive shrink-0"
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
