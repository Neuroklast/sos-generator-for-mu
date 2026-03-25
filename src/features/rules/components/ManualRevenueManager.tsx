import { Plus, Trash, CurrencyEur, MagnifyingGlass, X } from '@phosphor-icons/react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { ManualRevenue } from '@/lib/types'

const CUSTOM_ARTIST_VALUE = '__custom_artist__'

interface ManualRevenueManagerProps {
  revenues: ManualRevenue[]
  artists: string[]
  onAddRevenue: (revenue: Omit<ManualRevenue, 'id'>) => void
  onRemoveRevenue: (id: string) => void
}

export function ManualRevenueManager({
  revenues,
  artists,
  onAddRevenue,
  onRemoveRevenue,
}: ManualRevenueManagerProps) {
  const [open, setOpen] = useState(false)
  const [artist, setArtist] = useState('')
  const [customArtist, setCustomArtist] = useState('')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')

  // ── Artist filter ─────────────────────────────────────────────────────────
  const [filterSearch, setFilterSearch] = useState('')
  const [filterArtist, setFilterArtist] = useState<string | null>(null)

  const effectiveArtist = artist === CUSTOM_ARTIST_VALUE ? customArtist.trim() : artist

  const handleArtistChange = (value: string) => {
    setArtist(value)
    if (value !== CUSTOM_ARTIST_VALUE) {
      setCustomArtist('')
    }
  }

  const handleAdd = () => {
    const amountNum = parseFloat(amount)
    if (effectiveArtist && description.trim() && !isNaN(amountNum) && amountNum > 0) {
      onAddRevenue({
        artist: effectiveArtist,
        description: description.trim(),
        amount: amountNum,
      })
      setArtist('')
      setCustomArtist('')
      setDescription('')
      setAmount('')
      setOpen(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(value)
  }

  // All known artists from the list + any custom ones already in revenues.
  // We merge both sources so that revenues added with a "custom artist name"
  // still appear in the filter even if that artist is not yet in the roster.
  const allKnownArtists = useMemo(() => {
    const fromRevenues = revenues.map(r => r.artist)
    return Array.from(new Set([...artists, ...fromRevenues])).sort((a, b) =>
      a.localeCompare(b)
    )
  }, [artists, revenues])

  const filteredSearchArtists = useMemo(
    () =>
      allKnownArtists.filter(a =>
        a.toLowerCase().includes(filterSearch.toLowerCase())
      ),
    [allKnownArtists, filterSearch]
  )

  const displayedRevenues = useMemo(
    () =>
      filterArtist
        ? revenues.filter(r => r.artist === filterArtist)
        : revenues,
    [revenues, filterArtist]
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CurrencyEur size={20} weight="bold" className="text-primary" />
          <h3 className="font-semibold">Manual Revenue</h3>
        </div>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus size={16} weight="bold" />
              Add Revenue
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Manual Revenue</DialogTitle>
              <DialogDescription>
                Add additional revenue for an artist (e.g., merchandise sales)
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="revenue-artist">Artist</Label>
                <Select value={artist} onValueChange={handleArtistChange}>
                  <SelectTrigger id="revenue-artist">
                    <SelectValue placeholder="Select or enter artist" />
                  </SelectTrigger>
                  <SelectContent>
                    {artists.map((a) => (
                      <SelectItem key={a} value={a}>
                        {a}
                      </SelectItem>
                    ))}
                    <SelectItem value={CUSTOM_ARTIST_VALUE}>
                      + Enter custom artist name
                    </SelectItem>
                  </SelectContent>
                </Select>
                {artist === CUSTOM_ARTIST_VALUE && (
                  <Input
                    value={customArtist}
                    onChange={(e) => setCustomArtist(e.target.value)}
                    placeholder="Enter artist name"
                    autoFocus
                  />
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="revenue-description">Description</Label>
                <Input
                  id="revenue-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g., Darkmerch Sales"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="revenue-amount">Amount (EUR)</Label>
                <Input
                  id="revenue-amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="font-mono"
                  onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleAdd}
                disabled={!effectiveArtist || !description.trim() || !amount || parseFloat(amount) <= 0}
              >
                Add Revenue
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* ── Artist filter ── */}
      {revenues.length > 0 && (
        <div className="relative flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10">
          <MagnifyingGlass size={14} className="text-muted-foreground shrink-0" />
          <Input
            placeholder="Filter by artist…"
            value={filterSearch}
            onChange={e => {
              setFilterSearch(e.target.value)
              if (!e.target.value) setFilterArtist(null)
            }}
            className="h-7 text-xs border-0 bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0 flex-1"
          />
          {(filterSearch || filterArtist) && (
            <button
              onClick={() => {
                setFilterSearch('')
                setFilterArtist(null)
              }}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Clear filter"
            >
              <X size={14} />
            </button>
          )}
          {filterSearch && !filterArtist && filteredSearchArtists.length > 0 && (
            <div className="absolute z-50 mt-1 w-56 rounded-lg border border-border bg-popover shadow-lg py-1"
              style={{ top: 'calc(100% + 4px)', left: 0 }}
            >
              {filteredSearchArtists.slice(0, 8).map(a => (
                <button
                  key={a}
                  className="w-full text-left px-3 py-1.5 text-sm hover:bg-white/10 truncate"
                  onClick={() => {
                    setFilterArtist(a)
                    setFilterSearch(a)
                  }}
                >
                  {a}
                </button>
              ))}
            </div>
          )}
          {filterArtist && (
            <span className="text-xs text-primary font-medium bg-primary/10 px-2 py-0.5 rounded-full">
              {displayedRevenues.length} entry{displayedRevenues.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      )}

      {/* ── Artist quick-select pills ── */}
      {revenues.length > 0 && allKnownArtists.length > 0 && !filterSearch && (
        <div className="flex flex-wrap gap-1.5">
          {allKnownArtists.filter(a => revenues.some(r => r.artist === a)).map(a => (
            <button
              key={a}
              onClick={() => setFilterArtist(prev => prev === a ? null : a)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                filterArtist === a
                  ? 'bg-primary/20 border-primary/60 text-primary'
                  : 'bg-white/5 border-white/10 text-muted-foreground hover:border-white/30'
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      )}

      <AnimatePresence mode="popLayout">
        {displayedRevenues.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-2"
          >
            {displayedRevenues.map((revenue, index) => (
              <motion.div
                key={revenue.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="p-3 flex items-center gap-3 bg-card hover:shadow-md transition-shadow">
                  <div className="p-2 bg-accent/10 rounded">
                    <CurrencyEur size={20} weight="fill" className="text-accent" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{revenue.description}</p>
                    <p className="text-xs text-muted-foreground">{revenue.artist}</p>
                  </div>
                  
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-mono font-semibold text-accent">
                      {formatCurrency(revenue.amount)}
                    </p>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveRevenue(revenue.id)}
                    className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive flex-shrink-0"
                  >
                    <Trash size={16} />
                  </Button>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <Card className="p-8 text-center border-dashed">
            <CurrencyEur size={32} className="mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {filterArtist ? `No manual revenues for ${filterArtist}` : 'No manual revenue entries yet'}
            </p>
          </Card>
        )}
      </AnimatePresence>
    </div>
  )
}
