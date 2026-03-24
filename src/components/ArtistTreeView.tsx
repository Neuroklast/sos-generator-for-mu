import { useMemo, useState, useCallback } from 'react'
import {
  CaretRight,
  CaretDown,
  MusicNote,
  Disc,
  MusicNoteSimple,
  User,
  MagnifyingGlass,
  ArrowsDownUp,
  Users,
  Star,
} from '@phosphor-icons/react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { motion, AnimatePresence } from 'framer-motion'
import { buildArtistTree } from '@/lib/data-processor'
import type { ProcessedArtistData } from '@/lib/data-processor'
import type { ArtistTreeNode, TrackData, ReleaseWithTracks } from '@/lib/types'

interface ArtistTreeViewProps {
  processedData: ProcessedArtistData[]
}

// ── Separator patterns for collab detection (pre-lowercased) ─────────────────

const COLLAB_SEPARATORS_LOWER = [
  ' feat. ', ' feat ', ' ft. ', ' ft ', ' featuring ',
  ' with ', ' & ', ' x ',
]

function isCollabRelease(node: ArtistTreeNode, release: ReleaseWithTracks, processedData: ProcessedArtistData[]): boolean {
  const artistData = processedData.find(d => d.artist === node.artist)
  if (!artistData) return false
  const releaseKey = release.upcEan || release.catalogNumber || release.releaseTitle
  for (const t of artistData.transactions) {
    const tKey = t.upc_ean || t.catalog_number || t.release_title
    if (tKey !== releaseKey) continue
    const orig = t.original_artist?.toLowerCase() ?? ''
    const main = t.main_artist?.toLowerCase() ?? ''
    if (orig !== main) {
      for (const sep of COLLAB_SEPARATORS_LOWER) {
        if (orig.includes(sep)) return true
      }
    }
  }
  return false
}

// ── Formatters ─────────────────────────────────────────────────────────────────

function fmtEur(v: number) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(v)
}
function fmtNum(v: number) {
  return new Intl.NumberFormat('de-DE').format(v)
}

// ── Track row ─────────────────────────────────────────────────────────────────

function TrackRow({ track, artistLabel }: { track: TrackData; artistLabel?: string }) {
  return (
    <div className="flex items-center gap-3 py-1.5 px-3 rounded-lg hover:bg-muted/30 transition-colors group">
      <MusicNoteSimple size={12} className="text-muted-foreground/50 shrink-0" />
      <span className="flex-1 text-sm truncate text-muted-foreground min-w-0" title={track.trackTitle}>
        {track.trackTitle || '—'}
      </span>
      {artistLabel && (
        <span className="text-xs text-muted-foreground/60 font-medium truncate max-w-[120px] hidden lg:block">{artistLabel}</span>
      )}
      {track.isrc && (
        <span className="text-xs font-mono text-muted-foreground/40 hidden xl:block">{track.isrc}</span>
      )}
      <span className="text-xs text-muted-foreground/60 font-mono shrink-0">{fmtNum(track.quantity)}</span>
      <span className="text-xs font-mono text-primary font-semibold w-24 text-right shrink-0">{fmtEur(track.revenue)}</span>
    </div>
  )
}

// ── Release row ───────────────────────────────────────────────────────────────

