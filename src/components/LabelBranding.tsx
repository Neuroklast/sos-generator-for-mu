import { Image as ImageIcon, Buildings } from '@phosphor-icons/react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useState } from 'react'
import type { LabelInfo } from '@/lib/types'

interface LabelBrandingProps {
  labelInfo: LabelInfo
  onUpdate: (info: LabelInfo) => void
}

export function LabelBranding({ labelInfo, onUpdate }: LabelBrandingProps) {
  const [logoPreview, setLogoPreview] = useState<string | undefined>(labelInfo.logo)

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string
        setLogoPreview(dataUrl)
        onUpdate({ ...labelInfo, logo: dataUrl })
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Buildings size={20} weight="bold" className="text-primary" />
        <h3 className="font-semibold">Label Branding</h3>
      </div>

      <Card className="p-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="label-logo">Label Logo</Label>
          <div className="flex items-start gap-4">
            {logoPreview ? (
              <div className="relative group">
                <img
                  src={logoPreview}
                  alt="Label logo"
                  className="w-24 h-24 object-contain rounded border bg-white"
                />
                <label
                  htmlFor="label-logo"
                  className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 cursor-pointer rounded transition-opacity"
                >
                  <ImageIcon size={24} className="text-white" weight="bold" />
                </label>
              </div>
            ) : (
              <label
                htmlFor="label-logo"
                className="flex flex-col items-center justify-center w-24 h-24 border-2 border-dashed rounded cursor-pointer hover:border-accent hover:bg-accent/5 transition-colors"
              >
                <ImageIcon size={32} className="text-muted-foreground mb-1" />
                <span className="text-xs text-muted-foreground">Upload</span>
              </label>
            )}
            
            <input
              id="label-logo"
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden"
            />
            
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">
                Upload your label logo (PNG, JPG, or SVG)
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Recommended: Square format, max 5MB
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="label-name">Label Name</Label>
          <Input
            id="label-name"
            value={labelInfo.name}
            onChange={(e) => onUpdate({ ...labelInfo, name: e.target.value })}
            placeholder="Enter your label name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="label-address">Label Address</Label>
          <Textarea
            id="label-address"
            value={labelInfo.address}
            onChange={(e) => onUpdate({ ...labelInfo, address: e.target.value })}
            placeholder="Enter your label address"
            rows={3}
          />
        </div>
      </Card>
    </div>
  )
}
