import { SlidersHorizontal, EnvelopeSimple, CalendarBlank, Coins, type Icon as PhosphorIcon } from '@phosphor-icons/react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { AppDefaults } from '@/lib/types'

interface DefaultSettingsProps {
  defaults: AppDefaults
  onUpdate: (next: AppDefaults) => void
}

function SectionHeading({ icon: Icon, title }: { icon: PhosphorIcon; title: string }) {
  return (
    <div className="flex items-center gap-2 pb-1 border-b border-border/40">
      <Icon size={15} weight="bold" className="text-primary shrink-0" />
      <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{title}</h4>
    </div>
  )
}

export function DefaultSettings({ defaults, onUpdate }: DefaultSettingsProps) {
  const patch = (partial: Partial<AppDefaults>) => onUpdate({ ...defaults, ...partial })

  return (
    <div className="space-y-4 p-8">
      <div className="flex items-center gap-2">
        <SlidersHorizontal size={20} weight="bold" className="text-primary" />
        <h3 className="font-semibold">Standard-Voreinstellungen</h3>
      </div>

      <Card className="p-6 space-y-8">

        {/* ── Split-Rate ───────────────────────────── */}
        <div className="space-y-4">
          <SectionHeading icon={Coins} title="Auszahlungs-Voreinstellung" />

          <div className="space-y-2">
            <Label htmlFor="default-split">Standard Split-Rate (%)</Label>
            <Input
              id="default-split"
              type="number"
              min={0}
              max={100}
              step={0.1}
              value={defaults.defaultSplitPercentage}
              onChange={e => {
                const val = parseFloat(e.target.value)
                if (!Number.isNaN(val)) patch({ defaultSplitPercentage: Math.min(100, Math.max(0, val)) })
              }}
              placeholder="z.B. 50"
              className="max-w-xs"
            />
            <p className="text-xs text-muted-foreground">
              Wird für neue Künstler verwendet, wenn keine individuelle Split-Rate gesetzt ist.
            </p>
          </div>
        </div>

        {/* ── Zahlungsfrist ────────────────────────── */}
        <div className="space-y-4">
          <SectionHeading icon={CalendarBlank} title="Rechnungs-Frist" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="deadline-days">Zahlungsfrist (Tage)</Label>
              <Input
                id="deadline-days"
                type="number"
                min={1}
                max={365}
                step={1}
                value={defaults.invoiceDeadlineDays}
                onChange={e => {
                  const val = parseInt(e.target.value, 10)
                  if (!Number.isNaN(val)) patch({ invoiceDeadlineDays: Math.max(1, val) })
                }}
                placeholder="z.B. 25"
              />
              <p className="text-xs text-muted-foreground">
                Anzahl Tage, innerhalb derer Künstler ihre Rechnung einsenden müssen.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deadline-date">Konkretes Fälligkeitsdatum (optional)</Label>
              <Input
                id="deadline-date"
                type="text"
                value={defaults.invoiceDeadlineDate}
                onChange={e => patch({ invoiceDeadlineDate: e.target.value })}
                placeholder="z.B. 20. Dezember"
              />
              <p className="text-xs text-muted-foreground">
                Wird in der E-Mail-Vorlage als {'{'}deadline_date{'}'} eingesetzt.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="donation-org">Organisation für nicht eingeforderte Tantiemen</Label>
            <Input
              id="donation-org"
              type="text"
              value={defaults.royaltyDonationOrg}
              onChange={e => patch({ royaltyDonationOrg: e.target.value })}
              placeholder="z.B. Tierheim, Kinderhilfswerk"
            />
            <p className="text-xs text-muted-foreground">
              Name der gemeinnützigen Organisation, an die nicht beanspruchte Tantiemen gespendet werden.
            </p>
          </div>
        </div>

        {/* ── Kontakt ──────────────────────────────── */}
        <div className="space-y-4">
          <SectionHeading icon={EnvelopeSimple} title="Rechnungsempfang" />

          <div className="space-y-2">
            <Label htmlFor="finance-email">Rechnungs-E-Mail</Label>
            <Input
              id="finance-email"
              type="email"
              value={defaults.financeEmail}
              onChange={e => patch({ financeEmail: e.target.value })}
              placeholder="z.B. finance@label.com"
            />
            <p className="text-xs text-muted-foreground">
              An diese Adresse sollen Künstler ihre Rechnung schicken. Wird in E-Mail-Vorlagen als{' '}
              {'{'}invoice_email{'}'} eingesetzt.
            </p>
          </div>
        </div>

      </Card>
    </div>
  )
}
