import { Card } from '@/components/ui/card'
import { AnalyticsDashboard } from '@/features/analytics/components/AnalyticsDashboard'
import type { ArtistRevenue } from '@/lib/types'

interface AnalyticsViewProps {
  revenues: ArtistRevenue[]
}

export function AnalyticsView({ revenues }: AnalyticsViewProps) {
  return (
    <Card className="border border-white/10 bg-card backdrop-blur-md rounded-2xl overflow-hidden">
      <AnalyticsDashboard revenues={revenues} />
    </Card>
  )
}
