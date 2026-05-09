import { useState, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import i18next from 'i18next'
import { ArrowsSplit, Plus, Trash } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { SearchableCombobox } from '@/components/ui/combobox'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import type { TrackRevenueAssignment } from '@/lib/types'

interface TrackRevenueAssignmentManagerProps {
  assignments: TrackRevenueAssignment[]
  /**
   * Map of artist name → release titles that belong to that artist
   * (including collabs and features).  Used to populate the release dropdown
   * and to restrict it to the selected artist's releases.
   */
  releaseTitlesByArtist: Record<string, string[]>
  /** All known artist names — used to populate the owner artist dropdown. */
  artists: string[]
  onAdd: (entry: Omit<TrackRevenueAssignment, 'id'>) => void
  onRemove: (id: string) => void
}

export function TrackRevenueAssignmentManager({
  assignments,
  releaseTitlesByArtist,
  artists,
  onAdd,
  onRemove,
}: TrackRevenueAssignmentManagerProps) {
  const { t } = useTranslation()
  const [trackTitle, setTrackTitle] = useState('')
  const [ownerArtist, setOwnerArtist] = useState('')

  /**
   * All unique release titles across all artists — shown in the dropdown when
   * no owner artist has been selected yet.
   */
  const allReleases = useMemo<string[]>(() => {
    const seen = new Set<string>()
    for (const titles of Object.values(releaseTitlesByArtist)) {
      for (const title of titles) {
        seen.add(title)
      }
    }
    return Array.from(seen).sort((a, b) => a.localeCompare(b))
  }, [releaseTitlesByArtist])

  /**
   * Releases visible in the track-title dropdown.
   * Restricted to the selected artist's releases when an artist is chosen;
   * falls back to the full list otherwise.
   */
  const releaseOptions = useMemo<string[]>(() => {
    if (!ownerArtist.trim()) return allReleases
    return releaseTitlesByArtist[ownerArtist] ?? allReleases
  }, [ownerArtist, releaseTitlesByArtist, allReleases])

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
          {/* Owner artist — select first so that the release dropdown is pre-filtered */}
          <div className="flex-1">
            <SearchableCombobox
              value={ownerArtist}
              onChange={setOwnerArtist}
              options={artists}
              placeholder={t('trackRevenueAssignment.ownerArtistPlaceholder')}
              emptyText={t('trackRevenueAssignment.noArtistFound')}
            />
          </div>
          {/* Track / release title — filtered by selected artist */}
          <div className="flex-1">
            <SearchableCombobox
              value={trackTitle}
              onChange={setTrackTitle}
              options={releaseOptions}
              placeholder={t('trackRevenueAssignment.trackTitlePlaceholder')}
              emptyText={t('trackRevenueAssignment.noReleaseFound')}
            />
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
