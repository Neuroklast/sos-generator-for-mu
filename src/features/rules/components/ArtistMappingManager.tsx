import { Plus, Trash, GitBranch, Pencil, GitMerge, Sparkle } from '@phosphor-icons/react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { ArtistMapping } from '@/lib/types'

interface ArtistMappingManagerProps {
  mappings: ArtistMapping[]
  onAddMapping: (mapping: Omit<ArtistMapping, 'id'>) => void
  onRemoveMapping: (id: string) => void
  onUpdateMapping?: (id: string, update: Omit<ArtistMapping, 'id'>) => void
  artists?: string[]
  autoMappings?: ArtistMapping[]
}

export function ArtistMappingManager({
  mappings,
  onAddMapping,
  onRemoveMapping,
  onUpdateMapping,
  artists = [],
  autoMappings = [],
}: ArtistMappingManagerProps) {
  // ── Add dialog state ───────────────────────────────────────────────────────
  const [addOpen, setAddOpen] = useState(false)
  const [featuringName, setFeaturingName] = useState('')
  const [primaryArtist, setPrimaryArtist] = useState('')

  const handleAdd = () => {
    if (featuringName.trim() && primaryArtist.trim()) {
      onAddMapping({ featuringName: featuringName.trim(), primaryArtist: primaryArtist.trim() })
      setFeaturingName('')
      setPrimaryArtist('')
      setAddOpen(false)
    }
  }

  // ── Edit dialog state ──────────────────────────────────────────────────────
  const [editOpen, setEditOpen] = useState(false)
  const [editMapping, setEditMapping] = useState<ArtistMapping | null>(null)
  const [editFeat, setEditFeat] = useState('')
  const [editPrimary, setEditPrimary] = useState('')

  const openEdit = (m: ArtistMapping) => {
    setEditMapping(m)
    setEditFeat(m.featuringName)
    setEditPrimary(m.primaryArtist)
    setEditOpen(true)
  }

  const handleEdit = () => {
    if (editMapping && editFeat.trim() && editPrimary.trim()) {
      onUpdateMapping?.(editMapping.id, { featuringName: editFeat.trim(), primaryArtist: editPrimary.trim() })
      setEditOpen(false)
      setEditMapping(null)
    }
  }

  // ── Merge dialog state ─────────────────────────────────────────────────────
  const [mergeOpen, setMergeOpen] = useState(false)
  const [mergeSelected, setMergeSelected] = useState<Set<string>>(new Set())
  const [mergePrimary, setMergePrimary] = useState('')
  const [mergeSearch, setMergeSearch] = useState('')

  const filteredArtists = artists.filter(a =>
    a.toLowerCase().includes(mergeSearch.toLowerCase())
  )

  const toggleMergeArtist = (artist: string) => {
    setMergeSelected(prev => {
      const next = new Set(prev)
      if (next.has(artist)) next.delete(artist)
      else next.add(artist)
      return next
    })
  }

  const handleMerge = () => {
    if (!mergePrimary.trim() || mergeSelected.size < 2) return
    const primary = mergePrimary.trim()
    for (const artist of mergeSelected) {
      if (artist.toLowerCase() === primary.toLowerCase()) continue
      onAddMapping({ featuringName: artist, primaryArtist: primary })
    }
    setMergeOpen(false)
    setMergeSelected(new Set())
    setMergePrimary('')
    setMergeSearch('')
  }

  // ── Auto-mapping wizard state ──────────────────────────────────────────────
  // Only include auto-mapping suggestions not already covered by a manual mapping.
  const existingFeaturingNamesLower = new Set(mappings.map(m => m.featuringName.toLowerCase()))
  const pendingSuggestions = autoMappings.filter(
    am => !existingFeaturingNamesLower.has(am.featuringName.toLowerCase())
  )

  const [wizardOpen, setWizardOpen] = useState(false)
  const [wizardIndex, setWizardIndex] = useState(0)

  const currentSuggestion = pendingSuggestions[wizardIndex] ?? null

  const startWizard = () => {
    setWizardIndex(0)
    setWizardOpen(true)
  }

  const acceptSuggestion = () => {
    if (!currentSuggestion) return
    onAddMapping({
      featuringName: currentSuggestion.featuringName,
      primaryArtist: currentSuggestion.primaryArtist,
    })
    advanceWizard()
  }

  const skipSuggestion = () => {
    advanceWizard()
  }

  const advanceWizard = () => {
    if (wizardIndex + 1 >= pendingSuggestions.length) {
      setWizardOpen(false)
    } else {
      setWizardIndex(i => i + 1)
    }
  }

  const allMappings = [
    ...mappings,
    ...pendingSuggestions,
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <GitBranch size={20} weight="bold" className="text-primary" />
          <h3 className="font-semibold">Artist Mappings</h3>
        </div>

        <div className="flex gap-2 flex-wrap">
          {/* Auto-Mapping Wizard */}
          {pendingSuggestions.length > 0 && (
            <Button size="sm" variant="outline" className="gap-2 border-amber-500/40 text-amber-400 hover:bg-amber-500/10 hover:border-amber-500/60" onClick={startWizard}>
              <Sparkle size={16} weight="bold" />
              Auto-Map Wizard
              <Badge variant="secondary" className="ml-0.5 text-[10px] px-1.5 py-0 bg-amber-500/20 text-amber-400 border-amber-500/30">
                {pendingSuggestions.length}
              </Badge>
            </Button>
          )}

          {/* Merge Dialog */}
          <Dialog open={mergeOpen} onOpenChange={open => { setMergeOpen(open); if (!open) { setMergeSelected(new Set()); setMergePrimary(''); setMergeSearch('') } }}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="gap-2" disabled={artists.length < 2}>
                <GitMerge size={16} weight="bold" />
                Merge Artists
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Merge Artists</DialogTitle>
                <DialogDescription>
                  Select artists to merge and choose the primary artist they should consolidate under.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-1">
                  <Label>Primary Artist (merge target)</Label>
                  <Input
                    value={mergePrimary}
                    onChange={e => setMergePrimary(e.target.value)}
                    placeholder="e.g. Artist A"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Artists to consolidate</Label>
                  <Input
                    value={mergeSearch}
                    onChange={e => setMergeSearch(e.target.value)}
                    placeholder="Filter artists…"
                    className="mb-2"
                  />
                  <div className="max-h-52 overflow-y-auto space-y-1 rounded-md border border-border/40 p-2">
                    {filteredArtists.length === 0 && (
                      <p className="text-xs text-muted-foreground py-2 text-center">No artists available</p>
                    )}
                    {filteredArtists.map(artist => (
                      <label key={artist} className="flex items-center gap-2 cursor-pointer rounded px-2 py-1 hover:bg-white/5">
                        <Checkbox
                          checked={mergeSelected.has(artist)}
                          onCheckedChange={() => toggleMergeArtist(artist)}
                          className="border-2 border-white/40 data-[state=checked]:border-primary data-[state=checked]:bg-primary"
                        />
                        <span className="text-sm truncate" title={artist}>{artist}</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">{mergeSelected.size} artist{mergeSelected.size !== 1 ? 's' : ''} selected</p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setMergeOpen(false)}>Cancel</Button>
                <Button onClick={handleMerge} disabled={!mergePrimary.trim() || mergeSelected.size < 2}>
                  Merge
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Add Dialog */}
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus size={16} weight="bold" />
                Add Mapping
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Map Featuring Artist</DialogTitle>
                <DialogDescription>Map a featuring credit to a primary artist for revenue attribution</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="featuring-name">Featuring Name</Label>
                  <Input id="featuring-name" value={featuringName} onChange={e => setFeaturingName(e.target.value)} placeholder="e.g., Artist A feat. Artist B" />
                </div>
                <div className="flex items-center justify-center">
                  <GitBranch size={24} className="text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="primary-artist">Primary Artist</Label>
                  <Input id="primary-artist" value={primaryArtist} onChange={e => setPrimaryArtist(e.target.value)} placeholder="e.g., Artist A" onKeyDown={e => e.key === 'Enter' && handleAdd()} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
                <Button onClick={handleAdd} disabled={!featuringName.trim() || !primaryArtist.trim()}>Add Mapping</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={open => { setEditOpen(open); if (!open) setEditMapping(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Mapping</DialogTitle>
            <DialogDescription>Update the featuring name or primary artist. Revenue is re-processed automatically.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Featuring Name</Label>
              <Input value={editFeat} onChange={e => setEditFeat(e.target.value)} />
            </div>
            <div className="flex items-center justify-center">
              <GitBranch size={24} className="text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <Label>Primary Artist</Label>
              <Input value={editPrimary} onChange={e => setEditPrimary(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleEdit()} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={handleEdit} disabled={!editFeat.trim() || !editPrimary.trim()}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Auto-Mapping Wizard Dialog */}
      <Dialog open={wizardOpen} onOpenChange={open => { if (!open) setWizardOpen(false) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkle size={18} className="text-amber-400" />
              Auto-Map Wizard
            </DialogTitle>
            <DialogDescription>
              Review each suggested mapping and accept or skip it. You can cancel at any time.
            </DialogDescription>
          </DialogHeader>

          {currentSuggestion ? (
            <div className="space-y-6 py-2">
              {/* Progress indicator */}
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Suggestion {wizardIndex + 1} of {pendingSuggestions.length}</span>
                <div className="flex gap-1">
                  {pendingSuggestions.map((_, i) => (
                    <div
                      key={i}
                      className={`h-1.5 w-6 rounded-full transition-colors ${i < wizardIndex ? 'bg-emerald-500' : i === wizardIndex ? 'bg-amber-400' : 'bg-white/10'}`}
                    />
                  ))}
                </div>
              </div>

              {/* Suggestion card */}
              <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-5 space-y-4">
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Alias / Featuring Name</p>
                  <p className="text-lg font-bold text-foreground">{currentSuggestion.featuringName}</p>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <GitBranch size={16} />
                  <span className="text-xs">maps to</span>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Primary Artist</p>
                  <p className="text-lg font-bold text-foreground">{currentSuggestion.primaryArtist}</p>
                </div>
                {currentSuggestion.mappingScore !== undefined && (
                  <Badge variant="secondary" className="text-[10px] px-2 py-0.5 bg-amber-500/15 text-amber-400 border-amber-500/30">
                    Similarity: {((currentSuggestion.mappingScore) * 100).toFixed(0)}%
                  </Badge>
                )}
              </div>
            </div>
          ) : (
            <div className="py-8 text-center space-y-2">
              <p className="text-sm font-semibold text-foreground">All suggestions reviewed!</p>
              <p className="text-xs text-muted-foreground">No more auto-mapping suggestions available.</p>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setWizardOpen(false)} className="sm:mr-auto">
              Cancel
            </Button>
            {currentSuggestion && (
              <>
                <Button variant="outline" onClick={skipSuggestion}>
                  Skip
                </Button>
                <Button onClick={acceptSuggestion} className="bg-emerald-600 hover:bg-emerald-500 text-white">
                  Accept
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AnimatePresence mode="popLayout">
        {allMappings.length > 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
            {allMappings.map((mapping, index) => (
              <motion.div
                key={mapping.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.04 }}
              >
                <Card className="p-3 flex items-center gap-3 bg-card hover:shadow-md transition-shadow">
                  <GitBranch size={20} className="text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium truncate max-w-[200px]" title={mapping.featuringName}>
                        {mapping.featuringName}
                      </p>
                      {mapping.autoMapped && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-blue-500/15 text-blue-400 border-blue-500/30 shrink-0">
                          Auto Mapped · {((mapping.mappingScore ?? 0) * 100).toFixed(0)}%
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate" title={mapping.primaryArtist}>
                      → {mapping.primaryArtist}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {!mapping.autoMapped && onUpdateMapping && (
                      <Button
                        variant="ghost" size="sm"
                        onClick={() => openEdit(mapping)}
                        className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
                        title="Edit mapping"
                      >
                        <Pencil size={14} />
                      </Button>
                    )}
                    {!mapping.autoMapped && (
                      <Button
                        variant="ghost" size="sm"
                        onClick={() => onRemoveMapping(mapping.id)}
                        className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                        title="Remove mapping"
                      >
                        <Trash size={16} />
                      </Button>
                    )}
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <Card className="p-8 text-center border-dashed">
            <GitBranch size={32} className="mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No artist mappings configured yet</p>
          </Card>
        )}
      </AnimatePresence>
    </div>
  )
}
