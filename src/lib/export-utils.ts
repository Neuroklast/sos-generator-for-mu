import { jsPDF, GState } from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import type { SafeProcessedArtistData, LabelInfo, PdfExportSettings, LabelArtist } from '@/lib/types'
import { resolveTemplate } from '@/lib/utils'
import { APP_CREDITS, APP_LOGO, APP_NAME } from '@/config/softwareBranding'

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

/**
 * Loads an image from a data URL and returns its natural pixel dimensions.
 * Resolves with null if the image fails to load (e.g. corrupted data).
 */
async function resolveImageDimensions(src: string): Promise<{ width: number; height: number } | null> {
  return new Promise(resolve => {
    const img = new Image()
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
    img.onerror = () => resolve(null)
    img.src = src
  })
}

/**
 * Scales image dimensions to fit within a bounding box of `maxWidth × maxHeight`
 * while preserving the original aspect ratio (object-contain semantics).
 */
function computeFitDimensions(
  naturalWidth: number,
  naturalHeight: number,
  maxWidth: number,
  maxHeight: number
): { w: number; h: number } {
  const scale = Math.min(maxWidth / naturalWidth, maxHeight / naturalHeight)
  return { w: naturalWidth * scale, h: naturalHeight * scale }
}

/**
 * Maximum label logo width in mm: fills the right third of an A4 page (210/3 = 70mm)
 * minus the right margin (20mm), giving 50mm of usable header space.
 */
const LABEL_LOGO_MAX_WIDTH_MM = 50

/**
 * Maximum label logo height in mm: constrains the logo to remain within the page
 * header area while the width expands to fill the right third.
 */
const LABEL_LOGO_MAX_HEIGHT_MM = 30

/** Size of the software branding logo rendered in the footer of every page (mm). */
const APP_LOGO_FOOTER_SIZE_MM = 6

/**
 * Horizontal offset (mm) applied so the footer logo extends slightly beyond the
 * left margin, visually anchoring it to the page edge.
 */
const FOOTER_LOGO_LEFT_OFFSET_MM = 4

/**
 * Vertical nudge (mm) applied to the footer logo so its baseline aligns with the
 * Row 2 text baseline rather than sitting above it.
 */
const FOOTER_LOGO_VERTICAL_NUDGE_MM = 1

/** Distance in mm between the bottom edge of the page and the Row 2 footer baseline. */
const FOOTER_BOTTOM_MARGIN_MM = 6

/** Vertical spacing in mm between footer Row 1 (bank/contact info) and Row 2. */
const FOOTER_ROW_SPACING_MM = 6

/**
 * Fraction of the total page width reserved for the left footer text (bank / contact
 * info). Kept below 0.6 so the text never reaches the center-aligned credits on Row 2.
 */
const FOOTER_TEXT_WIDTH_RATIO = 0.6

/**
 * Maximum rows rendered per breakdown table (releases, platforms, countries, months).
 * Prevents memory exhaustion in the browser for artists with extremely large catalogues
 * that would otherwise produce documents exceeding 10 pages per section.
 */
const MAX_BREAKDOWN_ROWS = 500

/**
 * Minimum vertical space in mm that must remain on the current page before a section
 * heading is rendered inline. Must accommodate the heading line (≈5 mm), the autoTable
 * column-header row (≈8 mm) and at least two data rows (≈12 mm) so the heading is
 * never orphaned at the bottom of a page when autoTable opens a fresh page for the
 * table body. If less space is available, the heading is skipped so autoTable's own
 * repeated column header carries the visual separation instead.
 */
const MIN_SPACE_FOR_SECTION_HEADING_MM = 60

/**
 * Placeholder string that is substituted by jsPDF's `putTotalPages()` call at the
 * very end of `buildPDF`, after every page has been generated. Using this two-pass
 * approach guarantees that "Page N of M" footers show the correct final page count M
 * on every page, not just the last one (which would be the result of reading
 * `getNumberOfPages()` inside the per-page `didDrawPage` callback).
 */
const TOTAL_PAGES_PLACEHOLDER = '{total_pages}'

