import { useState, useMemo } from 'react'
import {
  Clock,
  Trash,
  FileCsv,
  MagnifyingGlass,
  CheckCircle,
  XCircle,
  Warning,
} from '@phosphor-icons/react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { motion, AnimatePresence } from 'framer-motion'
import type { HistoryEntry } from '@/lib/types'

interface HistoryPanelProps {
  entries: HistoryEntry[]
  onClearHistory: () => void
}

function fmtDate(iso: string) {
  return new Intl.DateTimeFormat('de-DE', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(iso))
}

function fmtSize(bytes: number) {
  if (bytes < 1000) return `${bytes} B`
  if (bytes < 1_000_000) return `${(bytes / 1000).toFixed(1)} KB`
  return `${(bytes / 1_000_000).toFixed(1)} MB`
}

function fmtNum(n: number) {
  return new Intl.NumberFormat('de-DE').format(n)
}

function StatusIcon({ entry }: { entry: HistoryEntry }) {
  if (entry.removedAt) return (
    <span title="File removed">
      <XCircle size={16} className="text-muted-foreground/50" />
    </span>
  )
  if (entry.rowsSkipped > 0) return (
    <span title="Completed with warnings">
      <Warning size={16} className="text-amber-500" />
    </span>
  )
  return (
    <span title="Processed successfully">
      <CheckCircle size={16} className="text-green-500" />
    </span>
  )
}

export function HistoryPanel({ entries, onClearHistory }: HistoryPanelProps) {
  const [search, setSearch] = useState('')
  const [sourceFilter, setSourceFilter] = useState<'all' | 'believe' | 'bandcamp'>('all')

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return entries.filter(e => {
      const matchSearch = !q || e.filename.toLowerCase().includes(q)
      const matchSource = sourceFilter === 'all' || e.source === sourceFilter
      return matchSearch && matchSource
    })
  }, [entries, search, sourceFilter])

  const stats = useMemo(() => ({
    totalUploads: entries.length,
    totalRows: entries.reduce((s, e) => s + e.rowsParsed, 0),
    totalSkipped: entries.reduce((s, e) => s + e.rowsSkipped, 0),
    activeFiles: entries.filter(e => !e.removedAt).length,
  }), [entries])

  if (entries.length === 0) {
    return (
      <div className="p-8 flex flex-col items-center justify-center text-center gap-4 min-h-64">
        <div className="p-4 bg-primary/10 rounded-full">
          <Clock size={40} className="text-primary" />
        </div>
        <h3 className="text-xl font-semibold">No History Yet</h3>
        <p className="text-muted-foreground max-w-sm">
          Upload history will appear here after you process CSV files.
        </p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-primary to-accent rounded-lg">
            <Clock size={28} weight="duotone" className="text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-2xl font-bold font-['Space_Grotesk']">Upload History</h2>
            <p className="text-sm text-muted-foreground">
              {stats.totalUploads} upload{stats.totalUploads !== 1 ? 's' : ''} · {fmtNum(stats.totalRows)} rows processed
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={onClearHistory}
          className="gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30"
        >
          <Trash size={15} />
          Clear History
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Uploads', value: stats.totalUploads },
          { label: 'Active Files', value: stats.activeFiles },
          { label: 'Rows Parsed', value: fmtNum(stats.totalRows) },
          { label: 'Rows Skipped', value: stats.totalSkipped },
        ].map(card => (
          <Card key={card.label} className="p-4 text-center border-2">
            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">{card.label}</p>
            <p className="text-2xl font-bold font-mono">{card.value}</p>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by filename…"
            className="pl-9"
          />
        </div>
        <div className="flex gap-1 border rounded-lg p-1">
          {(['all', 'believe', 'bandcamp'] as const).map(s => (
            <Button
              key={s}
              variant={sourceFilter === s ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSourceFilter(s)}
              className="h-7 capitalize text-xs"
            >
              {s}
            </Button>
          ))}
        </div>
      </div>

      {/* Table */}
      <Card className="overflow-hidden border-2">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="w-8" />
              <TableHead className="font-semibold">File</TableHead>
              <TableHead className="font-semibold">Source</TableHead>
              <TableHead className="font-semibold text-right">Size</TableHead>
              <TableHead className="font-semibold text-right">Rows</TableHead>
              <TableHead className="font-semibold text-right">Skipped</TableHead>
              <TableHead className="font-semibold text-right">Artists</TableHead>
              <TableHead className="font-semibold text-right">Uploaded</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <AnimatePresence mode="popLayout">
              {filtered.map((entry, index) => (
                <motion.tr
                  key={entry.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ delay: index * 0.03 }}
                  className={[
                    'border-b transition-colors',
                    entry.removedAt ? 'opacity-50' : 'hover:bg-primary/5',
                  ].join(' ')}
                >
                  <TableCell className="w-8 pl-3">
                    <StatusIcon entry={entry} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FileCsv size={16} className="text-primary flex-shrink-0" />
                      <span className="text-sm font-medium truncate max-w-48" title={entry.filename}>
                        {entry.filename}
                      </span>
                    </div>
                    {entry.removedAt && (
                      <p className="text-xs text-muted-foreground/60 mt-0.5">
                        Removed {fmtDate(entry.removedAt)}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={entry.source === 'believe' ? 'default' : 'secondary'} className="text-xs capitalize">
                      {entry.source}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm text-muted-foreground">
                    {fmtSize(entry.sizeBytes)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {fmtNum(entry.rowsParsed)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {entry.rowsSkipped > 0 ? (
                      <span className="text-amber-500">{fmtNum(entry.rowsSkipped)}</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {entry.uniqueArtists}
                  </TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground whitespace-nowrap">
                    {fmtDate(entry.timestamp)}
                  </TableCell>
                </motion.tr>
              ))}
            </AnimatePresence>
          </TableBody>
        </Table>

        {filtered.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            No entries match the current filter
          </div>
        )}
      </Card>
    </div>
  )
}
