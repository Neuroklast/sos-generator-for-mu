import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, CalendarDays, Sparkles } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { UniversalFileUploadZone, type FileManagerCallbacks } from '@/components/UniversalFileUploadZone'
import { ManualRevenueManager } from '@/components/ManualRevenueManager'
import { ExpenseManager } from '@/components/ExpenseManager'
import { DetectedPeriodBanner } from '@/components/DetectedPeriodBanner'
import { ShopifyUploadCard, type ShopifyManager } from '@/components/ShopifyUploadCard'
import { toast } from 'sonner'
import type {
  UploadedFile,
  ManualRevenue,
  ExpenseEntry,
  CSVColumnAlias,
  LabelArtist,
} from '@/lib/types'

interface IngestViewProps {
  detectedPeriodStart: string
  detectedPeriodEnd: string
  periodStart: string
  periodEnd: string
  setPeriodStart: (val: string) => void
  setPeriodEnd: (val: string) => void
  believeManager: FileManagerCallbacks
  bandcampManager: FileManagerCallbacks
  shopifyManager: ShopifyManager
  exchangeRatesLoading: boolean
  handleAddAlias: (alias: Omit<CSVColumnAlias, 'id'>) => void
  isProcessing: boolean
  revenues: { totalRevenue: number }[]
  uniqueArtists: string[]
  totalFiles: number
  manualRevenues: ManualRevenue[]
  handleAddManualRevenue: (revenue: Omit<ManualRevenue, 'id'>) => void
  handleRemoveManualRevenue: (id: string) => void
  expenses: ExpenseEntry[]
  handleAddExpense: (expense: Omit<ExpenseEntry, 'id'>) => void
  handleRemoveExpense: (id: string) => void
  /** Imports artist master data when an artist CSV is dropped into the upload zone. */
  onImportLabelArtistsCSV: (artists: Omit<LabelArtist, 'id'>[]) => void
}

