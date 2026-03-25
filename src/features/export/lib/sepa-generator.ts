/**
 * sepa-generator.ts
 *
 * Pure, deterministic generator for SEPA Credit Transfer Initiation messages
 * in the ISO 20022 `pain.001.001.03` XML format (used for batch wire transfers
 * in the SEPA payment area).
 *
 * Design principles:
 * - No external XML libraries or DOM APIs — the XML is built from a template
 *   string to keep the bundle size minimal and avoid injection risks via
 *   `escapeXml()` sanitisation of all user-supplied strings.
 * - All monetary amounts are rounded to exactly two decimal places and
 *   formatted with a period as the decimal separator before embedding in XML,
 *   as required by the pain.001 schema (ISO 20022 Amount type).
 * - BigInt is NOT required here (used in the IBAN validator); standard
 *   JavaScript `Number.toFixed(2)` is safe for display-only formatting since
 *   amounts are pre-computed by the data-processor and only formatted at
 *   the XML boundary.
 *
 * References:
 * - ISO 20022 pain.001.001.03 schema:
 *   https://www.iso20022.org/catalogue-messages/iso-20022-messages-archive?search=pain.001
 * - Deutsche Bundesbank SEPA Implementierungsrichtlinien
 */

/** A single recipient artist in a SEPA batch payout. */
export interface SepaPayoutEntry {
  /** Artist or legal entity name as registered with their bank. */
  accountHolder: string
  /**
   * Validated IBAN in normalised form (no spaces, uppercase).
   * Callers MUST pass only IBANs that have already been validated by
   * `isValidIBAN()`. Invalid IBANs will be rejected by the bank.
   */
  iban: string
  /** BIC/SWIFT code. Optional in SEPA-only transfers since 2016. */
  bic?: string
  /**
   * Gross payout amount in EUR. Must be > 0.
   * Will be rounded to two decimal places for the XML output.
   */
  amount: number
  /**
   * Unique end-to-end reference (max 35 characters).
   * Generated automatically by the caller when not supplied.
   */
  endToEndId?: string
}

