import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { FileDown, FileText, Table2, Archive, Search } from 'lucide-react'
import type { ArtistRevenue } from '@/lib/types'

interface ReportingPanelProps {
  revenues: ArtistRevenue[]
  onDownloadPDF: (artist: string) => void
  onDownloadExcel: (artist: string) => void
  onDownloadAll: () => void
}

function fmtEur(value: number) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }).format(value)
}

export function ReportingPanel({ revenues, onDownloadPDF, onDownloadExcel, onDownloadAll }: ReportingPanelProps) {
  const [selectedArtists, setSelectedArtists] = useState<Set<string>>(new Set())
  const [filter, setFilter] = useState('')

  const filtered = useMemo(
    () => revenues.filter(r => r.artist.toLowerCase().includes(filter.toLowerCase())),
    [revenues, filter],
  )

  const allSelected = filtered.length > 0 && filtered.every(r => selectedArtists.has(r.artist))
  const someSelected = filtered.some(r => selectedArtists.has(r.artist))

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedArtists(prev => {
        const next = new Set(prev)
        filtered.forEach(r => next.delete(r.artist))
        return next
      })
    } else {
      setSelectedArtists(prev => {
        const next = new Set(prev)
        filtered.forEach(r => next.add(r.artist))
        return next
      })
    }
  }

  function toggleArtist(artist: string) {
    setSelectedArtists(prev => {
      const next = new Set(prev)
      if (next.has(artist)) next.delete(artist)
      else next.add(artist)
      return next
    })
  }

  function exportSelected() {
    selectedArtists.forEach(artist => {
      onDownloadPDF(artist)
      onDownloadExcel(artist)
    })
  }

  const selectedCount = selectedArtists.size

  return (
    <div className="flex flex-col h-full">
      {/* ── Batch Actions Bar ──────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-white/10 bg-card/60 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            {selectedCount > 0
              ? `${selectedCount} artist${selectedCount !== 1 ? 's' : ''} selected`
              : 'No artists selected'}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-7"
            onClick={toggleSelectAll}
            disabled={filtered.length === 0}
          >
            {allSelected ? 'Deselect All' : 'Select All'}
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 text-xs"
            disabled={selectedCount === 0}
            onClick={exportSelected}
          >
            <Archive size={14} />
            Export Selected to ZIP
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 text-xs"
            disabled={revenues.length === 0}
            onClick={onDownloadAll}
          >
            <FileDown size={14} />
            Export All
          </Button>
        </div>
      </div>

      {/* ── Filter ────────────────────────────────────────────── */}
      <div className="px-6 py-4 border-b border-white/5">
        <div className="relative max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Filter by artist…"
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="pl-8 h-9 text-sm border-border/60 bg-background/50 focus:border-primary/60"
          />
        </div>
      </div>

      {/* ── Table ─────────────────────────────────────────────── */}
      <div className="overflow-x-auto flex-1">
        {revenues.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground">
            <FileDown size={32} className="opacity-30" />
            <p className="text-sm">No revenue data yet. Upload a CSV to get started.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02]">
                <th className="w-10 px-4 py-3">
                  <Checkbox
                    checked={allSelected}
                    ref={el => {
                      if (el) (el as HTMLButtonElement).dataset.indeterminate = someSelected && !allSelected ? 'true' : 'false'
                    }}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Select all artists"
                  />
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Artist</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Total Revenue</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Payout</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground text-xs">
                    No artists match your filter.
                  </td>
                </tr>
              ) : (
                filtered.map(r => (
                  <tr
                    key={r.artist}
                    className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="w-10 px-4 py-3">
                      <Checkbox
                        checked={selectedArtists.has(r.artist)}
                        onCheckedChange={() => toggleArtist(r.artist)}
                        aria-label={`Select ${r.artist}`}
                      />
                    </td>
                    <td className="px-4 py-3 font-medium">{r.artist}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{fmtEur(r.totalRevenue)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-emerald-400 font-medium">
                      {fmtEur(r.finalAmount)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 gap-1 text-xs"
                          onClick={() => onDownloadPDF(r.artist)}
                          title={`Download PDF for ${r.artist}`}
                        >
                          <FileText size={13} />
                          PDF
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 gap-1 text-xs"
                          onClick={() => onDownloadExcel(r.artist)}
                          title={`Download Excel for ${r.artist}`}
                        >
                          <Table2 size={13} />
                          Excel
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
