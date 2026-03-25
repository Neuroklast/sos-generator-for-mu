import { Percent } from '@phosphor-icons/react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { useCallback, useRef, useState } from 'react'
import type { SplitFee } from '@/lib/types'

interface SplitFeeManagerProps {
  splitFees: SplitFee[]
  onUpdateSplitFee: (artist: string, percentage: number) => void
  onBulkUpdateSplitFee?: (artists: string[], percentage: number) => void
}

function SplitFeeRow({
  split,
  selected,
  onSelect,
  onUpdate,
}: {
  split: SplitFee
  selected: boolean
  onSelect: (e: React.MouseEvent) => void
  onUpdate: (artist: string, percentage: number) => void
}) {
  // Keep a local draft value while the user is typing
  const [draft, setDraft] = useState(String(split.percentage))
  const [error, setError] = useState('')

  const handleChange = (value: string) => {
    setDraft(value)
    setError('')
  }

  const handleBlur = useCallback(() => {
    const raw = draft.trim()
    if (raw === '') {
      setError('Required')
      return
    }
    const num = parseFloat(raw)
    if (isNaN(num)) {
      setError('Must be a number')
      return
    }
    if (num < 0 || num > 100) {
      setError('Must be between 0 and 100')
      return
    }
    const clamped = Math.round(num * 10) / 10 // Round to 1 decimal place for display consistency
    setDraft(String(clamped))
    setError('')
    onUpdate(split.artist, clamped)
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

        <div className="flex flex-col items-end gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
          <div className="flex items-center gap-2">
            <Input
              id={`split-${split.artist}`}
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={draft}
              onChange={e => handleChange(e.target.value)}
              onBlur={handleBlur}
              className={[
                'w-24 text-right font-mono',
                error ? 'border-destructive focus-visible:ring-destructive' : '',
              ].join(' ')}
            />
            <span className="text-sm text-muted-foreground w-4">%</span>
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
      </div>
    </Card>
  )
}

export function SplitFeeManager({ splitFees, onUpdateSplitFee, onBulkUpdateSplitFee }: SplitFeeManagerProps) {
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
    const raw = bulkDraft.trim()
    if (!raw) { setBulkError('Required'); return }
    const num = parseFloat(raw)
    if (isNaN(num)) { setBulkError('Must be a number'); return }
    if (num < 0 || num > 100) { setBulkError('Must be between 0 and 100'); return }
    const clamped = Math.round(num * 10) / 10
    const artists = Array.from(selectedArtists)
    if (onBulkUpdateSplitFee) {
      onBulkUpdateSplitFee(artists, clamped)
    } else {
      artists.forEach(a => onUpdateSplitFee(a, clamped))
    }
    setBulkDraft('')
    setBulkError('')
    clearSelection()
  }

  const selectedCount = selectedArtists.size

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
