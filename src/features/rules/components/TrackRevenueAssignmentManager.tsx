import { useState, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import i18next from 'i18next'
import { ArrowsSplit, Plus, Trash } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { SearchableCombobox } from '@/components/ui/combobox'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { getAllReleases } from '@/lib/release-utils'
import type { TrackRevenueAssignment, RevenueOwner } from '@/lib/types'

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

/** Mutable draft of a single owner row before submission. */
interface OwnerDraft {
  artist: string
  percentage: number
}

/**
 * Renders the display label for an assignment entry list row.
 * New entries with `owners` show proportional shares; legacy entries with
 * `ownerArtist` render in the original single-owner style.
 */
function AssignmentLabel({ entry }: { entry: TrackRevenueAssignment }) {
  if (entry.owners && entry.owners.length > 0) {
    const parts = entry.owners.map(o => `${o.artist} ${o.percentage}%`).join(' / ')
    return <span className="text-sm text-primary font-medium truncate max-w-[260px]">{parts}</span>
  }
  return (
    <>
      <span className="text-muted-foreground/50 text-xs shrink-0">→</span>
      <span className="text-sm text-primary font-medium truncate max-w-[180px]">
        {entry.ownerArtist}
      </span>
    </>
  )
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
  const [owners, setOwners] = useState<OwnerDraft[]>([{ artist: '', percentage: 100 }])

  /**
   * All unique release titles across all artists — shown in the dropdown when
   * no owner artist has been selected yet.
   */
  const allReleases = useMemo(() => getAllReleases(releaseTitlesByArtist), [releaseTitlesByArtist])

  /**
   * Releases visible in the track-title dropdown.
   * When exactly one owner has been selected, restricts to that artist's
   * releases (matching the legacy single-owner UX). Falls back to the full
   * list when no selection has been made or when there are multiple owners.
   */
  const releaseOptions = useMemo<string[]>(() => {
    const firstArtist = owners[0]?.artist ?? ''
    if (owners.length === 1 && firstArtist.trim()) {
      return releaseTitlesByArtist[firstArtist] ?? allReleases
    }
    return allReleases
  }, [owners, releaseTitlesByArtist, allReleases])

  const percentageSum = useMemo(
    () => owners.reduce((sum, o) => sum + o.percentage, 0),
    [owners]
  )
  const isSumValid = percentageSum === 100
  const hasAnyArtist = owners.some(o => o.artist.trim() !== '')
  const isFormValid = trackTitle.trim() !== '' && hasAnyArtist && isSumValid

  /**
   * Handles first-owner artist selection.  Clears the track-title field
   * whenever the first artist changes so the user is not left with a release
   * from a different artist.
   */
  const handleOwnerArtistChange = useCallback((index: number, value: string) => {
    if (index === 0) setTrackTitle('')
    setOwners(prev => prev.map((o, i) => i === index ? { ...o, artist: value } : o))
  }, [])

  const handleOwnerPercentageChange = useCallback((index: number, value: number) => {
    setOwners(prev => prev.map((o, i) => i === index ? { ...o, percentage: value } : o))
  }, [])

  const handleAddOwner = useCallback(() => {
    setOwners(prev => [...prev, { artist: '', percentage: 0 }])
  }, [])

  const handleRemoveOwner = useCallback((index: number) => {
    setOwners(prev => prev.filter((_, i) => i !== index))
  }, [])

  const handleAdd = useCallback(() => {
    const title = trackTitle.trim()
    if (!title) {
      toast.error(i18next.t('trackRevenueAssignment.trackTitleRequired'))
      return
    }
    if (!hasAnyArtist) {
      toast.error(i18next.t('trackRevenueAssignment.ownerArtistRequired'))
      return
    }
    if (!isSumValid) {
      toast.error(i18next.t('trackRevenueAssignment.percentageSumInvalid'))
      return
    }
    const validOwners: RevenueOwner[] = owners
      .filter(o => o.artist.trim() !== '')
      .map(o => ({ artist: o.artist.trim(), percentage: o.percentage }))
    onAdd({ trackTitle: title, owners: validOwners })
    setTrackTitle('')
    setOwners([{ artist: '', percentage: 100 }])
  }, [trackTitle, owners, hasAnyArtist, isSumValid, onAdd])

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
      <div className="space-y-3 mb-5">
        {/* Release / track title */}
        <SearchableCombobox
          value={trackTitle}
          onChange={setTrackTitle}
          options={releaseOptions}
          placeholder={t('trackRevenueAssignment.trackTitlePlaceholder')}
          emptyText={t('trackRevenueAssignment.noReleaseFound')}
        />

        {/* Owner rows */}
        <div className="space-y-2">
          {owners.map((owner, index) => (
            <div key={index} className="flex gap-2 items-center">
              <div className="flex-1">
                <SearchableCombobox
                  value={owner.artist}
                  onChange={value => handleOwnerArtistChange(index, value)}
                  options={artists}
                  placeholder={t('trackRevenueAssignment.ownerArtistPlaceholder')}
                  emptyText={t('trackRevenueAssignment.noArtistFound')}
                />
              </div>
              <input
                type="number"
                min={0}
                max={100}
                value={owner.percentage}
                onChange={e => handleOwnerPercentageChange(index, Number(e.target.value))}
                aria-label={t('trackRevenueAssignment.ownerPercentage')}
                className="w-20 h-9 rounded-md border border-border/60 bg-background/50 px-2 text-sm text-center focus:outline-none focus:border-primary/60"
              />
              {owners.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-muted-foreground hover:text-destructive shrink-0"
                  onClick={() => handleRemoveOwner(index)}
                  aria-label={t('trackRevenueAssignment.removeOwner')}
                >
                  <Trash size={14} />
                </Button>
              )}
            </div>
          ))}
        </div>

        {/* Percentage sum indicator + Add owner button */}
        <div className="flex items-center justify-between gap-2">
          <span
            className={`text-xs font-medium ${isSumValid ? 'text-green-500' : 'text-destructive'}`}
          >
            {isSumValid
              ? t('trackRevenueAssignment.percentageSumValid')
              : t('trackRevenueAssignment.percentageSumInvalid')}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleAddOwner}
            className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <Plus size={12} weight="bold" />
            {t('trackRevenueAssignment.addOwner')}
          </Button>
        </div>

        <p className="text-[11px] text-muted-foreground/60 leading-snug">
          {t('trackRevenueAssignment.multiOwnerHint')}
        </p>
        <p className="text-[11px] text-muted-foreground/60 leading-snug">
          {t('trackRevenueAssignment.hint')}
        </p>

        <Button
          size="sm"
          onClick={handleAdd}
          disabled={!isFormValid}
          className="gap-1.5 w-full"
        >
          <Plus size={14} weight="bold" />
          {t('trackRevenueAssignment.addEntry')}
        </Button>
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
                  <AssignmentLabel entry={entry} />
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
