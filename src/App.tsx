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
import { parseCSVContent, suggestArtistMappings } from '@/lib/csv-parser'
import { processTransactions, getUniqueArtistsFromTransactions } from '@/lib/data-processor'
import { generatePDF, generateExcel, downloadBlob, generateZipOfAllStatements } from '@/lib/export-utils'
import type { 
  UploadedFile, 
  CompilationFilter, 
  ArtistMapping, 
  SplitFee, 
  ManualRevenue, 
  LabelInfo 
} from '@/lib/types'
import type { SalesTransaction } from '@/lib/csv-parser'
import type { ProcessedArtistData } from '@/lib/data-processor'

function App() {
  const [believeFiles, setBelieveFiles] = useKV<UploadedFile[]>('believe-files', [])
  const [bandcampFiles, setBandcampFiles] = useKV<UploadedFile[]>('bandcamp-files', [])
  const [compilationFilters, setCompilationFilters] = useKV<CompilationFilter[]>('compilation-filters', [])
  const [artistMappings, setArtistMappings] = useKV<ArtistMapping[]>('artist-mappings', [])
  const [splitFees, setSplitFees] = useKV<SplitFee[]>('split-fees', [])
  const [manualRevenues, setManualRevenues] = useKV<ManualRevenue[]>('manual-revenues', [])
  const [labelInfo, setLabelInfo] = useKV<LabelInfo>('label-info', { name: '', address: '' })
  
  const [allTransactions, setAllTransactions] = useState<SalesTransaction[]>([])
  const [processedData, setProcessedData] = useState<ProcessedArtistData[]>([])

  const generateId = () => crypto.randomUUID()

  const handleBelieveFilesAdded = async (files: File[]) => {
    const newFiles: UploadedFile[] = []
    let totalNewArtists = 0
    let totalNewMappings = 0
    
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

      const parsed = parseCSVContent(text, 'believe')
      totalNewArtists += parsed.uniqueArtists.length
      
      const suggestions = suggestArtistMappings(parsed.uniqueArtists)
      totalNewMappings += suggestions.length

      if (suggestions.length > 0) {
        setArtistMappings((current) => {
          const existing = current || []
          const newMappings = suggestions
            .filter(s => !existing.find(e => e.featuringName === s.featuringName))
            .map(s => ({
              id: generateId(),
              featuringName: s.featuringName,
              primaryArtist: s.primaryArtist,
            }))
          return [...existing, ...newMappings]
        })
      }

      if (parsed.errors.length > 0) {
        console.warn(`${parsed.errors.length} errors in ${file.name}:`, parsed.errors)
      }
    }

    setBelieveFiles((current) => [...(current || []), ...newFiles])
    toast.success(
      `Added ${newFiles.length} Believe file${newFiles.length > 1 ? 's' : ''} with ${totalNewArtists} artists${totalNewMappings > 0 ? ` (${totalNewMappings} mappings suggested)` : ''}`
    )
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
    toast.success(`Added ${newFiles.length} Bandcamp file${newFiles.length > 1 ? 's' : ''}`)
  }

  const handleRemoveBelieveFile = (id: string) => {
    setBelieveFiles((current) => (current || []).filter(f => f.id !== id))
    toast.info('File removed')
  }

  const handleRemoveBandcampFile = (id: string) => {
    setBandcampFiles((current) => (current || []).filter(f => f.id !== id))
    toast.info('File removed')
  }

  const handleAddFilter = (filter: Omit<CompilationFilter, 'id'>) => {
    const newFilter: CompilationFilter = { ...filter, id: generateId() }
    setCompilationFilters((current) => [...(current || []), newFilter])
  }

  const handleRemoveFilter = (id: string) => {
    setCompilationFilters((current) => (current || []).filter(f => f.id !== id))
  }

  const handleAddMapping = (mapping: Omit<ArtistMapping, 'id'>) => {
    const newMapping: ArtistMapping = { ...mapping, id: generateId() }
    toast.success(`Mapped "${mapping.featuringName}" → "${mapping.primaryArtist}"`)
    setArtistMappings((current) => [...(current || []), newMapping])
  }

  const handleRemoveMapping = (id: string) => {
    setArtistMappings((current) => (current || []).filter(m => m.id !== id))
  }

  const handleUpdateSplitFee = (artist: string, percentage: number) => {
    setSplitFees((current) => {
      const existing = (current || []).find((s) => s.artist === artist)
      if (existing) {
        return (current || []).map((s) => (s.artist === artist ? { ...s, percentage } : s))
      } else {
        return [...(current || []), { artist, percentage }]
      }
    })
  }

  const handleAddManualRevenue = (revenue: Omit<ManualRevenue, 'id'>) => {
    const newRevenue: ManualRevenue = { ...revenue, id: generateId() }
    toast.success(`Added ${revenue.description} for ${revenue.artist}`)
    setManualRevenues((current) => [...(current || []), newRevenue])
  }

  const handleRemoveRevenue = (id: string) => {
    setManualRevenues((current) => (current || []).filter(r => r.id !== id))
  }

  useEffect(() => {
    const allTrans: SalesTransaction[] = []

    for (const file of (believeFiles || [])) {
      const parsed = parseCSVContent(file.data, 'believe')
      allTrans.push(...parsed.transactions)
    }

    for (const file of (bandcampFiles || [])) {
      const parsed = parseCSVContent(file.data, 'bandcamp')
      allTrans.push(...parsed.transactions)
    }

    setAllTransactions(allTrans)

    if (allTrans.length === 0) {
      setProcessedData([])
      return
    }

    const processed = processTransactions(allTrans, {
      compilationFilters: compilationFilters || [],
      artistMappings: artistMappings || [],
      splitFees: splitFees || [],
      manualRevenues: manualRevenues || [],
    })

    setProcessedData(processed)

    const artistList = getUniqueArtistsFromTransactions(allTrans, artistMappings || [])
    const newArtistsWithoutSplits = artistList.filter(
      (artist) => !(splitFees || []).find((s) => s.artist === artist)
    )

    if (newArtistsWithoutSplits.length > 0) {
      setSplitFees((current) => [
        ...(current || []),
        ...newArtistsWithoutSplits.map((artist) => ({ artist, percentage: 100 })),
      ])
    }
  }, [believeFiles, bandcampFiles, compilationFilters, artistMappings, splitFees, manualRevenues])

  const handleDownloadAll = async () => {
    try {
      const zipBlob = await generateZipOfAllStatements(processedData, labelInfo || { name: '', address: '' })
      downloadBlob(zipBlob, 'all_statements.zip')
      toast.success('All statements downloaded as ZIP')
    } catch (error) {
      console.error(error)
      toast.error('Failed to generate ZIP file')
    }
  }

  const handleDownloadPDF = (artist: string) => {
    try {
      const artistData = processedData.find(d => d.artist === artist)
      if (!artistData) {
        toast.error(`No data found for ${artist}`)
        return
      }
      const pdfBlob = generatePDF(artistData, labelInfo || { name: '', address: '' })
      downloadBlob(pdfBlob, `${artist.replace(/[^a-z0-9]/gi, '_')}_statement.pdf`)
      toast.success(`PDF generated for ${artist}`)
    } catch (error) {
      console.error(error)
      toast.error('Failed to generate PDF')
    }
  }

  const handleDownloadExcel = (artist: string) => {
    try {
      const artistData = processedData.find(d => d.artist === artist)
      if (!artistData) {
        toast.error(`No data found for ${artist}`)
        return
      }
      const excelBlob = generateExcel(artistData, labelInfo || { name: '', address: '' })
      downloadBlob(excelBlob, `${artist.replace(/[^a-z0-9]/gi, '_')}_statement.xlsx`)
      toast.success(`Excel generated for ${artist}`)
    } catch (error) {
      console.error(error)
      toast.error('Failed to generate Excel file')
    }
  }

  const artistList = getUniqueArtistsFromTransactions(allTransactions, artistMappings || [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-8 md:py-12 max-w-7xl">
        <div className="mb-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            SOS Generator
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Statement of Sales Tool for Independent Labels
          </p>
        </div>

        <Tabs defaultValue="import" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 max-w-2xl mx-auto">
            <TabsTrigger value="import">Import</TabsTrigger>
            <TabsTrigger value="config">Configure</TabsTrigger>
            <TabsTrigger value="branding">Branding</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="import" className="space-y-6">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4">Upload Data</h2>
              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Believe Digital</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Upload multiple 6-month export CSV files from Believe Digital
                  </p>
                  <FileUploadZone
                    type="believe"
                    files={believeFiles || []}
                    onFilesAdded={handleBelieveFilesAdded}
                    onFileRemoved={handleRemoveBelieveFile}
                  />
                </div>

                <Separator />

                <div>
                  <h3 className="text-lg font-semibold mb-2">Bandcamp</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Upload sales report CSV files from Bandcamp
                  </p>
                  <FileUploadZone
                    type="bandcamp"
                    files={bandcampFiles || []}
                    onFilesAdded={handleBandcampFilesAdded}
                    onFileRemoved={handleRemoveBandcampFile}
                  />
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="config" className="space-y-6">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4">Configuration</h2>
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
                  onAddRevenue={handleAddManualRevenue}
                  onRemoveRevenue={handleRemoveRevenue}
                />
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="branding" className="space-y-6">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4">Label Branding</h2>
              <LabelBranding labelInfo={labelInfo || { name: '', address: '' }} onUpdate={setLabelInfo} />
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4">Revenue Reports</h2>
              <RevenueDashboard
                revenues={processedData.map(p => ({
                  artist: p.artist,
                  believeRevenue: p.totalDigitalRevenue,
                  bandcampRevenue: p.totalPhysicalRevenue,
                  manualRevenue: p.manualRevenue,
                  totalRevenue: p.grossRevenue,
                  splitPercentage: p.splitPercentage,
                  finalAmount: p.finalPayout
                }))}
                onDownloadAll={handleDownloadAll}
                onDownloadPDF={handleDownloadPDF}
                onDownloadExcel={handleDownloadExcel}
              />
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      <Toaster />
    </div>
  )
}

export default App
