import { Card } from '@/components/ui/card'
import { LabelBranding } from '@/components/LabelBranding'
import type { LabelInfo } from '@/lib/types'

interface BrandingViewProps {
  labelInfo: LabelInfo
  onUpdate: (info: LabelInfo) => void
}

export function BrandingView({ labelInfo, onUpdate }: BrandingViewProps) {
  return (
    <Card className="border border-white/10 bg-card backdrop-blur-md rounded-2xl overflow-hidden">
      <LabelBranding labelInfo={labelInfo} onUpdate={onUpdate} />
    </Card>
  )
}
