import { motion } from 'framer-motion'
import { UploadCloud, TrendingUp, Users, Zap, CalendarDays } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatCard } from '@/components/StatCard'
import { RevenueDashboard } from '@/components/RevenueDashboard'
import type { ArtistRevenue, FilteredCompilation, SplitFee } from '@/lib/types'

interface StepItem {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string; size?: number }>
  step: number
}

interface FileManagerRef {
  files: { length: number }
}

interface DashboardViewProps {
  revenues: ArtistRevenue[]
  totalNetRevenue: number
  uniqueArtists: string[]
  splitFees: SplitFee[]
  topPlatform: string
  totalFiles: number
  believeManager: FileManagerRef
  bandcampManager: FileManagerRef
  isProcessing: boolean
  currentStep: number
  periodStart: string
  periodEnd: string
  filteredCompilations: FilteredCompilation[]
  navigate: (view: string) => void
  handleDownloadAll: () => void
  handleDownloadPDF: (artist?: string) => void
  handleDownloadExcel: (artist?: string) => void
  STEP_ITEMS: StepItem[]
}

export function DashboardView({
  revenues,
  totalNetRevenue,
  uniqueArtists,
  splitFees,
  topPlatform,
  totalFiles,
  believeManager,
  bandcampManager,
  isProcessing,
  currentStep,
  periodStart,
  periodEnd,
  filteredCompilations,
  navigate,
  handleDownloadAll,
  handleDownloadPDF,
  handleDownloadExcel,
  STEP_ITEMS,
}: DashboardViewProps) {
  return (
    <div className="space-y-8 md:space-y-10">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
        <StatCard
          label="Net Revenue"
          value={`€${totalNetRevenue.toFixed(2)}`}
          sub={`${revenues.length} artist${revenues.length !== 1 ? 's' : ''}`}
          icon={TrendingUp}
          gradient="from-primary to-violet-600"
          delay={0}
        />
        <StatCard
          label="Active Artists"
          value={String(uniqueArtists.length)}
          sub={`${splitFees.length} split rules`}
          icon={Users}
          gradient="from-violet-500 to-fuchsia-600"
          delay={0.06}
        />
        <StatCard
          label="Top Platform"
          value={topPlatform}
          sub="by gross revenue"
          icon={Zap}
          gradient="from-cyan-500 to-blue-600"
          delay={0.12}
        />
        <StatCard
          label="Files Loaded"
          value={String(totalFiles)}
          sub={`${believeManager.files.length} Believe · ${bandcampManager.files.length} Bandcamp`}
          icon={UploadCloud}
          gradient="from-emerald-500 to-teal-600"
          delay={0.18}
        />
      </div>

      {revenues.length === 0 && !isProcessing && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {STEP_ITEMS.map((step) => (
            <motion.button
              key={step.id}
              onClick={() => navigate(step.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`relative flex flex-col items-start gap-3 p-5 rounded-2xl border text-left transition-all duration-200 group
                ${currentStep > step.step ? 'border-emerald-500/30 bg-emerald-500/5' :
                  currentStep === step.step ? 'border-primary/40 bg-primary/5' :
                  'border-border/50 bg-card/50 hover:border-primary/25 hover:bg-primary/3'}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                ${currentStep > step.step ? 'bg-emerald-500 text-white' :
                  currentStep === step.step ? 'bg-primary text-primary-foreground' :
                  'bg-muted text-muted-foreground'}`}>
                {currentStep > step.step ? '✓' : step.step}
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground">Step {step.step}</p>
                <p className="text-sm font-bold">{step.label}</p>
              </div>
            </motion.button>
          ))}
        </div>
      )}

      {/* Period info banner */}
      {(periodStart || periodEnd) && revenues.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-card/50 border border-border/40 text-sm text-muted-foreground"
        >
          <CalendarDays size={14} className="text-primary shrink-0" />
          <span>Statement period: <span className="text-foreground font-medium">{periodStart || '—'}</span> → <span className="text-foreground font-medium">{periodEnd || '—'}</span></span>
        </motion.div>
      )}

      {revenues.length === 0 && !isProcessing && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-16 gap-4 rounded-2xl border border-dashed border-border/50 bg-card/30"
        >
          <div className="p-4 rounded-2xl bg-primary/10">
            <UploadCloud size={36} className="text-primary/70" />
          </div>
          <div className="text-center space-y-1.5">
            <p className="font-semibold text-foreground">No data loaded yet</p>
            <p className="text-sm text-muted-foreground">Upload your Believe or Bandcamp CSV files to get started</p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="border-primary/30 hover:border-primary/60 hover:bg-primary/10"
            onClick={() => navigate('ingest')}
          >
            <UploadCloud size={14} className="mr-1.5" />
            Go to Ingestion
          </Button>
        </motion.div>
      )}

      {revenues.length > 0 && (
        <Card className="border border-white/10 bg-card backdrop-blur-md rounded-2xl overflow-hidden">
          <RevenueDashboard
            revenues={revenues}
            filteredCompilations={filteredCompilations}
            onDownloadAll={handleDownloadAll}
            onDownloadPDF={handleDownloadPDF}
            onDownloadExcel={handleDownloadExcel}
          />
        </Card>
      )}
    </div>
  )
}
