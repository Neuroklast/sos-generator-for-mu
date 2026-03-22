import { Plus, Trash, CurrencyEur } from '@phosphor-icons/react'
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
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { ManualRevenue } from '@/lib/types'

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
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')

  const handleAdd = () => {
    const amountNum = parseFloat(amount)
    if (artist && description.trim() && !isNaN(amountNum) && amountNum > 0) {
      onAddRevenue({
        artist,
        description: description.trim(),
        amount: amountNum,
      })
      setArtist('')
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CurrencyEur size={20} weight="bold" className="text-primary" />
          <h3 className="font-semibold">Manual Revenue</h3>
        </div>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2" disabled={artists.length === 0}>
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
                <Select value={artist} onValueChange={setArtist}>
                  <SelectTrigger id="revenue-artist">
                    <SelectValue placeholder="Select artist" />
                  </SelectTrigger>
                  <SelectContent>
                    {artists.map((a) => (
                      <SelectItem key={a} value={a}>
                        {a}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                disabled={!artist || !description.trim() || !amount || parseFloat(amount) <= 0}
              >
                Add Revenue
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <AnimatePresence mode="popLayout">
        {revenues.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-2"
          >
            {revenues.map((revenue, index) => (
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
              No manual revenue entries yet
            </p>
          </Card>
        )}
      </AnimatePresence>
    </div>
  )
}
