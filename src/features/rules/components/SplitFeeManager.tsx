import { Percent, X } from '@phosphor-icons/react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { SplitFee, ReleaseSplitOverride } from '@/lib/types'

interface SplitFeeManagerProps {
  splitFees: SplitFee[]
  onUpdateSplitFee: (artist: string, percentage: number) => void
  onBulkUpdateSplitFee?: (artists: string[], percentage: number) => void
  onUpdateSplitFeeTypeOverride?: (
    artist: string,
    digitalPercentage: number | undefined,
    physicalPercentage: number | undefined
  ) => void
  onUpdateReleaseOverrides?: (artist: string, overrides: ReleaseSplitOverride[]) => void
  /** Map of artist name → sorted release titles for the per-release override dropdown. */
  releaseTitlesByArtist?: Record<string, string[]>
}

// ── Shared validation ─────────────────────────────────────────────────────────

type ParseResult =
  | { ok: true; value: number }
  | { ok: true; value: undefined } // empty string → clear override
  | { ok: false; error: string }

/**
 * Parses and validates a raw percentage string input.
 * Returns a typed discriminated union so callers handle both success and failure.
 *
 * @param raw - Raw string from an input element.
 * @param required - When true an empty string is treated as an error instead of clearing the value.
 */
function parsePercentInput(raw: string, required: boolean): ParseResult {
  const trimmed = raw.trim()
  if (trimmed === '') {
    return required
      ? { ok: false, error: 'Required' }
      : { ok: true, value: undefined }
  }
  const num = parseFloat(trimmed)
  if (isNaN(num)) return { ok: false, error: 'Must be a number' }
  if (num < 0 || num > 100) return { ok: false, error: 'Must be 0–100' }
  return { ok: true, value: Math.round(num * 10) / 10 }
}

// ── PercentInput ──────────────────────────────────────────────────────────────

/** Converts an optional percentage number to its string representation for input state. */
function formatPercentValue(value: number | undefined): string {
  return value != null ? String(value) : ''
}

/**
 * Controlled optional numeric input for percentage values (0–100).
 * An empty value clears the override and triggers `onChange(undefined)`.
 * Synchronises the local draft with external `value` prop changes so that
 * undo / workspace-reset operations always reflect the current state.
 */
