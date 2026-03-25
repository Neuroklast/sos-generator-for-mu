import { motion } from 'framer-motion'

interface StatCardProps {
  label: string
  value: string
  sub?: string
  icon: React.ComponentType<{ className?: string; size?: number }>
  gradient: string
  delay?: number
}

export function StatCard({ label, value, sub, icon: Icon, gradient, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.38, ease: 'easeOut' }}
      className="relative overflow-hidden rounded-2xl border border-white/10 bg-card backdrop-blur-md p-6 md:p-8 min-h-[120px] flex flex-col justify-between transition-all duration-300 hover:border-white/20 hover:shadow-lg group"
    >
      {/* accent glow */}
      <div aria-hidden="true" className={`absolute -top-6 -right-6 w-24 h-24 rounded-full blur-2xl opacity-25 group-hover:opacity-40 transition-opacity ${gradient}`} />
      <div className="flex items-start justify-between relative z-10">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
        <div className={`p-2.5 rounded-xl bg-gradient-to-br ${gradient} opacity-80 shrink-0`}>
          <Icon className="text-white" size={20} />
        </div>
      </div>
      <div className="relative z-10 mt-3">
        <p className="text-3xl font-bold text-foreground leading-none truncate font-mono tabular-nums">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-2 leading-tight">{sub}</p>}
      </div>
    </motion.div>
  )
}
