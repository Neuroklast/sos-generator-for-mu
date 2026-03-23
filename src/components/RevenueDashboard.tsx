import { useState } from 'react'
import {
  DownloadSimple,
  FilePdf,
  FileXls,
  ChartBar,
  CaretDown,
  CaretRight,
  MusicNote,
  Globe,
  Storefront,
  CalendarBlank,
  FunnelSimple,
} from '@phosphor-icons/react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import type { ArtistRevenue, FilteredCompilation } from '@/lib/types'

interface RevenueDashboardProps {
  revenues: ArtistRevenue[]
  filteredCompilations: FilteredCompilation[]
  onDownloadAll: () => void
  onDownloadPDF: (artist: string) => void
  onDownloadExcel: (artist: string) => void
}

// ── Constants ──────────────────────────────────────────────────────────────────

/** Maximum rows shown per breakdown table in the artist detail panel. */
const MAX_BREAKDOWN_ROWS = 8

// ── Formatting helpers ─────────────────────────────────────────────────────────

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value)
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('de-DE').format(value)
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function SectionHeader({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
      {icon}
      {label}
    </div>
  )
}

function MiniTable({
  rows,
  labelKey,
  label,
}: {
  rows: { label: string; revenue: number; quantity?: number }[]
  labelKey?: string
  label: string
}) {
  return (
    <div className="rounded border overflow-hidden text-xs">
      <table className="w-full">
        <thead className="bg-muted/40">
          <tr>
            <th className="text-left px-3 py-1.5 font-medium text-muted-foreground">{label}</th>
            <th className="text-right px-3 py-1.5 font-medium text-muted-foreground">Revenue</th>
            {rows[0]?.quantity !== undefined && (
              <th className="text-right px-3 py-1.5 font-medium text-muted-foreground">Qty</th>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, MAX_BREAKDOWN_ROWS).map((row, i) => (
            <tr key={i} className="border-t border-border/50 hover:bg-muted/20">
              <td className="px-3 py-1.5 font-mono truncate max-w-[180px]" title={row.label}>
                {row.label || '—'}
              </td>
              <td className="px-3 py-1.5 text-right font-mono text-primary">
                {formatCurrency(row.revenue)}
              </td>
              {row.quantity !== undefined && (
                <td className="px-3 py-1.5 text-right font-mono text-muted-foreground">
                  {formatNumber(row.quantity)}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ArtistDetailPanel({ revenue }: { revenue: ArtistRevenue }) {
  const platforms = revenue.platformBreakdown.map(p => ({
    label: p.platform,
    revenue: p.revenue,
    quantity: p.quantity,
  }))
  const countries = revenue.countryBreakdown.slice(0, MAX_BREAKDOWN_ROWS).map(c => ({
    label: c.country,
    revenue: c.revenue,
    quantity: c.quantity,
  }))
  const months = revenue.monthlyBreakdown.map(m => ({
    label: m.month,
    revenue: m.revenue,
  }))
  const releases = revenue.releaseBreakdown.map(r => ({
    label: r.releaseTitle,
    revenue: r.revenue,
    quantity: r.quantity,
  }))

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 pt-0 bg-muted/20 border-t">
      {platforms.length > 0 && (
        <div>
          <SectionHeader icon={<Storefront size={14} />} label="By Platform" />
          <MiniTable rows={platforms} label="Platform" />
        </div>
      )}
      {countries.length > 0 && (
        <div>
          <SectionHeader icon={<Globe size={14} />} label="By Country (Top 8)" />
          <MiniTable rows={countries} label="Country" />
        </div>
      )}
      {months.length > 0 && (
        <div>
          <SectionHeader icon={<CalendarBlank size={14} />} label="Monthly Trend" />
          <MiniTable rows={months} label="Month" />
        </div>
      )}
      {releases.length > 0 && (
        <div>
          <SectionHeader icon={<MusicNote size={14} />} label="By Release" />
          <MiniTable rows={releases} label="Release" />
        </div>
      )}
    </div>
  )
}

function CompilationsPanel({ compilations }: { compilations: FilteredCompilation[] }) {
  if (compilations.length === 0) return null

  const typeLabel: Record<string, string> = {
    ean: 'EAN/UPC',
    title: 'Title',
    catalog: 'Catalog',
  }

  return (
    <Card className="border-2 border-accent/20 bg-accent/5 overflow-hidden">
      <div className="p-4 border-b border-accent/20 flex items-center gap-2">
        <FunnelSimple size={18} className="text-accent" weight="bold" />
        <h3 className="font-semibold text-sm">Filtered Compilations</h3>
        <Badge variant="secondary" className="ml-auto">
          {compilations.length}
        </Badge>
      </div>
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30">
            <TableHead className="font-semibold text-xs">Release</TableHead>
            <TableHead className="font-semibold text-xs">Identifier</TableHead>
            <TableHead className="font-semibold text-xs">Type</TableHead>
            <TableHead className="text-right font-mono font-semibold text-xs">Revenue</TableHead>
            <TableHead className="text-right font-semibold text-xs">Rows</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {compilations.map((c, i) => (
            <TableRow key={i} className="text-sm">
              <TableCell className="font-medium truncate max-w-[200px]" title={c.releaseTitle}>
                {c.releaseTitle}
              </TableCell>
              <TableCell className="font-mono text-xs text-muted-foreground">{c.identifier}</TableCell>
              <TableCell>
                <Badge variant="outline" className="text-xs">
                  {typeLabel[c.filterType] ?? c.filterType}
                </Badge>
              </TableCell>
              <TableCell className="text-right font-mono text-accent font-semibold">
                {formatCurrency(c.revenue)}
              </TableCell>
              <TableCell className="text-right text-muted-foreground font-mono">
                {formatNumber(c.transactionCount)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export function RevenueDashboard({
  revenues,
  filteredCompilations,
  onDownloadAll,
  onDownloadPDF,
  onDownloadExcel,
}: RevenueDashboardProps) {
  const [expandedArtist, setExpandedArtist] = useState<string | null>(null)

  const totalRevenue = revenues.reduce((sum, r) => sum + r.finalAmount, 0)
  const totalQuantity = revenues.reduce((sum, r) => sum + (r.totalQuantity ?? 0), 0)

  const handleDownload = (type: 'pdf' | 'excel' | 'all', artist?: string) => {
    if (type === 'all') {
      toast.success('Generating all statements…', { description: 'Your ZIP will download shortly' })
      onDownloadAll()
    } else if (artist) {
      const fmt = type === 'pdf' ? 'PDF' : 'Excel'
      toast.success(`Generating ${fmt} for "${artist}"…`)
      type === 'pdf' ? onDownloadPDF(artist) : onDownloadExcel(artist)
    }
  }

  const toggleExpand = (artist: string) => {
    setExpandedArtist(prev => (prev === artist ? null : artist))
  }

  return (
    <div className="space-y-6 p-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-primary to-accent rounded-lg">
            <ChartBar size={28} weight="duotone" className="text-primary-foreground" />
          </div>
          <h2 className="text-3xl font-bold font-['Space_Grotesk']">Revenue Dashboard</h2>
        </div>

        {revenues.length > 0 && (
          <Button
            onClick={() => handleDownload('all')}
            size="lg"
            className="gap-2 bg-accent hover:bg-accent/90 shadow-lg shadow-accent/20"
          >
            <DownloadSimple size={20} weight="bold" />
            Download All as ZIP
          </Button>
        )}
      </div>

      {revenues.length > 0 ? (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

          {/* Compilations panel */}
          <CompilationsPanel compilations={filteredCompilations} />

          {/* Artist table */}
          <Card className="overflow-hidden border-2">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-8" />
                  <TableHead className="font-semibold">Artist</TableHead>
                  <TableHead className="text-right font-mono font-semibold">Believe</TableHead>
                  <TableHead className="text-right font-mono font-semibold">Bandcamp</TableHead>
                  <TableHead className="text-right font-mono font-semibold">Manual</TableHead>
                  <TableHead className="text-right font-mono font-semibold">Qty</TableHead>
                  <TableHead className="text-right font-mono font-semibold">Split %</TableHead>
                  <TableHead className="text-right font-mono font-semibold">Final</TableHead>
                  <TableHead className="text-right font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {revenues.map((revenue, index) => {
                  const isExpanded = expandedArtist === revenue.artist
                  const hasDetail =
                    revenue.platformBreakdown.length > 0 ||
                    revenue.countryBreakdown.length > 0 ||
                    revenue.monthlyBreakdown.length > 0 ||
                    revenue.releaseBreakdown.length > 0

                  return (
                    <>
                      <motion.tr
                        key={revenue.artist}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.04 }}
                        className={[
                          'group border-b transition-colors cursor-pointer',
                          isExpanded ? 'bg-primary/5' : 'hover:bg-primary/5',
                        ].join(' ')}
                        onClick={() => hasDetail && toggleExpand(revenue.artist)}
                      >
                        <TableCell className="w-8 pl-3">
                          {hasDetail ? (
                            isExpanded ? (
                              <CaretDown size={14} className="text-primary" />
                            ) : (
                              <CaretRight size={14} className="text-muted-foreground group-hover:text-primary transition-colors" />
                            )
                          ) : null}
                        </TableCell>
                        <TableCell className="font-semibold text-base">{revenue.artist}</TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {formatCurrency(revenue.believeRevenue)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {formatCurrency(revenue.bandcampRevenue)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {formatCurrency(revenue.manualRevenue)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm text-muted-foreground">
                          {formatNumber(revenue.totalQuantity ?? 0)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm text-primary font-semibold">
                          {revenue.splitPercentage}%
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold text-lg text-accent">
                          {formatCurrency(revenue.finalAmount)}
                        </TableCell>
                        <TableCell className="text-right" onClick={e => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="gap-2 hover:bg-primary hover:text-primary-foreground"
                              >
                                <DownloadSimple size={16} />
                                Download
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem
                                onClick={() => handleDownload('pdf', revenue.artist)}
                                className="cursor-pointer"
                              >
                                <FilePdf size={16} className="mr-2 text-destructive" />
                                PDF Statement
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDownload('excel', revenue.artist)}
                                className="cursor-pointer"
                              >
                                <FileXls size={16} className="mr-2 text-green-600" />
                                Excel Spreadsheet
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </motion.tr>

                      <AnimatePresence>
                        {isExpanded && hasDetail && (
                          <tr key={`${revenue.artist}-detail`}>
                            <td colSpan={9} className="p-0">
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2 }}
                              >
                                <ArtistDetailPanel revenue={revenue} />
                              </motion.div>
                            </td>
                          </tr>
                        )}
                      </AnimatePresence>
                    </>
                  )
                })}
              </TableBody>
            </Table>
          </Card>
        </>
      ) : (
        <Card className="p-12 text-center border-dashed">
          <ChartBar size={48} className="mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No Revenue Data Yet</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Upload CSV files and configure your settings to generate artist revenue statements
          </p>
        </Card>
      )}
    </div>
  )
}