function PercentInput({
  id,
  value,
  onChange,
  placeholder = 'e.g. 70',
}: {
  id: string
  value: number | undefined
  onChange: (value: number | undefined) => void
  placeholder?: string
}) {
  const [draft, setDraft] = useState(formatPercentValue(value))
  const [error, setError] = useState('')

  // Sync draft whenever the external value changes (e.g. after undo or reset).
  useEffect(() => {
    setDraft(formatPercentValue(value))
    setError('')
  }, [value])

  const handleBlur = useCallback(() => {
    const result = parsePercentInput(draft, false)
    if (!result.ok) { setError(result.error); return }
    setError('')
    if (result.value != null) setDraft(String(result.value))
    onChange(result.value)
  }, [draft, onChange])

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-1">
        <Input
          id={id}
          type="number"
          min="0"
          max="100"
          step="0.1"
          placeholder={placeholder}
          value={draft}
          onChange={e => { setDraft(e.target.value); setError('') }}
          onBlur={handleBlur}
          className={[
            'w-20 text-right font-mono text-xs',
            error ? 'border-destructive focus-visible:ring-destructive' : '',
          ].join(' ')}
        />
        <span className="text-xs text-muted-foreground">%</span>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

// ── ReleaseOverrideList ───────────────────────────────────────────────────────

/**
 * Displays and manages per-release split percentage overrides for a single artist.
 * When `availableReleases` is provided the add-form uses a `Select` dropdown
 * instead of a free-text input, preventing typos and showing only actual releases.
 */
function ReleaseOverrideList({
  artist,
  overrides,
  availableReleases,
  onUpdate,
}: {
  artist: string
  overrides: ReleaseSplitOverride[]
  availableReleases?: string[]
  onUpdate: (artist: string, overrides: ReleaseSplitOverride[]) => void
}) {
  const [newTitle, setNewTitle] = useState('')
  const [newPct, setNewPct] = useState('')
  const [titleError, setTitleError] = useState('')
  const [pctError, setPctError] = useState('')

  const handleRemove = useCallback(
    (index: number, e: React.MouseEvent) => {
      e.stopPropagation()
      const updated = overrides.filter((_, i) => i !== index)
      onUpdate(artist, updated)
    },
    [artist, overrides, onUpdate]
  )

  const handleChangePercent = useCallback(
    (index: number, value: number | undefined) => {
      if (value == null) return
      const updated = overrides.map((o, i) => i === index ? { ...o, percentage: value } : o)
      onUpdate(artist, updated)
    },
    [artist, overrides, onUpdate]
  )

  const handleAdd = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      let valid = true
      const trimmedTitle = newTitle.trim()
      if (!trimmedTitle) {
        setTitleError('Release title is required')
        valid = false
      } else if (
        overrides.some(o => o.releaseTitle.toLowerCase() === trimmedTitle.toLowerCase())
      ) {
        setTitleError('An override for this title already exists')
        valid = false
      } else {
        setTitleError('')
      }
      const pctResult = parsePercentInput(newPct, true)
      if (!pctResult.ok) {
        setPctError(pctResult.error)
        valid = false
      } else {
        setPctError('')
      }
      if (!valid || !pctResult.ok || pctResult.value == null) return
      onUpdate(artist, [...overrides, { releaseTitle: trimmedTitle, percentage: pctResult.value }])
      setNewTitle('')
      setNewPct('')
    },
    [artist, overrides, onUpdate, newTitle, newPct]
  )

  // Releases already covered by an override — excluded from the dropdown.
  const usedTitles = new Set(overrides.map(o => o.releaseTitle.toLowerCase()))
  const selectableReleases = availableReleases?.filter(r => !usedTitles.has(r.toLowerCase()))
  const useDropdown = selectableReleases != null

  return (
    <div className="mt-3 pt-3 border-t border-white/10 space-y-3" onClick={e => e.stopPropagation()}>
      <Label className="text-xs text-muted-foreground block">Per-release overrides</Label>

      {overrides.length > 0 && (
        <div className="space-y-2">
          {overrides.map((o, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="flex-1 text-xs truncate font-mono text-foreground/80" title={o.releaseTitle}>
                {o.releaseTitle}
              </span>
              <PercentInput
                id={`release-override-${artist}-${i}`}
                value={o.percentage}
                onChange={val => handleChangePercent(i, val)}
              />
              <button
                type="button"
                onClick={e => handleRemove(i, e)}
                aria-label={`Remove override for ${o.releaseTitle}`}
                className="text-muted-foreground hover:text-destructive transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add form */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          {useDropdown ? (
            <div className="flex-1 flex flex-col gap-1">
              <Select
                value={newTitle}
                onValueChange={val => { setNewTitle(val); setTitleError('') }}
              >
                <SelectTrigger className={`text-xs ${titleError ? 'border-destructive' : ''}`}>
                  <SelectValue placeholder="Select a release…" />
                </SelectTrigger>
                <SelectContent>
                  {selectableReleases.length > 0
                    ? selectableReleases.map(title => (
                        <SelectItem key={title} value={title} className="text-xs">
                          {title}
                        </SelectItem>
                      ))
                    : (
                        <div className="px-3 py-2 text-xs text-muted-foreground">
                          All releases already have overrides
                        </div>
                      )}
                </SelectContent>
              </Select>
              {titleError && <p className="text-xs text-destructive">{titleError}</p>}
            </div>
          ) : (
            <div className="flex-1 flex flex-col gap-1">
              <Input
                type="text"
                placeholder="Release title substring…"
                value={newTitle}
                onChange={e => { setNewTitle(e.target.value); setTitleError('') }}
                className={`text-xs ${titleError ? 'border-destructive' : ''}`}
              />
              {titleError && <p className="text-xs text-destructive">{titleError}</p>}
            </div>
          )}
          <div className="flex flex-col gap-1 items-end">
            <div className="flex items-center gap-1">
              <Input
                type="number"
                min="0"
                max="100"
                step="0.1"
                placeholder="e.g. 70"
                value={newPct}
                onChange={e => { setNewPct(e.target.value); setPctError('') }}
                className={`w-20 text-right font-mono text-xs ${pctError ? 'border-destructive' : ''}`}
              />
              <span className="text-xs text-muted-foreground">%</span>
            </div>
            {pctError && <p className="text-xs text-destructive">{pctError}</p>}
          </div>
          <Button size="sm" variant="outline" onClick={handleAdd} className="text-xs shrink-0">
            Add
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground/60">
          {useDropdown
            ? 'Exact release · overrides type-level split'
            : 'Substring match · case-insensitive · overrides type-level split'}
        </p>
      </div>
    </div>
  )
}

// ── SplitFeeRow ───────────────────────────────────────────────────────────────

function SplitFeeRow({
  split,
  selected,
  onSelect,
  onUpdate,
  onUpdateTypeOverride,
  onUpdateReleaseOverrides,
  availableReleases,
}: {
  split: SplitFee
  selected: boolean
  onSelect: (e: React.MouseEvent) => void
  onUpdate: (artist: string, percentage: number) => void
  onUpdateTypeOverride?: (artist: string, digital: number | undefined, physical: number | undefined) => void
  onUpdateReleaseOverrides?: (artist: string, overrides: ReleaseSplitOverride[]) => void
  availableReleases?: string[]
}) {
  const [draft, setDraft] = useState(String(split.percentage))
  const [error, setError] = useState('')
  const [showOverrides, setShowOverrides] = useState(
    split.digitalPercentage != null || split.physicalPercentage != null
  )
  const [showReleaseOverrides, setShowReleaseOverrides] = useState(
    split.releaseOverrides != null && split.releaseOverrides.length > 0
  )

  // Sync base draft with external changes (undo / reset).
  useEffect(() => {
    setDraft(String(split.percentage))
    setError('')
  }, [split.percentage])

  const handleBlur = useCallback(() => {
    const result = parsePercentInput(draft, true)
    if (!result.ok) { setError(result.error); return }
    const value = result.value as number // required=true guarantees a number on success
    setDraft(String(value))
    setError('')
    onUpdate(split.artist, value)
  }, [draft, split.artist, onUpdate])

  return (
    <Card
      className={`p-4 cursor-pointer transition-colors ${selected ? 'border-primary/60 bg-primary/5' : 'hover:bg-white/[0.02]'}`}
      onClick={onSelect}
    >
      <div className="flex items-start gap-3">
        <Checkbox
          checked={selected}
          onCheckedChange={undefined}
          className="mt-1 border-2 border-white/40 data-[state=checked]:border-primary data-[state=checked]:bg-primary"
          aria-label={`Select ${split.artist}`}
        />
        <div className="flex-1 min-w-0 pt-1">
          <Label htmlFor={`split-${split.artist}`} className="text-sm font-medium truncate block">
            {split.artist}
          </Label>
        </div>

        {/* Base split % */}
        <div className="flex flex-col items-end gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Base</span>
            <Input
              id={`split-${split.artist}`}
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={draft}
              onChange={e => { setDraft(e.target.value); setError('') }}
              onBlur={handleBlur}
              className={[
                'w-24 text-right font-mono',
                error ? 'border-destructive focus-visible:ring-destructive' : '',
              ].join(' ')}
            />
            <span className="text-sm text-muted-foreground w-4">%</span>
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}

          {/* Toggle for type-specific overrides */}
          {onUpdateTypeOverride && (
            <button
              type="button"
              onClick={e => { e.stopPropagation(); setShowOverrides(v => !v) }}
              className="text-xs text-primary/70 hover:text-primary underline underline-offset-2 mt-1"
            >
              {showOverrides ? 'Hide type overrides' : 'Set per-type override…'}
            </button>
          )}

          {/* Toggle for per-release overrides */}
          {onUpdateReleaseOverrides && (
            <button
              type="button"
              onClick={e => { e.stopPropagation(); setShowReleaseOverrides(v => !v) }}
              className="text-xs text-primary/70 hover:text-primary underline underline-offset-2 mt-1"
            >
              {showReleaseOverrides ? 'Hide release overrides' : 'Set per-release override…'}
            </button>
          )}
        </div>
      </div>

      {/* Per-type override inputs */}
      {showOverrides && onUpdateTypeOverride && (
        <div
          className="mt-3 pt-3 border-t border-white/10 grid grid-cols-2 gap-4"
          onClick={e => e.stopPropagation()}
        >
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Digital override</Label>
            <PercentInput
              id={`split-digital-${split.artist}`}
              value={split.digitalPercentage}
              placeholder="e.g. 80"
              onChange={digitalPercentage =>
                onUpdateTypeOverride(split.artist, digitalPercentage, split.physicalPercentage)
              }
            />
            <p className="text-[10px] text-muted-foreground/60">Streaming · empty = use base</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Physical / Merch override</Label>
            <PercentInput
              id={`split-physical-${split.artist}`}
              value={split.physicalPercentage}
              placeholder="e.g. 60"
              onChange={physicalPercentage =>
                onUpdateTypeOverride(split.artist, split.digitalPercentage, physicalPercentage)
              }
            />
            <p className="text-[10px] text-muted-foreground/60">Physical · Merch · empty = use base</p>
          </div>
        </div>
      )}

      {/* Per-release override list */}
      {showReleaseOverrides && onUpdateReleaseOverrides && (
        <ReleaseOverrideList
          artist={split.artist}
          overrides={split.releaseOverrides ?? []}
          availableReleases={availableReleases}
          onUpdate={onUpdateReleaseOverrides}
        />
      )}
    </Card>
  )
}

// ── SplitFeeManager ───────────────────────────────────────────────────────────

export function SplitFeeManager({ splitFees, onUpdateSplitFee, onBulkUpdateSplitFee, onUpdateSplitFeeTypeOverride, onUpdateReleaseOverrides, releaseTitlesByArtist }: SplitFeeManagerProps) {
  const [selectedArtists, setSelectedArtists] = useState<Set<string>>(new Set())
  const [bulkDraft, setBulkDraft] = useState('')
  const [bulkError, setBulkError] = useState('')
  const lastClickedIndexRef = useRef<number | null>(null)

  const handleRowSelect = useCallback((artist: string, index: number, e: React.MouseEvent) => {
    setSelectedArtists(prev => {
      const next = new Set(prev)
      if (e.shiftKey && lastClickedIndexRef.current !== null) {
        // Range-select: toggle all rows between last clicked and current
        const lo = Math.min(lastClickedIndexRef.current, index)
        const hi = Math.max(lastClickedIndexRef.current, index)
        const shouldSelect = !prev.has(artist)
        for (let i = lo; i <= hi; i++) {
          const a = splitFees[i]?.artist
          if (a) {
            if (shouldSelect) next.add(a)
            else next.delete(a)
          }
        }
      } else if (e.ctrlKey || e.metaKey) {
        // Toggle single row
        if (next.has(artist)) next.delete(artist)
        else next.add(artist)
      } else {
        // Plain click: toggle selection; clicking a non-selected row clears others
        if (next.has(artist) && next.size === 1) {
          next.clear()
        } else {
          next.clear()
          next.add(artist)
        }
      }
      return next
    })
    lastClickedIndexRef.current = index
  }, [splitFees])

  const clearSelection = () => {
    setSelectedArtists(new Set())
    lastClickedIndexRef.current = null
  }

  const applyBulk = () => {
    const result = parsePercentInput(bulkDraft, true)
    if (!result.ok) { setBulkError(result.error); return }
    const value = result.value as number
    const artists = Array.from(selectedArtists)
    if (onBulkUpdateSplitFee) {
      onBulkUpdateSplitFee(artists, value)
    } else {
      artists.forEach(a => onUpdateSplitFee(a, value))
    }
    setBulkDraft('')
    setBulkError('')
    clearSelection()
  }

  const selectedCount = selectedArtists.size
  const allSelected = splitFees.length > 0 && selectedCount === splitFees.length

  /**
   * Selects or deselects all artists in a single immutable batch to minimise
   * re-renders. When selecting, `lastClickedIndexRef` is set to the last artist
   * index so that a subsequent Shift+click correctly extends or shrinks the range
   * from the end of the list. When deselecting, the ref is cleared to `null`
   * so the next plain click starts a fresh anchor point.
   */
  const handleSelectAll = useCallback(() => {
    if (allSelected) {
      setSelectedArtists(new Set())
      lastClickedIndexRef.current = null
    } else {
      setSelectedArtists(new Set(splitFees.map(s => s.artist)))
      // Set anchor to last index so subsequent Shift+click ranges work correctly.
      lastClickedIndexRef.current = splitFees.length - 1
    }
  }, [allSelected, splitFees])

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Percent size={20} weight="bold" className="text-primary" />
        <h3 className="font-semibold">Split Fees</h3>
      </div>

      {/* Bulk edit toolbar – visible when ≥2 rows are selected */}
      {selectedCount >= 2 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/10 border border-primary/30">
          <p className="text-sm font-medium text-primary shrink-0">
            {selectedCount} artists selected
          </p>
          <div className="flex items-center gap-2 flex-1">
            <Input
              type="number"
              min="0"
              max="100"
              step="0.1"
              placeholder="e.g. 80"
              value={bulkDraft}
              onChange={e => { setBulkDraft(e.target.value); setBulkError('') }}
              onKeyDown={e => e.key === 'Enter' && applyBulk()}
              className={`w-28 text-right font-mono ${bulkError ? 'border-destructive' : 'border-primary/40'}`}
            />
            <span className="text-sm text-muted-foreground">%</span>
            {bulkError && <p className="text-xs text-destructive">{bulkError}</p>}
          </div>
          <Button size="sm" onClick={applyBulk} className="shrink-0">Apply to all</Button>
          <Button size="sm" variant="ghost" onClick={clearSelection} className="shrink-0 text-muted-foreground">
            Clear selection
          </Button>
        </div>
      )}

      {splitFees.length > 0 ? (
        <div className="space-y-3">
          {/* Select All row */}
          <div
            className="flex items-center gap-2 px-1 cursor-pointer"
            onClick={handleSelectAll}
          >
            <Checkbox
              checked={allSelected}
              onCheckedChange={handleSelectAll}
              className="border-2 border-white/40 data-[state=checked]:border-primary data-[state=checked]:bg-primary"
              aria-label="Select all artists"
            />
            <span className="text-xs text-muted-foreground select-none">
              {allSelected ? 'Deselect all' : 'Select all artists'}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Click to select · Shift+click to select a range · Ctrl+click to add/remove
          </p>
          {splitFees.map((split, index) => (
            <SplitFeeRow
              key={split.artist}
              split={split}
              selected={selectedArtists.has(split.artist)}
              onSelect={e => handleRowSelect(split.artist, index, e)}
              onUpdate={onUpdateSplitFee}
              onUpdateTypeOverride={onUpdateSplitFeeTypeOverride}
              onUpdateReleaseOverrides={onUpdateReleaseOverrides}
              availableReleases={releaseTitlesByArtist?.[split.artist]}
            />
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center border-dashed">
          <Percent size={32} className="mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Upload revenue data to configure split fees
          </p>
        </Card>
      )}
    </div>
  )
}
