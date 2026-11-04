import { describe, expect, it } from 'vitest'
import * as XLSX from 'xlsx'
import JSZip from 'jszip'
import type { SafeProcessedArtistData } from '../types'
import { buildExcelBuffer, generateExcel } from '../excel-export'
import { generateZipOfAllStatements } from '../export-utils'

const artist = {
  artist: 'Band A',
  believeRevenue: 10,
  bandcampRevenue: 0,
  darkmerchRevenue: 0,
  digitalSplitPercentage: 50,
  believeSplitPercentage: 50,
  bandcampSplitPercentage: 50,
  releaseBreakdown: [],
  platformBreakdown: [],
  countryBreakdown: [],
  monthlyBreakdown: [],
} as unknown as SafeProcessedArtistData

const label = { name: 'darkTunes', address: '' }
const source = [{ source: 'believe' as const, sheetName: 'Believe', headers: ['Artist Name', 'Net Revenue'], rows: [['Band A', '10']] }]

describe('Excel original source tabs', () => {
  it('retains the unchanged summary and adds artist-only source rows', () => {
    const bytes = buildExcelBuffer(artist, label, undefined, undefined, [], undefined, source)
    const workbook = XLSX.read(bytes, { type: 'array' })
    expect(workbook.SheetNames).toContain('Summary')
    expect(workbook.SheetNames).toContain('Believe')
    expect(XLSX.utils.sheet_to_json(workbook.Sheets.Believe, { header: 1 })).toEqual([
      ['Artist Name', 'Net Revenue'],
      ['Band A', '10'],
    ])
  })

  it('places the same raw tabs inside ZIP Excel exports', async () => {
    const zipBlob = await generateZipOfAllStatements(
      [artist], label, undefined, undefined, 'excel', undefined,
      undefined, undefined, undefined, undefined, undefined, [],
      async () => generateExcel(artist, label, undefined, undefined, [], undefined, source),
    )
    const archive = await JSZip.loadAsync(await zipBlob.arrayBuffer())
    const name = Object.keys(archive.files).find(path => path.endsWith('_statement.xlsx'))
    expect(name).toBeDefined()
    const xlsx = await archive.file(name!)!.async('arraybuffer')
    const workbook = XLSX.read(xlsx, { type: 'array' })
    expect(workbook.SheetNames).toContain('Believe')
  })
})
