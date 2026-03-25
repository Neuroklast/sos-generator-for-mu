import { Minus, Trash, MagnifyingGlass, X } from '@phosphor-icons/react'
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
import type { ExpenseEntry } from '@/lib/types'

const CUSTOM_ARTIST_VALUE = '__custom_artist__'

interface ExpenseManagerProps {
  expenses: ExpenseEntry[]
  artists: string[]
  onAddExpense: (expense: Omit<ExpenseEntry, 'id'>) => void
  onRemoveExpense: (id: string) => void
}

export function ExpenseManager({
  expenses,
  artists,
  onAddExpense,
  onRemoveExpense,
}: ExpenseManagerProps) {
  const [open, setOpen] = useState(false)
  const [artist, setArtist] = useState('')
  const [customArtist, setCustomArtist] = useState('')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))

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
    if (!effectiveArtist) return
    if (!description.trim()) return
    if (isNaN(amountNum) || amountNum <= 0) return
    onAddExpense({
      artist: effectiveArtist,
      description: description.trim(),
      amount: amountNum,
      date,
    })
    setArtist('')
    setCustomArtist('')
    setDescription('')
    setAmount('')
    setDate(new Date().toISOString().slice(0, 10))
    setOpen(false)
  }

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value)

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)

  // All known artists from the list + any custom ones already in expenses.
  // We merge both sources so that expenses added with a "custom artist name"
  // still appear in the filter even if that artist is not yet in the roster.
  const allKnownArtists = useMemo(() => {
    const fromExpenses = expenses.map(e => e.artist)
    return Array.from(new Set([...artists, ...fromExpenses])).sort((a, b) =>
      a.localeCompare(b)
    )
  }, [artists, expenses])

  const filteredSearchArtists = useMemo(
    () =>
      allKnownArtists.filter(a =>
        a.toLowerCase().includes(filterSearch.toLowerCase())
      ),
    [allKnownArtists, filterSearch]
  )

  const displayedExpenses = useMemo(
    () =>
      filterArtist
        ? expenses.filter(e => e.artist === filterArtist)
        : expenses,
    [expenses, filterArtist]
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Minus size={20} weight="bold" className="text-destructive" />
          <h3 className="font-semibold">Recoupable Expenses</h3>
          {expenses.length > 0 && (
            <span className="text-xs text-muted-foreground bg-destructive/10 text-destructive px-2 py-0.5 rounded-full font-mono">
              - {formatCurrency(totalExpenses)}
            </span>
          )}
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="gap-2 border-destructive/40 text-destructive hover:bg-destructive/10">
              <Minus size={16} weight="bold" />
              Add Expense
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Recoupable Expense</DialogTitle>
              <DialogDescription>
                Add a marketing cost, advance, or production expense to be deducted from an
                artist's gross revenue before the split percentage is applied.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="expense-artist">Artist</Label>
                <Select value={artist} onValueChange={handleArtistChange}>
                  <SelectTrigger id="expense-artist">
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
                <Label htmlFor="expense-description">Description</Label>
                <Input
                  id="expense-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="z.B. Musikvideo-Produktion, PR-Agentur"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="expense-amount">Amount (EUR)</Label>
                  <Input
                    id="expense-amount"
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
                <div className="space-y-2">
                  <Label htmlFor="expense-date">Date</Label>
                  <Input
                    id="expense-date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleAdd}
                disabled={!effectiveArtist || !description.trim() || !amount || parseFloat(amount) <= 0}
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              >
                Add Expense
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* ── Artist filter ── */}
      {expenses.length > 0 && (
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
              {displayedExpenses.length} entry{displayedExpenses.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      )}

      {/* ── Artist quick-select pills ── */}
      {expenses.length > 0 && allKnownArtists.length > 0 && !filterSearch && (
        <div className="flex flex-wrap gap-1.5">
          {allKnownArtists.filter(a => expenses.some(e => e.artist === a)).map(a => (
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
        {displayedExpenses.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-2"
          >
            {displayedExpenses.map((expense, index) => (
              <motion.div
                key={expense.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="p-3 flex items-center gap-3 bg-card hover:shadow-md transition-shadow border-destructive/20">
                  <div className="p-2 bg-destructive/10 rounded">
                    <Minus size={20} weight="fill" className="text-destructive" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{expense.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {expense.artist}
                      {expense.date && (
                        <span className="ml-2 opacity-60">{expense.date}</span>
                      )}
                    </p>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-mono font-semibold text-destructive">
                      - {formatCurrency(expense.amount)}
                    </p>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveExpense(expense.id)}
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
            <Minus size={32} className="mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {filterArtist ? `No expenses for ${filterArtist}` : 'No expense entries yet'}
            </p>
            {!filterArtist && (
              <p className="text-xs text-muted-foreground/60 mt-1">
                Add marketing costs, advances, and production expenses to deduct them before the split.
              </p>
            )}
          </Card>
        )}
      </AnimatePresence>
    </div>
  )
}
