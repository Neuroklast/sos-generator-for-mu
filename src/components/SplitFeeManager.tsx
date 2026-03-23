import { Percent } from '@phosphor-icons/react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCallback, useState } from 'react'
import type { SplitFee } from '@/lib/types'

interface SplitFeeManagerProps {
  splitFees: SplitFee[]
  onUpdateSplitFee: (artist: string, percentage: number) => void
}

function SplitFeeRow({
  split,
  onUpdate,
}: {
  split: SplitFee
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
    <Card className="p-4">
      <div className="flex items-start gap-4">
        <div className="flex-1 min-w-0 pt-1">
          <Label htmlFor={`split-${split.artist}`} className="text-sm font-medium truncate block">
            {split.artist}
          </Label>
        </div>

        <div className="flex flex-col items-end gap-1 flex-shrink-0">
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

export function SplitFeeManager({ splitFees, onUpdateSplitFee }: SplitFeeManagerProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Percent size={20} weight="bold" className="text-primary" />
        <h3 className="font-semibold">Split Fees</h3>
      </div>

      {splitFees.length > 0 ? (
        <div className="space-y-3">
          {splitFees.map(split => (
            <SplitFeeRow key={split.artist} split={split} onUpdate={onUpdateSplitFee} />
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
