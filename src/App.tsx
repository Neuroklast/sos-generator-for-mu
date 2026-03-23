import { useState, useMemo, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { FileUploadZone } from '@/components/FileUploadZone'
import { CompilationFilterManager } from '@/components/CompilationFilterManager'
import { ArtistMappingManager } from '@/components/ArtistMappingManager'
import { SplitFeeManager } from '@/components/SplitFeeManager'
import { ManualRevenueManager } from '@/components/ManualRevenueManager'
import { LabelBranding } from '@/components/LabelBranding'
import { RevenueDashboard } from '@/components/RevenueDashboard'
import { parseCSVContent } from '@/lib/csv-parser'
import { processTransactions, getUniqueArtistsFromTransactions } from '@/lib/data-processor'
import { generatePDF, generateExcel, downloadBlob, generateZipOfAllStatements } from '@/lib/export-utils'
import { MusicNotes } from '@phosphor-icons/react'
import { toast } from 'sonner'
import type { UploadedFile, CompilationFilter, ArtistMapping, SplitFee, ManualRevenue, LabelInfo, ArtistRevenue } from '@/lib/types'
import type { SalesTransaction } from '@/lib/csv-parser'

function App() {
  const [believeFiles, setBelieveFiles] = useKV<UploadedFile[]>('believe-files', [])
  const [bandcampFiles, setBandcampFiles] = useKV<UploadedFile[]>('bandcamp-files', [])
  const [compilationFilters, setCompilationFilters] = useKV<CompilationFilter[]>('compilation-filters', [])
  const [artistMappings, setArtistMappings] = useKV<ArtistMapping[]>('artist-mappings', [])
  const [splitFees, setSplitFees] = useKV<SplitFee[]>('split-fees', [])
  const [manualRevenues, setManualRevenues] = useKV<ManualRevenue[]>('manual-revenues', [])
  const [labelInfo, setLabelInfo] = useKV<LabelInfo>('label-info', {
    name: '',
    address: '',
  })
  const [excludePhysical, setExcludePhysical] = useKV<boolean>('exclude-physical', false)
  const [periodStart, setPeriodStart] = useKV<string>('period-start', '')
  const [periodEnd, setPeriodEnd] = useKV<string>('period-end', '')

  const [allTransactions, setAllTransactions] = useState<SalesTransaction[]>([])

  const handleFilesAdded = async (files: File[], type: 'believe' | 'bandcamp') => {
    const newFiles: UploadedFile[] = []
    
    for (const file of files) {
      const content = await file.text()
      const uploadedFile: UploadedFile = {
        id: crypto.randomUUID(),
        name: file.name,
        size: file.size,
        type,
        data: content,
        uploadedAt: new Date(),
      }
      newFiles.push(uploadedFile)
    }

    if (type === 'believe') {
      setBelieveFiles((current = []) => [...current, ...newFiles])
    } else {
      setBandcampFiles((current = []) => [...current, ...newFiles])
    }

    toast.success(`${newFiles.length} file(s) uploaded successfully`)
  }

  const handleFileRemoved = (id: string, type: 'believe' | 'bandcamp') => {
    if (type === 'believe') {
      setBelieveFiles((current = []) => current.filter((f) => f.id !== id))
    } else {
      setBandcampFiles((current = []) => current.filter((f) => f.id !== id))
    }
    toast.info('File removed')
  }

  const processAllFiles = (files: UploadedFile[]) => {
    const transactions: SalesTransaction[] = []

    files.forEach((file) => {
      const parsed = parseCSVContent(file.data, file.type)
      transactions.push(...parsed.transactions)
      
      if (parsed.errors.length > 0) {
        console.warn(`Errors parsing ${file.name}:`, parsed.errors)
      }
    })

    setAllTransactions(transactions)
  }

  useEffect(() => {
    const allFiles = [...(believeFiles || []), ...(bandcampFiles || [])]
    processAllFiles(allFiles)
  }, [believeFiles, bandcampFiles])

  const uniqueArtists = useMemo(() => {
    return getUniqueArtistsFromTransactions(allTransactions, artistMappings || [])
  }, [allTransactions, artistMappings])

  useEffect(() => {
    const currentArtists = new Set((splitFees || []).map((sf) => sf.artist))
    const newArtists = uniqueArtists.filter((artist) => !currentArtists.has(artist))
    
    if (newArtists.length > 0) {
      setSplitFees((current = []) => [
        ...current,
        ...newArtists.map((artist) => ({ artist, percentage: 100 })),
      ])
    }
  }, [uniqueArtists, setSplitFees])

  const processedData = useMemo(() => {
    return processTransactions(allTransactions, {
      compilationFilters: compilationFilters || [],
      artistMappings: artistMappings || [],
      splitFees: splitFees || [],
      manualRevenues: manualRevenues || [],
      excludePhysical: excludePhysical || false,
    })
  }, [allTransactions, compilationFilters, artistMappings, splitFees, manualRevenues, excludePhysical])

  const revenues: ArtistRevenue[] = useMemo(() => {
    return processedData.map((data) => ({
      artist: data.artist,
      believeRevenue: data.transactions
        .filter((t) => t.source === 'believe')
        .reduce((sum, t) => sum + t.net_revenue, 0),
      bandcampRevenue: data.transactions
        .filter((t) => t.source === 'bandcamp')
        .reduce((sum, t) => sum + t.net_revenue, 0),
      manualRevenue: data.manualRevenue,
      totalRevenue: data.grossRevenue,
      splitPercentage: data.splitPercentage,
      finalAmount: data.finalPayout,
    }))
  }, [processedData])

  const handleAddCompilationFilter = (filter: Omit<CompilationFilter, 'id'>) => {
    setCompilationFilters((current = []) => [
      ...current,
      { ...filter, id: crypto.randomUUID() },
    ])
    toast.success('Compilation exclusion added')
  }

  const handleRemoveCompilationFilter = (id: string) => {
    setCompilationFilters((current = []) => current.filter((f) => f.id !== id))
    toast.info('Compilation exclusion removed')
  }

  const handleAddArtistMapping = (mapping: Omit<ArtistMapping, 'id'>) => {
    setArtistMappings((current = []) => [
      ...current,
      { ...mapping, id: crypto.randomUUID() },
    ])
    toast.success('Artist mapping added')
  }

  const handleRemoveArtistMapping = (id: string) => {
    setArtistMappings((current = []) => current.filter((m) => m.id !== id))
    toast.info('Artist mapping removed')
  }

  const handleUpdateSplitFee = (artist: string, percentage: number) => {
    setSplitFees((current = []) =>
      current.map((sf) =>
        sf.artist === artist ? { ...sf, percentage } : sf
      )
    )
  }

  const handleAddManualRevenue = (revenue: Omit<ManualRevenue, 'id'>) => {
    setManualRevenues((current = []) => [
      ...current,
      { ...revenue, id: crypto.randomUUID() },
    ])
    toast.success('Manual revenue added')
  }

  const handleRemoveManualRevenue = (id: string) => {
    setManualRevenues((current = []) => current.filter((r) => r.id !== id))
    toast.info('Manual revenue removed')
  }

  const handleDownloadPDF = (artist: string) => {
    const artistData = processedData.find((d) => d.artist === artist)
    if (artistData && labelInfo) {
      const blob = generatePDF(artistData, labelInfo, periodStart || undefined, periodEnd || undefined)
      downloadBlob(blob, `${artist.replace(/[^a-z0-9]/gi, '_')}_statement.pdf`)
    }
  }

  const handleDownloadExcel = (artist: string) => {
    const artistData = processedData.find((d) => d.artist === artist)
    if (artistData && labelInfo) {
      const blob = generateExcel(artistData, labelInfo, periodStart || undefined, periodEnd || undefined)
      downloadBlob(blob, `${artist.replace(/[^a-z0-9]/gi, '_')}_statement.xlsx`)
    }
  }

  const handleDownloadAll = async () => {
    if (labelInfo) {
      const blob = await generateZipOfAllStatements(processedData, labelInfo, periodStart || undefined, periodEnd || undefined)
      downloadBlob(blob, 'artist_statements.zip')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8 flex items-center gap-3">
          <div className="p-3 bg-primary rounded-lg">
            <MusicNotes size={32} weight="bold" className="text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-4xl font-bold font-['Space_Grotesk'] tracking-tight">
              SOS Generator
            </h1>
            <p className="text-muted-foreground">Statement of Sales Tool</p>
          </div>
        </div>

        <Tabs defaultValue="upload" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="upload">Upload & Process</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="branding">Branding</TabsTrigger>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Believe CSV Files</h2>
              <FileUploadZone
                type="believe"
                files={believeFiles || []}
                onFilesAdded={(files) => handleFilesAdded(files, 'believe')}
                onFileRemoved={(id) => handleFileRemoved(id, 'believe')}
              />
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Bandcamp CSV Files</h2>
              <FileUploadZone
                type="bandcamp"
                files={bandcampFiles || []}
                onFilesAdded={(files) => handleFilesAdded(files, 'bandcamp')}
                onFileRemoved={(id) => handleFileRemoved(id, 'bandcamp')}
              />
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Statement Period</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Define the reporting period to include in generated PDF and Excel statements.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="period-start">Period Start</Label>
                  <Input
                    id="period-start"
                    type="month"
                    value={periodStart || ''}
                    onChange={(e) => setPeriodStart(e.target.value)}
                    placeholder="YYYY-MM"
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <Label htmlFor="period-end">Period End</Label>
                  <Input
                    id="period-end"
                    type="month"
                    value={periodEnd || ''}
                    onChange={(e) => setPeriodEnd(e.target.value)}
                    placeholder="YYYY-MM"
                  />
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card className="p-6">
              <CompilationFilterManager
                filters={compilationFilters || []}
                onAddFilter={handleAddCompilationFilter}
                onRemoveFilter={handleRemoveCompilationFilter}
              />
            </Card>

            <Card className="p-6">
              <ArtistMappingManager
                mappings={artistMappings || []}
                onAddMapping={handleAddArtistMapping}
                onRemoveMapping={handleRemoveArtistMapping}
              />
            </Card>

            <Card className="p-6">
              <SplitFeeManager
                splitFees={splitFees || []}
                onUpdateSplitFee={handleUpdateSplitFee}
              />
            </Card>

            <Card className="p-6">
              <ManualRevenueManager
                revenues={manualRevenues || []}
                artists={uniqueArtists}
                onAddRevenue={handleAddManualRevenue}
                onRemoveRevenue={handleRemoveManualRevenue}
              />
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="font-semibold">Exclude Physical Products</h3>
                  <p className="text-sm text-muted-foreground">
                    When enabled, physical product sales (CD, Vinyl, etc.) are excluded from revenue calculations and statements.
                  </p>
                </div>
                <Switch
                  checked={excludePhysical || false}
                  onCheckedChange={(checked) => setExcludePhysical(checked)}
                />
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="branding">
            <LabelBranding
              labelInfo={labelInfo || { name: '', address: '' }}
              onUpdate={setLabelInfo}
            />
          </TabsContent>

          <TabsContent value="dashboard">
            <RevenueDashboard
              revenues={revenues}
              onDownloadAll={handleDownloadAll}
              onDownloadPDF={handleDownloadPDF}
              onDownloadExcel={handleDownloadExcel}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default App
