import { Card } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ReportingPanel } from '@/features/export/components/ReportingPanel'
import { PayoutManager } from '@/features/export/components/PayoutManager'
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
    <Tabs defaultValue="berichte" className="flex flex-col h-full gap-4">
      <TabsList className="grid grid-cols-2 w-full max-w-sm shrink-0">
        <TabsTrigger value="berichte">Berichte</TabsTrigger>
        <TabsTrigger value="auszahlungen">Auszahlungen</TabsTrigger>
      </TabsList>

      <TabsContent value="berichte" className="flex-1 mt-0">
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
      </TabsContent>

      <TabsContent value="auszahlungen" className="flex-1 mt-0">
        <Card className="border border-white/10 bg-card backdrop-blur-md rounded-2xl overflow-hidden">
          <PayoutManager
            revenues={revenues}
            labelArtists={labelArtists}
            labelInfo={labelInfo}
            periodStart={periodStart}
            periodEnd={periodEnd}
          />
        </Card>
      </TabsContent>
    </Tabs>
  )
}