function ReleaseRow({
  release,
  isCollab,
  artistLabel,
}: {
  release: ReleaseWithTracks
  isCollab?: boolean
  artistLabel?: string
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="rounded-xl overflow-hidden">
      <div
        className="flex items-center gap-3 py-2.5 px-3 cursor-pointer hover:bg-muted/30 transition-colors rounded-xl"
        onClick={() => setOpen(o => !o)}
      >
        <div className="w-5 shrink-0 flex justify-center">
          {open
            ? <CaretDown size={13} className="text-accent" />
            : <CaretRight size={13} className="text-muted-foreground/60" />}
        </div>
        <div className="p-1.5 rounded-lg bg-accent/10 shrink-0">
          <Disc size={12} className="text-accent" />
        </div>
        <span className="flex-1 text-sm font-medium truncate min-w-0" title={release.releaseTitle}>
          {release.releaseTitle}
        </span>
        {artistLabel && (
          <span className="text-xs text-muted-foreground/60 hidden lg:block truncate max-w-[120px]">{artistLabel}</span>
        )}
        {isCollab && (
          <Badge variant="outline" className="text-[10px] h-5 px-1.5 border-amber-500/40 text-amber-400 hidden sm:flex items-center gap-1 shrink-0">
            <Star size={9} weight="fill" className="text-amber-400" /> Collab
          </Badge>
        )}
        {release.isPhysical && (
          <Badge variant="outline" className="text-[10px] h-5 px-1.5 hidden sm:block shrink-0">Physical</Badge>
        )}
        <span className="text-xs text-muted-foreground/60 font-mono w-16 text-right shrink-0 hidden sm:block">{fmtNum(release.quantity)}</span>
        <span className="text-sm font-mono font-semibold text-accent w-24 text-right shrink-0">{fmtEur(release.revenue)}</span>
      </div>

      <AnimatePresence>
        {open && release.tracks.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
            className="pl-10 border-l-2 border-accent/20 ml-6 mb-1"
          >
            <div className="flex items-center gap-3 py-1 px-3 text-[10px] text-muted-foreground/50 uppercase tracking-widest font-semibold">
              <span className="flex-1">Track</span>
              <span className="hidden xl:block w-24">ISRC</span>
              <span className="w-12 text-right">Units</span>
              <span className="w-24 text-right">Revenue</span>
            </div>
            {release.tracks.map((track, i) => (
              <TrackRow key={track.isrc || track.trackTitle || i} track={track} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Artist row ─────────────────────────────────────────────────────────────────

function ArtistRow({
  node,
  forceOpen,
  processedData,
}: {
  node: ArtistTreeNode
  forceOpen?: boolean
  processedData: ProcessedArtistData[]
}) {
  const [open, setOpen] = useState(false)
  const isOpen = forceOpen !== undefined ? forceOpen : open

  const { primaryReleases, collabReleases } = useMemo(() => {
    const primary: ReleaseWithTracks[] = []
    const collab: ReleaseWithTracks[] = []
    for (const r of node.releases) {
      if (isCollabRelease(node, r, processedData)) collab.push(r)
      else primary.push(r)
    }
    return { primaryReleases: primary, collabReleases: collab }
  }, [node, processedData])

  return (
    <div className="rounded-2xl border border-border/60 bg-card/60 overflow-hidden hover:border-primary/30 transition-colors">
      {/* Artist header */}
      <div
        className="flex items-center gap-3 p-4 cursor-pointer hover:bg-primary/5 transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <div className="shrink-0">
          {isOpen
            ? <CaretDown size={15} className="text-primary" />
            : <CaretRight size={15} className="text-muted-foreground/60" />}
        </div>
        <div className="p-2 rounded-xl bg-primary/10 shrink-0">
          <User size={16} className="text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-sm truncate">{node.artist}</p>
            {collabReleases.length > 0 && (
              <Badge variant="outline" className="text-[10px] h-5 px-1.5 border-amber-500/30 text-amber-400/80 hidden sm:flex items-center gap-1">
                <Star size={8} weight="fill" className="text-amber-400" />
                {collabReleases.length} collab{collabReleases.length !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {node.releases.length} release{node.releases.length !== 1 ? 's' : ''} · {fmtNum(node.quantity)} units
          </p>
        </div>
        <div className="text-right shrink-0 ml-4 hidden sm:block">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Split {node.splitPercentage}%</p>
          <p className="text-xs text-muted-foreground font-mono">{fmtEur(node.totalRevenue)}</p>
        </div>
        <div className="text-right shrink-0 ml-4">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Payout</p>
          <p className="text-base font-bold font-mono text-primary">{fmtEur(node.finalPayout)}</p>
        </div>
      </div>

      {/* Releases */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-border/40 bg-muted/10"
          >
            <div className="px-3 py-2 space-y-0.5">
              {primaryReleases.length > 0 && (
                <>
                  {collabReleases.length > 0 && (
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50 px-3 pt-2 pb-1">Primary Releases</p>
                  )}
                  {primaryReleases.map((rel, i) => (
                    <ReleaseRow key={rel.upcEan || rel.releaseTitle || i} release={rel} isCollab={false} />
                  ))}
                </>
              )}
              {collabReleases.length > 0 && (
                <>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-400/60 px-3 pt-3 pb-1 flex items-center gap-1.5">
                    <Star size={9} weight="fill" className="text-amber-400" /> Collaborations
                  </p>
                  {collabReleases.map((rel, i) => (
                    <ReleaseRow key={rel.upcEan || rel.releaseTitle || i} release={rel} isCollab={true} />
                  ))}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Album view ─────────────────────────────────────────────────────────────────

function AlbumView({ treeNodes, search }: { treeNodes: ArtistTreeNode[]; search: string }) {
  // Collect all releases with their artist info
  const allReleases = useMemo(() => {
    const releases: Array<ReleaseWithTracks & { artist: string; artistPayout: number }> = []
    for (const node of treeNodes) {
      for (const rel of node.releases) {
        releases.push({ ...rel, artist: node.artist, artistPayout: node.finalPayout })
      }
    }
    return releases.sort((a, b) => b.revenue - a.revenue)
  }, [treeNodes])

  const filtered = useMemo(() => {
    if (!search.trim()) return allReleases
    const q = search.toLowerCase()
    return allReleases.filter(r =>
      r.releaseTitle.toLowerCase().includes(q) ||
      r.artist.toLowerCase().includes(q) ||
      r.upcEan.toLowerCase().includes(q)
    )
  }, [allReleases, search])

  if (filtered.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground text-sm">
        {search ? `No albums matching "${search}"` : 'No albums found'}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {filtered.map((rel, i) => (
        <div key={rel.upcEan || rel.releaseTitle || i} className="rounded-xl border border-border/50 bg-card/40 overflow-hidden">
          <ReleaseRow release={rel} artistLabel={rel.artist} />
        </div>
      ))}
    </div>
  )
}

// ── Song view ──────────────────────────────────────────────────────────────────

function SongView({ treeNodes, search }: { treeNodes: ArtistTreeNode[]; search: string }) {
  const allTracks = useMemo(() => {
    const tracks: Array<TrackData & { artist: string; album: string }> = []
    for (const node of treeNodes) {
      for (const rel of node.releases) {
        for (const track of rel.tracks) {
          tracks.push({ ...track, artist: node.artist, album: rel.releaseTitle })
        }
      }
    }
    return tracks.sort((a, b) => b.revenue - a.revenue)
  }, [treeNodes])

  const filtered = useMemo(() => {
    if (!search.trim()) return allTracks
    const q = search.toLowerCase()
    return allTracks.filter(t =>
      t.trackTitle.toLowerCase().includes(q) ||
      t.artist.toLowerCase().includes(q) ||
      t.album.toLowerCase().includes(q) ||
      t.isrc?.toLowerCase().includes(q)
    )
  }, [allTracks, search])

  if (filtered.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground text-sm">
        {search ? `No tracks matching "${search}"` : 'No tracks found'}
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border/50 overflow-hidden divide-y divide-border/40">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 bg-muted/20">
        <span className="w-4 shrink-0" />
        <span className="flex-1">Track</span>
        <span className="hidden lg:block w-32">Artist</span>
        <span className="hidden md:block w-36">Album</span>
        <span className="hidden xl:block w-24">ISRC</span>
        <span className="w-16 text-right">Units</span>
        <span className="w-24 text-right">Revenue</span>
      </div>
      {filtered.map((track, i) => (
        <div key={track.isrc || track.trackTitle || i} className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/20 transition-colors">
          <MusicNoteSimple size={13} className="text-muted-foreground/40 shrink-0" />
          <span className="flex-1 text-sm truncate min-w-0" title={track.trackTitle}>{track.trackTitle || '—'}</span>
          <span className="hidden lg:block text-xs text-muted-foreground truncate w-32">{track.artist}</span>
          <span className="hidden md:block text-xs text-muted-foreground/60 truncate w-36">{track.album}</span>
          <span className="hidden xl:block text-xs font-mono text-muted-foreground/40 w-24">{track.isrc}</span>
          <span className="text-xs font-mono text-muted-foreground/70 w-16 text-right shrink-0">{fmtNum(track.quantity)}</span>
          <span className="text-sm font-mono font-semibold text-primary w-24 text-right shrink-0">{fmtEur(track.revenue)}</span>
        </div>
      ))}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export function ArtistTreeView({ processedData }: ArtistTreeViewProps) {
  const [search, setSearch] = useState('')
  const [expandAll, setExpandAll] = useState<boolean | undefined>(undefined)
  const [sortBy, setSortBy] = useState<'payout' | 'artist' | 'quantity'>('payout')

  const treeNodes = useMemo(() => buildArtistTree(processedData), [processedData])

  const filteredArtists = useMemo(() => {
    const q = search.toLowerCase().trim()
    const nodes = q
      ? treeNodes.filter(n =>
          n.artist.toLowerCase().includes(q) ||
          n.releases.some(r =>
            r.releaseTitle.toLowerCase().includes(q) ||
            r.tracks.some(t => t.trackTitle.toLowerCase().includes(q))
          )
        )
      : treeNodes

    return [...nodes].sort((a, b) => {
      switch (sortBy) {
        case 'artist':   return a.artist.localeCompare(b.artist)
        case 'quantity': return b.quantity - a.quantity
        default:         return b.finalPayout - a.finalPayout
      }
    })
  }, [treeNodes, search, sortBy])

  const handleExpandAll   = useCallback(() => setExpandAll(true),      [])
  const handleCollapseAll = useCallback(() => setExpandAll(undefined), [])

  if (processedData.length === 0) {
    return (
      <div className="p-10 flex flex-col items-center justify-center text-center gap-4 min-h-64">
        <div className="p-4 bg-primary/10 rounded-2xl border border-primary/20">
          <MusicNote size={36} className="text-primary/70" />
        </div>
        <div className="space-y-1.5">
          <h3 className="text-base font-semibold">No Artists Yet</h3>
          <p className="text-sm text-muted-foreground max-w-xs">
            Upload CSV files to populate the artist tree with releases and track data.
          </p>
        </div>
      </div>
    )
  }

  const totalReleases = treeNodes.reduce((s, n) => s + n.releases.length, 0)
  const totalTracks   = treeNodes.reduce((s, n) => s + n.releases.reduce((sr, r) => sr + r.tracks.length, 0), 0)

  return (
    <div className="p-5 md:p-6 space-y-5">
      {/* Summary */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Users size={13} />
          <span><strong className="text-foreground">{treeNodes.length}</strong> artist{treeNodes.length !== 1 ? 's' : ''}</span>
        </div>
        <span className="text-muted-foreground/30">·</span>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Disc size={13} />
          <span><strong className="text-foreground">{totalReleases}</strong> release{totalReleases !== 1 ? 's' : ''}</span>
        </div>
        <span className="text-muted-foreground/30">·</span>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <MusicNote size={13} />
          <span><strong className="text-foreground">{totalTracks}</strong> track{totalTracks !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <MagnifyingGlass size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search artists, albums, tracks…"
            className="pl-9 h-9 text-sm"
          />
        </div>
        <div className="flex gap-2 items-center">
          <div className="flex items-center gap-0.5 bg-card/80 border border-border/50 rounded-lg p-1">
            <Button variant={sortBy === 'payout'   ? 'default' : 'ghost'} size="sm" onClick={() => setSortBy('payout')}   className="h-7 text-xs px-2.5 gap-1"><ArrowsDownUp size={11} /> Payout</Button>
            <Button variant={sortBy === 'artist'   ? 'default' : 'ghost'} size="sm" onClick={() => setSortBy('artist')}   className="h-7 text-xs px-2.5">A–Z</Button>
            <Button variant={sortBy === 'quantity' ? 'default' : 'ghost'} size="sm" onClick={() => setSortBy('quantity')} className="h-7 text-xs px-2.5">Units</Button>
          </div>
          <Button variant="outline" size="sm" onClick={handleExpandAll}   className="h-9 text-xs hidden sm:flex">Expand</Button>
          <Button variant="outline" size="sm" onClick={handleCollapseAll} className="h-9 text-xs hidden sm:flex">Collapse</Button>
        </div>
      </div>

      {/* Grouping tabs */}
      <Tabs defaultValue="artists" className="space-y-4">
        <TabsList className="bg-card/50 border border-border/40 rounded-xl p-1 h-auto gap-0.5">
          <TabsTrigger value="artists" className="text-xs h-8 rounded-lg gap-1.5 px-3">
            <User size={12} /> By Artist
          </TabsTrigger>
          <TabsTrigger value="albums" className="text-xs h-8 rounded-lg gap-1.5 px-3">
            <Disc size={12} /> By Album
          </TabsTrigger>
          <TabsTrigger value="songs" className="text-xs h-8 rounded-lg gap-1.5 px-3">
            <MusicNoteSimple size={12} /> By Song
          </TabsTrigger>
        </TabsList>

        {/* By Artist */}
        <TabsContent value="artists" className="space-y-2.5 mt-2">
          {search && (
            <p className="text-xs text-muted-foreground px-1">
              Showing {filteredArtists.length} of {treeNodes.length} artists
            </p>
          )}
          {filteredArtists.length === 0 && search ? (
            <div className="py-10 text-center text-muted-foreground text-sm">
              No results for &quot;{search}&quot;
            </div>
          ) : (
            filteredArtists.map(node => (
              <ArtistRow
                key={node.artist}
                node={node}
                forceOpen={expandAll}
                processedData={processedData}
              />
            ))
          )}
        </TabsContent>

        {/* By Album */}
        <TabsContent value="albums" className="mt-2">
          <AlbumView treeNodes={treeNodes} search={search} />
        </TabsContent>

        {/* By Song */}
        <TabsContent value="songs" className="mt-2">
          <SongView treeNodes={treeNodes} search={search} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
