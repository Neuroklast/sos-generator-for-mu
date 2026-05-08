import { SlidersHorizontal, EnvelopeSimple, CalendarBlank, Coins, Percent, ArrowClockwise, Database, type Icon as PhosphorIcon } from '@phosphor-icons/react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import type { AppDefaults } from '@/lib/types'

interface DefaultSettingsProps {
  defaults: AppDefaults
  onUpdate: (next: AppDefaults) => void
  onApplyDefaultSplitToAll?: () => void
}

function SectionHeading({ icon: Icon, title }: { icon: PhosphorIcon; title: string }) {
  return (
    <div className="flex items-center gap-2 pb-1 border-b border-border/40">
      <Icon size={15} weight="bold" className="text-primary shrink-0" />
      <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{title}</h4>
    </div>
  )
}

/** Clamps a percentage value to the valid 0–100 range. */
function clampPct(value: number): number {
  return Math.min(100, Math.max(0, value))
}

export function DefaultSettings({ defaults, onUpdate, onApplyDefaultSplitToAll }: DefaultSettingsProps) {
  const patch = (partial: Partial<AppDefaults>) => onUpdate({ ...defaults, ...partial })

  return (
    <div className="space-y-4 p-8">
      <div className="flex items-center gap-2">
        <SlidersHorizontal size={20} weight="bold" className="text-primary" />
        <h3 className="font-semibold">Default Settings</h3>
      </div>

      <Card className="p-6 space-y-8">

        {/* ── Split-Rate ───────────────────────────── */}
        <div className="space-y-4">
          <SectionHeading icon={Coins} title="Payout Default" />

          <div className="space-y-2">
            <Label htmlFor="default-split">Default Split Rate (%)</Label>
            <Input
              id="default-split"
              type="number"
              min={0}
              max={100}
              step={0.1}
              value={defaults.defaultSplitPercentage}
              onChange={e => {
                const val = parseFloat(e.target.value)
                if (!Number.isNaN(val)) patch({ defaultSplitPercentage: clampPct(val) })
              }}
              placeholder="e.g. 50"
              className="max-w-xs"
            />
            <p className="text-xs text-muted-foreground">
              Used for new artists when no individual split rate has been set.
            </p>
            {onApplyDefaultSplitToAll && (
              <Button
                variant="outline"
                size="sm"
                onClick={onApplyDefaultSplitToAll}
                className="mt-1 gap-1.5"
              >
                <ArrowClockwise size={14} />
                Apply default split to all artists
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="default-split-digital">Digital Split (%) – optional</Label>
              <Input
                id="default-split-digital"
                type="number"
                min={0}
                max={100}
                step={0.1}
                value={defaults.defaultSplitPercentageDigital ?? ''}
                onChange={e => {
                  const raw = e.target.value
                  if (raw === '') {
                    patch({ defaultSplitPercentageDigital: undefined })
                  } else {
                    const val = parseFloat(raw)
                    if (!Number.isNaN(val)) patch({ defaultSplitPercentageDigital: clampPct(val) })
                  }
                }}
                placeholder="Empty = global rate"
                className="max-w-full"
              />
              <p className="text-xs text-muted-foreground">
                Overrides the global split rate for streaming revenue. Leave empty to use the global rate.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="default-split-physical">Physical/Merch Split (%) – optional</Label>
              <Input
                id="default-split-physical"
                type="number"
                min={0}
                max={100}
                step={0.1}
                value={defaults.defaultSplitPercentagePhysical ?? ''}
                onChange={e => {
                  const raw = e.target.value
                  if (raw === '') {
                    patch({ defaultSplitPercentagePhysical: undefined })
                  } else {
                    const val = parseFloat(raw)
                    if (!Number.isNaN(val)) patch({ defaultSplitPercentagePhysical: clampPct(val) })
                  }
                }}
                placeholder="Empty = global rate"
                className="max-w-full"
              />
              <p className="text-xs text-muted-foreground">
                Overrides the global split rate for physical / merch revenue. Leave empty to use the global rate.
              </p>
            </div>
          </div>
        </div>

        {/* ── Label Distribution Fee ─────────────── */}
        <div className="space-y-4">
          <SectionHeading icon={Percent} title="Label Distribution Fee" />

          <div className="space-y-2">
            <Label htmlFor="distribution-fee">Global Distribution Fee (%)</Label>
            <Input
              id="distribution-fee"
              type="number"
              min={0}
              max={100}
              step={0.1}
              value={defaults.distributionFeePercentage ?? 0}
              onChange={e => {
                const val = parseFloat(e.target.value)
                if (!Number.isNaN(val)) patch({ distributionFeePercentage: clampPct(val) })
              }}
              placeholder="e.g. 15"
              className="max-w-xs"
            />
            <p className="text-xs text-muted-foreground">
              This percentage is retained from each artist's streaming/physical revenue as a
              label distribution fee before the individual split rate is applied.
              At 0% no fee is deducted.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="distribution-fee-digital">Digital Fee (%) – optional</Label>
              <Input
                id="distribution-fee-digital"
                type="number"
                min={0}
                max={100}
                step={0.1}
                value={defaults.distributionFeeDigital ?? ''}
                onChange={e => {
                  const raw = e.target.value
                  if (raw === '') {
                    patch({ distributionFeeDigital: undefined })
                  } else {
                    const val = parseFloat(raw)
                    if (!Number.isNaN(val)) patch({ distributionFeeDigital: clampPct(val) })
                  }
                }}
                placeholder="Empty = global rate"
                className="max-w-full"
              />
              <p className="text-xs text-muted-foreground">
                Overrides the global rate exclusively for streaming revenue.
                Leave empty to use the global rate.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="distribution-fee-physical">Physical/Merch Fee (%) – optional</Label>
              <Input
                id="distribution-fee-physical"
                type="number"
                min={0}
                max={100}
                step={0.1}
                value={defaults.distributionFeePhysical ?? ''}
                onChange={e => {
                  const raw = e.target.value
                  if (raw === '') {
                    patch({ distributionFeePhysical: undefined })
                  } else {
                    const val = parseFloat(raw)
                    if (!Number.isNaN(val)) patch({ distributionFeePhysical: clampPct(val) })
                  }
                }}
                placeholder="Empty = global rate"
                className="max-w-full"
              />
              <p className="text-xs text-muted-foreground">
                Overrides the global rate exclusively for physical / merch revenue.
                Leave empty to use the global rate.
              </p>
            </div>
          </div>
        </div>

        {/* ── Global Source Split Rates ─────────────── */}
        <div className="space-y-4">
          <SectionHeading icon={Database} title="Global Source Split Rates" />
          <p className="text-xs text-muted-foreground">
            Per-data-source default split percentages. These apply to ALL artists when no
            artist-specific split or source override is configured. Leave a field empty to
            fall back to the global split rate above.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(
              [
                { id: 'source-split-believe',  key: 'believe',  label: 'Believe (Digital / Streaming)' },
                { id: 'source-split-bandcamp',  key: 'bandcamp',  label: 'Bandcamp' },
                { id: 'source-split-darkmerch', key: 'darkmerch', label: 'Darkmerch / Merchandise' },
                { id: 'source-split-physical',  key: 'physical',  label: 'Physical Releases (Shopify / Printful)' },
              ] as const
            ).map(({ id, key, label }) => (
              <div key={key} className="space-y-2">
                <Label htmlFor={id}>{label} (%) – optional</Label>
                <Input
                  id={id}
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  value={defaults.sourceSplits?.[key] ?? ''}
                  onChange={e => {
                    const raw = e.target.value
                    if (raw === '') {
                      patch({ sourceSplits: { ...defaults.sourceSplits, [key]: undefined } })
                      return
                    }
                    const parsed = parseFloat(raw)
                    if (Number.isNaN(parsed)) return
                    patch({ sourceSplits: { ...defaults.sourceSplits, [key]: clampPct(parsed) } })
                  }}
                  placeholder="Empty = global rate"
                  className="max-w-full"
                />
              </div>
            ))}
          </div>
        </div>

        {/* ── Payment Deadline ─────────────────────── */}
        <div className="space-y-4">
          <SectionHeading icon={CalendarBlank} title="Invoice Deadline" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="deadline-days">Payment Deadline (days)</Label>
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
                placeholder="e.g. 25"
              />
              <p className="text-xs text-muted-foreground">
                Number of days within which artists must submit their invoice.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deadline-date">Specific due date (optional)</Label>
              <Input
                id="deadline-date"
                type="text"
                value={defaults.invoiceDeadlineDate}
                onChange={e => patch({ invoiceDeadlineDate: e.target.value })}
                placeholder="e.g. 20 December"
              />
              <p className="text-xs text-muted-foreground">
                Used in the email template as {'{'}deadline_date{'}'}.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="donation-org">Organisation for unclaimed royalties</Label>
            <Input
              id="donation-org"
              type="text"
              value={defaults.royaltyDonationOrg}
              onChange={e => patch({ royaltyDonationOrg: e.target.value })}
              placeholder="e.g. Animal Shelter, Children's Aid"
            />
            <p className="text-xs text-muted-foreground">
              Name of the non-profit organisation to which unclaimed royalties will be donated.
            </p>
          </div>
        </div>

        {/* ── Contact ──────────────────────────────── */}
        <div className="space-y-4">
          <SectionHeading icon={EnvelopeSimple} title="Invoice Receipt" />

          <div className="space-y-2">
            <Label htmlFor="finance-email">Finance Email</Label>
            <Input
              id="finance-email"
              type="email"
              value={defaults.financeEmail}
              onChange={e => patch({ financeEmail: e.target.value })}
              placeholder="e.g. finance@label.com"
            />
            <p className="text-xs text-muted-foreground">
              Artists should send their invoice to this address. Used in email templates as{' '}
              {'{'}invoice_email{'}'}.
            </p>
          </div>
        </div>

      </Card>
    </div>
  )
}
