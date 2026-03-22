import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsT
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card } from '@/components/ui/card'
import { CompilationFilterManager } from '@/component
import { FileUploadZone } from '@/components/FileUploadZone'
import { CompilationFilterManager } from '@/components/CompilationFilterManager'
import { ArtistMappingManager } from '@/components/ArtistMappingManager'
import { generatePDF, generateExcel, downloadBlob, generateZip
  UploadedFile, 
  ArtistMapping, 
  ManualRevenue, 
} from '@/lib/types'
import type { ProcessedArtistD
function App() {
  const [bandcampFiles, setBandcampFiles] = useKV<UploadedFile[]>('bandcamp-files', [])
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
      if (suggestions.length > 0) {
          const existing = current || []
            .filter(s => !existing.find(e => e.featuringName === s.featuringName))
              id: generateId(),
  
          return [...existing, ...newMappings]
      }

      }

    toast.success(
    )

    const newFiles: Uploaded
    
      newFiles.push({
        name: file.name,
        type: 'bandca
        uploadedAt: new D
    }
    setBandcampFiles((cu
  }
  const handleRemov
    toast.info('File removed')


  }
  const handleAddFilter = (filter: Omit<CompilationF
    se

    setCompilationFilters((current) => (curr

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

          <TabsList className="grid w-full grid-cols-4 max-w-2xl mx-auto">
            <TabsTrigger value="config">Configure</TabsTrigger>
   

            <Card className="p-6">
              <div className="space-y-8">
   

                  <FileUploadZone
                    files={beli
                    onFileRemoved={handleRemoveBelieveFile}
                </div
                <Separator />
              
                  <p className="text-sm text-muted-foregrou
       
      
   

              </div>
          </TabsContent>
          <TabsContent value="config" className="space-y-6">
              <h2 className="text-2xl font-bold mb-4">Configuration<
   

                />
                <ArtistMappingManager
   

                <Sp
                  onUpdateSplitFee={handleU

                  revenues={manualRevenues || 
                  onAddRevenue={handleAddManualRevenue}
                />
     

            <Card className="p-6">
              <LabelBranding labelInfo={labelInfo || { name
          </TabsContent>
     

                revenues={proces

                  manualRevenue:
                  splitPer
            
     

          </TabsContent>
      </div>
    </div>
}
export default App















































































































































