export async function generatePDF(
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
): Promise<Blob> {
  // Pre-load label logo dimensions so buildPDF can preserve the aspect ratio.
  let logoDimensions: { w: number; h: number } | undefined
  const logoSrc = labelInfo.logoBase64 ?? labelInfo.logo
  if (logoSrc) {
    const naturalDims = await resolveImageDimensions(logoSrc)
    // Only compute fit dimensions when both axes are valid positive values;
    // otherwise leave logoDimensions undefined so buildPDF falls back to the
    // default 25×25 square rather than rendering a potentially distorted image.
    if (naturalDims && naturalDims.width > 0 && naturalDims.height > 0) {
      logoDimensions = computeFitDimensions(naturalDims.width, naturalDims.height, LABEL_LOGO_MAX_WIDTH_MM, LABEL_LOGO_MAX_HEIGHT_MM)
    }
  }

  try {
    const settings = { ...DEFAULT_PDF_SETTINGS, ...pdfSettings }
    return buildPDF(artistData, labelInfo, periodStart, periodEnd, invoiceNumber, settings, emailOptions, artistInfo, logoDimensions)
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
  artistInfo?: LabelArtist,
  logoDimensions?: { w: number; h: number }
): Blob {
  const doc = new jsPDF()
  const margin = 20

  // Embed document metadata so PDF readers show a meaningful title.
  doc.setProperties({ title: `${APP_NAME} · Statement of Sales`, creator: APP_NAME })

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

  // Add label logo in the header, filling the right third of the page width.
  // Uses pre-computed dimensions (logoDimensions) to preserve the original
  // aspect ratio — equivalent to CSS object-contain within the right-third area.
  const logoSrc = labelInfo.logoBase64 ?? labelInfo.logo
  if (logoSrc) {
    try {
      const pageWidth = doc.internal.pageSize.getWidth()
      const { w, h } = logoDimensions ?? { w: LABEL_LOGO_MAX_WIDTH_MM, h: LABEL_LOGO_MAX_HEIGHT_MM }
      // Right-align against the right margin so the logo never overflows.
      const logoX = pageWidth - margin - w
      const logoY = yPos - 5
      doc.addImage(logoSrc, 'PNG', logoX, logoY, w, h)
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
    doc.text(`Tax Number: ${labelInfo.taxNumber}`, margin, yPos)
    yPos += 5
  }

  if (labelInfo.taxId) {
    doc.text(`VAT ID: ${labelInfo.taxId}`, margin, yPos)
    yPos += 5
  }
  
  yPos += 5

  if (invoiceNumber) {
    doc.setFontSize(10)
    doc.text(`Invoice No.: ${invoiceNumber}`, margin, yPos)
    yPos += 5
  }

  if (periodStart && periodEnd) {
    doc.setFontSize(10)
    doc.text(`Billing Period: ${periodStart} – ${periodEnd}`, margin, yPos)
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
  doc.text('Credit note pursuant to German VAT law (§ 14 para. 2 UStG)', margin, yPos)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0, 0, 0)
  yPos += 8

  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('Statement of Sales', margin, yPos)
  yPos += 10

  doc.setFontSize(12)
  doc.text(`Artist: ${artistData.artist}`, margin, yPos)
  yPos += 6

  // ── Artist VAT / Reverse Charge info ───────────────────────────────────────
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  const artistVatId = artistInfo?.vatNumber
  const artistIsEuNonGerman = artistInfo?.isEuNonGerman ?? false

  if (artistVatId) {
    doc.text(`VAT ID (Recipient): ${artistVatId}`, margin, yPos)
    yPos += 5
  }

  if (artistIsEuNonGerman) {
    doc.setTextColor(80, 80, 80)
    doc.text(
      'Tax liability of the service recipient (Reverse Charge, Art. 196 VAT Directive)',
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

  // ── Page footer helper ────────────────────────────────────────────────────
  // Two-row footer layout to prevent element overlap:
  //   Row 1 (footerTopY): label bank / contact info, left-aligned
  //   Row 2 (footerBotY): [NR logo left] [APP_CREDITS center] [Page N/M right]
  // The logo is rendered here (not in a separate post-loop) so draw order is
  // deterministic and text is never painted underneath the logo.
  const drawPageFooter = (data: { pageNumber: number }) => {
    const pageHeight = doc.internal.pageSize.getHeight()
    const pageWidth = doc.internal.pageSize.getWidth()

    // Row 2 baseline — leaves FOOTER_BOTTOM_MARGIN_MM from the bottom edge for readability.
    const footerBotY = pageHeight - FOOTER_BOTTOM_MARGIN_MM
    // Row 1 baseline — FOOTER_ROW_SPACING_MM above Row 2 for label bank/contact text.
    const footerTopY = footerBotY - FOOTER_ROW_SPACING_MM

    // Reset font to a known state so bold/italic set by previous drawing calls (e.g.
    // section headings, autoTable internals) never bleeds into the footer text.
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(150, 150, 150)

    // ── Row 1: label-specific footer text or bank details ─────────────────
    // Constrained to FOOTER_TEXT_WIDTH_RATIO of the page so it never reaches the
    // center credit text on Row 2.
    const footerLeft = labelInfo.footerText
      ? labelInfo.footerText.replace(/\n/g, ' · ')
      : labelInfo.bankAccount
        ? labelInfo.bankAccount.replace(/\n/g, ' · ')
        : ''
    if (footerLeft) {
      doc.text(footerLeft, margin, footerTopY, { maxWidth: pageWidth * FOOTER_TEXT_WIDTH_RATIO - margin })
    }

    // ── Row 2 left: software branding logo ────────────────────────────────
    try {
      doc.saveGraphicsState()
      doc.setGState(new GState({ opacity: 0.5 }))
      doc.addImage(
        APP_LOGO,
        'PNG',
        margin - FOOTER_LOGO_LEFT_OFFSET_MM,
        footerBotY - APP_LOGO_FOOTER_SIZE_MM + FOOTER_LOGO_VERTICAL_NUDGE_MM,
        APP_LOGO_FOOTER_SIZE_MM,
        APP_LOGO_FOOTER_SIZE_MM
      )
      doc.restoreGraphicsState()
    } catch (err) {
      console.warn('Failed to render app logo in PDF footer:', err)
    }

    // ── Row 2 center: software branding credit ────────────────────────────
    doc.setTextColor(150, 150, 150)
    doc.text(APP_CREDITS, pageWidth / 2, footerBotY, { align: 'center' })

    // ── Row 2 right: page number "Page X of Y" ────────────────────────────
    // `TOTAL_PAGES_PLACEHOLDER` is replaced by the real page count via
    // `doc.putTotalPages()` at the end of `buildPDF`, ensuring every page
    // shows the correct final total rather than the count at render time.
    doc.text(`Page ${data.pageNumber} of ${TOTAL_PAGES_PLACEHOLDER}`, pageWidth - margin, footerBotY, { align: 'right' })

    doc.setTextColor(0, 0, 0)
  }

  // ── Financial waterfall summary ───────────────────────────────────────────
  // Visualises the revenue flow: Gross → –Fee → –Expenses → = Split-Basis
  // → × Split% → = Net Payout (Artist Share) → [+VAT] → = Gross Payout.
  const waterfallRows: string[][] = [
    ['Digital Revenue', formatCurrency(artistData.totalDigitalRevenue)],
    ['Physical Revenue', formatCurrency(artistData.totalPhysicalRevenue)],
    ['Manual Revenue', formatCurrency(artistData.manualRevenue)],
    ['= Gross Revenue', formatCurrency(artistData.grossRevenue)],
  ]

  if (artistData.distributionFeeDeducted > 0) {
    waterfallRows.push(['– Label Distribution Fee', `- ${formatCurrency(artistData.distributionFeeDeducted)}`])
  }

  if (artistData.totalExpenses > 0) {
    waterfallRows.push(['– Deductible Costs / Advances', `- ${formatCurrency(artistData.totalExpenses)}`])
  }

  if (artistData.distributionFeeDeducted > 0 || artistData.totalExpenses > 0) {
    const splitBasis = artistData.grossRevenue - artistData.distributionFeeDeducted - artistData.totalExpenses
    waterfallRows.push(['= Split Basis', formatCurrency(splitBasis)])
  }

  waterfallRows.push(
    [`× Split ${artistData.splitPercentage}%`, ''],
    ['= Net Payout (Artist Share)', formatCurrency(artistData.finalPayout)],
  )

  if (vatRate > 0) {
    waterfallRows.push(
      [`+ VAT ${vatRate}%`, formatCurrency(vatAmount)],
      ['= Gross Payout', formatCurrency(grossPayout)],
    )
  }

  autoTable(doc, {
    startY: yPos,
    head: [['Item', 'Amount']],
    body: waterfallRows,
    theme: 'striped',
    styles: { fontSize: 9, cellPadding: 2.5 },
    headStyles: { fillColor: [40, 40, 60], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 245, 250] },
    columnStyles: { 1: { halign: 'right' } },
    margin: { left: margin, right: margin },
    didDrawPage: drawPageFooter,
  })
  yPos = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10

  // ── Section heading helper ────────────────────────────────────────────────
  // Renders a small bold label above a breakdown table. The heading is only
  // painted when sufficient vertical space remains on the current page; otherwise
  // autoTable's own pagination will open a fresh page with its repeated header.
  const renderSectionHeading = (title: string): void => {
    const pageHeight = doc.internal.pageSize.getHeight()
    if (yPos < pageHeight - MIN_SPACE_FOR_SECTION_HEADING_MM) {
      doc.setFontSize(8)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(40, 40, 60)
      doc.text(title, margin, yPos)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(0, 0, 0)
      yPos += 5
    }
  }

  // ── Release breakdown ─────────────────────────────────────────────────────
  if (settings.includeReleaseBreakdown && artistData.releaseBreakdown.length > 0) {
    renderSectionHeading('Revenue by Release')
    autoTable(doc, {
      startY: yPos,
      head: [['Release Title', 'Revenue', 'Qty', 'Type']],
      body: artistData.releaseBreakdown.slice(0, MAX_BREAKDOWN_ROWS).map(rel => [
        rel.releaseTitle || '-',
        formatCurrency(rel.revenue),
        String(rel.quantity),
        rel.isPhysical ? 'Physical' : 'Digital',
      ]),
      theme: 'striped',
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [40, 40, 60], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 245, 250] },
      columnStyles: {
        1: { halign: 'right' },
        2: { halign: 'right' },
      },
      margin: { left: margin, right: margin },
      didDrawPage: drawPageFooter,
    })
    yPos = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10
  }

  // ── Platform breakdown ────────────────────────────────────────────────────
  if (settings.includePlatformBreakdown && artistData.platformBreakdown.length > 0) {
    renderSectionHeading('Revenue by Platform')
    autoTable(doc, {
      startY: yPos,
      head: [['Platform', 'Revenue', 'Qty']],
      body: artistData.platformBreakdown.slice(0, MAX_BREAKDOWN_ROWS).map(p => [
        p.platform || 'Unknown',
        formatCurrency(p.revenue),
        String(p.quantity),
      ]),
      theme: 'striped',
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [40, 40, 60], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 245, 250] },
      columnStyles: {
        1: { halign: 'right' },
        2: { halign: 'right' },
      },
      margin: { left: margin, right: margin },
      didDrawPage: drawPageFooter,
    })
    yPos = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10
  }

  // ── Country breakdown ─────────────────────────────────────────────────────
  if (settings.includeCountryBreakdown && artistData.countryBreakdown.length > 0) {
    renderSectionHeading('Revenue by Country')
    autoTable(doc, {
      startY: yPos,
      head: [['Country', 'Revenue', 'Qty']],
      body: artistData.countryBreakdown.slice(0, MAX_BREAKDOWN_ROWS).map(c => [
        c.country || 'Unknown',
        formatCurrency(c.revenue),
        String(c.quantity),
      ]),
      theme: 'striped',
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [40, 40, 60], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 245, 250] },
      columnStyles: {
        1: { halign: 'right' },
        2: { halign: 'right' },
      },
      margin: { left: margin, right: margin },
      didDrawPage: drawPageFooter,
    })
    yPos = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10
  }

  // ── Monthly breakdown ─────────────────────────────────────────────────────
  if (settings.includeMonthlyBreakdown && artistData.monthlyBreakdown.length > 0) {
    renderSectionHeading('Revenue by Month')
    autoTable(doc, {
      startY: yPos,
      head: [['Month', 'Revenue']],
      body: artistData.monthlyBreakdown.slice(0, MAX_BREAKDOWN_ROWS).map(m => [
        m.month,
        formatCurrency(m.revenue),
      ]),
      theme: 'striped',
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [40, 40, 60], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 245, 250] },
      columnStyles: { 1: { halign: 'right' } },
      margin: { left: margin, right: margin },
      didDrawPage: drawPageFooter,
    })
  }

  // Replace all occurrences of the placeholder with the actual final page count.
  // This must be called after every page and table has been generated so jsPDF
  // can substitute the correct total in every footer it drew during the run.
  doc.putTotalPages(TOTAL_PAGES_PLACEHOLDER)

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
      const pdfBlob = await generatePDF(artistData, labelInfo, periodStart, periodEnd, invoiceNumber, pdfSettings, emailOptions, artistInfo)
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
