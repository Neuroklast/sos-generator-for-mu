import { useCallback, useMemo } from 'react'
import { toast } from 'sonner'
import {
  generatePDF,
  generateExcel,
  downloadBlob,
  generateZipOfAllStatements,
} from '@/lib/export-utils'
import { createSafeFilename } from '@/lib/utils'
import type { SafeProcessedArtistData, LabelInfo, PdfExportSettings, AppDefaults } from '@/lib/types'

/**
 * Provides PDF, Excel and ZIP export actions with error handling.
 * Uses the safe (no raw-transaction) artist data from the Web Worker.
 */
export function useExports(
  processedData: SafeProcessedArtistData[],
  labelInfo: LabelInfo,
  periodStart: string,
  periodEnd: string,
  pdfSettings?: Partial<PdfExportSettings>,
  appDefaults?: Partial<AppDefaults>
) {
  const emailOptions = useMemo(
    () =>
      appDefaults
        ? {
            financeEmail: appDefaults.financeEmail ?? '',
            deadlineDate: appDefaults.invoiceDeadlineDate ?? '',
            donationOrg: appDefaults.royaltyDonationOrg ?? '',
          }
        : undefined,
    [appDefaults]
  )

  const handleDownloadPDF = useCallback(
    (artist: string) => {
      const artistData = processedData.find(d => d.artist === artist)
      if (!artistData) {
        toast.error(`No data found for artist "${artist}"`)
        return
      }

      const invoiceNumber = labelInfo.invoiceNumberPrefix
        ? `${labelInfo.invoiceNumberPrefix}-${artist.replace(/[^a-z0-9]/gi, '').toUpperCase().slice(0, 4) || '0001'}`
        : undefined

      try {
        const blob = generatePDF(
          artistData,
          labelInfo,
          periodStart || undefined,
          periodEnd || undefined,
          invoiceNumber,
          pdfSettings,
          emailOptions
        )
        downloadBlob(blob, `${createSafeFilename(artist)}_statement.pdf`)
        toast.success(`PDF for "${artist}" downloaded`)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        toast.error('PDF export failed', { description: message })
        console.error('PDF export error:', err)
      }
    },
    [processedData, labelInfo, periodStart, periodEnd, pdfSettings, emailOptions]
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
        downloadBlob(blob, `${createSafeFilename(artist)}_statement.xlsx`)
        toast.success(`Excel for "${artist}" downloaded`)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        toast.error('Excel export failed', { description: message })
        console.error('Excel export error:', err)
      }
    },
    [processedData, labelInfo, periodStart, periodEnd]
  )

  /**
   * Queued batch export — generates one document at a time so the browser
   * never tries to build hundreds of PDFs simultaneously. Progress is shown
   * via an updating sonner toast so the user sees exactly how far along the
   * export is without the tab freezing.
   */
  const handleDownloadAll = useCallback(async () => {
    if (processedData.length === 0) {
      toast.info('No revenue data to export')
      return
    }

    const total = processedData.length
    const toastId = toast.loading(`Preparing 1 / ${total} statements…`)
    try {
      const blob = await generateZipOfAllStatements(
        processedData,
        labelInfo,
        periodStart || undefined,
        periodEnd || undefined,
        'both',
        (done, tot) => {
          if (done < tot) {
            toast.loading(`Generating ${done + 1} / ${tot} statements…`, { id: toastId })
          }
        },
        pdfSettings,
        emailOptions
      )
      downloadBlob(blob, 'artist_statements.zip')
      toast.success(`All ${total} statements downloaded`, { id: toastId })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      toast.error('ZIP export failed', { id: toastId, description: message })
      console.error('ZIP export error:', err)
    }
  }, [processedData, labelInfo, periodStart, periodEnd, pdfSettings, emailOptions])

  /**
   * Queued batch export for a specific subset of artists — same async queue
   * as handleDownloadAll but filters processedData to only the provided names.
   */
  const handleDownloadSelected = useCallback(async (selectedArtistNames: string[]) => {
    if (selectedArtistNames.length === 0) {
      toast.info('No artists selected for export')
      return
    }

    const subset = processedData.filter(d => selectedArtistNames.includes(d.artist))
    if (subset.length === 0) {
      toast.error('No matching processed data for selected artists')
      return
    }

    const total = subset.length
    const toastId = toast.loading(`Preparing 1 / ${total} statements…`)
    try {
      const blob = await generateZipOfAllStatements(
        subset,
        labelInfo,
        periodStart || undefined,
        periodEnd || undefined,
        'both',
        (done, tot) => {
          if (done < tot) {
            toast.loading(`Generating ${done + 1} / ${tot} statements…`, { id: toastId })
          }
        },
        pdfSettings,
        emailOptions
      )
      downloadBlob(blob, 'selected_artist_statements.zip')
      toast.success(`${total} selected statement${total !== 1 ? 's' : ''} downloaded`, { id: toastId })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      toast.error('ZIP export failed', { id: toastId, description: message })
      console.error('ZIP export error:', err)
    }
  }, [processedData, labelInfo, periodStart, periodEnd, pdfSettings, emailOptions])

  return { handleDownloadPDF, handleDownloadExcel, handleDownloadAll, handleDownloadSelected }
}
