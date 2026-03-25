/**
 * Shared default configuration constants.
 *
 * Kept in a dedicated module so they can be imported by both components and
 * hooks without triggering react-refresh fast-reload warnings (which fire when
 * a file mixes component exports with non-component exports).
 */
import type { AppDefaults, PdfExportSettings, EmailConfig } from '@/lib/types'

export const DEFAULT_APP_DEFAULTS: AppDefaults = {
  defaultSplitPercentage: 50,
  invoiceDeadlineDays: 25,
  financeEmail: '',
  invoiceDeadlineDate: '',
  royaltyDonationOrg: 'animal shelter',
  distributionFeePercentage: 0,
}

export const DEFAULT_PDF_EXPORT_SETTINGS: PdfExportSettings = {
  includeReleaseBreakdown: true,
  includePlatformBreakdown: true,
  includeCountryBreakdown: false,
  includeMonthlyBreakdown: false,
  includeEmailCoverLetter: false,
}

export const DEFAULT_EMAIL_CONFIG: EmailConfig = {
  fromName: '',
  fromEmail: '',
  replyTo: '',
  subjectTemplate: 'Statement of Sales – {period}',
}
