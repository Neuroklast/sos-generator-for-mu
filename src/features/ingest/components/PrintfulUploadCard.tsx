/**
 * PrintfulUploadCard.tsx
 *
 * Upload zone for Printful orders export CSVs.
 *
 * The card pairs with ShopifyUploadCard: once both Shopify and Printful data
 * are uploaded, the worker automatically reconciles them — deducting Printful
 * production costs from each order's subtotal and attributing the net revenue
 * to the correct artist via product-name analysis.
 *
 * Orders without a Printful match (e.g. CDs or Vinyl shipped directly) are
 * treated silently: their full subtotal is used as net revenue. No action
 * from the user is needed for these cases.
 */

import { useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trash2 } from 'lucide-react'
import { Package } from '@phosphor-icons/react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { UploadedFile } from '@/lib/types'

export interface PrintfulManager {
  files: UploadedFile[]
  addFiles: (files: File[]) => void
  removeFile: (id: string) => void
}

interface PrintfulUploadCardProps {
  printfulManager: PrintfulManager
  /** Number of matched Shopify orders (displayed as reconciliation feedback). */
  matchedOrderCount?: number
  /** Total Shopify order count for context. */
  totalShopifyOrders?: number
}

export function PrintfulUploadCard({
  printfulManager,
  matchedOrderCount,
  totalShopifyOrders,
}: PrintfulUploadCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files).filter(f => f.name.endsWith('.csv'))
    if (files.length > 0) printfulManager.addFiles(files)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (files.length > 0) printfulManager.addFiles(files)
    e.target.value = ''
  }

  const hasFiles = printfulManager.files.length > 0
  const showReconciliationHint =
    hasFiles && matchedOrderCount !== undefined && totalShopifyOrders !== undefined

  return (
    <Card className="p-6 mt-3 border border-white/10 bg-card backdrop-blur-md rounded-2xl">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-violet-500 shrink-0 shadow-lg shadow-purple-500/25">
          <Package size={16} weight="fill" className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm font-['Space_Grotesk'] leading-tight">
            Printful Production Costs
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Upload Printful orders export to deduct fulfilment costs from Shopify revenue
          </p>
        </div>
        {hasFiles && (
          <span className="text-xs text-muted-foreground bg-white/5 px-2 py-1 rounded-full shrink-0">
            {printfulManager.files.length} file{printfulManager.files.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        className="flex flex-col items-center justify-center gap-2 p-6 rounded-xl border border-dashed border-purple-500/30 bg-purple-500/5 hover:bg-purple-500/10 hover:border-purple-500/50 transition-colors cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && fileInputRef.current?.click()}
        aria-label="Upload Printful CSV"
      >
        <Package size={24} weight="duotone" className="text-purple-400/60" />
        <p className="text-sm text-muted-foreground">
          Drop Printful orders export here or click to browse
        </p>
        <p className="text-xs text-muted-foreground/60">
          Accepts Printful orders CSV exports — columns: Order, Status, Total, Date, Address
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          multiple
          onChange={handleChange}
          className="hidden"
          aria-label="Printful CSV file input"
        />
      </div>

      {/* Reconciliation feedback */}
      <AnimatePresence>
        {showReconciliationHint && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 flex items-start gap-2 px-3 py-2 rounded-lg bg-purple-500/10 border border-purple-500/20 text-xs text-purple-300"
          >
            <Package size={13} weight="fill" className="shrink-0 mt-0.5" />
            <span>
              <strong>{matchedOrderCount}</strong> of {totalShopifyOrders} Shopify orders matched
              with Printful costs.{' '}
              {(totalShopifyOrders ?? 0) - (matchedOrderCount ?? 0) > 0 && (
                <>
                  {(totalShopifyOrders ?? 0) - (matchedOrderCount ?? 0)} orders use full subtotal
                  as net (self-fulfilled, e.g. CDs / Vinyl).
                </>
              )}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loaded files list */}
      <AnimatePresence>
        {hasFiles && (
          <motion.ul
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 space-y-1.5 overflow-hidden"
          >
            {printfulManager.files.map(f => (
              <li
                key={f.id}
                className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/8 text-sm"
              >
                <span className="truncate text-foreground/80">{f.name}</span>
                <div className="flex items-center gap-2 shrink-0">
                  {f.rowsParsed !== undefined && (
                    <span className="text-xs text-muted-foreground">{f.rowsParsed} orders</span>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-destructive"
                    onClick={() => printfulManager.removeFile(f.id)}
                    aria-label={`Remove ${f.name}`}
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
