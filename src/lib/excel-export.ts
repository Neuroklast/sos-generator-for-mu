import * as XLSX from 'xlsx'
import type { SafeProcessedArtistData, LabelInfo, PdfExportSettings, CompilationFilter } from '@/lib/types'
import type { ArtistRawSourceSheet } from '@/lib/raw-source-rows'
import { excelSafeSheetName } from '@/lib/raw-source-rows'

const MAX_DATA_ROWS_PER_SHEET = 1_000_000
const MAX_TOTAL_RAW_ROWS = 1_500_000

function isCompilationRelease(
  release: Pick<SafeProcessedArtistData['releaseBreakdown'][number], 'releaseTitle' | 'upcEan' | 'catalogNumber'>,
  compilationFilters: CompilationFilter[]
): boolean {
  if (compilationFilters.length === 0) return false
  const title = release.releaseTitle.toLowerCase()
  const upcEan = release.upcEan.toLowerCase()
  const catalogNumber = release.catalogNumber.toLowerCase()
  return compilationFilters.some(cf => {
    const identifier = cf.identifier.toLowerCase()
    if (cf.type === 'title') return title.includes(identifier)
    if (cf.type === 'ean') return upcEan === identifier
    return catalogNumber === identifier
  })
}

/** Shared renderer for both browser and Worker. */
export function generateExcel(
  artistData: SafeProcessedArtistData,
  labelInfo: LabelInfo,
  periodStart?: string,
  periodEnd?: string,
  compilationFilters: CompilationFilter[] = [],
  settings?: Partial<PdfExportSettings>,
  rawSheets: ArtistRawSourceSheet[] = []
): Blob {
  try {
    const buffer = buildExcelBuffer(artistData, labelInfo, periodStart, periodEnd, compilationFilters, settings, rawSheets)
    return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  } catch (err) {
    throw new Error(`Excel generation failed for "${artistData.artist}": ${err instanceof Error ? err.message : String(err)}`)
  }
}

