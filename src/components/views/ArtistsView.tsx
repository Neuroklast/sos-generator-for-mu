import { Card } from '@/components/ui/card'
import { ArtistTreeView } from '@/components/ArtistTreeView'
import { ArtistMappingManager } from '@/components/ArtistMappingManager'
import type { ArtistTreeNode, ArtistCollabNode, ArtistMapping } from '@/lib/types'

interface ArtistsViewProps {
  artistTrees: ArtistTreeNode[]
  collabTree: ArtistCollabNode[]
  artistMappings: ArtistMapping[]
  onAddMapping: (mapping: Omit<ArtistMapping, 'id'>) => void
  onRemoveMapping: (id: string) => void
  onUpdateMapping: (id: string, update: Omit<ArtistMapping, 'id'>) => void
  uniqueArtists: string[]
  autoMappings: ArtistMapping[]
}

export function ArtistsView({
  artistTrees,
  collabTree,
  artistMappings,
  onAddMapping,
  onRemoveMapping,
  onUpdateMapping,
  uniqueArtists,
  autoMappings,
}: ArtistsViewProps) {
  return (
    <div className="space-y-8">
      <Card className="border border-white/10 bg-card backdrop-blur-md rounded-2xl overflow-hidden">
        <ArtistTreeView treeNodes={artistTrees} collabTree={collabTree} />
      </Card>
      <Card className="p-8 border border-white/10 bg-card backdrop-blur-md rounded-2xl">
        <ArtistMappingManager
          mappings={artistMappings}
          onAddMapping={onAddMapping}
          onRemoveMapping={onRemoveMapping}
          onUpdateMapping={onUpdateMapping}
          artists={uniqueArtists}
          autoMappings={autoMappings}
        />
      </Card>
    </div>
  )
}
