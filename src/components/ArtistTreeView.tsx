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
} from '@phosphor-icons/react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { motion, AnimatePresence } from 'framer-motion'
import type { ArtistTreeNode, ArtistCollabNode } from '@/lib/types'

interface ArtistTreeViewProps {
  /** Pre-computed artist → release → track hierarchy from the Web Worker. */
  treeNodes: ArtistTreeNode[]
  /** Pre-computed collab graph from the Web Worker. */
  collabTree: ArtistCollabNode[]
}

// ── Formatters ─────────────────────────────────────────────────────────────────

function fmtEur(v: number) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(v)
}
function fmtNum(v: number) {
  return new Intl.NumberFormat('de-DE').format(v)
}

// ── Track row ─────────────────────────────────────────────────────────────────

function TrackRow({ track }: { track: ArtistTreeNode['releases'][number]['tracks'][number] }) {
  return (
    <div className="flex items-center gap-3 py-1.5 px-3 rounded hover:bg-muted/30 transition-colors group">
      <div className="w-5 flex-shrink-0 flex justify-center">
        <MusicNoteSimple size={13} className="text-muted-foreground/60" />
      </div>
      <span className="flex-1 text-sm truncate text-muted-foreground" title={track.trackTitle}>
        {track.trackTitle || '—'}
      </span>
      {track.isrc && (
        <span className="text-xs font-mono text-muted-foreground/50 hidden lg:block">{track.isrc}</span>
      )}
      <span className="text-xs text-muted-foreground/70 font-mono">{fmtNum(track.quantity)}</span>
      <span className="text-xs font-mono text-primary font-semibold w-24 text-right">{fmtEur(track.revenue)}</span>
    </div>
  )
}

// ── Release row ───────────────────────────────────────────────────────────────