/** Label (debitor) configuration required by the SEPA XML header. */
export interface SepaLabelConfig {
  /** Legal account-holder name used as `<Dbtr><Nm>`. */
  accountHolder: string
  /**
   * Label's own IBAN used as `<DbtrAcct><Id><IBAN>`.
   * Must be a valid, normalised IBAN.
   */
  iban: string
  /**
   * Label's bank BIC used as `<DbtrAgt><FinInstnId><BIC>`.
   * When omitted, the `<DbtrAgt>` block is included with `<Othr><Id>NOTPROVIDED</Id></Othr>`
   * which is accepted by most SEPA-compliant banks.
   */
  bic?: string
  /**
   * Human-readable period label embedded in the `<Ustrd>` payment reference,
   * e.g. "Q3 2025" or "2025-07 – 2025-09".
   */
  periodLabel: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Escapes the five XML special characters to their entity references.
 * Applied to every user-supplied string before embedding in XML to prevent
 * injection of malformed XML.
 *
 * @param str - Raw string value to escape.
 * @returns XML-safe string.
 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/**
 * Formats a monetary amount for the `<InstdAmt>` XML element.
 *
 * Rules enforced:
 * - Exactly 2 decimal places (ISO 20022 Amount type requirement).
 * - Period `.` as the decimal separator (ISO notation, NOT German comma).
 * - Values are rounded using `Math.round` at the cent level to avoid
 *   floating-point display artefacts (e.g. 1.005 → "1.01", not "1.00").
 *
 * @param amount - The amount in EUR as a JavaScript number.
 * @returns Formatted string, e.g. `"1234.56"`.
 */
function formatAmount(amount: number): string {
  // Round to 2 decimal places at the cent level to avoid floating-point artefacts.
  const rounded = Math.round(amount * 100) / 100
  return rounded.toFixed(2)
}

/**
 * Returns the current date in `YYYY-MM-DD` ISO 8601 format.
 * Used as `<ReqdExctnDt>` (requested execution date).
 */
function todayIso(): string {
  const now = new Date()
  const year  = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day   = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Returns a `<CreDtTm>` timestamp in `YYYY-MM-DDTHH:mm:ss` format.
 * The pain.001 schema requires local time without timezone offset here.
 */
function creationDateTime(): string {
  const now = new Date()
  const date = todayIso()
  const hh = String(now.getHours()).padStart(2, '0')
  const mm = String(now.getMinutes()).padStart(2, '0')
  const ss = String(now.getSeconds()).padStart(2, '0')
  return `${date}T${hh}:${mm}:${ss}`
}

/**
 * Generates a short, unique message ID for the `<MsgId>` element.
 * Format: `SEPA-YYYYMMDD-<random6>` (max 35 characters per pain.001 schema).
 */
function generateMsgId(): string {
  const dateStamp = todayIso().replace(/-/g, '')
  const random = Math.random().toString(36).slice(2, 8).toUpperCase()
  return `SEPA-${dateStamp}-${random}`
}

// ── Constants ──────────────────────────────────────────────────────────────────

/**
 * SEPA standard fallback BIC value for domestic transfers that do not require
 * an explicit BIC (IBAN-only since 2016 within the SEPA area).
 * Accepted by all major German and EU banking portals.
 */
const BIC_FALLBACK_VALUE = 'NOTPROVIDED'

/** Maximum length of the `<Ustrd>` (remittance information) field per ISO 20022. */
const USTRD_MAX_LENGTH = 140

/**
 * Generates a SEPA Credit Transfer Initiation XML document (`pain.001.001.03`)
 * for batch artist payouts.
 *
 * The generated XML is ready to be saved as a `.xml` file and imported into
 * any SEPA-compliant European business banking portal (e.g. Sparkasse,
 * Commerzbank, Qonto, N26) for a single-TAN batch payment authorisation.
 *
 * **Pre-conditions** (callers must enforce):
 * - Every entry in `payouts` must have an IBAN pre-validated by `isValidIBAN()`.
 * - `payouts` must be non-empty (empty batches are rejected by banks).
 * - All amounts must be > 0.
 * - `labelConfig.iban` must be a valid, normalised IBAN.
 *
 * @param payouts - Array of payout recipients; invalid IBANs should be filtered out.
 * @param labelConfig - Label (debitor) configuration for the XML header.
 * @returns A valid `pain.001.001.03` XML string encoded as UTF-8.
 *
 * @example
 * ```ts
 * const xml = generateSepaXml(
 *   [{ accountHolder: 'Max Muster', iban: 'DE89370400440532013000', amount: 250.50 }],
 *   { accountHolder: 'darkTunes UG', iban: 'DE12345678901234567890', periodLabel: 'Q3 2025' }
 * )
 * ```
 */
export function generateSepaXml(
  payouts: SepaPayoutEntry[],
  labelConfig: SepaLabelConfig
): string {
  if (payouts.length === 0) {
    throw new Error('SEPA XML generation requires at least one valid payout entry.')
  }

  const msgId         = generateMsgId()
  const creDtTm       = creationDateTime()
  const reqExctnDt    = todayIso()
  const nbOfTxs       = payouts.length
  const ctrlSum       = formatAmount(payouts.reduce((acc, p) => acc + p.amount, 0))
  const pmtInfId      = `PMTINF-${msgId}`
  const labelName     = escapeXml(labelConfig.accountHolder)
  const labelIban     = escapeXml(labelConfig.iban)
  const periodLabel   = escapeXml(labelConfig.periodLabel)
  const ustrdBase     = `Abrechnung ${periodLabel} ${escapeXml(labelConfig.accountHolder)}`
  // Truncate Ustrd to maximum allowed length (ISO 20022 RemittanceInformation limit)
  const ustrdTruncated = ustrdBase.length > USTRD_MAX_LENGTH ? ustrdBase.slice(0, USTRD_MAX_LENGTH) : ustrdBase

  // ── Debitor agent block ────────────────────────────────────────────────────
  const dbtrAgtBlock = labelConfig.bic
    ? `      <DbtrAgt>
        <FinInstnId>
          <BIC>${escapeXml(labelConfig.bic)}</BIC>
        </FinInstnId>
      </DbtrAgt>`
    : `      <DbtrAgt>
        <FinInstnId>
          <Othr>
            <Id>${BIC_FALLBACK_VALUE}</Id>
          </Othr>
        </FinInstnId>
      </DbtrAgt>`

  // ── Credit transfer transactions ──────────────────────────────────────────
  const transactions = payouts.map((payout, index) => {
    const endToEndId = payout.endToEndId
      ?? `E2E-${String(index + 1).padStart(4, '0')}`
    const cdtrName = escapeXml(payout.accountHolder)
    const cdtrIban = escapeXml(payout.iban)
    const instdAmt = formatAmount(payout.amount)

    // Optional creditor agent (BIC) block
    const cdtrAgtBlock = payout.bic
      ? `        <CdtrAgt>
          <FinInstnId>
            <BIC>${escapeXml(payout.bic)}</BIC>
          </FinInstnId>
        </CdtrAgt>`
      : ''

    return `      <CdtTrfTxInf>
        <PmtId>
          <EndToEndId>${escapeXml(endToEndId)}</EndToEndId>
        </PmtId>
        <Amt>
          <InstdAmt Ccy="EUR">${instdAmt}</InstdAmt>
        </Amt>
${cdtrAgtBlock ? `${cdtrAgtBlock}\n` : ''}        <Cdtr>
          <Nm>${cdtrName}</Nm>
        </Cdtr>
        <CdtrAcct>
          <Id>
            <IBAN>${cdtrIban}</IBAN>
          </Id>
        </CdtrAcct>
        <RmtInf>
          <Ustrd>${ustrdTruncated}</Ustrd>
        </RmtInf>
      </CdtTrfTxInf>`
  }).join('\n')

  // ── Full pain.001.001.03 document ─────────────────────────────────────────
  return `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pain.001.001.03"
          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
          xsi:schemaLocation="urn:iso:std:iso:20022:tech:xsd:pain.001.001.03 pain.001.001.03.xsd">
  <CstmrCdtTrfInitn>
    <GrpHdr>
      <MsgId>${msgId}</MsgId>
      <CreDtTm>${creDtTm}</CreDtTm>
      <NbOfTxs>${nbOfTxs}</NbOfTxs>
      <CtrlSum>${ctrlSum}</CtrlSum>
      <InitgPty>
        <Nm>${labelName}</Nm>
      </InitgPty>
    </GrpHdr>
    <PmtInf>
      <PmtInfId>${pmtInfId}</PmtInfId>
      <PmtMtd>TRF</PmtMtd>
      <NbOfTxs>${nbOfTxs}</NbOfTxs>
      <CtrlSum>${ctrlSum}</CtrlSum>
      <PmtTpInf>
        <SvcLvl>
          <Cd>SEPA</Cd>
        </SvcLvl>
      </PmtTpInf>
      <ReqdExctnDt>${reqExctnDt}</ReqdExctnDt>
      <Dbtr>
        <Nm>${labelName}</Nm>
      </Dbtr>
      <DbtrAcct>
        <Id>
          <IBAN>${labelIban}</IBAN>
        </Id>
      </DbtrAcct>
${dbtrAgtBlock}
${transactions}
    </PmtInf>
  </CstmrCdtTrfInitn>
</Document>`
}

/**
 * Triggers a browser file download for the given XML string.
 *
 * Creates a transient Blob URL, clicks it programmatically, then immediately
 * revokes the URL to free memory. No server or backend is involved.
 *
 * @param xml      - The XML content to download.
 * @param filename - Suggested file name (defaults to `sepa-export-YYYY-MM-DD.xml`).
 */
export function downloadSepaXml(xml: string, filename?: string): void {
  const safeFilename = filename ?? `sepa-export-${todayIso()}.xml`
  const blob = new Blob([xml], { type: 'application/xml;charset=utf-8' })
  const url  = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href     = url
  link.download = safeFilename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  // Revoke the object URL after the current event loop tick to ensure the
  // download has started before the URL is invalidated.
  setTimeout(() => URL.revokeObjectURL(url), 100)
}