/** Creates bytes directly in a worker so no original distributor rows enter React state. */
export function buildExcelBuffer(
  artistData: SafeProcessedArtistData,
  labelInfo: LabelInfo,
  periodStart?: string,
  periodEnd?: string,
  compilationFilters: CompilationFilter[] = [],
  settings?: Partial<PdfExportSettings>,
  rawSheets: ArtistRawSourceSheet[] = []
): ArrayBuffer {
  const count = rawSheets.reduce((total, sheet) => total + sheet.rows.length, 0)
  if (count > MAX_TOTAL_RAW_ROWS) throw new Error(`Raw data exceeds the ${MAX_TOTAL_RAW_ROWS} row limit for one artist. Split the period and retry.`)
  const workbook = XLSX.utils.book_new()
  const digitalFallbackSplit = artistData.digitalSplitPercentage
  // Keep source rows visible when they are economically relevant (have revenue),
  // even if the percentage currently matches the fallback.
  const includeBelieveDigitalSplit =
    artistData.believeSplitPercentage !== digitalFallbackSplit || artistData.believeRevenue > 0
  const includeBandcampDigitalSplit =
    artistData.bandcampSplitPercentage !== digitalFallbackSplit || artistData.bandcampRevenue > 0

  const digitalSplitRows: Array<[string, number]> = []
  if (includeBelieveDigitalSplit) {
    digitalSplitRows.push(['Artist Split – Believe Digital (%)', artistData.believeSplitPercentage])
  }
  if (includeBandcampDigitalSplit) {
    digitalSplitRows.push(['Artist Split – Bandcamp Digital (%)', artistData.bandcampSplitPercentage])
  }
  digitalSplitRows.push(['Artist Split – Other Digital (%)', digitalFallbackSplit])

  const summaryData = [
    ['Statement of Sales'],
    [],
    ['Label', labelInfo.name || ''],
    ['Address', labelInfo.address || ''],
    [],
    ['Artist', artistData.artist],
    ['Period', periodStart && periodEnd ? `${periodStart} - ${periodEnd}` : ''],
    [],
    ['Revenue Summary'],
    ['Believe Revenue', artistData.believeRevenue],
    ['Bandcamp Revenue', artistData.bandcampRevenue],
    ['Darkmerch Revenue', artistData.darkmerchRevenue],
    ['Streaming Revenue', artistData.totalStreamRevenue],
    ['Download Revenue', artistData.totalDownloadRevenue],
    ['Digital Revenue (Total)', artistData.totalDigitalRevenue],
    ['Physical Revenue', artistData.totalPhysicalRevenue],
    ['Manual Revenue', artistData.manualRevenue],
    ['Gross Revenue', artistData.grossRevenue],
    ...digitalSplitRows,
    ['Artist Split – Physical Releases (%)', artistData.physicalSplitPercentage],
    ['Artist Split – Merchandise/Darkmerch (%)', artistData.darkmerchSplitPercentage],
    ['Final Payout', artistData.finalPayout],
  ]

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
  summarySheet['!cols'] = [{ wch: 25 }, { wch: 25 }]

  if (summarySheet['A1']) {
    summarySheet['A1'].s = { font: { bold: true, sz: 14 } }
  }

  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary')

  // Release breakdown sheet (aggregated, memory-efficient alternative to raw rows)
  const shouldHideCompilations = settings?.hideCompilationsInStatement ?? true
  const releaseBreakdown = shouldHideCompilations
    ? artistData.releaseBreakdown.filter(rel => !isCompilationRelease(rel, compilationFilters))
    : artistData.releaseBreakdown
  if (releaseBreakdown.length > 0) {
    const releaseHeaders = [
      'Release Title', 'UPC/EAN', 'Catalog Number', 'Revenue', 'Quantity', 'Type',
    ]
    const releaseRows = releaseBreakdown.map(r => [
      r.releaseTitle || '',
      r.upcEan || '',
      r.catalogNumber || '',
      r.revenue,
      r.quantity,
      r.isPhysical ? 'Physical' : 'Digital',
    ])
    const releaseSheet = XLSX.utils.aoa_to_sheet([releaseHeaders, ...releaseRows])
    releaseSheet['!cols'] = [
      { wch: 35 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 10 }, { wch: 10 },
    ]
    XLSX.utils.book_append_sheet(workbook, releaseSheet, 'Releases')
  }

  // Platform breakdown sheet
  if (artistData.platformBreakdown.length > 0) {
    const platformHeaders = ['Platform', 'Revenue', 'Quantity']
    const platformRows = artistData.platformBreakdown.map(p => [
      p.platform || 'Unknown', p.revenue, p.quantity,
    ])
    const platformSheet = XLSX.utils.aoa_to_sheet([platformHeaders, ...platformRows])
    platformSheet['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 10 }]
    XLSX.utils.book_append_sheet(workbook, platformSheet, 'Platforms')
  }

  // Country breakdown sheet
  if (artistData.countryBreakdown.length > 0) {
    const countryHeaders = ['Country', 'Revenue', 'Quantity']
    const countryRows = artistData.countryBreakdown.map(c => [
      c.country || 'Unknown', c.revenue, c.quantity,
    ])
    const countrySheet = XLSX.utils.aoa_to_sheet([countryHeaders, ...countryRows])
    countrySheet['!cols'] = [{ wch: 20 }, { wch: 15 }, { wch: 10 }]
    XLSX.utils.book_append_sheet(workbook, countrySheet, 'Countries')
  }

  // Monthly breakdown sheet
  if (artistData.monthlyBreakdown.length > 0) {
    const monthHeaders = ['Month', 'Revenue']
    const monthRows = artistData.monthlyBreakdown.map(m => [m.month, m.revenue])
    const monthSheet = XLSX.utils.aoa_to_sheet([monthHeaders, ...monthRows])
    monthSheet['!cols'] = [{ wch: 12 }, { wch: 15 }]
    XLSX.utils.book_append_sheet(workbook, monthSheet, 'Monthly')
  }

  for (const sourceSheet of rawSheets) {
    if (sourceSheet.headers.length === 0) continue
    for (let offset = 0; offset < sourceSheet.rows.length; offset += MAX_DATA_ROWS_PER_SHEET) {
      const index = Math.floor(offset / MAX_DATA_ROWS_PER_SHEET)
      const name = excelSafeSheetName(index === 0 ? sourceSheet.sheetName : `${sourceSheet.sheetName}_${index + 1}`)
      const rows = sourceSheet.rows.slice(offset, offset + MAX_DATA_ROWS_PER_SHEET)
      const worksheet = XLSX.utils.aoa_to_sheet([sourceSheet.headers, ...rows])
      worksheet['!cols'] = sourceSheet.headers.map(header => ({ wch: Math.max(14, Math.min(36, header.length + 4)) }))
      if (worksheet['!ref']) worksheet['!autofilter'] = { ref: worksheet['!ref'] }
      XLSX.utils.book_append_sheet(workbook, worksheet, name)
    }
  }

  return XLSX.write(workbook, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer
}

export type ExcelExportRequest = (
  artistData: SafeProcessedArtistData,
  labelInfo: LabelInfo,
  periodStart?: string,
  periodEnd?: string,
  compilationFilters?: CompilationFilter[],
  settings?: Partial<PdfExportSettings>
) => Promise<Blob>