function ReleaseRow({ release, forceOpen }: { release: ArtistTreeNode['releases'][number]; forceOpen?: boolean }) {
  const [open, setOpen] = useState(false)
  // When forceOpen is provided (e.g. a search is active), respect it; otherwise use local state.
  const isOpen = forceOpen !== undefined ? forceOpen : open

  return (
    <div>
      <div
        className="flex items-center gap-3 py-2 px-3 rounded cursor-pointer hover:bg-muted/40 transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <div className="w-5 flex-shrink-0 flex justify-center">
          {isOpen
            ? <CaretDown size={13} className="text-accent" />
            : <CaretRight size={13} className="text-muted-foreground" />}
        </div>
        <div className="p-1 rounded bg-accent/10 flex-shrink-0">
          <Disc size={13} className="text-accent" />
        </div>
        <span className="flex-1 text-sm font-medium truncate" title={release.releaseTitle}>
          {release.releaseTitle}
        </span>
        {release.isPhysical && (
          <Badge variant="outline" className="text-xs h-5">Physical</Badge>
        )}
        {release.upcEan && (
          <span className="text-xs font-mono text-muted-foreground/50 hidden xl:block">{release.upcEan}</span>
        )}
        <span className="text-xs text-muted-foreground/70 font-mono w-20 text-right">{fmtNum(release.quantity)}</span>
        <span className="text-sm font-mono font-semibold text-accent w-24 text-right">{fmtEur(release.revenue)}</span>
      </div>

      <AnimatePresence>
        {isOpen && release.tracks.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
            className="pl-8 border-l border-border/50 ml-6"
          >
            {/* Column header */}
            <div className="flex items-center gap-3 py-1 px-3 text-xs text-muted-foreground/60 uppercase tracking-wide">
              <div className="w-5 flex-shrink-0" />
              <span className="flex-1">Track</span>
              <span className="hidden lg:block w-24">ISRC</span>
              <span className="w-16 text-right">Qty</span>
              <span className="w-24 text-right">Revenue</span>
            </div>
            {/* Bug 9 fix: prefix index to guarantee key uniqueness even for tracks without ISRC or with identical titles */}
            {release.tracks.map((track, i) => (
              <TrackRow key={`${i}-${track.isrc}-${track.trackTitle}`} track={track} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Artist row ────────────────────────────────────────────────────────────────

function ArtistRow({ node, forceOpen }: { node: ArtistTreeNode; forceOpen?: boolean }) {
  const [open, setOpen] = useState(false)
  const isOpen = forceOpen !== undefined ? forceOpen : open

  return (
    <Card className="overflow-hidden border-2 hover:border-primary/30 transition-colors">
      {/* Artist header */}
      <div
        className="flex items-center gap-3 p-4 cursor-pointer hover:bg-primary/5 transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex-shrink-0">
          {isOpen
            ? <CaretDown size={16} className="text-primary" />
            : <CaretRight size={16} className="text-muted-foreground" />}
        </div>
        <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
          <User size={18} className="text-primary" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-base truncate">{node.artist}</p>
          <p className="text-xs text-muted-foreground">
            {node.releases.length} release{node.releases.length !== 1 ? 's' : ''} · {fmtNum(node.quantity)} units
          </p>
        </div>

        <div className="text-right flex-shrink-0 ml-4 hidden sm:block">
          <p className="text-xs text-muted-foreground">Split {node.splitPercentage}%</p>
          <p className="text-sm text-muted-foreground">{fmtEur(node.totalRevenue)}</p>
        </div>

        <div className="text-right flex-shrink-0 ml-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Payout</p>
          <p className="text-lg font-bold font-mono text-primary">{fmtEur(node.finalPayout)}</p>
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
            className="border-t border-border/50 bg-muted/10"
          >
            {/* Column header */}
            <div className="flex items-center gap-3 px-4 py-1.5 text-xs text-muted-foreground/60 uppercase tracking-wide border-b border-border/30">
              <div className="w-5 flex-shrink-0" />
              <div className="w-5 flex-shrink-0" />
              <span className="flex-1">Release</span>
              <span className="hidden xl:block w-24 text-right">UPC / EAN</span>
              <span className="w-20 text-right">Units</span>
              <span className="w-24 text-right">Revenue</span>
            </div>
            <div className="px-2 pb-2 pt-1 space-y-0.5">
              {/* Bug 9 fix: prefix index so releases without UPC/EAN and with duplicate titles don't clash */}
              {node.releases.map((rel, i) => (
                <ReleaseRow key={`${i}-${rel.upcEan}-${rel.releaseTitle}`} release={rel} forceOpen={forceOpen} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export function ArtistTreeView({ treeNodes, collabTree }: ArtistTreeViewProps) {
  const [search, setSearch] = useState('')
  const [expandAll, setExpandAll] = useState<boolean | undefined>(undefined)
  const [sortBy, setSortBy] = useState<'payout' | 'artist' | 'quantity'>('payout')
  const [showCollabs, setShowCollabs] = useState(false)

  // treeNodes and collabTree are pre-computed by the Web Worker — no
  // main-thread transaction access needed here.

  const filtered = useMemo(() => {
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
        case 'artist': return a.artist.localeCompare(b.artist)
        case 'quantity': return b.quantity - a.quantity
        default: return b.finalPayout - a.finalPayout
      }
    })
  }, [treeNodes, search, sortBy])

  // Filter collabTree by search query in real-time
  const filteredCollabs = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return collabTree.filter(n => n.collabEntries.length > 0)
    return collabTree
      .filter(n => n.collabEntries.length > 0)
      .filter(n =>
        n.primaryArtist.toLowerCase().includes(q) ||
        n.collabEntries.some(e => e.name.toLowerCase().includes(q))
      )
  }, [collabTree, search])

  // Bug 7 fix: when a search is active, force all matched artist rows and their
  // releases to be expanded so the user can immediately see the matching tracks.
  const searchForceOpen = search.trim().length > 0 ? true : undefined

  const handleExpandAll = useCallback(() => setExpandAll(true), [])
  const handleCollapseAll = useCallback(() => setExpandAll(false), [])

  if (treeNodes.length === 0) {
    return (
      <div className="p-8 flex flex-col items-center justify-center text-center gap-4 min-h-64">
        <div className="p-4 bg-primary/10 rounded-full">
          <MusicNote size={40} className="text-primary" />
        </div>
        <h3 className="text-xl font-semibold">No Artists Yet</h3>
        <p className="text-muted-foreground max-w-sm">
          Upload CSV files to populate the artist tree with releases and track data.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-0">
      {/* Header */}
      <div className="flex items-center gap-3 p-6 border-b border-white/10">
        <div className="p-3 bg-gradient-to-br from-primary to-accent rounded-lg shrink-0">
          <MusicNote size={24} weight="duotone" className="text-primary-foreground" />
        </div>
        <div>
          <h2 className="text-xl font-bold font-['Space_Grotesk']">Artist Tree</h2>
          <p className="text-sm text-muted-foreground">
            {treeNodes.length} artist{treeNodes.length !== 1 ? 's' : ''} ·{' '}
            {treeNodes.reduce((s, n) => s + n.releases.length, 0)} releases ·{' '}
            {treeNodes.reduce((s, n) => s + n.releases.reduce((sr, r) => sr + r.tracks.length, 0), 0)} tracks
          </p>
        </div>
      </div>

      {/* Main Control Bar: search + view toggle */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-6 py-4 bg-card/50 border-b border-white/10">
        <div className="relative w-full md:w-96">
          <MagnifyingGlass size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Künstler, Release oder Track suchen…"
            className="pl-11 h-12 bg-background/50 border-white/10 focus:border-primary text-base"
          />
        </div>

        <div className="flex bg-background/50 p-1 rounded-lg border border-white/10 shrink-0">
          <button
            onClick={() => setShowCollabs(false)}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
              !showCollabs ? 'bg-primary text-white shadow-lg' : 'text-muted-foreground hover:text-white'
            }`}
          >
            Hauptreleases
          </button>
          <button
            onClick={() => setShowCollabs(true)}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
              showCollabs ? 'bg-accent text-white shadow-lg' : 'text-muted-foreground hover:text-white'
            }`}
          >
            Collabs & Features
          </button>
        </div>
      </div>

      {/* Secondary controls — Hauptreleases only */}
      {!showCollabs && (
        <div className="flex items-center justify-between gap-3 px-6 py-2 border-b border-white/10">
          <div className="flex items-center gap-1 bg-background/50 rounded-lg p-1 border border-white/10">
            <Button
              variant={sortBy === 'payout' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSortBy('payout')}
              className="h-7 text-xs gap-1"
            >
              <ArrowsDownUp size={12} /> Payout
            </Button>
            <Button
              variant={sortBy === 'artist' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSortBy('artist')}
              className="h-7 text-xs"
            >
              A–Z
            </Button>
            <Button
              variant={sortBy === 'quantity' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSortBy('quantity')}
              className="h-7 text-xs"
            >
              Units
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExpandAll} className="h-8 text-xs">
              Expand All
            </Button>
            <Button variant="outline" size="sm" onClick={handleCollapseAll} className="h-8 text-xs">
              Collapse
            </Button>
          </div>
        </div>
      )}

      {/* Summary bar */}
      {search && (
        <div className="px-6 py-2 border-b border-white/10">
          <p className="text-sm text-muted-foreground">
            {showCollabs
              ? `${filteredCollabs.length} of ${collabTree.filter(n => n.collabEntries.length > 0).length} collab groups`
              : `${filtered.length} of ${treeNodes.length} artists`}
          </p>
        </div>
      )}

      {/* ── Collab View ── */}
      {showCollabs && (
        <>
          {filteredCollabs.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
              {filteredCollabs.map(node => (
                <Card key={node.primaryArtist} className="overflow-hidden border-white/10 bg-background/40">
                  {/* Primary artist header */}
                  <div className="flex items-center justify-between p-5 border-b border-white/10 bg-card/40">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                        <User size={20} className="text-primary" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-lg leading-tight truncate">{node.primaryArtist}</h3>
                        <p className="text-sm text-muted-foreground">
                          {node.collabEntries.length} Kollaboration{node.collabEntries.length !== 1 ? 'en' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Gesamtumsatz</p>
                      <p className="text-xl font-mono font-bold text-primary">{fmtEur(node.revenue)}</p>
                    </div>
                  </div>

                  {/* Feature list */}
                  <div className="divide-y divide-white/5">
                    {node.collabEntries.map(entry => (
                      <div
                        key={entry.name}
                        className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Badge variant="outline" className="text-accent border-accent/30 bg-accent/10 shrink-0">
                            feat.
                          </Badge>
                          <span className="font-medium truncate">{entry.name}</span>
                        </div>
                        <div className="flex items-center gap-6 text-right shrink-0 ml-4">
                          <div>
                            <p className="text-xs text-muted-foreground">Units</p>
                            <p className="text-sm font-mono">{fmtNum(entry.quantity)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Track Rev.</p>
                            <p className="text-sm font-mono text-foreground">{fmtEur(entry.revenue)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="p-12 flex flex-col items-center justify-center text-center gap-4">
              <p className="text-muted-foreground">
                {search ? `No collab groups match "${search}"` : 'No collab data found in the loaded files.'}
              </p>
            </div>
          )}
        </>
      )}

      {/* ── Hauptreleases (Artist Tree) ── */}
      {!showCollabs && (
        <div className="p-6 space-y-3">
          {filtered.map(node => (
            <ArtistRow
              key={node.artist}
              node={node}
              forceOpen={expandAll ?? searchForceOpen}
            />
          ))}

          {filtered.length === 0 && search && (
            <div className="text-center py-12 text-muted-foreground">
              No results for "<strong>{search}</strong>"
            </div>
          )}
        </div>
      )}
    </div>
  )
}