export function IngestView({
  detectedPeriodStart,
  detectedPeriodEnd,
  periodStart,
  periodEnd,
  setPeriodStart,
  setPeriodEnd,
  believeManager,
  bandcampManager,
  shopifyManager,
  exchangeRatesLoading,
  handleAddAlias,
  isProcessing,
  revenues,
  uniqueArtists,
  totalFiles,
  manualRevenues,
  handleAddManualRevenue,
  handleRemoveManualRevenue,
  expenses,
  handleAddExpense,
  handleRemoveExpense,
  onImportLabelArtistsCSV,
}: IngestViewProps) {
  return (
    <div className="space-y-8">
      {/* Detected period banner */}
      <AnimatePresence>
        <DetectedPeriodBanner
          detectedStart={detectedPeriodStart}
          detectedEnd={detectedPeriodEnd}
          currentStart={periodStart}
          currentEnd={periodEnd}
          onApply={() => {
            setPeriodStart(detectedPeriodStart)
            setPeriodEnd(detectedPeriodEnd)
            toast.success('Period applied from CSV data')
          }}
        />
      </AnimatePresence>

      {/* ── Step 1: Upload CSV files ── */}
      <div>
        <div className="flex items-center gap-2.5 mb-4">
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary text-primary-foreground text-sm font-bold shrink-0">1</span>
          <h2 className="text-base font-semibold">Upload CSV Files</h2>
        </div>

        <Card className="p-8 border border-white/10 bg-card backdrop-blur-md rounded-2xl relative">
          {exchangeRatesLoading && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-2xl bg-card/90 backdrop-blur-sm">
              <Loader2 size={28} className="text-primary animate-spin" />
              <p className="text-sm font-medium text-muted-foreground">Lade aktuelle Wechselkurse (EZB)…</p>
              <p className="text-xs text-muted-foreground/60">Datei-Upload ist verfügbar, sobald die Kurse geladen sind.</p>
            </div>
          )}
          <UniversalFileUploadZone
            believeManager={believeManager}
            bandcampManager={bandcampManager}
            onAddAliases={aliases => aliases.forEach(handleAddAlias)}
            onImportLabelArtistsCSV={onImportLabelArtistsCSV}
          />
        </Card>

        {/* ── Shopify Merch Upload ── */}
        <ShopifyUploadCard shopifyManager={shopifyManager} />

        {/* Summary stats after processing */}
        {!isProcessing && revenues.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4"
          >
            {[
              {
                label: 'Total Rows',
                value: (
                  [...believeManager.files, ...bandcampManager.files, ...shopifyManager.files]
                    .reduce((s, f) => s + ((f as UploadedFile).rowsParsed ?? 0), 0)
                ).toLocaleString(),
              },
              {
                label: 'Unique Artists',
                value: uniqueArtists.length.toLocaleString(),
              },
              {
                label: 'Files Loaded',
                value: totalFiles.toString(),
              },
              {
                label: 'Total Revenue',
                value: revenues
                  .reduce((s, r) => s + r.totalRevenue, 0)
                  .toLocaleString('de-DE', { style: 'currency', currency: 'EUR' }),
              },
            ].map(stat => (
              <div key={stat.label} className="p-4 rounded-xl bg-card border border-white/10 text-center">
                <p className="text-xl font-bold font-mono tabular-nums">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        )}
      </div>

      {/* ── Step 2: Configure Statement Period ── */}
      <div>
        <div className="flex items-center gap-2.5 mb-4">
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary text-primary-foreground text-sm font-bold shrink-0">2</span>
          <h2 className="text-base font-semibold">Configure Statement Period</h2>
        </div>

        <Card className="p-8 border border-white/10 bg-card backdrop-blur-md rounded-2xl">
          <p className="text-xs text-muted-foreground mb-4">
            Define the reporting period for PDF and Excel statements. Automatically detected from your CSV data.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="period-start" className="text-xs font-medium flex items-center gap-1.5">
                <CalendarDays size={12} className="text-muted-foreground" />
                Period Start
              </Label>
              <Input
                id="period-start"
                type="text"
                placeholder="YYYY-MM"
                value={periodStart}
                onChange={e => setPeriodStart(e.target.value)}
                className="border border-border/60 bg-background/50 focus:border-primary/60 h-10"
              />
            </div>
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="period-end" className="text-xs font-medium flex items-center gap-1.5">
                <CalendarDays size={12} className="text-muted-foreground" />
                Period End
              </Label>
              <Input
                id="period-end"
                type="text"
                placeholder="YYYY-MM"
                value={periodEnd}
                onChange={e => setPeriodEnd(e.target.value)}
                className="border border-border/60 bg-background/50 focus:border-primary/60 h-10"
              />
            </div>
          </div>
          {detectedPeriodStart && detectedPeriodEnd && (
            <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1.5">
              <Sparkles size={11} className="text-amber-400" />
              Detected range from CSV: <span className="font-mono text-foreground/70">{detectedPeriodStart}</span> → <span className="font-mono text-foreground/70">{detectedPeriodEnd}</span>
            </p>
          )}
        </Card>
      </div>

      {/* ── Step 3: Manual Revenue Entries ── */}
      <div>
        <div className="flex items-center gap-2.5 mb-4">
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary text-primary-foreground text-sm font-bold shrink-0">3</span>
          <h2 className="text-base font-semibold">Manual Entries <span className="text-muted-foreground font-normal">(Darkmerch / Sync)</span></h2>
        </div>

        <Card className="p-8 border border-white/10 bg-card backdrop-blur-md rounded-2xl">
          <ManualRevenueManager
            revenues={manualRevenues}
            artists={uniqueArtists}
            onAddRevenue={handleAddManualRevenue}
            onRemoveRevenue={handleRemoveManualRevenue}
          />
        </Card>
      </div>

      {/* ── Step 4: Recoupable Expenses ── */}
      <div>
        <div className="flex items-center gap-2.5 mb-4">
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-destructive text-destructive-foreground text-sm font-bold shrink-0">4</span>
          <h2 className="text-base font-semibold">Recoupable Expenses <span className="text-muted-foreground font-normal">(Kosten & Vorschüsse)</span></h2>
        </div>

        <Card className="p-8 border border-white/10 bg-card backdrop-blur-md rounded-2xl">
          <ExpenseManager
            expenses={expenses}
            artists={uniqueArtists}
            onAddExpense={handleAddExpense}
            onRemoveExpense={handleRemoveExpense}
          />
        </Card>
      </div>
    </div>
  )
}
