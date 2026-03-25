import { Image as ImageIcon, Buildings, X, EnvelopeSimple, Bank, FileText, IdentificationCard, EnvelopeOpen, type Icon as PhosphorIcon } from '@phosphor-icons/react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { toast } from 'sonner'
import type { LabelInfo } from '@/lib/types'
import { isValidIBAN, sanitiseIBAN } from '@/lib/iban-validator'

const MAX_LOGO_SIZE_BYTES = 5 * 1000 * 1000 // 5 MB
const ACCEPTED_LOGO_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp']

/**
 * Default e-mail template pre-filled with a darkTunes-style example.
 * Placeholders: {artist}, {period}, {amount}, {label_name}, {label_vat_id},
 * {invoice_email}, {deadline_date}, {donation_org}.
 */
export const DEFAULT_EMAIL_TEMPLATE = `Hello,

Please find attached your Statement of Sales for the period {period}.

Your earnings: {amount}

To receive your payment, please send your invoice to {invoice_email}.
Important: Payments are only processed upon receipt of a correct invoice.

IMPORTANT DEADLINE
Due to accounting regulations, we need your invoice within 25 days. If we do not receive it by {deadline_date}, your royalties will be donated to a non-profit organization (e.g. {donation_org}). Please note: Unclaimed royalties will NOT be carried over to your next statement.

If the amount is too low and you prefer not to send an invoice, kindly reply with the following declaration:
"We, [Band Name], hereby certify that we do not wish to claim our royalties for {period}. {label_name} is allowed to keep them."

PLEASE NOTE:
Non-German VAT holders: Include your VAT number and mention the {label_name} VAT number {label_vat_id}. Do not apply any taxes.

Invoice recipient: {label_name}

Description: State the earnings period clearly: "Music distribution for {period}"

Mandatory tax clause (EU): Add the following line to your invoice:
"Die Umsatzsteuer wird vom Leistungsempfänger geschuldet."

If you need help creating your invoice, just ask your label manager – we're here to support you.

Thank you for your continued collaboration with {label_name}!

Stay dark,
{label_name}`

interface LabelBrandingProps {
  labelInfo: LabelInfo
  onUpdate: (info: LabelInfo) => void
}

function SectionHeading({ icon: Icon, title }: { icon: PhosphorIcon; title: string }) {
  return (
    <div className="flex items-center gap-2 pb-1 border-b border-border/40">
      <Icon size={15} weight="bold" className="text-primary shrink-0" />
      <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{title}</h4>
    </div>
  )
}

