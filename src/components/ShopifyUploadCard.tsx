import { useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingBag, Trash2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { UploadedFile } from '@/lib/types'

export interface ShopifyManager {
  files: UploadedFile[]
  addFiles: (files: File[]) => void
  removeFile: (id: string) => void
}

interface ShopifyUploadCardProps {
  shopifyManager: ShopifyManager
}

export function ShopifyUploadCard({ shopifyManager }: ShopifyUploadCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files).filter(f => f.name.endsWith('.csv'))
    if (files.length > 0) shopifyManager.addFiles(files)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (files.length > 0) shopifyManager.addFiles(files)
    e.target.value = ''
  }

  return (
    <Card className="p-6 mt-4 border border-white/10 bg-card backdrop-blur-md rounded-2xl">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 shrink-0 shadow-lg shadow-green-500/25">
          <ShoppingBag size={16} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm font-['Space_Grotesk'] leading-tight">Shopify Merch Sales</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Import Shopify orders CSV for merch revenue tracking</p>
        </div>
        {shopifyManager.files.length > 0 && (
          <span className="text-xs text-muted-foreground bg-white/5 px-2 py-1 rounded-full shrink-0">
            {shopifyManager.files.length} file{shopifyManager.files.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        className="flex flex-col items-center justify-center gap-2 p-6 rounded-xl border border-dashed border-green-500/30 bg-green-500/5 hover:bg-green-500/10 hover:border-green-500/50 transition-colors cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && fileInputRef.current?.click()}
      >
        <ShoppingBag size={24} className="text-green-400/60" />
        <p className="text-sm text-muted-foreground">Drop Shopify order export here or click to browse</p>
        <p className="text-xs text-muted-foreground/60">Accepts Shopify orders CSV exports</p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          multiple
          onChange={handleChange}
          className="hidden"
        />
      </div>

      {/* Loaded files list */}
      <AnimatePresence>
        {shopifyManager.files.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 space-y-1.5 overflow-hidden"
          >
            {shopifyManager.files.map(f => (
              <li key={f.id} className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/8 text-sm">
                <span className="truncate text-foreground/80">{f.name}</span>
                <div className="flex items-center gap-2 shrink-0">
                  {f.rowsParsed !== undefined && (
                    <span className="text-xs text-muted-foreground">{f.rowsParsed} rows</span>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-destructive"
                    onClick={() => shopifyManager.removeFile(f.id)}
                  >
                    <Trash2 size={12} />
                  </Button>
                </div>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </Card>
  )
}
