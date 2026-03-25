import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import type { SafeProcessedArtistData, LabelInfo, PdfExportSettings, LabelArtist } from '@/lib/types'
import { resolveTemplate } from '@/lib/utils'
import { APP_CREDITS, APP_LOGO } from '@/config/softwareBranding'

/** Default PDF export settings — all major sections enabled, cover letter off. */
const DEFAULT_PDF_SETTINGS: PdfExportSettings = {
  includeReleaseBreakdown: true,
  includePlatformBreakdown: true,
  includeCountryBreakdown: false,
  includeMonthlyBreakdown: false,
  includeEmailCoverLetter: false,
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(value)
}

export function generatePDF(
  artistData: SafeProcessedArtistData,
  labelInfo: LabelInfo,
  periodStart?: string,
  periodEnd?: string,
  invoiceNumber?: string,
  pdfSettings?: Partial<PdfExportSettings>,
  emailOptions?: {
    financeEmail: string
    deadlineDate: string
    donationOrg: string
  },
  artistInfo?: LabelArtist
): Blob {
  try {
    const settings = { ...DEFAULT_PDF_SETTINGS, ...pdfSettings }
    return buildPDF(artistData, labelInfo, periodStart, periodEnd, invoiceNumber, settings, emailOptions, artistInfo)
  } catch (err) {
    throw new Error(
      `PDF generation failed for "${artistData.artist}": ${err instanceof Error ? err.message : String(err)}`
    )
  }
}

