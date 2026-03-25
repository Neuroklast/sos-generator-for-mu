import { FilePdf, type Icon as PhosphorIcon } from '@phosphor-icons/react'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import type { PdfExportSettings } from '@/lib/types'

interface PdfExportSettingsProps {
  settings: PdfExportSettings
  onUpdate: (next: PdfExportSettings) => void
}

interface ToggleRowProps {
  id: string
  label: string
  description: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}

function ToggleRow({ id, label, description, checked, onCheckedChange }: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 px-4 rounded-xl bg-muted/20 border border-border/40">
      <div className="space-y-0.5 flex-1 min-w-0">
        <Label htmlFor={id} className="text-sm font-medium cursor-pointer">{label}</Label>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
      />
    </div>
  )
}

function SectionHeading({ icon: Icon, title }: { icon: PhosphorIcon; title: string }) {
  return (
    <div className="flex items-center gap-2 pb-1 border-b border-border/40">
      <Icon size={15} weight="bold" className="text-primary shrink-0" />
      <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{title}</h4>
    </div>
  )
}

export function PdfExportSettingsPanel({ settings, onUpdate }: PdfExportSettingsProps) {
  const patch = (partial: Partial<PdfExportSettings>) => onUpdate({ ...settings, ...partial })

  return (
    <div className="space-y-4 p-8">
      <div className="flex items-center gap-2">
        <FilePdf size={20} weight="bold" className="text-primary" />
        <h3 className="font-semibold">PDF-Export-Module</h3>
      </div>

      <Card className="p-6 space-y-8">

        {/* ── Pflichtmodule / optionale Module ─────── */}
        <div className="space-y-3">
          <SectionHeading icon={FilePdf} title="Inhalt der PDF-Abrechnung" />
          <p className="text-xs text-muted-foreground">
            Wähle aus, welche Abschnitte im exportierten PDF enthalten sein sollen.
            Pflichtfelder (Zusammenfassung, Künstler-Info) sind immer enthalten.
          </p>

          <div className="space-y-2">
            <ToggleRow
              id="pdf-releases"
              label="Release-Aufschlüsselung"
              description="Tabelle aller Releases mit Umsatz und Menge pro Album / Single."
              checked={settings.includeReleaseBreakdown}
              onCheckedChange={v => patch({ includeReleaseBreakdown: v })}
            />
            <ToggleRow
              id="pdf-platforms"
              label="Plattform-Aufschlüsselung"
              description="Umsatz pro Streaming-Dienst (Spotify, Apple Music, etc.)."
              checked={settings.includePlatformBreakdown}
              onCheckedChange={v => patch({ includePlatformBreakdown: v })}
            />
            <ToggleRow
              id="pdf-countries"
              label="Länder-Aufschlüsselung"
              description="Umsatz nach Herkunftsland / Territorium."
              checked={settings.includeCountryBreakdown}
              onCheckedChange={v => patch({ includeCountryBreakdown: v })}
            />
            <ToggleRow
              id="pdf-monthly"
              label="Monatlicher Verlauf"
              description="Monat-für-Monat-Entwicklung der Stream-Einnahmen im Abrechnungszeitraum."
              checked={settings.includeMonthlyBreakdown}
              onCheckedChange={v => patch({ includeMonthlyBreakdown: v })}
            />
            <ToggleRow
              id="pdf-cover"
              label="E-Mail-Anschreiben als erste Seite"
              description="Hängt den ausgefüllten E-Mail-Text (aus der Branding-Vorlage) als Deckblatt ans PDF."
              checked={settings.includeEmailCoverLetter}
              onCheckedChange={v => patch({ includeEmailCoverLetter: v })}
            />
          </div>
        </div>

      </Card>
    </div>
  )
}
