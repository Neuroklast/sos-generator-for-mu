import { Card } from '@/components/ui/card'
import { ReportingPanel } from '@/components/ReportingPanel'
import type { ArtistRevenue, LabelArtist, LabelInfo, AppDefaults, EmailConfig } from '@/lib/types'

interface ReportsViewProps {
  revenues: ArtistRevenue[]
  onDownloadPDF: (artist?: string) => void
  onDownloadExcel: (artist?: string) => void
  onDownloadAll: () => void
  onDownloadSelected: (artists: string[]) => void
  labelArtists: LabelArtist[]
  labelInfo: LabelInfo
  appDefaults: AppDefaults
  emailConfig: EmailConfig
  periodStart: string
  periodEnd: string
}

export function ReportsView({
  revenues,
  onDownloadPDF,
  onDownloadExcel,
  onDownloadAll,
  onDownloadSelected,
  labelArtists,
  labelInfo,
  appDefaults,
  emailConfig,
  periodStart,
  periodEnd,
}: ReportsViewProps) {
  return (
    <Card className="border border-white/10 bg-card backdrop-blur-md rounded-2xl overflow-hidden">
      <ReportingPanel
        revenues={revenues}
        onDownloadPDF={onDownloadPDF}
        onDownloadExcel={onDownloadExcel}
        onDownloadAll={onDownloadAll}
        onDownloadSelected={onDownloadSelected}
        labelArtists={labelArtists}
        labelInfo={labelInfo}
        appDefaults={appDefaults}
        emailConfig={emailConfig}
        periodStart={periodStart}
        periodEnd={periodEnd}
      />
    </Card>
  )
}
