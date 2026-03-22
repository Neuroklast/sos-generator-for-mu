import { Percent } from '@phosphor-icons/react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { SplitFee } from '@/lib/types'

interface SplitFeeManagerProps {
  splitFees: SplitFee[]
  onUpdateSplitFee: (artist: string, percentage: number) => void
}

export function SplitFeeManager({ splitFees, onUpdateSplitFee }: SplitFeeManagerProps) {
  const handlePercentageChange = (artist: string, value: string) => {
    const num = parseFloat(value)
    if (!isNaN(num) && num >= 0 && num <= 100) {
      onUpdateSplitFee(artist, num)
    } else if (value === '') {
      onUpdateSplitFee(artist, 0)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Percent size={20} weight="bold" className="text-primary" />
        <h3 className="font-semibold">Split Fees</h3>
      </div>

      {splitFees.length > 0 ? (
        <div className="space-y-3">
          {splitFees.map((split) => (
            <Card key={split.artist} className="p-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Label htmlFor={`split-${split.artist}`} className="text-sm font-medium">
                    {split.artist}
                  </Label>
                </div>
                
                <div className="flex items-center gap-2">
                  <Input
                    id={`split-${split.artist}`}
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={split.percentage}
                    onChange={(e) => handlePercentageChange(split.artist, e.target.value)}
                    className="w-24 text-right font-mono"
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
              </div>
            </Card>
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
