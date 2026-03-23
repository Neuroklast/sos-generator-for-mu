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
import { parseCSVContentStreaming } from '@/lib/streaming-csv-parser'
import type { ParseProgress } from '@/lib/streaming-csv-parser'
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
  const [isProcessing, setIsProcessing] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const handleFilesAdded = async (files: File[], type: 'believe' | 'bandcamp') => {
    setIsProcessing(true)
    setUploadProgress(0)

    try {
      const newFiles: UploadedFile[] = []
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
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
        
        setUploadProgress(Math.round(((i + 1) / files.length) * 50))
      }

      if (type === 'believe') {
        setBelieveFiles((current = []) => [...current, ...newFiles])
      } else {
        setBandcampFiles((current = []) => [...current, ...newFiles])
      }

      toast.success(`${newFiles.length} file(s) uploaded successfully`)
    } catch (error) {
      toast.error('Error uploading files')
      console.error(error)
    } finally {
      setIsProcessing(false)
      setUploadProgress(0)
    }
  }

  const handleFileRemoved = (id: string, type: 'believe' | 'bandcamp') => {
    if (type === 'believe') {
      setBelieveFiles((current = []) => current.filter((f) => f.id !== id))
    } else {
      setBandcampFiles((current = []) => current.filter((f) => f.id !== id))
    }
    toast.info('File removed')
  }

  const processAllFiles = async (files: UploadedFile[]) => {
    if (files.length === 0) {
      setAllTransactions([])
      return
    }

    setIsProcessing(true)
    setUploadProgress(0)

    try {
      const transactions: SalesTransaction[] = []
      let totalProgress = 0

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        
        const parsed = await parseCSVContentStreaming(
          file.data,
          file.type,
          (progress: ParseProgress) => {
            const fileProgress = progress.percentage
            const overallProgress = Math.round(
              (totalProgress + fileProgress / files.length)
            )
            setUploadProgress(Math.min(overallProgress, 100))
          }
        )
        
        transactions.push(...parsed.transactions)
        
        if (parsed.errors.length > 0) {
          console.warn(`Errors parsing ${file.name}:`, parsed.errors)
          toast.warning(`${parsed.errors.length} row(s) skipped in ${file.name}`)
        }

        totalProgress += (100 / files.length)
      }

      setAllTransactions(transactions)
    } catch (error) {
      toast.error('Error processing files')
      console.error(error)
    } finally {
      setIsProcessing(false)
      setUploadProgress(0)
    }
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
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-10 flex items-center gap-4">
          <div className="p-4 bg-gradient-to-br from-primary to-accent rounded-xl shadow-lg shadow-primary/20">
            <MusicNotes size={40} weight="duotone" className="text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-5xl font-bold font-['Space_Grotesk'] tracking-tight bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              SOS Generator
            </h1>
            <p className="text-muted-foreground text-lg mt-1">Statement of Sales Tool</p>
          </div>
        </div>

        <Tabs defaultValue="upload" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-card/50 backdrop-blur-sm border border-border p-1.5 h-auto">
            <TabsTrigger value="upload" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=active]:shadow-primary/20 transition-all duration-300">Upload & Process</TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=active]:shadow-primary/20 transition-all duration-300">Settings</TabsTrigger>
            <TabsTrigger value="branding" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=active]:shadow-primary/20 transition-all duration-300">Branding</TabsTrigger>
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=active]:shadow-primary/20 transition-all duration-300">Dashboard</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-6">
            <Card className="p-8 border-2 shadow-xl shadow-primary/5 backdrop-blur-sm bg-card/95">
              <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-gradient-to-b from-primary to-accent rounded-full"></span>
                Believe CSV Files
              </h2>
              <FileUploadZone
                type="believe"
                files={believeFiles || []}
                onFilesAdded={(files) => handleFilesAdded(files, 'believe')}
                onFileRemoved={(id) => handleFileRemoved(id, 'believe')}
                isProcessing={isProcessing}
                uploadProgress={uploadProgress}
              />
            </Card>

            <Card className="p-8 border-2 shadow-xl shadow-primary/5 backdrop-blur-sm bg-card/95">
              <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-gradient-to-b from-primary to-accent rounded-full"></span>
                Bandcamp CSV Files
              </h2>
              <FileUploadZone
                type="bandcamp"
                files={bandcampFiles || []}
                onFilesAdded={(files) => handleFilesAdded(files, 'bandcamp')}
                onFileRemoved={(id) => handleFileRemoved(id, 'bandcamp')}
                isProcessing={isProcessing}
                uploadProgress={uploadProgress}
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
            <Card className="p-8 border-2 shadow-xl shadow-primary/5 backdrop-blur-sm bg-card/95">
              <CompilationFilterManager
                filters={compilationFilters || []}
                onAddFilter={handleAddCompilationFilter}
                onRemoveFilter={handleRemoveCompilationFilter}
              />
            </Card>

            <Card className="p-8 border-2 shadow-xl shadow-primary/5 backdrop-blur-sm bg-card/95">
              <ArtistMappingManager
                mappings={artistMappings || []}
                onAddMapping={handleAddArtistMapping}
                onRemoveMapping={handleRemoveArtistMapping}
              />
            </Card>

            <Card className="p-8 border-2 shadow-xl shadow-primary/5 backdrop-blur-sm bg-card/95">
              <SplitFeeManager
                splitFees={splitFees || []}
                onUpdateSplitFee={handleUpdateSplitFee}
              />
            </Card>

            <Card className="p-8 border-2 shadow-xl shadow-primary/5 backdrop-blur-sm bg-card/95">
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
            <Card className="border-2 shadow-xl shadow-primary/5 backdrop-blur-sm bg-card/95">
              <LabelBranding
                labelInfo={labelInfo || { name: '', address: '' }}
                onUpdate={setLabelInfo}
              />
            </Card>
          </TabsContent>

          <TabsContent value="dashboard">
            <Card className="border-2 shadow-xl shadow-primary/5 backdrop-blur-sm bg-card/95">
              <RevenueDashboard
                revenues={revenues}
                onDownloadAll={handleDownloadAll}
                onDownloadPDF={handleDownloadPDF}
                onDownloadExcel={handleDownloadExcel}
              />
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default App