function buildPDF(
  artistData: SafeProcessedArtistData,
  labelInfo: LabelInfo,
  periodStart?: string,
  periodEnd?: string,
  invoiceNumber?: string,
  settings: PdfExportSettings = DEFAULT_PDF_SETTINGS,
  emailOptions?: { financeEmail: string; deadlineDate: string; donationOrg: string },
  artistInfo?: LabelArtist
): Blob {
  const doc = new jsPDF()
  const margin = 20

  // ── Optional e-mail cover letter page ────────────────────────────────────
  if (settings.includeEmailCoverLetter && labelInfo.emailTemplate) {
    const period = periodStart && periodEnd ? `${periodStart} – ${periodEnd}` : (periodStart ?? periodEnd ?? '')
    const amount = formatCurrency(artistData.finalPayout)
    const appDefaults = {
      financeEmail: emailOptions?.financeEmail,
      invoiceDeadlineDate: emailOptions?.deadlineDate,
      royaltyDonationOrg: emailOptions?.donationOrg,
    }
    const covered = resolveTemplate(
      labelInfo.emailTemplate,
      artistData.artist,
      period,
      amount,
      labelInfo,
      appDefaults
    )
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    const coverLines = doc.splitTextToSize(covered, 170)
    let yC = margin
    coverLines.forEach((line: string) => {
      if (yC > 280) { doc.addPage(); yC = margin }
      doc.text(line, margin, yC)
      yC += 5
    })
    doc.addPage()
  }

  let yPos = margin

  // Add app branding logo in the top-left corner of the first page
  const APP_LOGO_SIZE = 12
  const APP_LOGO_OFFSET_X = -5
  const APP_LOGO_OFFSET_Y = -8
  try {
    doc.addImage(APP_LOGO, 'PNG', margin + APP_LOGO_OFFSET_X, yPos + APP_LOGO_OFFSET_Y, APP_LOGO_SIZE, APP_LOGO_SIZE)
  } catch (err) {
    console.warn('Failed to render app logo in PDF:', err)
  }

  // Add label logo if available (prefer logoBase64, fall back to logo)
  const logoSrc = labelInfo.logoBase64 ?? labelInfo.logo
  if (logoSrc) {
    try {
      const logoSize = 25
      const pageWidth = doc.internal.pageSize.getWidth()
      doc.addImage(logoSrc, 'PNG', pageWidth - margin - logoSize, yPos - 5, logoSize, logoSize)
    } catch {
      // Logo rendering failed, continue without it
    }
  }

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  
  if (labelInfo.name) {
    doc.text(labelInfo.name, margin, yPos)
    yPos += 5
  }

  if (labelInfo.legalForm) {
    doc.setTextColor(120, 120, 120)
    doc.text(labelInfo.legalForm, margin, yPos)
    doc.setTextColor(0, 0, 0)
    yPos += 5
  }
  
  if (labelInfo.address) {
    const addressLines = labelInfo.address.split('\n')
    addressLines.forEach((line) => {
      doc.text(line, margin, yPos)
      yPos += 5
    })
  }

  if (labelInfo.email) {
    doc.text(`E-Mail: ${labelInfo.email}`, margin, yPos)
    yPos += 5
  }

  if (labelInfo.taxNumber) {
    doc.text(`Steuernummer: ${labelInfo.taxNumber}`, margin, yPos)
    yPos += 5
  }

  if (labelInfo.taxId) {
    doc.text(`USt-IdNr.: ${labelInfo.taxId}`, margin, yPos)
    yPos += 5
  }
  
  yPos += 5

  if (invoiceNumber) {
    doc.setFontSize(10)
    doc.text(`Rechnungsnummer: ${invoiceNumber}`, margin, yPos)
    yPos += 5
  }

  if (periodStart && periodEnd) {
    doc.setFontSize(10)
    doc.text(`Abrechnungszeitraum: ${periodStart} – ${periodEnd}`, margin, yPos)
    yPos += 10
  }

  doc.setLineWidth(0.5)
  doc.line(margin, yPos, 190, yPos)
  yPos += 10

  // ── Legal keyword: "Gutschrift" ────────────────────────────────────────────
  // Required by German VAT law (§ 14 Abs. 2 UStG) for the issuing party
  // (label) to claim input-tax deduction on artist payouts.
  doc.setFontSize(8)
  doc.setFont('helvetica', 'italic')
  doc.setTextColor(80, 80, 80)
  doc.text('Gutschrift im Sinne des Umsatzsteuergesetzes (§ 14 Abs. 2 UStG)', margin, yPos)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0, 0, 0)
  yPos += 8

  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('Gutschrift / Statement of Sales', margin, yPos)
  yPos += 10

  doc.setFontSize(12)
  doc.text(`Künstler / Artist: ${artistData.artist}`, margin, yPos)
  yPos += 6

  // ── Artist VAT / Reverse Charge info ───────────────────────────────────────
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  const artistVatId = artistInfo?.vatNumber
  const artistIsEuNonGerman = artistInfo?.isEuNonGerman ?? false

  if (artistVatId) {
    doc.text(`USt-IdNr. Leistungsempfänger: ${artistVatId}`, margin, yPos)
    yPos += 5
  }

  if (artistIsEuNonGerman) {
    doc.setTextColor(80, 80, 80)
    doc.text(
      'Steuerschuldnerschaft des Leistungsempfängers (Reverse Charge, Art. 196 MwStSystRL)',
      margin,
      yPos
    )
    doc.setTextColor(0, 0, 0)
    yPos += 5
  }

  doc.setFontSize(10)

  // ── Per-artist VAT rate: prefer artistInfo.vatRate, fall back to labelInfo.vatRate
  const effectiveVatRate = artistInfo?.vatRate ?? labelInfo.vatRate ?? 0
  const vatRate = artistIsEuNonGerman ? 0 : effectiveVatRate
  const vatAmount = vatRate > 0 ? artistData.finalPayout * (vatRate / 100) : 0
  const grossPayout = artistData.finalPayout + vatAmount

  const summaryData: string[][] = [
    ['Digitale Einnahmen', formatCurrency(artistData.totalDigitalRevenue)],
    ['Physische Einnahmen', formatCurrency(artistData.totalPhysicalRevenue)],
    ['Manuelle Einnahmen', formatCurrency(artistData.manualRevenue)],
    ['Bruttoeinnahmen', formatCurrency(artistData.grossRevenue)],
  ]

  if (artistData.distributionFeeDeducted > 0) {
    summaryData.push(['Label Vertriebsprovision', `- ${formatCurrency(artistData.distributionFeeDeducted)}`])
  }

  if (artistData.totalExpenses > 0) {
    summaryData.push(['Verrechenbare Kosten / Vorschüsse', `- ${formatCurrency(artistData.totalExpenses)}`])
  }

  summaryData.push(
    ['Split-Prozentsatz', `${artistData.splitPercentage}%`],
    ['Netto-Auszahlung', formatCurrency(artistData.finalPayout)],
  )

  if (vatRate > 0) {
    summaryData.push(
      [`USt. ${vatRate}%`, formatCurrency(vatAmount)],
      ['Brutto-Auszahlung', formatCurrency(grossPayout)],
    )
  }

  summaryData.forEach(([label, value]) => {
    doc.text(label + ':', margin, yPos)
    doc.text(value, margin + 80, yPos)
    yPos += 6
  })

  doc.setLineWidth(0.5)
  doc.line(margin, yPos, 190, yPos)
  yPos += 10

  // ── Page footer helper ────────────────────────────────────────────────────
  const drawPageFooter = (data: { pageNumber: number }) => {
    const pageCount = (doc as jsPDF & { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages()
    const pageHeight = doc.internal.pageSize.getHeight()
    const pageWidth = doc.internal.pageSize.getWidth()
    doc.setFontSize(7)
    doc.setTextColor(150, 150, 150)

    // Left: footer text or bank details; right: page number
    const footerLeft = labelInfo.footerText
      ? labelInfo.footerText.replace(/\n/g, ' · ')
      : labelInfo.bankAccount
        ? labelInfo.bankAccount.replace(/\n/g, ' · ')
        : APP_CREDITS
    doc.text(footerLeft, margin, pageHeight - 8, { maxWidth: pageWidth - margin * 2 - 20 })
    doc.text(`Seite ${data.pageNumber} / ${pageCount}`, pageWidth - margin, pageHeight - 8, { align: 'right' })
    doc.setTextColor(0, 0, 0)
  }

  // ── Release breakdown ─────────────────────────────────────────────────────
  // autoTable handles pagination automatically — no slice() or manual yPos math needed.
  if (settings.includeReleaseBreakdown) {
    autoTable(doc, {
      startY: yPos,
      head: [['Release Title', 'Revenue', 'Qty', 'Type']],
      body: artistData.releaseBreakdown.map(rel => [
        rel.releaseTitle || '-',
        formatCurrency(rel.revenue),
        String(rel.quantity),
        rel.isPhysical ? 'Physical' : 'Digital',
      ]),
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [40, 40, 60], textColor: 255, fontStyle: 'bold' },
      columnStyles: {
        1: { halign: 'right' },
        2: { halign: 'right' },
      },
      margin: { left: margin, right: margin },
      didDrawPage: drawPageFooter,
    })
  }

  // ── Platform breakdown ────────────────────────────────────────────────────
  if (settings.includePlatformBreakdown && artistData.platformBreakdown.length > 0) {
    const lastFinalYPlat = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY
    const startY = settings.includeReleaseBreakdown && lastFinalYPlat
      ? lastFinalYPlat + 8
      : yPos
    autoTable(doc, {
      startY,
      head: [['Platform', 'Revenue', 'Qty']],
      body: artistData.platformBreakdown.map(p => [
        p.platform || 'Unknown',
        formatCurrency(p.revenue),
        String(p.quantity),
      ]),
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [40, 40, 60], textColor: 255, fontStyle: 'bold' },
      columnStyles: {
        1: { halign: 'right' },
        2: { halign: 'right' },
      },
      margin: { left: margin, right: margin },
      didDrawPage: drawPageFooter,
    })
  }

  // ── Country breakdown ─────────────────────────────────────────────────────
  if (settings.includeCountryBreakdown && artistData.countryBreakdown.length > 0) {
    const lastFinalY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY
    autoTable(doc, {
      startY: lastFinalY ? lastFinalY + 8 : yPos,
      head: [['Country', 'Revenue', 'Qty']],
      body: artistData.countryBreakdown.map(c => [
        c.country || 'Unknown',
        formatCurrency(c.revenue),
        String(c.quantity),
      ]),
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [40, 40, 60], textColor: 255, fontStyle: 'bold' },
      columnStyles: {
        1: { halign: 'right' },
        2: { halign: 'right' },
      },
      margin: { left: margin, right: margin },
      didDrawPage: drawPageFooter,
    })
  }

  // ── Monthly breakdown ─────────────────────────────────────────────────────
  if (settings.includeMonthlyBreakdown && artistData.monthlyBreakdown.length > 0) {
    const lastFinalY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY
    autoTable(doc, {
      startY: lastFinalY ? lastFinalY + 8 : yPos,
      head: [['Month', 'Revenue']],
      body: artistData.monthlyBreakdown.map(m => [
        m.month,
        formatCurrency(m.revenue),
      ]),
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [40, 40, 60], textColor: 255, fontStyle: 'bold' },
      columnStyles: { 1: { halign: 'right' } },
      margin: { left: margin, right: margin },
      didDrawPage: drawPageFooter,
    })
  }

  return doc.output('blob')
}

