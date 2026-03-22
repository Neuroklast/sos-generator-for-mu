import { useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { FileUploadZone } from '@/components/FileUploadZone'
import { CompilationFilterManager } from '@/components/CompilationFilterManager'
import { ArtistMappingManager } from '@/components/ArtistMappingManager'
import { SplitFeeManager } from '@/components/SplitFeeManager'
import { ManualRevenueManager } from '@/components/ManualRevenueManager'
import { LabelBranding } from '@/components/LabelBranding'
import { RevenueDashboard } from '@/components/RevenueDashboard'
import { Toaster } from '@/components/ui/sonner'
import { toast } from 'sonner'
import type {
  UploadedFile,
  CompilationFilter,
  ArtistMapping,
  SplitFee,
  ManualRevenue,
  LabelInfo,
  ArtistRevenue,
} from '@/lib/types'

function App() {
  const [believeFiles, setBelieveFiles] = useKV<UploadedFile[]>('believe-files', [])
  const [bandcampFiles, setBandcampFiles] = useKV<UploadedFile[]>('bandcamp-files', [])
  const [compilationFilters, setCompilationFilters] = useKV<CompilationFilter[]>('compilation-filters', [])
  const [artistMappings, setArtistMappings] = useKV<ArtistMapping[]>('artist-mappings', [])
  const [splitFees, setSplitFees] = useKV<SplitFee[]>('split-fees', [])
  const [manualRevenues, setManualRevenues] = useKV<ManualRevenue[]>('manual-revenues', [])
  const [labelInfo, setLabelInfo] = useKV<LabelInfo>('label-info', { name: '', address: '' })
  
  const [artistRevenues, setArtistRevenues] = useState<ArtistRevenue[]>([])

  const generateId = () => crypto.randomUUID()

  const handleBelieveFilesAdded = async (files: File[]) => {
    const newFiles: UploadedFile[] = []
    
    for (const file of files) {
      const text = await file.text()
      newFiles.push({
        id: generateId(),
        name: file.name,
        size: file.size,
        type: 'believe',
        data: text,
        uploadedAt: new Date(),
      })
    }
    
    setBelieveFiles((current) => [...(current || []), ...newFiles])
    toast.success(`Added ${files.length} Believe file(s)`)
  }

  const handleBandcampFilesAdded = async (files: File[]) => {
    const newFiles: UploadedFile[] = []
    
    for (const file of files) {
      const text = await file.text()
      newFiles.push({
        id: generateId(),
        name: file.name,
        size: file.size,
        type: 'bandcamp',
        data: text,
        uploadedAt: new Date(),
      })
    }
    
    setBandcampFiles((current) => [...(current || []), ...newFiles])
    toast.success(`Added ${files.length} Bandcamp file(s)`)
  }

  const handleBelieveFileRemoved = (id: string) => {
    setBelieveFiles((current) => (current || []).filter((f) => f.id !== id))
  }

  const handleBandcampFileRemoved = (id: string) => {
    setBandcampFiles((current) => (current || []).filter((f) => f.id !== id))
  }

  const handleAddFilter = (filter: Omit<CompilationFilter, 'id'>) => {
    setCompilationFilters((current) => [...(current || []), { ...filter, id: generateId() }])
    toast.success('Compilation excluded')
  }

  const handleRemoveFilter = (id: string) => {
    setCompilationFilters((current) => (current || []).filter((f) => f.id !== id))
  }

  const handleAddMapping = (mapping: Omit<ArtistMapping, 'id'>) => {
    setArtistMappings((current) => [...(current || []), { ...mapping, id: generateId() }])
    toast.success('Artist mapping added')
  }

  const handleRemoveMapping = (id: string) => {
    setArtistMappings((current) => (current || []).filter((m) => m.id !== id))
  }

  const handleUpdateSplitFee = (artist: string, percentage: number) => {
    setSplitFees((current) => {
      const curr = current || []
      const existing = curr.find((s) => s.artist === artist)
      if (existing) {
        return curr.map((s) => (s.artist === artist ? { ...s, percentage } : s))
      }
      return [...curr, { artist, percentage }]
    })
  }

  const handleAddRevenue = (revenue: Omit<ManualRevenue, 'id'>) => {
    setManualRevenues((current) => [...(current || []), { ...revenue, id: generateId() }])
    toast.success('Manual revenue added')
  }

  const handleRemoveRevenue = (id: string) => {
    setManualRevenues((current) => (current || []).filter((r) => r.id !== id))
  }

  useEffect(() => {
    const artistSet = new Set<string>()
    
    if ((believeFiles || []).length > 0) {
      artistSet.add('Sample Artist A')
      artistSet.add('Sample Artist B')
    }
    
    if ((bandcampFiles || []).length > 0) {
      artistSet.add('Sample Artist A')
      artistSet.add('Sample Artist C')
    }

    const revenues: ArtistRevenue[] = Array.from(artistSet).map((artist) => {
      const believeRev = Math.random() * 5000
      const bandcampRev = Math.random() * 2000
      const manualRev = (manualRevenues || [])
        .filter((r) => r.artist === artist)
        .reduce((sum, r) => sum + r.amount, 0)
      
      const total = believeRev + bandcampRev + manualRev
      const split = (splitFees || []).find((s) => s.artist === artist)?.percentage || 100
      const final = total * (split / 100)

      return {
        artist,
        believeRevenue: believeRev,
        bandcampRevenue: bandcampRev,
        manualRevenue: manualRev,
        totalRevenue: total,
        splitPercentage: split,
        finalAmount: final,
      }
    })

    setArtistRevenues(revenues)

    revenues.forEach((rev) => {
      const existingSplit = (splitFees || []).find((s) => s.artist === rev.artist)
      if (!existingSplit) {
        setSplitFees((current) => [...(current || []), { artist: rev.artist, percentage: 100 }])
      }
    })
  }, [believeFiles, bandcampFiles, manualRevenues, splitFees, setSplitFees])

  const handleDownloadAll = () => {
    console.log('Downloading all statements as ZIP')
  }

  const handleDownloadPDF = (artist: string) => {
    console.log(`Downloading PDF for ${artist}`)
  }

  const handleDownloadExcel = (artist: string) => {
    console.log(`Downloading Excel for ${artist}`)
  }

  const artistList = Array.from(new Set(artistRevenues.map((r) => r.artist)))

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-8 md:py-12 max-w-7xl">
        <div className="mb-8 md:mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-3 font-['Space_Grotesk'] tracking-tight text-primary">
            SOS Generator
          </h1>
          <p className="text-lg text-muted-foreground">
            Statement of Sales Tool for Music Labels
          </p>
        </div>

        <Tabs defaultValue="import" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
            <TabsTrigger value="import">Import</TabsTrigger>
            <TabsTrigger value="configure">Configure</TabsTrigger>
            <TabsTrigger value="branding">Branding</TabsTrigger>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          </TabsList>

          <TabsContent value="import" className="space-y-6">
            <Card className="p-6 md:p-8">
              <h2 className="text-2xl font-bold mb-6 font-['Space_Grotesk']">Data Import</h2>
              
              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Believe CSV Files</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Upload multiple 6-month export files for annual statements
                  </p>
                  <FileUploadZone
                    type="believe"
                    files={believeFiles || []}
                    onFilesAdded={handleBelieveFilesAdded}
                    onFileRemoved={handleBelieveFileRemoved}
                  />
                </div>

                <Separator />

                <div>
                  <h3 className="text-lg font-semibold mb-4">Bandcamp CSV Files</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Upload Bandcamp sales reports
                  </p>
                  <FileUploadZone
                    type="bandcamp"
                    files={bandcampFiles || []}
                    onFilesAdded={handleBandcampFilesAdded}
                    onFileRemoved={handleBandcampFileRemoved}
                  />
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="configure" className="space-y-6">
            <Card className="p-6 md:p-8">
              <h2 className="text-2xl font-bold mb-6 font-['Space_Grotesk']">Configuration</h2>
              
              <div className="space-y-8">
                <CompilationFilterManager
                  filters={compilationFilters || []}
                  onAddFilter={handleAddFilter}
                  onRemoveFilter={handleRemoveFilter}
                />

                <Separator />

                <ArtistMappingManager
                  mappings={artistMappings || []}
                  onAddMapping={handleAddMapping}
                  onRemoveMapping={handleRemoveMapping}
                />

                <Separator />

                <SplitFeeManager
                  splitFees={splitFees || []}
                  onUpdateSplitFee={handleUpdateSplitFee}
                />

                <Separator />

                <ManualRevenueManager
                  revenues={manualRevenues || []}
                  artists={artistList}
                  onAddRevenue={handleAddRevenue}
                  onRemoveRevenue={handleRemoveRevenue}
                />
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="branding" className="space-y-6">
            <Card className="p-6 md:p-8">
              <h2 className="text-2xl font-bold mb-6 font-['Space_Grotesk']">Label Branding</h2>
              <LabelBranding labelInfo={labelInfo || { name: '', address: '' }} onUpdate={setLabelInfo} />
            </Card>
          </TabsContent>

          <TabsContent value="dashboard" className="space-y-6">
            <RevenueDashboard
              revenues={artistRevenues}
              onDownloadAll={handleDownloadAll}
              onDownloadPDF={handleDownloadPDF}
              onDownloadExcel={handleDownloadExcel}
            />
          </TabsContent>
        </Tabs>
      </div>
      
      <Toaster />
    </div>
  )
}

export default App