export function LabelBranding({ labelInfo, onUpdate }: LabelBrandingProps) {
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!ACCEPTED_LOGO_TYPES.includes(file.type)) {
      toast.error('Unsupported file type', {
        description: 'Please upload a PNG, JPG, SVG, or WebP image.',
      })
      e.target.value = ''
      return
    }

    if (file.size > MAX_LOGO_SIZE_BYTES) {
      toast.error('Logo too large', {
        description: `Maximum file size is 5 MB (got ${(file.size / (1024 * 1024)).toFixed(1)} MB).`,
      })
      e.target.value = ''
      return
    }

    const reader = new FileReader()
    reader.onload = event => {
      const dataUrl = event.target?.result as string
      // Keep logo and logoBase64 in sync so both PDF generation and external
      // consumers see the same image regardless of which field they read.
      onUpdate({ ...labelInfo, logo: dataUrl, logoBase64: dataUrl })
    }
    reader.onerror = () => {
      toast.error('Failed to read logo file')
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handleRemoveLogo = () => {
    onUpdate({ ...labelInfo, logo: undefined, logoBase64: undefined })
  }

  const currentLogo = labelInfo.logoBase64 ?? labelInfo.logo

  return (
    <div className="space-y-4 p-8">
      <div className="flex items-center gap-2">
        <Buildings size={20} weight="bold" className="text-primary" />
        <h3 className="font-semibold">Label Branding</h3>
      </div>

      <Card className="p-6 space-y-8">

        {/* ── Markenzeichen ───────────────────────── */}
        <div className="space-y-4">
          <SectionHeading icon={ImageIcon} title="Markenzeichen" />
          <div className="flex items-start gap-4">
            {currentLogo ? (
              <div className="relative group flex-shrink-0">
                <img
                  src={currentLogo}
                  alt="Label logo"
                  className="w-24 h-24 object-contain rounded border bg-white"
                />
                <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/50 opacity-0 group-hover:opacity-100 rounded transition-opacity">
                  <label
                    htmlFor="label-logo"
                    className="cursor-pointer p-1 rounded hover:bg-white/20 transition-colors"
                    title="Replace logo"
                  >
                    <ImageIcon size={18} className="text-white" weight="bold" />
                  </label>
                  <button
                    onClick={handleRemoveLogo}
                    className="p-1 rounded hover:bg-white/20 transition-colors"
                    title="Remove logo"
                  >
                    <X size={18} className="text-white" weight="bold" />
                  </button>
                </div>
              </div>
            ) : (
              <label
                htmlFor="label-logo"
                className="flex flex-col items-center justify-center w-24 h-24 border-2 border-dashed rounded cursor-pointer hover:border-accent hover:bg-accent/5 transition-colors flex-shrink-0"
              >
                <ImageIcon size={28} className="text-muted-foreground mb-1" />
                <span className="text-xs text-muted-foreground">Upload</span>
              </label>
            )}

            <input
              id="label-logo"
              type="file"
              accept={ACCEPTED_LOGO_TYPES.join(',')}
              onChange={handleLogoUpload}
              className="hidden"
            />

            <div className="flex-1 space-y-1">
              <p className="text-sm text-muted-foreground">
                Logo hochladen (PNG, JPG, SVG oder WebP) — wird als Base64 gespeichert.
              </p>
              <p className="text-xs text-muted-foreground">Quadratisches Format empfohlen · max. 5 MB</p>
              {currentLogo && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={handleRemoveLogo}
                >
                  Logo entfernen
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* ── Stammdaten ──────────────────────────── */}
        <div className="space-y-4">
          <SectionHeading icon={Buildings} title="Stammdaten" />

          <div className="space-y-2">
            <Label htmlFor="label-name">Label Name</Label>
            <Input
              id="label-name"
              value={labelInfo.name}
              onChange={e => onUpdate({ ...labelInfo, name: e.target.value })}
              placeholder="z.B. Neuroklast Records"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="label-legal-form">Rechtsform &amp; Geschäftsführer</Label>
            <Input
              id="label-legal-form"
              value={labelInfo.legalForm ?? ''}
              onChange={e => onUpdate({ ...labelInfo, legalForm: e.target.value })}
              placeholder="z.B. GmbH · Geschäftsführer: Max Mustermann"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="label-address">Anschrift</Label>
            <Textarea
              id="label-address"
              value={labelInfo.address}
              onChange={e => onUpdate({ ...labelInfo, address: e.target.value })}
              placeholder="Straße, PLZ, Ort"
              rows={3}
            />
          </div>
        </div>

        {/* ── Kontakt ─────────────────────────────── */}
        <div className="space-y-4">
          <SectionHeading icon={EnvelopeSimple} title="Kontakt" />

          <div className="space-y-2">
            <Label htmlFor="label-email">E-Mail-Adresse</Label>
            <Input
              id="label-email"
              type="email"
              value={labelInfo.email ?? ''}
              onChange={e => onUpdate({ ...labelInfo, email: e.target.value })}
              placeholder="kontakt@label.de"
            />
          </div>
        </div>

        {/* ── Steuer & Rechnungsstellung ───────────── */}
        <div className="space-y-4">
          <SectionHeading icon={IdentificationCard} title="Steuer & Rechnungsstellung" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="label-tax-number">Steuernummer</Label>
              <Input
                id="label-tax-number"
                value={labelInfo.taxNumber ?? ''}
                onChange={e => onUpdate({ ...labelInfo, taxNumber: e.target.value })}
                placeholder="z.B. 123/456/78901"
              />
              <p className="text-xs text-muted-foreground">Finanzamt-Steuernummer des Labels</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="label-tax-id">Umsatzsteuer-ID (USt-IdNr.)</Label>
              <Input
                id="label-tax-id"
                value={labelInfo.taxId ?? ''}
                onChange={e => onUpdate({ ...labelInfo, taxId: e.target.value })}
                placeholder="z.B. DE123456789"
              />
              <p className="text-xs text-muted-foreground">Pflichtangabe bei EU-Geschäftsverkehr</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="label-vat-rate">Umsatzsteuersatz (%)</Label>
              <Input
                id="label-vat-rate"
                type="number"
                min={0}
                max={100}
                step={1}
                value={labelInfo.vatRate ?? ''}
                onChange={e => {
                  const val = e.target.value === '' ? undefined : Number(e.target.value)
                  onUpdate({ ...labelInfo, vatRate: val })
                }}
                placeholder="0 = umsatzsteuerbefreit"
              />
              <p className="text-xs text-muted-foreground">Z.B. 19 für 19 % MwSt.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="label-invoice-prefix">Rechnungsnummer-Präfix</Label>
              <Input
                id="label-invoice-prefix"
                value={labelInfo.invoiceNumberPrefix ?? ''}
                onChange={e => onUpdate({ ...labelInfo, invoiceNumberPrefix: e.target.value })}
                placeholder="z.B. SOS-2025-Q1"
              />
              <p className="text-xs text-muted-foreground">Wird mit Künstler-Index kombiniert, z.B. SOS-2025-Q1-0001</p>
            </div>
          </div>
        </div>

        {/* ── Bankverbindung ──────────────────────── */}
        <div className="space-y-4">
          <SectionHeading icon={Bank} title="Bankverbindung" />

          <div className="space-y-2">
            <Label htmlFor="label-bank-account">IBAN &amp; BIC</Label>
            <Textarea
              id="label-bank-account"
              value={labelInfo.bankAccount ?? ''}
              onChange={e => onUpdate({ ...labelInfo, bankAccount: e.target.value })}
              placeholder={"IBAN: DE89 XXXX XXXX XXXX XXXX XX\nBIC: XXXXXXXX · Musterbank AG"}
              rows={2}
            />
          </div>

          {/* ── SEPA Absenderkonto (maschinenlesbar) ─── */}
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
              <Bank size={12} weight="bold" />
              SEPA-Absenderkonto (für XML-Batch-Auszahlungen)
            </p>
            <p className="text-xs text-muted-foreground">
              Diese Felder werden als <code className="font-mono bg-muted px-1 rounded">{'<Dbtr>'}</code> und{' '}
              <code className="font-mono bg-muted px-1 rounded">{'<DbtrAcct>'}</code> in SEPA-XML-Dateien eingebettet.
              Die IBAN muss mit deinem Geschäftskonto übereinstimmen.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="label-sepa-holder">Kontoinhaber (SEPA)</Label>
                <Input
                  id="label-sepa-holder"
                  type="text"
                  value={labelInfo.sepaAccountHolder ?? ''}
                  onChange={e => onUpdate({ ...labelInfo, sepaAccountHolder: e.target.value || undefined })}
                  placeholder="z.B. darkTunes Music Group UG"
                />
                <p className="text-xs text-muted-foreground">
                  Exakt wie bei deiner Bank registriert (für <code className="font-mono text-[10px] bg-muted px-1 rounded">{'<Dbtr><Nm>'}</code>).
                </p>
              </div>

              <TooltipProvider>
                <div className="space-y-1.5">
                  <Label htmlFor="label-sepa-iban" className="flex items-center gap-1.5">
                    IBAN (SEPA-Absender)
                    {labelInfo.sepaIban && (
                      isValidIBAN(labelInfo.sepaIban)
                        ? <span className="text-emerald-400 text-[10px] font-medium">✓ gültig</span>
                        : <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="text-red-400 text-[10px] font-medium cursor-help underline decoration-dotted">✗ fehlerhaft</span>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs bg-red-900/90 text-red-100 border-red-700">
                              Prüfsumme fehlerhaft. SEPA-Export wird blockiert.
                            </TooltipContent>
                          </Tooltip>
                    )}
                  </Label>
                  <Input
                    id="label-sepa-iban"
                    type="text"
                    value={labelInfo.sepaIban ?? ''}
                    onChange={e => {
                      const normalised = sanitiseIBAN(e.target.value)
                      onUpdate({ ...labelInfo, sepaIban: normalised || undefined })
                    }}
                    placeholder="z.B. DE89370400440532013000"
                    className="font-mono"
                  />
                  <p className="text-xs text-muted-foreground">
                    Dein Geschäftskonto, das als Absender aller SEPA-Überweisungen fungiert.
                  </p>
                </div>
              </TooltipProvider>
            </div>
          </div>
        </div>

        {/* ── Rechtliche Fußzeile ────────────────────── */}
        <div className="space-y-4">
          <SectionHeading icon={FileText} title="Rechtliche Fußzeile" />

          <div className="space-y-2">
            <Label htmlFor="label-footer-text">Hinweistext</Label>
            <Textarea
              id="label-footer-text"
              value={labelInfo.footerText ?? ''}
              onChange={e => onUpdate({ ...labelInfo, footerText: e.target.value })}
              placeholder="z.B. Diese Abrechnung wurde maschinell erstellt und ist ohne Unterschrift gültig."
              rows={3}
            />
            <p className="text-xs text-muted-foreground">Erscheint in der Fußzeile von PDF-Abrechnungen</p>
          </div>
        </div>

        {/* ── E-Mail-Vorlage ──────────────────────── */}
        <div className="space-y-4">
          <SectionHeading icon={EnvelopeOpen} title="E-Mail-Anschreiben (Vorlage)" />

          <div className="space-y-2">
            <Label htmlFor="label-email-template">Vorlage</Label>
            <Textarea
              id="label-email-template"
              value={labelInfo.emailTemplate ?? ''}
              onChange={e => onUpdate({ ...labelInfo, emailTemplate: e.target.value })}
              placeholder="Klicke auf »Standardvorlage laden« um die Vorlage zu befüllen."
              rows={18}
              className="font-mono text-xs leading-relaxed"
            />
            <div className="flex flex-wrap gap-2 mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onUpdate({ ...labelInfo, emailTemplate: DEFAULT_EMAIL_TEMPLATE })}
              >
                Standardvorlage laden
              </Button>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Verfügbare Platzhalter:{' '}
              {[
                '{artist}', '{period}', '{amount}', '{label_name}',
                '{label_vat_id}', '{invoice_email}', '{deadline_date}', '{donation_org}',
              ].map(p => (
                <code key={p} className="mx-0.5 px-1 py-0.5 rounded bg-muted text-xs font-mono">{p}</code>
              ))}
            </p>
          </div>
        </div>

      </Card>
    </div>
  )
}