export function generateExcel(
  artistData: SafeProcessedArtistData,
  labelInfo: LabelInfo,
  periodStart?: string,
  periodEnd?: string
): Blob {
  try {
    return buildExcel(artistData, labelInfo, periodStart, periodEnd)
  } catch (err) {
    throw new Error(
      `Excel generation failed for "${artistData.artist}": ${err instanceof Error ? err.message : String(err)}`
    )
  }
}

function buildExcel(
  artistData: SafeProcessedArtistData,
  labelInfo: LabelInfo,
  periodStart?: string,
  periodEnd?: string
): Blob {
  const workbook = XLSX.utils.book_new()

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
    ['Digital Revenue', artistData.totalDigitalRevenue],
    ['Physical Revenue', artistData.totalPhysicalRevenue],
    ['Manual Revenue', artistData.manualRevenue],
    ['Gross Revenue', artistData.grossRevenue],
    ['Split Percentage', artistData.splitPercentage / 100],
    ['Final Payout', artistData.finalPayout],
  ]

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
  summarySheet['!cols'] = [{ wch: 25 }, { wch: 25 }]

  if (summarySheet['A1']) {
    summarySheet['A1'].s = { font: { bold: true, sz: 14 } }
  }

  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary')

  // Release breakdown sheet (aggregated, memory-efficient alternative to raw rows)
  if (artistData.releaseBreakdown.length > 0) {
    const releaseHeaders = [
      'Release Title', 'UPC/EAN', 'Catalog Number', 'Revenue', 'Quantity', 'Type',
    ]
    const releaseRows = artistData.releaseBreakdown.map(r => [
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

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
  return new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
}

/** Downloads a Blob as a file. Revokes the object URL after a short delay so
 *  the browser has time to initiate the download before the reference is freed. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  setTimeout(() => URL.revokeObjectURL(url), 100)
}

/**
 * Generates a ZIP of PDF and/or Excel statements for all artists.
 *
 * Artists are processed sequentially (one per event-loop turn via
 * `setTimeout(0)` yields) so that:
 *  1. The browser UI remains fully responsive during a large export.
 *  2. Memory consumption stays bounded — only one artist's document is live
 *     at a time before it is handed off to JSZip.
 *
 * @param onProgress  Optional callback fired after each artist is processed.
 *                    Receives (done, total) so callers can show a progress bar.
 */
export async function generateZipOfAllStatements(
  artistsData: SafeProcessedArtistData[],
  labelInfo: LabelInfo,
  periodStart?: string,
  periodEnd?: string,
  format: 'pdf' | 'excel' | 'both' = 'both',
  onProgress?: (done: number, total: number) => void,
  pdfSettings?: Partial<PdfExportSettings>,
  emailOptions?: { financeEmail: string; deadlineDate: string; donationOrg: string },
  labelArtists?: LabelArtist[]
): Promise<Blob> {
  const JSZip = (await import('jszip')).default
  const zip = new JSZip()
  const total = artistsData.length
  const currentYear = new Date().getFullYear()

  // Build a O(1) lookup map by lowercase artist name to avoid O(n²) in the loop.
  const artistInfoMap = new Map<string, LabelArtist>()
  for (const la of labelArtists ?? []) {
    artistInfoMap.set(la.name.toLowerCase(), la)
  }

  for (let i = 0; i < artistsData.length; i++) {
    const artistData = artistsData[i]

    // Yield to the event loop so the main thread can paint progress updates
    // and remain interactive between each document generation.
    await new Promise<void>(resolve => setTimeout(resolve, 0))

    const safeArtistName = artistData.artist.replace(/[^a-z0-9]/gi, '_')

    // Sequential invoice number: PREFIX-YEAR-NNNN
    const prefix = labelInfo.invoiceNumberPrefix ?? 'SOS'
    const invoiceNumber = `${prefix}-${currentYear}-${String(i + 1).padStart(4, '0')}`

    const artistInfo = artistInfoMap.get(artistData.artist.toLowerCase())

    if (format === 'pdf' || format === 'both') {
      const pdfBlob = generatePDF(artistData, labelInfo, periodStart, periodEnd, invoiceNumber, pdfSettings, emailOptions, artistInfo)
      zip.file(`${safeArtistName}_statement.pdf`, pdfBlob)
    }

    if (format === 'excel' || format === 'both') {
      const excelBlob = generateExcel(artistData, labelInfo, periodStart, periodEnd)
      zip.file(`${safeArtistName}_statement.xlsx`, excelBlob)
    }

    onProgress?.(i + 1, total)
  }

  return await zip.generateAsync({ type: 'blob' })
}
