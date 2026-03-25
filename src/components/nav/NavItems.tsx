import { motion } from 'framer-motion'
import { ChevronRight } from 'lucide-react'

export type NavItem = {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string; size?: number }>
}

// ── Sidebar nav item ──────────────────────────────────────────────────────────

export function SideNavItem({
  item,
  active,
  onClick,
  collapsed,
}: {
  item: NavItem
  active: boolean
  onClick: () => void
  collapsed: boolean
}) {
  const Icon = item.icon
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.96 }}
      className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 group relative
        ${active
          ? 'bg-primary/15 text-primary border border-primary/30 shadow-md shadow-primary/10'
          : 'text-muted-foreground hover:text-foreground hover:bg-white/5 border border-transparent'
        }`}
      title={collapsed ? item.label : undefined}
    >
      {active && (
        <motion.div
          aria-hidden="true"
          layoutId="nav-pill"
          className="absolute inset-0 rounded-xl bg-primary/10 border border-primary/25"
          transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
        />
      )}
      <Icon
        className={`shrink-0 transition-colors relative z-10 ${active ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`}
        size={18}
      />
      {!collapsed && <span className="truncate relative z-10">{item.label}</span>}
      {!collapsed && active && <ChevronRight className="ml-auto text-primary relative z-10 shrink-0" size={14} />}
    </motion.button>
  )
}

// ── Step nav item ─────────────────────────────────────────────────────────────

export function StepNavItem({
  item,
  stepNum,
  active,
  onClick,
  collapsed,
  completed,
}: {
  item: { id: string; label: string; icon: React.ComponentType<{ className?: string; size?: number }> }
  stepNum: number
  active: boolean
  onClick: () => void
  collapsed: boolean
  completed: boolean
}) {
  const Icon = item.icon
  const badgeClass = completed
    ? 'bg-emerald-500 text-white'
    : active
    ? 'bg-primary text-primary-foreground'
    : 'bg-muted text-muted-foreground'

  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.96 }}
      className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 group relative
        ${active
          ? 'bg-primary/15 text-primary border border-primary/30 shadow-md shadow-primary/10'
          : 'text-muted-foreground hover:text-foreground hover:bg-white/5 border border-transparent'
        }`}
      title={collapsed ? item.label : undefined}
    >
      {active && (
        <motion.div
          aria-hidden="true"
          layoutId="step-nav-pill"
          className="absolute inset-0 rounded-xl bg-primary/10 border border-primary/25"
          transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
        />
      )}
      <div className="relative shrink-0 z-10">
        <Icon
          className={`transition-colors ${active ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`}
          size={18}
        />
        {collapsed && (
          <span className={`absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center ${badgeClass}`}>
            {completed ? '✓' : stepNum}
          </span>
        )}
      </div>
      {!collapsed && (
        <>
          <span className="truncate relative z-10 flex-1">{item.label}</span>
          <span className={`w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center relative z-10 shrink-0 ${badgeClass}`}>
            {completed ? '✓' : stepNum}
          </span>
        </>
      )}
    </motion.button>
  )
}

// ── Mobile bottom nav item ────────────────────────────────────────────────────

export function MobileNavItem({
  item,
  active,
  onClick,
}: {
  item: NavItem
  active: boolean
  onClick: () => void
}) {
  const Icon = item.icon
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex flex-col items-center gap-1 py-3 px-1 transition-colors min-h-[56px] ${
        active ? 'text-primary' : 'text-muted-foreground'
      }`}
    >
      <Icon size={22} className={active ? 'text-primary' : 'text-muted-foreground'} />
      <span className="text-xs font-medium uppercase tracking-wide leading-none">{item.label}</span>
    </button>
  )
}
