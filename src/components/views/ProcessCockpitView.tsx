import { Fragment } from 'react'
import { motion } from 'framer-motion'
import {
  UploadCloud,
  Settings,
  Users,
  Download,
  TrendingUp,
  Zap,
  CalendarDays,
  Search,
  Copy,
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  FileText,
  Sparkles,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { StatCard } from '@/features/core/components/StatCard'
import { CompilationFilterManager } from '@/features/rules/components/CompilationFilterManager'
import { ArtistMappingManager } from '@/features/rules/components/ArtistMappingManager'
import { ManualRevenueManager } from '@/features/rules/components/ManualRevenueManager'
import { ExpenseManager } from '@/features/rules/components/ExpenseManager'
import { toast } from 'sonner'
import { fmtEur, fmtPct, totalDeductions } from '@/lib/formatters'
import type {
  ArtistRevenue,
  CompilationFilter,
  ArtistMapping,
  ManualRevenue,
  ExpenseEntry,
  GuestPayoutRule,
  ArtistCollabNode,
} from '@/lib/types'

export type MasterSortField = 'artist' | 'totalQuantity' | 'totalRevenue' | 'finalAmount'
export type MasterSortDir = 'asc' | 'desc'

interface ProcessCockpitViewProps {
  revenues: ArtistRevenue[]
  totalFiles: number
  uniqueArtists: string[]
  compilationFilters: CompilationFilter[]
  handleAddCompilationFilter: (filter: Omit<CompilationFilter, 'id'>) => void
  handleRemoveCompilationFilter: (id: string) => void
  excludePhysical: boolean
  setExcludePhysical: (checked: boolean) => void
  masterSearch: string
  setMasterSearch: (q: string) => void
  masterTableRevenues: ArtistRevenue[]
  toggleMasterSort: (field: MasterSortField) => void
  masterSortField: MasterSortField
  masterSortDir: MasterSortDir
  expandedArtists: Set<string>
  toggleArtistExpanded: (artist: string) => void
  collabTree: ArtistCollabNode[]
  guestPayoutRules: GuestPayoutRule[]
  handleUpdateGuestPayout: (primaryArtist: string, guestName: string, percentage: number) => void
  handleUpdateSplitFee: (artist: string, percentage: number) => void
  handleDownloadPDF: (artist?: string) => void
  handleDownloadExcel: (artist?: string) => void
  artistMappings: ArtistMapping[]
  handleAddArtistMapping: (mapping: Omit<ArtistMapping, 'id'>) => void
  handleRemoveArtistMapping: (id: string) => void
  handleUpdateArtistMapping: (id: string, update: Omit<ArtistMapping, 'id'>) => void
  autoMappings: ArtistMapping[]
  manualRevenues: ManualRevenue[]
  handleAddManualRevenue: (revenue: Omit<ManualRevenue, 'id'>) => void
  handleRemoveManualRevenue: (id: string) => void
  expenses: ExpenseEntry[]
  handleAddExpense: (expense: Omit<ExpenseEntry, 'id'>) => void
  handleRemoveExpense: (id: string) => void
  periodStart: string
  periodEnd: string
  setPeriodStart: (val: string) => void
  setPeriodEnd: (val: string) => void
  detectedPeriodStart: string
  detectedPeriodEnd: string
  isProcessing: boolean
  navigate: (view: string) => void
}

export function ProcessCockpitView({
  revenues,
  totalFiles,
  uniqueArtists,
  compilationFilters,
  handleAddCompilationFilter,
  handleRemoveCompilationFilter,
  excludePhysical,
  setExcludePhysical,
  masterSearch,
  setMasterSearch,
  masterTableRevenues,
  toggleMasterSort,
  masterSortField,
  masterSortDir,
  expandedArtists,
  toggleArtistExpanded,
  collabTree,
  guestPayoutRules,
  handleUpdateGuestPayout,
  handleUpdateSplitFee,
  handleDownloadPDF,
  handleDownloadExcel,
  artistMappings,
  handleAddArtistMapping,
  handleRemoveArtistMapping,
  handleUpdateArtistMapping,
  autoMappings,
  manualRevenues,
  handleAddManualRevenue,
  handleRemoveManualRevenue,
  expenses,
  handleAddExpense,
  handleRemoveExpense,
  periodStart,
  periodEnd,
  setPeriodStart,
  setPeriodEnd,
  detectedPeriodStart,
  detectedPeriodEnd,
  isProcessing,
  navigate,
}: ProcessCockpitViewProps) {
  return (
    <div className="flex flex-col min-h-full -mx-6 md:-mx-8 lg:-mx-12 -my-8 md:-my-10">
      {/* Title */}
      <div className="px-8 lg:px-12 pt-8 pb-6 border-b border-white/10">
        <h2 className="text-2xl font-bold font-['Space_Grotesk']">Process Cockpit</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Configure rules, review finances, and generate statements.
        </p>
      </div>

      {/* 12-column dashboard grid */}
      <div className="flex-1 grid grid-cols-12 gap-8 lg:gap-10 p-8 lg:p-12 pb-6">

        {/* ─ Card 1: Workspace Status — 8 columns ─ */}
        <Card className="col-span-12 lg:col-span-8 p-8 border border-white/10 bg-card backdrop-blur-md rounded-2xl flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 shrink-0 shadow-lg shadow-emerald-500/25">
              <UploadCloud size={20} className="text-white" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-lg font-['Space_Grotesk'] leading-tight">Workspace Status</h3>
              <p className="text-xs text-muted-foreground">Overview of loaded data</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              label="Files Loaded"
              value={String(totalFiles)}
              icon={FileText}
              gradient="from-sky-500 to-blue-600"
              delay={0}
            />
            <StatCard
              label="Unique Artists"
              value={String(uniqueArtists.length)}
              icon={Users}
              gradient="from-violet-500 to-purple-600"
              delay={0.05}
            />
            <StatCard
              label="Total Payout"
              value={new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(
                revenues.reduce((sum, r) => sum + r.finalAmount, 0)
              )}
              icon={TrendingUp}
              gradient="from-emerald-500 to-teal-500"
              delay={0.1}
            />
          </div>

          <div className="mt-auto pt-2">
            <Button
              onClick={() => navigate('ingest')}
              className="w-full gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <UploadCloud size={16} />
              Start New Data Import
            </Button>
          </div>
        </Card>

        {/* ─ Card 2: Compilations & Rules — 4 columns ─ */}
        <Card className="col-span-12 lg:col-span-4 p-8 border border-white/10 bg-card backdrop-blur-md rounded-2xl flex flex-col gap-6 overflow-hidden">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shrink-0 shadow-lg shadow-violet-500/25">
              <Settings size={20} className="text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg font-['Space_Grotesk'] leading-tight">Compilations & Rules</h3>
              <p className="text-xs text-muted-foreground">Exclude compilations and label exceptions</p>
            </div>
          </div>
          <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-muted/20 border border-border/40">
            <div>
              <p className="text-sm font-medium">Exclude Physical Products</p>
              <p className="text-xs text-muted-foreground">Skip CD, Vinyl, Cassette from revenue</p>
            </div>
            <Switch
              checked={excludePhysical}
              onCheckedChange={checked => setExcludePhysical(checked)}
            />
          </div>
          <div className="flex-1 overflow-y-auto min-h-0">
            <CompilationFilterManager
              filters={compilationFilters}
              onAddFilter={handleAddCompilationFilter}
              onRemoveFilter={handleRemoveCompilationFilter}
            />
          </div>
        </Card>

        {/* ─ Card 3: Finance Master Table — 12 columns ─ */}
        <Card className="col-span-12 p-0 border border-white/10 bg-card backdrop-blur-md rounded-2xl flex flex-col overflow-hidden">
          {/* Card Header */}
          <div className="flex items-center gap-3 p-8 pb-6">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary to-accent shrink-0 shadow-lg shadow-primary/25">
              <Users size={20} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-lg font-['Space_Grotesk'] leading-tight">Finance Master Table</h3>
              <p className="text-xs text-muted-foreground">Aggregated revenue per artist · click a row to expand</p>
            </div>
            {revenues.length > 0 && (
              <div className="text-right shrink-0">
                <p className="text-xs text-muted-foreground">Total Payout</p>
                <p className="font-mono font-bold text-primary tabular-nums">
                  {revenues.reduce((s, r) => s + r.finalAmount, 0).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                </p>
              </div>
            )}
          </div>

          {/* Expandable Data Grid */}
          {revenues.length === 0 ? (
            <div className="px-8 pb-8">
              <div className="flex flex-col items-center justify-center py-12 rounded-xl border border-dashed border-border/40 bg-muted/10">
                <Users size={28} className="text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground">No revenue data yet</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Upload CSV files to see artist breakdowns</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              {/* Search bar */}
              <div className="px-6 pb-4">
                <div className="relative max-w-xs">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search artists…"
                    value={masterSearch}
                    onChange={e => setMasterSearch(e.target.value)}
                    className="pl-8 h-9 text-sm border-border/60 bg-background/50 focus:border-primary/60"
                  />
                </div>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-y border-white/10 bg-white/[0.02]">
                    <th className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground w-8"></th>
                    <th
                      className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors"
                      onClick={() => toggleMasterSort('artist')}
                    >
                      <span className="inline-flex items-center gap-1">
                        Artist
                        {masterSortField === 'artist' ? (masterSortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />) : <ArrowUpDown size={12} className="opacity-40" />}
                      </span>
                    </th>
                    <th
                      className="py-3 px-4 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors"
                      onClick={() => toggleMasterSort('totalQuantity')}
                    >
                      <span className="inline-flex items-center justify-end gap-1">
                        Units
                        {masterSortField === 'totalQuantity' ? (masterSortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />) : <ArrowUpDown size={12} className="opacity-40" />}
                      </span>
                    </th>
                    <th className="py-3 px-4 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Solo Revenue</th>
                    <th className="py-3 px-4 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Collab Revenue</th>
                    <th
                      className="py-3 px-4 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors"
                      onClick={() => toggleMasterSort('totalRevenue')}
                    >
                      <span className="inline-flex items-center justify-end gap-1">
                        Total Revenue
                        {masterSortField === 'totalRevenue' ? (masterSortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />) : <ArrowUpDown size={12} className="opacity-40" />}
                      </span>
                    </th>
                    <th className="py-3 px-4 text-right text-xs font-semibold uppercase tracking-wider text-rose-400/70">Deductions</th>
                    <th className="py-3 px-4 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Split Rate</th>
                    <th
                      className="py-3 px-4 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors"
                      onClick={() => toggleMasterSort('finalAmount')}
                    >
                      <span className="inline-flex items-center justify-end gap-1">
                        Payout
                        {masterSortField === 'finalAmount' ? (masterSortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />) : <ArrowUpDown size={12} className="opacity-40" />}
                      </span>
                    </th>
                    <th className="py-3 px-4 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {masterTableRevenues.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-sm text-muted-foreground">No artists match your search.</td>
                    </tr>
                  ) : masterTableRevenues.map(rev => {
                    const isExpanded = expandedArtists.has(rev.artist)
                    const collabNode = collabTree.find(c => c.primaryArtist === rev.artist)
                    const collabRevenue = collabNode?.collabEntries.reduce((s, e) => s + e.revenue, 0) ?? 0
                    const soloRevenue = rev.totalRevenue - collabRevenue

                    return (
                      <Fragment key={rev.artist}>
                        {/* Master Row */}
                        <tr
                          onClick={() => toggleArtistExpanded(rev.artist)}
                          className={`border-b border-white/5 cursor-pointer transition-colors duration-150 hover:bg-white/[0.04] ${isExpanded ? 'bg-white/[0.03]' : ''}`}
                        >
                          <td className="py-4 px-4 text-muted-foreground">
                            <ChevronDown
                              size={14}
                              className={`transition-transform duration-200 ${isExpanded ? 'rotate-0' : '-rotate-90'}`}
                            />
                          </td>
                          <td className="py-4 px-4 font-medium text-foreground whitespace-nowrap">
                            <span className="inline-flex items-center gap-1.5">
                              {rev.artist}
                              <button
                                type="button"
                                onClick={e => { e.stopPropagation(); navigator.clipboard.writeText(rev.artist).then(() => toast.success(`"${rev.artist}" copied`)) }}
                                className="text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                                title="Copy artist name"
                              >
                                <Copy size={12} />
                              </button>
                            </span>
                          </td>
                          <td className="py-4 px-4 text-right font-mono tabular-nums text-muted-foreground">{rev.totalQuantity.toLocaleString('de-DE')}</td>
                          <td className="py-4 px-4 text-right font-mono tabular-nums text-foreground/80">€{fmtEur(soloRevenue)}</td>
                          <td className="py-4 px-4 text-right font-mono tabular-nums text-foreground/60">
                            {collabRevenue > 0 ? `€${fmtEur(collabRevenue)}` : '—'}
                          </td>
                          <td className="py-4 px-4 text-right font-mono tabular-nums font-semibold text-foreground">€{fmtEur(rev.totalRevenue)}</td>
                          <td className="py-4 px-4 text-right font-mono tabular-nums text-rose-400">
                            {totalDeductions(rev) > 0 ? `- €${fmtEur(totalDeductions(rev))}` : '—'}
                          </td>
                          <td className="py-4 px-4 text-right font-mono tabular-nums text-primary">{rev.splitPercentage.toFixed(1)}%</td>
                          <td className="py-4 px-4 text-right font-mono tabular-nums font-bold text-primary">€{fmtEur(rev.finalAmount)}</td>
                          <td className="py-4 px-4 text-right" onClick={e => e.stopPropagation()}>
                            <div className="inline-flex items-center gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2 gap-1 text-xs"
                                onClick={() => handleDownloadPDF(rev.artist)}
                                title={`PDF for ${rev.artist}`}
                              >
                                <FileText size={12} />
                                PDF
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2 gap-1 text-xs"
                                onClick={() => handleDownloadExcel(rev.artist)}
                                title={`Excel for ${rev.artist}`}
                              >
                                <Download size={12} />
                                XLS
                              </Button>
                            </div>
                          </td>
                        </tr>

                        {/* Sub Row (expanded) */}
                        {isExpanded && (
                          <tr>
                            <td colSpan={10} className="p-0">
                              <div className="bg-white/5 shadow-inner border-b border-white/10">
                                <div className="px-8 lg:px-12 py-6 space-y-5">

                                  {/* Solo Revenue Section */}
                                  <div>
                                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Solo Revenue</p>
                                    <div className="grid grid-cols-3 gap-6">
                                      <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
                                        <p className="text-xs text-muted-foreground mb-1">Believe</p>
                                        <p className="font-mono tabular-nums font-semibold text-foreground">€{fmtEur(rev.believeRevenue)}</p>
                                      </div>
                                      <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
                                        <p className="text-xs text-muted-foreground mb-1">Bandcamp</p>
                                        <p className="font-mono tabular-nums font-semibold text-foreground">€{fmtEur(rev.bandcampRevenue)}</p>
                                      </div>
                                      <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
                                        <p className="text-xs text-muted-foreground mb-1">Manual</p>
                                        <p className="font-mono tabular-nums font-semibold text-foreground">€{fmtEur(rev.manualRevenue)}</p>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Feature Guests Section */}
                                  {collabNode && collabNode.collabEntries.length > 0 && (
                                    <div>
                                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Feature Guests</p>
                                      <div className="ml-4 overflow-hidden rounded-lg border border-white/5">
                                        <table className="w-full text-sm">
                                          <thead>
                                            <tr className="bg-white/[0.02]">
                                              <th className="py-2 px-4 text-left text-xs font-medium text-muted-foreground">Featured Artist</th>
                                              <th className="py-2 px-4 text-right text-xs font-medium text-muted-foreground">Units</th>
                                              <th className="py-2 px-4 text-right text-xs font-medium text-muted-foreground">Revenue</th>
                                              <th className="py-2 px-4 text-right text-xs font-medium text-muted-foreground">Share</th>
                                              <th className="py-2 px-4 text-right text-xs font-medium text-muted-foreground">Contract %</th>
                                              <th className="py-2 px-4 text-right text-xs font-medium text-muted-foreground">Payout</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {collabNode.collabEntries.map(entry => {
                                              const rule = guestPayoutRules.find(
                                                r => r.primaryArtist === rev.artist && r.guestName === entry.name
                                              )
                                              const contractPct = rule?.percentage ?? 0
                                              const guestPayout = entry.revenue * (contractPct / 100)
                                              return (
                                                <tr key={entry.name} className="border-t border-white/5">
                                                  <td className="py-2.5 px-4 text-foreground/80">
                                                    <span className="inline-flex items-center gap-1.5">
                                                      {entry.name}
                                                      <button
                                                        type="button"
                                                        onClick={e => { e.stopPropagation(); navigator.clipboard.writeText(entry.name).then(() => toast.success(`"${entry.name}" copied`)) }}
                                                        className="text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                                                        title="Copy artist name"
                                                      >
                                                        <Copy size={12} />
                                                      </button>
                                                    </span>
                                                  </td>
                                                  <td className="py-2.5 px-4 text-right font-mono tabular-nums text-muted-foreground">{entry.quantity.toLocaleString('de-DE')}</td>
                                                  <td className="py-2.5 px-4 text-right font-mono tabular-nums text-foreground/70">€{fmtEur(entry.revenue)}</td>
                                                  <td className="py-2.5 px-4 text-right font-mono tabular-nums text-muted-foreground">
                                                    {fmtPct(entry.revenue, rev.totalRevenue)}%
                                                  </td>
                                                  <td className="py-2.5 px-4 text-right" onClick={e => e.stopPropagation()}>
                                                    <div className="inline-flex items-center gap-1 justify-end">
                                                      <Input
                                                        type="number"
                                                        min={0}
                                                        max={100}
                                                        step={0.1}
                                                        defaultValue={contractPct}
                                                        key={`${rev.artist}-${entry.name}`}
                                                        onBlur={e => {
                                                          const val = parseFloat(e.target.value)
                                                          if (!Number.isNaN(val)) {
                                                            handleUpdateGuestPayout(rev.artist, entry.name, Math.min(100, Math.max(0, val)))
                                                          }
                                                        }}
                                                        className="w-20 h-7 text-xs font-mono tabular-nums text-right border-white/10 bg-white/5 focus:border-primary/60"
                                                      />
                                                      <span className="text-xs text-muted-foreground">%</span>
                                                    </div>
                                                  </td>
                                                  <td className="py-2.5 px-4 text-right font-mono tabular-nums font-semibold text-primary">
                                                    {contractPct > 0 ? `€${fmtEur(guestPayout)}` : '—'}
                                                  </td>
                                                </tr>
                                              )
                                            })}
                                          </tbody>
                                        </table>
                                      </div>
                                    </div>
                                  )}

                                  {/* Inline split rate edit */}
                                  <div className="flex items-center gap-4 pt-2 border-t border-white/5">
                                    <p className="text-xs font-medium text-muted-foreground">Split Rate</p>
                                    <div className="flex items-center gap-2">
                                      <Input
                                        type="number"
                                        min={0}
                                        max={100}
                                        step={0.1}
                                        defaultValue={rev.splitPercentage}
                                        key={`${rev.artist}-${rev.splitPercentage}`}
                                        onBlur={e => {
                                          const val = parseFloat(e.target.value)
                                          if (!Number.isNaN(val)) {
                                            handleUpdateSplitFee(rev.artist, Math.min(100, Math.max(0, val)))
                                          }
                                        }}
                                        className="w-24 h-8 text-sm font-mono tabular-nums text-right border-white/10 bg-white/5 focus:border-primary/60"
                                      />
                                      <span className="text-xs text-muted-foreground">%</span>
                                    </div>
                                    <div className="ml-auto text-right">
                                      <p className="text-xs text-muted-foreground">Net Payout</p>
                                      <p className="font-mono tabular-nums font-bold text-primary">€{fmtEur(rev.finalAmount)}</p>
                                    </div>
                                  </div>

                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    )
                  })}
                </tbody>
                {/* Table Footer with Totals */}
                <tfoot>
                  <tr className="border-t border-white/10 bg-white/[0.02]">
                    <td className="py-4 px-4"></td>
                    <td className="py-4 px-4 font-semibold text-foreground text-xs uppercase tracking-wider">Total</td>
                    <td className="py-4 px-4 text-right font-mono tabular-nums font-semibold text-foreground">
                      {revenues.reduce((s, r) => s + r.totalQuantity, 0).toLocaleString('de-DE')}
                    </td>
                    <td className="py-4 px-4 text-right font-mono tabular-nums font-semibold text-foreground/80">
                      €{revenues.reduce((s, r) => {
                        const cn = collabTree.find(c => c.primaryArtist === r.artist)
                        const cr = cn?.collabEntries.reduce((a, e) => a + e.revenue, 0) ?? 0
                        return s + (r.totalRevenue - cr)
                      }, 0).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-4 px-4 text-right font-mono tabular-nums font-semibold text-foreground/60">
                      €{revenues.reduce((s, r) => {
                        const cn = collabTree.find(c => c.primaryArtist === r.artist)
                        return s + (cn?.collabEntries.reduce((a, e) => a + e.revenue, 0) ?? 0)
                      }, 0).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-4 px-4 text-right font-mono tabular-nums font-bold text-foreground">
                      €{revenues.reduce((s, r) => s + r.totalRevenue, 0).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-4 px-4 text-right font-mono tabular-nums font-semibold text-rose-400">
                      {revenues.reduce((s, r) => s + totalDeductions(r), 0) > 0
                        ? `- €${fmtEur(revenues.reduce((s, r) => s + totalDeductions(r), 0))}`
                        : '—'}
                    </td>
                    <td className="py-4 px-4"></td>
                    <td className="py-4 px-4 text-right font-mono tabular-nums font-bold text-primary text-base">
                      €{revenues.reduce((s, r) => s + r.finalAmount, 0).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-4 px-4"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {/* Artist Mapping Section */}
          <div className="px-8 pb-8 pt-2 border-t border-white/5">
            <ArtistMappingManager
              mappings={artistMappings}
              onAddMapping={handleAddArtistMapping}
              onRemoveMapping={handleRemoveArtistMapping}
              onUpdateMapping={handleUpdateArtistMapping}
              artists={uniqueArtists}
              autoMappings={autoMappings}
            />
          </div>
        </Card>

        {/* ─ Card 4: Manual Revenue — 6 columns ─ */}
        <Card className="col-span-12 lg:col-span-6 p-8 border border-white/10 bg-card backdrop-blur-md rounded-2xl flex flex-col gap-6 overflow-hidden">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 shrink-0 shadow-lg shadow-amber-500/25">
              <Download size={20} className="text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg font-['Space_Grotesk'] leading-tight">Manual Revenue</h3>
              <p className="text-xs text-muted-foreground">Darkmerch, sync deals & other income</p>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto min-h-0">
            <ManualRevenueManager
              revenues={manualRevenues}
              artists={uniqueArtists}
              onAddRevenue={handleAddManualRevenue}
              onRemoveRevenue={handleRemoveManualRevenue}
            />
          </div>
        </Card>

        {/* ─ Card 5: Recoupable Expenses — 6 columns ─ */}
        <Card className="col-span-12 lg:col-span-6 p-8 border border-white/10 bg-card backdrop-blur-md rounded-2xl flex flex-col gap-6 overflow-hidden">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 shrink-0 shadow-lg shadow-red-500/25">
              <TrendingUp size={20} className="text-white" style={{ transform: 'scaleY(-1)' }} />
            </div>
            <div>
              <h3 className="font-bold text-lg font-['Space_Grotesk'] leading-tight">Recoupable Expenses</h3>
              <p className="text-xs text-muted-foreground">Marketing, advances & production costs</p>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto min-h-0">
            <ExpenseManager
              expenses={expenses}
              artists={uniqueArtists}
              onAddExpense={handleAddExpense}
              onRemoveExpense={handleRemoveExpense}
            />
          </div>
        </Card>
      </div>

      {/* ── Fixed bottom action bar ── */}
      <div className="sticky bottom-0 z-20 bg-card/95 backdrop-blur-xl border-t border-white/10 px-8 lg:px-12 py-5 mt-2">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-3 flex-1 flex-wrap">
            <div className="flex items-center gap-2 shrink-0">
              <CalendarDays size={16} className="text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Report Period</span>
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="text"
                placeholder="YYYY-MM"
                value={periodStart}
                onChange={e => setPeriodStart(e.target.value)}
                className="w-38 h-9 text-sm border-border/60 bg-background/50 focus:border-primary/60"
              />
              <span className="text-muted-foreground text-sm">→</span>
              <Input
                type="text"
                placeholder="YYYY-MM"
                value={periodEnd}
                onChange={e => setPeriodEnd(e.target.value)}
                className="w-38 h-9 text-sm border-border/60 bg-background/50 focus:border-primary/60"
              />
            </div>
            {detectedPeriodStart && detectedPeriodEnd &&
              (periodStart !== detectedPeriodStart || periodEnd !== detectedPeriodEnd) && (
              <Button
                variant="ghost"
                size="sm"
                className="text-amber-400 hover:text-amber-300 gap-1 text-xs h-7"
                onClick={() => {
                  setPeriodStart(detectedPeriodStart)
                  setPeriodEnd(detectedPeriodEnd)
                  toast.success('Period applied from CSV data')
                }}
              >
                <Sparkles size={12} />
                Use detected ({detectedPeriodStart} → {detectedPeriodEnd})
              </Button>
            )}
          </div>

          <motion.div>
            <Button
              size="lg"
              onClick={() => navigate('analytics')}
              disabled={revenues.length === 0}
              className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 font-bold px-10 h-14 text-lg shadow-lg shadow-primary/30 shrink-0 disabled:opacity-50 ring-2 ring-primary/20"
            >
              {isProcessing
                ? <TrendingUp size={18} className="animate-pulse" />
                : <Zap size={18} />}
              {isProcessing ? 'Processing…' : 'Process Data'}
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
