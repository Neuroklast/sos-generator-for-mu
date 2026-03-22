import { Plus, Trash, GitBranch } from '@phosphor-icons/react'
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
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { ArtistMapping } from '@/lib/types'

interface ArtistMappingManagerProps {
  mappings: ArtistMapping[]
  onAddMapping: (mapping: Omit<ArtistMapping, 'id'>) => void
  onRemoveMapping: (id: string) => void
}

export function ArtistMappingManager({
  mappings,
  onAddMapping,
  onRemoveMapping,
}: ArtistMappingManagerProps) {
  const [open, setOpen] = useState(false)
  const [featuringName, setFeaturingName] = useState('')
  const [primaryArtist, setPrimaryArtist] = useState('')

  const handleAdd = () => {
    if (featuringName.trim() && primaryArtist.trim()) {
      onAddMapping({
        featuringName: featuringName.trim(),
        primaryArtist: primaryArtist.trim(),
      })
      setFeaturingName('')
      setPrimaryArtist('')
      setOpen(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GitBranch size={20} weight="bold" className="text-primary" />
          <h3 className="font-semibold">Artist Mappings</h3>
        </div>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus size={16} weight="bold" />
              Add Mapping
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Map Featuring Artist</DialogTitle>
              <DialogDescription>
                Map a featuring credit to a primary artist for revenue attribution
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="featuring-name">Featuring Name</Label>
                <Input
                  id="featuring-name"
                  value={featuringName}
                  onChange={(e) => setFeaturingName(e.target.value)}
                  placeholder="e.g., Artist A feat. Artist B"
                />
              </div>
              
              <div className="flex items-center justify-center">
                <GitBranch size={24} className="text-muted-foreground" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="primary-artist">Primary Artist</Label>
                <Input
                  id="primary-artist"
                  value={primaryArtist}
                  onChange={(e) => setPrimaryArtist(e.target.value)}
                  placeholder="e.g., Artist A"
                  onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAdd} disabled={!featuringName.trim() || !primaryArtist.trim()}>
                Add Mapping
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <AnimatePresence mode="popLayout">
        {mappings.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-2"
          >
            {mappings.map((mapping, index) => (
              <motion.div
                key={mapping.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="p-3 flex items-center gap-3 bg-card hover:shadow-md transition-shadow">
                  <GitBranch size={20} className="text-primary flex-shrink-0" />
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{mapping.featuringName}</p>
                    <p className="text-xs text-muted-foreground">
                      → {mapping.primaryArtist}
                    </p>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveMapping(mapping.id)}
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
            <GitBranch size={32} className="mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No artist mappings configured yet
            </p>
          </Card>
        )}
      </AnimatePresence>
    </div>
  )
}
