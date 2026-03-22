import { Plus, Trash, FunnelSimple } from '@phosphor-icons/react'
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
import type { CompilationFilter } from '@/lib/types'

interface CompilationFilterManagerProps {
  filters: CompilationFilter[]
  onAddFilter: (filter: Omit<CompilationFilter, 'id'>) => void
  onRemoveFilter: (id: string) => void
}

export function CompilationFilterManager({
  filters,
  onAddFilter,
  onRemoveFilter,
}: CompilationFilterManagerProps) {
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<'ean' | 'title' | 'catalog'>('ean')
  const [identifier, setIdentifier] = useState('')

  const handleAdd = () => {
    if (identifier.trim()) {
      onAddFilter({
        identifier: identifier.trim(),
        type,
        label: identifier.trim(),
      })
      setIdentifier('')
      setOpen(false)
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'ean':
        return 'EAN/UPC'
      case 'title':
        return 'Release Title'
      case 'catalog':
        return 'Catalog Number'
      default:
        return type
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FunnelSimple size={20} weight="bold" className="text-primary" />
          <h3 className="font-semibold">Compilation Exclusions</h3>
        </div>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus size={16} weight="bold" />
              Add Exclusion
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Exclude Compilation</DialogTitle>
              <DialogDescription>
                Add a compilation to exclude from artist statements
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="filter-type">Identifier Type</Label>
                <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
                  <SelectTrigger id="filter-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ean">EAN/UPC</SelectItem>
                    <SelectItem value="title">Release Title</SelectItem>
                    <SelectItem value="catalog">Catalog Number</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="filter-value">{getTypeLabel(type)}</Label>
                <Input
                  id="filter-value"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={`Enter ${getTypeLabel(type).toLowerCase()}`}
                  onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAdd} disabled={!identifier.trim()}>
                Add Exclusion
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <AnimatePresence mode="popLayout">
        {filters.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-2"
          >
            {filters.map((filter, index) => (
              <motion.div
                key={filter.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="p-3 flex items-center gap-3 bg-card hover:shadow-md transition-shadow">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{filter.label}</p>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                      {getTypeLabel(filter.type)}
                    </p>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveFilter(filter.id)}
                    className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash size={16} />
                  </Button>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <Card className="p-8 text-center border-dashed">
            <FunnelSimple size={32} className="mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No compilations excluded yet
            </p>
          </Card>
        )}
      </AnimatePresence>
    </div>
  )
}
