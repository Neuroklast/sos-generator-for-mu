import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface DetectedPeriodBannerProps {
  detectedStart: string
  detectedEnd: string
  currentStart: string
  currentEnd: string
  onApply: () => void
}

export function DetectedPeriodBanner({
  detectedStart,
  detectedEnd,
  currentStart,
  currentEnd,
  onApply,
}: DetectedPeriodBannerProps) {
  if (!detectedStart || !detectedEnd) return null
  if (detectedStart === currentStart && detectedEnd === currentEnd) return null

  const fmt = (m: string) => {
    if (!m) return ''
    const [y, mo] = m.split('-')
    const d = new Date(Number(y), Number(mo) - 1)
    return d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-400"
    >
      <Sparkles size={15} className="shrink-0" />
      <p className="text-sm flex-1">
        <span className="font-semibold">Period detected from CSV: </span>
        {fmt(detectedStart)} → {fmt(detectedEnd)}
      </p>
      <Button
        size="sm"
        variant="outline"
        className="border-amber-500/40 text-amber-400 hover:bg-amber-500/20 hover:border-amber-500/60 text-xs h-7"
        onClick={onApply}
      >
        Apply
      </Button>
    </motion.div>
  )
}
