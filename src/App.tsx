import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsT
import { Separator } from '@/components/ui/separator'
import { CompilationFilterManager } from '@
import { SplitFeeManager } from '@/components/SplitFe
import { LabelBranding } from '@/components/LabelBranding'
import { Toaster } from '@/components/ui/sonner'
import { parseCSVContent, suggestArtistMappings } from '@/lib/csv-parser
import { SplitFeeManager } from '@/components/SplitFeeManager'
import { ManualRevenueManager } from '@/components/ManualRevenueManager'
import { LabelBranding } from '@/components/LabelBranding'
import { RevenueDashboard } from '@/components/RevenueDashboard'
import { Toaster } from '@/components/ui/sonner'
import { toast } from 'sonner'
import { parseCSVContent, suggestArtistMappings } from '@/lib/csv-parser'
import { processTransactions } from '@/lib/data-processor'
} from '@/lib/export-utils'
function App() {
  const [band
  const [artist
  const [manualReven
  
  const [ar


    const newFil
    let totalNewMapp
    for 
      newFiles
        name: fi
        type: '
        uploadedAt: new Date(
} from '@/lib/export-utils'

function App() {
  const [believeFiles, setBelieveFiles] = useKV<UploadedFile[]>('believe-files', [])
  const [bandcampFiles, setBandcampFiles] = useKV<UploadedFile[]>('bandcamp-files', [])
  const [compilationFilters, setCompilationFilters] = useKV<CompilationFilter[]>('compilation-filters', [])
  const [artistMappings, setArtistMappings] = useKV<ArtistMapping[]>('artist-mappings', [])
  const [splitFees, setSplitFees] = useKV<SplitFee[]>('split-fees', [])
  const [manualRevenues, setManualRevenues] = useKV<ManualRevenue[]>('manual-revenues', [])
  const [labelInfo, setLabelInfo] = useKV<LabelInfo>('label-info', { name: '', address: '' })
  
  const [allTransactions, setAllTransactions] = useState<SalesTransaction[]>([])
  const [artistRevenues, setArtistRevenues] = useState<ArtistRevenue[]>([])
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

        
      
            id: generateId(),
            primaryArtist: s.primaryArtist
       


    }
    setBandcampFiles((current) => [...(current
    toast.success(
    )

    setBe

    setBandcampFiles((current) => (current || 

    setCompilationFilt
  }
  const handleRemoveFilter = (id: string) =
  }
  const handl
    toas

    setArtistMappings((current) => (curr


      const existing = curr.find((s) => s.artist ===
     
    
  }
  co
    toast.success(

    s


    for (const file of (believeFiles || [])) {
      allTrans.push(...parsed.transacti
    
      const parsed = parseCS
    
    setAllTransactions(allTrans
    if (allTrans.length === 0) {
      setProcessedDat
    }
    const processed = pr
      artistMappings: ar
      manualRevenues: man


      ar

      totalRevenue: p.grossRevenue,
      


      c

    if (newArtistsWithoutSplits.length > 0) {
      
      ])
  }, [believeFiles, bandcampFiles, compila
  const handleDownloadAll = async () => {
      const zipBlob = await generateZipOfAllStatements
      dow
    } ca
      toast.error('Failed to generate ZIP file
  }
  const handleDownload
      const artistData = proc
        toast.error(`No data found for ${ar
      }
      const p
      do
    } catch (error) {
      toast.error('Failed to generate PD
  }

      const artistData = processedData.find(d => d.a
     
    
      const excelBlob = generateExcel(artistData, labelInfo || { nam
    
    } catch (error
      toast.error('Failed to generate Excel file')
  }
  c

      <div className="container mx-auto px-4 py-8 md
          <h1 className="text-4xl md:text-5xl font-bold mb-3 font-['Space_Gr
   

        </div>
        <Tabs defaultValue="import" className="space-y-6">
   

          </TabsList>
          <TabsContent value="import" className="space-y-6">
              <h2 className="text-2xl fon
   

                    Upload multiple 6-month ex
                  <FileUploadZone
   

                </div>
                <Separator />
                <div>
   

                    type="bandcamp"
                    onFilesAdded={handleBandcampFilesAdded}
   

          </TabsContent>
          <TabsContent value="c
              <h2 className="tex
              <div className="space-y-8">
                  fil
                  onRemoveFilter={handleRemoveFilter}


      
   


                  splitFees={splitFees || []}
                />
   

                  artists={artistList}
                  onRemoveRevenue={handleRemoveRevenue}
   

          <TabsCont
              <h2 className="text-2xl font-
    

            <RevenueDashboard
              onDownloadAll={handleDownload
     
    
      </div>
      <Toaster />
  )




















































































































































































































