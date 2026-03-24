import { Image as ImageIcon, Buildings, X } from '@phosphor-icons/react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import type { LabelInfo } from '@/lib/types'

const MAX_LOGO_SIZE_BYTES = 5 * 1000 * 1000 // 5 MB
const ACCEPTED_LOGO_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp']

interface LabelBrandingProps {
  labelInfo: LabelInfo
  onUpdate: (info: LabelInfo) => void
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
      onUpdate({ ...labelInfo, logo: dataUrl })
    }
    reader.onerror = () => {
      toast.error('Failed to read logo file')
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handleRemoveLogo = () => {
    onUpdate({ ...labelInfo, logo: undefined })
  }

  return (
    <div className="space-y-4 p-8">
      <div className="flex items-center gap-2">
        <Buildings size={20} weight="bold" className="text-primary" />
        <h3 className="font-semibold">Label Branding</h3>
      </div>

      <Card className="p-6 space-y-6">
        {/* Logo upload */}
        <div className="space-y-2">
          <Label>Label Logo</Label>
          <div className="flex items-start gap-4">
            {labelInfo.logo ? (
              <div className="relative group flex-shrink-0">
                <img
                  src={labelInfo.logo}
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
                Upload your label logo (PNG, JPG, SVG, or WebP)
              </p>
              <p className="text-xs text-muted-foreground">
                Square format recommended · max 5 MB
              </p>
              {labelInfo.logo && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={handleRemoveLogo}
                >
                  Remove logo
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Label name */}
        <div className="space-y-2">
          <Label htmlFor="label-name">Label Name</Label>
          <Input
            id="label-name"
            value={labelInfo.name}
            onChange={e => onUpdate({ ...labelInfo, name: e.target.value })}
            placeholder="Enter your label name"
          />
        </div>

        {/* Label address */}
        <div className="space-y-2">
          <Label htmlFor="label-address">Label Address</Label>
          <Textarea
            id="label-address"
            value={labelInfo.address}
            onChange={e => onUpdate({ ...labelInfo, address: e.target.value })}
            placeholder="Enter your label address"
            rows={3}
          />
        </div>

        {/* Tax number */}
        <div className="space-y-2">
          <Label htmlFor="label-tax-number">Steuernummer / USt-IdNr.</Label>
          <Input
            id="label-tax-number"
            value={labelInfo.taxNumber ?? ''}
            onChange={e => onUpdate({ ...labelInfo, taxNumber: e.target.value })}
            placeholder="z.B. DE123456789"
          />
          <p className="text-xs text-muted-foreground">Pflichtangabe auf rechtssicheren EU-Rechnungen</p>
        </div>

        {/* Invoice number prefix */}
        <div className="space-y-2">
          <Label htmlFor="label-invoice-prefix">Rechnungsnummer-Präfix</Label>
          <Input
            id="label-invoice-prefix"
            value={labelInfo.invoiceNumberPrefix ?? ''}
            onChange={e => onUpdate({ ...labelInfo, invoiceNumberPrefix: e.target.value })}
            placeholder="z.B. SOS-2025-Q1"
          />
          <p className="text-xs text-muted-foreground">Wird automatisch mit einem Künstler-Suffix kombiniert, z.B. SOS-2025-Q1-0001</p>
        </div>

        {/* VAT rate */}
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
          <p className="text-xs text-muted-foreground">Z.B. 19 für 19 % MwSt. · 0 oder leer = keine USt.</p>
        </div>
      </Card>
    </div>
  )
}
