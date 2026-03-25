import { EnvelopeSimple, type Icon as PhosphorIcon } from '@phosphor-icons/react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { EmailConfig } from '@/lib/types'

interface EmailSettingsProps {
  config: EmailConfig
  onUpdate: (next: EmailConfig) => void
}

function SectionHeading({ icon: Icon, title }: { icon: PhosphorIcon; title: string }) {
  return (
    <div className="flex items-center gap-2 pb-1 border-b border-border/40">
      <Icon size={15} weight="bold" className="text-primary shrink-0" />
      <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{title}</h4>
    </div>
  )
}

export function EmailSettings({ config, onUpdate }: EmailSettingsProps) {
  const patch = (partial: Partial<EmailConfig>) => onUpdate({ ...config, ...partial })

  return (
    <div className="space-y-4 p-8">
      <div className="flex items-center gap-2">
        <EnvelopeSimple size={20} weight="bold" className="text-primary" />
        <h3 className="font-semibold">E-Mail-Dienst</h3>
      </div>

      <Card className="p-6 space-y-8">

        {/* ── Absender ─────────────────────────────── */}
        <div className="space-y-4">
          <SectionHeading icon={EnvelopeSimple} title="Absender-Konfiguration" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email-from-name">Absendername</Label>
              <Input
                id="email-from-name"
                type="text"
                value={config.fromName}
                onChange={e => patch({ fromName: e.target.value })}
                placeholder="z.B. darkTunes Music Group"
              />
              <p className="text-xs text-muted-foreground">
                Angezeigter Name im E-Mail-Client des Empfängers.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email-from-addr">Absender-E-Mail</Label>
              <Input
                id="email-from-addr"
                type="email"
                value={config.fromEmail}
                onChange={e => patch({ fromEmail: e.target.value })}
                placeholder="z.B. info@label.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email-reply-to">Reply-To-Adresse</Label>
              <Input
                id="email-reply-to"
                type="email"
                value={config.replyTo}
                onChange={e => patch({ replyTo: e.target.value })}
                placeholder="z.B. finance@label.com"
              />
              <p className="text-xs text-muted-foreground">
                Antwortet der Künstler, landet die Mail hier.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email-subject">Betreff-Vorlage</Label>
              <Input
                id="email-subject"
                type="text"
                value={config.subjectTemplate}
                onChange={e => patch({ subjectTemplate: e.target.value })}
                placeholder="Statement of Sales – {period}"
              />
              <p className="text-xs text-muted-foreground">
                Platzhalter: {'{'}artist{'}'}, {'{'}period{'}'}
              </p>
            </div>
          </div>
        </div>

        {/* ── Hinweis ──────────────────────────────── */}
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-sm space-y-1">
          <p className="font-semibold">Hinweis zum E-Mail-Versand</p>
          <p className="text-xs text-amber-300/80 leading-relaxed">
            Diese App läuft vollständig im Browser und kann keine E-Mails direkt über einen SMTP-Server versenden.
            Beim Klick auf „Per E-Mail senden" öffnet sich dein Standard-E-Mail-Programm mit einer vorausgefüllten
            Nachricht (mailto:-Link). Für vollautomatischen Versand empfiehlt sich ein Backend-Dienst.
          </p>
        </div>

      </Card>
    </div>
  )
}
