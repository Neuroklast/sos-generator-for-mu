import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui/card'
import { AnalyticsDashboard } from '@/features/analytics/components/AnalyticsDashboard'
import type { ArtistRevenue } from '@/lib/types'

interface AnalyticsViewProps {
  revenues: ArtistRevenue[]
}

export function AnalyticsView({ revenues }: AnalyticsViewProps) {
  // t is scaffolded here for future string translations in this view layer
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { t } = useTranslation()

  return (
    <Card className="border border-white/10 bg-card backdrop-blur-md rounded-2xl overflow-hidden">
      <AnalyticsDashboard revenues={revenues} />
    </Card>
  )
}
