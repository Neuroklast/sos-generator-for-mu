import { useState, useMemo, useEffect } f
import { useKV } from '@github/spark/hooks'
import { Tabs, TabsContent, TabsList, TabsT
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SplitFeeManager } from '@/components/Sp
import { LabelBranding } from '@/components/LabelBranding'
import { parseCSVContent } from '@/lib/csv-parser'
import { generatePDF, generateExcel, downloadBlob, generateZipOfAllState
import { SplitFeeManager } from '@/components/SplitFeeManager'
import { ManualRevenueManager } from '@/components/ManualRevenueManager'
import { LabelBranding } from '@/components/LabelBranding'
import { RevenueDashboard } from '@/components/RevenueDashboard'
import { parseCSVContent } from '@/lib/csv-parser'
import { processTransactions, getUniqueArtistsFromTransactions } from '@/lib/data-processor'
import { generatePDF, generateExcel, downloadBlob, generateZipOfAllStatements } from '@/lib/export-utils'
import { Music } from '@phosphor-icons/react'
  const [allTransactions, setA
  const handleFilesAdded = async (files: File[], type: 'believe' | 'bandcamp') => {
    

        id: cryp
        size: file.size,
        data: content,
      }
    }
    if (type === 'believe') {
    } else {
    }
    toast.suc
  }
  co

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
      setBelieveFiles((current) => [...current, ...newFiles])
    } else {
      setBandcampFiles((current) => [...current, ...newFiles])
    }

    toast.success(`${newFiles.length} file(s) uploaded successfully`)
    processAllFiles([...believeFiles, ...bandcampFiles, ...newFiles])
  }

  const handleFileRemoved = (id: string, type: 'believe' | 'bandcamp') => {
    if (type === 'believe') {
      setBelieveFiles((current) => current.filter((f) => f.id !== id))
    } else {
      setBandcampFiles((current) => current.filter((f) => f.id !== id))
    }
    toast.info('File removed')
  }

  const processAllFiles = (files: UploadedFile[]) => {
    const transactions: SalesTransaction[] = []

    files.forEach((file) => {
      const parsed = parseCSVContent(file.data, file.type)
      transactions.push(...parsed.transactions)
      
    return processedData.map((data) =
        console.warn(`Errors parsing ${file.name}:`, parsed.errors)
       
    })

    setAllTransactions(transactions)
   

    }))
    processAllFiles([...believeFiles, ...bandcampFiles])
  }, [believeFiles, bandcampFiles])

  const uniqueArtists = useMemo(() => {
    return getUniqueArtistsFromTransactions(allTransactions, artistMappings)
  }, [allTransactions, artistMappings])

  useMemo(() => {
    const currentArtists = new Set(splitFees.map((sf) => sf.artist))
    const newArtists = uniqueArtists.filter((artist) => !currentArtists.has(artist))
    
    if (newArtists.length > 0) {
      setSplitFees((current) => [
        ...current,
        ...newArtists.map((artist) => ({ artist, percentage: 100 })),
  const 
    }
  }

  const processedData = useMemo(() => {
    return processTransactions(allTransactions, {
      )
      artistMappings,
      splitFees,
      manualRevenues,
    })
  }, [allTransactions, compilationFilters, artistMappings, splitFees, manualRevenues])

  const revenues: ArtistRevenue[] = useMemo(() => {
  const handleRemoveManualRevenue = (id: 
      artist: data.artist,
      believeRevenue: data.transactions
        .filter((t) => t.source === 'believe')
        .reduce((sum, t) => sum + t.net_revenue, 0),
      bandcampRevenue: data.transactions
      downloadBlob(blob, `${artist.replace(/[^a
        .reduce((sum, t) => sum + t.net_revenue, 0),
      manualRevenue: data.manualRevenue,
      totalRevenue: data.grossRevenue,
    if (artistData) {
      finalAmount: data.finalPayout,
    }
  }, [processedData])

                onAddMapping={handleAddArtistMapping}
              />

              <SplitFeeManager
      
            </Card>
   

                onAddRevenue={handleAddManualRevenue}
              />
          </TabsContent>
   

            />

            <Reve
              onDownloadAll={handleDownloadAll
      
          </TabsContent>
   













































































































                onAddMapping={handleAddArtistMapping}
                onRemoveMapping={handleRemoveArtistMapping}
              />
            </Card>

            <Card className="p-6">
              <SplitFeeManager
                splitFees={splitFees}
                onUpdateSplitFee={handleUpdateSplitFee}
              />
            </Card>

            <Card className="p-6">
              <ManualRevenueManager
                revenues={manualRevenues}
                artists={uniqueArtists}
                onAddRevenue={handleAddManualRevenue}
                onRemoveRevenue={handleRemoveManualRevenue}
              />
            </Card>
          </TabsContent>

          <TabsContent value="branding">
            <LabelBranding
              labelInfo={labelInfo}
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