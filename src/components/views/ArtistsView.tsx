import { Card } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ArtistTreeView } from '@/components/ArtistTreeView'
import { ArtistMappingManager } from '@/components/ArtistMappingManager'
import { LabelArtistManager } from '@/components/LabelArtistManager'
import { SplitFeeManager } from '@/components/SplitFeeManager'
import type {
  ArtistTreeNode,
  ArtistCollabNode,
  ArtistMapping,
  LabelArtist,
  SplitFee,
} from '@/lib/types'

interface ArtistsViewProps {
  // ── Artist tree data ──────────────────────────────────────────────────────
  artistTrees: ArtistTreeNode[]
  collabTree: ArtistCollabNode[]
  uniqueArtists: string[]
  autoMappings: ArtistMapping[]

  // ── Artist mapping (Abrechnungsregeln) ───────────────────────────────────
  artistMappings: ArtistMapping[]
  onAddMapping: (mapping: Omit<ArtistMapping, 'id'>) => void
  onRemoveMapping: (id: string) => void
  onUpdateMapping: (id: string, update: Omit<ArtistMapping, 'id'>) => void

  // ── Label artist roster (Stammdaten) ─────────────────────────────────────
  labelArtists: LabelArtist[]
  onAddLabelArtist: (name: string) => void
  onRemoveLabelArtist: (id: string) => void
  onUpdateLabelArtist: (id: string, patch: Omit<LabelArtist, 'id'>) => void
  onImportLabelArtistsCSV: (artists: Omit<LabelArtist, 'id'>[]) => void

  // ── Split fees (Abrechnungsregeln) ───────────────────────────────────────
  splitFees: SplitFee[]
  onUpdateSplitFee: (artist: string, percentage: number) => void
  onBulkUpdateSplitFee: (artists: string[], percentage: number) => void
}

export function ArtistsView({
  artistTrees,
  collabTree,
  uniqueArtists,
  autoMappings,
  artistMappings,
  onAddMapping,
  onRemoveMapping,
  onUpdateMapping,
  labelArtists,
  onAddLabelArtist,
  onRemoveLabelArtist,
  onUpdateLabelArtist,
  onImportLabelArtistsCSV,
  splitFees,
  onUpdateSplitFee,
  onBulkUpdateSplitFee,
}: ArtistsViewProps) {
  return (
    <Tabs defaultValue="stammdaten" className="space-y-6">
      <TabsList className="grid grid-cols-2 w-full max-w-md">
        <TabsTrigger value="stammdaten">Stammdaten</TabsTrigger>
        <TabsTrigger value="abrechnungsregeln">Abrechnungsregeln</TabsTrigger>
      </TabsList>

      {/* ── Stammdaten Tab ── */}
      <TabsContent value="stammdaten" className="space-y-8">
        <Card className="border border-white/10 bg-card backdrop-blur-md rounded-2xl overflow-hidden">
          <ArtistTreeView treeNodes={artistTrees} collabTree={collabTree} />
        </Card>
        <Card className="p-8 border border-white/10 bg-card backdrop-blur-md rounded-2xl">
          <LabelArtistManager
            artists={labelArtists}
            onAdd={onAddLabelArtist}
            onRemove={onRemoveLabelArtist}
            onUpdate={onUpdateLabelArtist}
            onImportCSV={onImportLabelArtistsCSV}
          />
        </Card>
      </TabsContent>

      {/* ── Abrechnungsregeln Tab ── */}
      <TabsContent value="abrechnungsregeln" className="space-y-8">
        <Card className="p-8 border border-white/10 bg-card backdrop-blur-md rounded-2xl">
          <SplitFeeManager
            splitFees={splitFees}
            onUpdateSplitFee={onUpdateSplitFee}
            onBulkUpdateSplitFee={onBulkUpdateSplitFee}
          />
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
      </TabsContent>
    </Tabs>
  )
}
