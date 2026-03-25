import { useMemo } from 'react'
import {
  DownloadSimple,
  FilePdf,
  FileXls,
  ChartBar,
  Trophy,
} from '@phosphor-icons/react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import type { ArtistRevenue } from '@/lib/types'

/** Number of artists shown in the top-N list on the summary card. */
const TOP_ARTISTS_LIMIT = 5

// ── Formatting helpers ─────────────────────────────────────────────────────────

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value)
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('de-DE').format(value)
}

// ── Props ──────────────────────────────────────────────────────────────────────

interface RevenueSummaryCardProps {
  revenues: ArtistRevenue[]
  onDownloadAll: () => void
  onDownloadPDF: (artist: string) => void
  onDownloadExcel: (artist: string) => void
}

/**
 * Lightweight read-only revenue overview for the Dashboard view.
 *
 * Renders three aggregate KPI cards (total payout, artist count, total
 * streams/units) and a non-expandable top-5 artist list with individual
 * PDF/Excel download buttons. It intentionally omits the sortable, filterable,
 * drill-down table that lives exclusively in the Process Cockpit, keeping the
 * Dashboard as a monitoring/KPI page rather than a second data workbench.
 *
 * @param revenues        - Processed artist revenue records to summarise.
 * @param onDownloadAll   - Callback invoked when the user clicks "Download All
 *                          as ZIP". Triggers generation of all artist statements.
 * @param onDownloadPDF   - Callback invoked with an artist name when the user
 *                          requests a PDF statement for that artist.
 * @param onDownloadExcel - Callback invoked with an artist name when the user
 *                          requests an Excel spreadsheet for that artist.
 */
export function RevenueSummaryCard({
  revenues,
  onDownloadAll,
  onDownloadPDF,
  onDownloadExcel,
}: RevenueSummaryCardProps) {
  const totalRevenue = useMemo(
    () => revenues.reduce((sum, r) => sum + r.finalAmount, 0),
    [revenues]
  )

  const totalQuantity = useMemo(
    () => revenues.reduce((sum, r) => sum + (r.totalQuantity ?? 0), 0),
    [revenues]
  )

  const topArtists = useMemo(
    () => [...revenues].sort((a, b) => b.finalAmount - a.finalAmount).slice(0, TOP_ARTISTS_LIMIT),
    [revenues]
  )

  const handleDownloadAll = () => {
    toast.success('Generating all statements…', { description: 'Your ZIP will download shortly' })
    onDownloadAll()
  }

  // ── Empty state ───────────────────────────────────────────────────────────

  if (revenues.length === 0) {
    return (
      <div className="space-y-6 p-6 md:p-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-primary to-accent rounded-lg">
            <ChartBar size={28} weight="duotone" className="text-primary-foreground" />
          </div>
          <h2 className="text-2xl font-bold font-['Space_Grotesk']">Revenue Overview</h2>
        </div>
        <Card className="p-12 text-center border-dashed">
          <ChartBar size={48} className="mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No Revenue Data Yet</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Upload CSV files and configure your settings to generate artist revenue statements
          </p>
        </Card>
      </div>
    )
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 p-6 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-primary to-accent rounded-lg">
            <ChartBar size={28} weight="duotone" className="text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-2xl font-bold font-['Space_Grotesk']">Revenue Overview</h2>
            <p className="text-sm text-muted-foreground">Summary · use the Cockpit for detailed analysis</p>
          </div>
        </div>

        <Button
          onClick={handleDownloadAll}
          size="lg"
          className="gap-2 bg-accent hover:bg-accent/90 shadow-lg shadow-accent/20"
        >
          <DownloadSimple size={20} weight="bold" />
          Download All as ZIP
        </Button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
        <Card className="p-6 bg-gradient-to-br from-primary/5 to-accent/5 border-2">
          <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-1">
            Total Payout
          </p>
          <p className="text-3xl font-bold font-mono bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            {formatCurrency(totalRevenue)}
          </p>
        </Card>
        <Card className="p-6 border-2">
          <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-1">
            Artists
          </p>
          <p className="text-3xl font-bold font-mono text-foreground">{revenues.length}</p>
        </Card>
        <Card className="p-6 border-2">
          <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-1">
            Total Streams / Units
          </p>
          <p className="text-3xl font-bold font-mono text-foreground">
            {formatNumber(totalQuantity)}
          </p>
        </Card>
      </div>

      {/* Top N artists — simple, non-expandable list */}
      <Card className="overflow-hidden border-2">
        <div className="flex items-center gap-2 p-4 border-b bg-muted/30">
          <Trophy size={18} className="text-accent" weight="duotone" />
          <h3 className="font-semibold text-sm">
            Top {topArtists.length} Artist{topArtists.length !== 1 ? 's' : ''} by Payout
          </h3>
        </div>
        <ul className="divide-y divide-border/50">
          {topArtists.map((revenue, index) => (
            <li
              key={revenue.artist}
              className="flex items-center justify-between px-4 py-3 hover:bg-muted/20 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                  {index + 1}
                </span>
                <span className="font-semibold text-sm">{revenue.artist}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono font-bold text-accent text-sm">
                  {formatCurrency(revenue.finalAmount)}
                </span>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 hover:bg-destructive/10 hover:text-destructive"
                    title={`Download PDF for ${revenue.artist}`}
                    onClick={() => {
                      toast.success(`Generating PDF for "${revenue.artist}"…`)
                      onDownloadPDF(revenue.artist)
                    }}
                  >
                    <FilePdf size={15} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 hover:bg-green-600/10 hover:text-green-600"
                    title={`Download Excel for ${revenue.artist}`}
                    onClick={() => {
                      toast.success(`Generating Excel for "${revenue.artist}"…`)
                      onDownloadExcel(revenue.artist)
                    }}
                  >
                    <FileXls size={15} />
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
        {revenues.length > TOP_ARTISTS_LIMIT && (
          <p className="text-xs text-muted-foreground text-center py-3 border-t">
            +{revenues.length - TOP_ARTISTS_LIMIT} more artist{revenues.length - TOP_ARTISTS_LIMIT !== 1 ? 's' : ''} · open the Cockpit for the full list
          </p>
        )}
      </Card>
    </div>
  )
}
