import { useCallback } from 'react'
import { toast } from 'sonner'
import {
  generatePDF,
  generateExcel,
  downloadBlob,
  generateZipOfAllStatements,
} from '@/lib/export-utils'
import type { ProcessedArtistData } from '@/lib/data-processor'
import type { LabelInfo } from '@/lib/types'

/**
 * Provides PDF, Excel and ZIP export actions with error handling.
 */
export function useExports(
  processedData: ProcessedArtistData[],
  labelInfo: LabelInfo,
  periodStart: string,
  periodEnd: string
) {
  const handleDownloadPDF = useCallback(
    (artist: string) => {
      const artistData = processedData.find(d => d.artist === artist)
      if (!artistData) {
        toast.error(`No data found for artist "${artist}"`)
        return
      }

      try {
        const blob = generatePDF(
          artistData,
          labelInfo,
          periodStart || undefined,
          periodEnd || undefined
        )
        downloadBlob(blob, `${artist.replace(/[^a-z0-9]/gi, '_')}_statement.pdf`)
        toast.success(`PDF for "${artist}" downloaded`)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        toast.error('PDF export failed', { description: message })
        console.error('PDF export error:', err)
      }
    },
    [processedData, labelInfo, periodStart, periodEnd]
  )

  const handleDownloadExcel = useCallback(
    (artist: string) => {
      const artistData = processedData.find(d => d.artist === artist)
      if (!artistData) {
        toast.error(`No data found for artist "${artist}"`)
        return
      }

      try {
        const blob = generateExcel(
          artistData,
          labelInfo,
          periodStart || undefined,
          periodEnd || undefined
        )
        downloadBlob(blob, `${artist.replace(/[^a-z0-9]/gi, '_')}_statement.xlsx`)
        toast.success(`Excel for "${artist}" downloaded`)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        toast.error('Excel export failed', { description: message })
        console.error('Excel export error:', err)
      }
    },
    [processedData, labelInfo, periodStart, periodEnd]
  )

  const handleDownloadAll = useCallback(async () => {
    if (processedData.length === 0) {
      toast.info('No revenue data to export')
      return
    }

    const toastId = toast.loading('Generating all statements...')
    try {
      const blob = await generateZipOfAllStatements(
        processedData,
        labelInfo,
        periodStart || undefined,
        periodEnd || undefined
      )
      downloadBlob(blob, 'artist_statements.zip')
      toast.success('All statements downloaded', { id: toastId })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      toast.error('ZIP export failed', { id: toastId, description: message })
      console.error('ZIP export error:', err)
    }
  }, [processedData, labelInfo, periodStart, periodEnd])

  return { handleDownloadPDF, handleDownloadExcel, handleDownloadAll }
}
