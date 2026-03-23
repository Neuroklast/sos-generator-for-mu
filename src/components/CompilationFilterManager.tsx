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
import { useCallback, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { CompilationFilter } from '@/lib/types'

interface CompilationFilterManagerProps {
  filters: CompilationFilter[]
  onAddFilter: (filter: Omit<CompilationFilter, 'id'>) => void
  onRemoveFilter: (id: string) => void
}

type FilterType = 'ean' | 'title' | 'catalog'

const FILTER_TYPE_LABELS: Record<FilterType, string> = {
  ean: 'EAN / UPC',
  title: 'Release Title',
  catalog: 'Catalog Number',
}

const DEFAULT_TYPE: FilterType = 'ean'

function useDialogForm() {
  const [type, setType] = useState<FilterType>(DEFAULT_TYPE)
  const [identifier, setIdentifier] = useState('')

  const reset = useCallback(() => {
    setType(DEFAULT_TYPE)
    setIdentifier('')
  }, [])

  return { type, setType, identifier, setIdentifier, reset }
}

export function CompilationFilterManager({
  filters,
  onAddFilter,
  onRemoveFilter,
}: CompilationFilterManagerProps) {
  const [open, setOpen] = useState(false)
  const { type, setType, identifier, setIdentifier, reset } = useDialogForm()

  const handleOpenChange = useCallback(
    (next: boolean) => {
      setOpen(next)
      if (!next) reset()
    },
    [reset]
  )

  const handleAdd = useCallback(() => {
    const trimmed = identifier.trim()
    if (!trimmed) return
    onAddFilter({ identifier: trimmed, type, label: trimmed })
    handleOpenChange(false)
  }, [identifier, type, onAddFilter, handleOpenChange])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FunnelSimple size={20} weight="bold" className="text-primary" />
          <h3 className="font-semibold">Compilation Exclusions</h3>
        </div>

        <Dialog open={open} onOpenChange={handleOpenChange}>
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
                <Select value={type} onValueChange={v => setType(v as FilterType)}>
                  <SelectTrigger id="filter-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(FILTER_TYPE_LABELS) as FilterType[]).map(t => (
                      <SelectItem key={t} value={t}>
                        {FILTER_TYPE_LABELS[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="filter-value">{FILTER_TYPE_LABELS[type]}</Label>
                <Input
                  id="filter-value"
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  placeholder={`Enter ${FILTER_TYPE_LABELS[type].toLowerCase()}`}
                  onKeyDown={e => e.key === 'Enter' && handleAdd()}
                  autoFocus
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
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
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
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
                      {FILTER_TYPE_LABELS[filter.type]}
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
            <p className="text-sm text-muted-foreground">No compilations excluded yet</p>
          </Card>
        )}
      </AnimatePresence>
    </div>
  )
}
