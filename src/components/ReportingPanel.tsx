import { useMemo } from 'react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import { Card } from '@/components/ui/card'
import { ChartLine, ChartBar, Globe, MusicNote, TrendUp } from '@phosphor-icons/react'
import type { ArtistRevenue } from '@/lib/types'

interface ReportingPanelProps {
  revenues: ArtistRevenue[]
}

// ── Colour palette ─────────────────────────────────────────────────────────────

const CHART_COLORS = [
  'oklch(0.45 0.18 295)',
  'oklch(0.65 0.25 300)',
  'oklch(0.55 0.22 250)',
  'oklch(0.70 0.20 320)',
  'oklch(0.60 0.15 210)',
  'oklch(0.50 0.20 280)',
  'oklch(0.75 0.18 340)',
  'oklch(0.40 0.25 260)',
]

// ── Formatters ─────────────────────────────────────────────────────────────────

function fmtEur(value: number) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }).format(value)
}

function fmtEurShort(value: number) {
  if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(1)}k €`
  return `${value.toFixed(2)} €`
}

function fmtNum(value: number) {
  return new Intl.NumberFormat('de-DE').format(value)
}

// ── Shared chart styles ────────────────────────────────────────────────────────

const TOOLTIP_STYLE = {
  backgroundColor: 'var(--color-card)',
  border: '1px solid var(--color-border)',
  borderRadius: '8px',
  fontSize: '12px',
}

const AXIS_STYLE = { fontSize: 11, fill: 'var(--muted-foreground)' }

// ── Custom tooltip components ──────────────────────────────────────────────────

function CurrencyTooltip({ active, payload, label }: { active?: boolean; payload?: {name: string; value: number; color: string}[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div style={TOOLTIP_STYLE} className="p-3 shadow-lg">
      <p className="font-semibold text-foreground mb-2">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: p.color }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-mono font-semibold text-foreground">{fmtEur(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

function PieTooltip({ active, payload }: { active?: boolean; payload?: {name: string; value: number}[] }) {
  if (!active || !payload?.length) return null
  return (
    <div style={TOOLTIP_STYLE} className="p-3 shadow-lg">
      <p className="font-semibold text-foreground">{payload[0].name}</p>
      <p className="font-mono text-primary">{fmtEur(payload[0].value)}</p>
    </div>
  )
}

// ── Chart section wrapper ──────────────────────────────────────────────────────

function ChartSection({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Card className="p-6 border-2">
      <div className="flex items-center gap-2 mb-5">
        <div className="p-2 rounded-lg bg-primary/10">{icon}</div>
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>
      {children}
    </Card>
  )
}

// ── KPI card ──────────────────────────────────────────────────────────────────

function KPICard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card className="p-5 border-2 bg-gradient-to-br from-primary/5 to-accent/5">
      <p className="text-xs uppercase tracking-widest font-semibold text-muted-foreground mb-1">{label}</p>
      <p className="text-2xl font-bold font-mono text-foreground">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </Card>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export function ReportingPanel({ revenues }: ReportingPanelProps) {
  // ── Derived aggregate data ─────────────────────────────────────────────────

  const totalPayout = useMemo(() => revenues.reduce((s, r) => s + r.finalAmount, 0), [revenues])
  const totalQuantity = useMemo(() => revenues.reduce((s, r) => s + (r.totalQuantity ?? 0), 0), [revenues])
  const avgSplit = useMemo(() =>
    revenues.length ? revenues.reduce((s, r) => s + r.splitPercentage, 0) / revenues.length : 0,
    [revenues]
  )
  const topArtist = useMemo(() =>
    revenues.length ? revenues[0] : null,
    [revenues]
  )

  /** Merged monthly data across all artists (YYYY-MM → total revenue) */
  const monthlyData = useMemo(() => {
    const map = new Map<string, number>()
    for (const rev of revenues) {
      for (const m of rev.monthlyBreakdown) {
        map.set(m.month, (map.get(m.month) ?? 0) + m.revenue)
      }
    }
    return Array.from(map.entries())
      .map(([month, revenue]) => ({ month, revenue }))
      .sort((a, b) => a.month.localeCompare(b.month))
  }, [revenues])

  /** Platform totals across all artists */
  const platformData = useMemo(() => {
    const map = new Map<string, { revenue: number; quantity: number }>()
    for (const rev of revenues) {
      for (const p of rev.platformBreakdown) {
        const ex = map.get(p.platform) ?? { revenue: 0, quantity: 0 }
        map.set(p.platform, { revenue: ex.revenue + p.revenue, quantity: ex.quantity + p.quantity })
      }
    }
    return Array.from(map.entries())
      .map(([platform, { revenue, quantity }]) => ({ platform, revenue, quantity }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 12)
  }, [revenues])

  /** Country totals */
  const countryData = useMemo(() => {
    const map = new Map<string, number>()
    for (const rev of revenues) {
      for (const c of rev.countryBreakdown) {
        map.set(c.country, (map.get(c.country) ?? 0) + c.revenue)
      }
    }
    return Array.from(map.entries())
      .map(([country, revenue]) => ({ country, revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)
  }, [revenues])

  /** Artist comparison for bar chart */
  const artistComparison = useMemo(() =>
    revenues.slice(0, 15).map(r => ({
      artist: r.artist.length > 18 ? r.artist.slice(0, 16) + '…' : r.artist,
      fullName: r.artist,
      believe: r.believeRevenue,
      bandcamp: r.bandcampRevenue,
      manual: r.manualRevenue,
      total: r.finalAmount,
    })),
    [revenues]
  )

  /** Pie chart data for source breakdown */
  const sourceData = useMemo(() => {
    const believe = revenues.reduce((s, r) => s + r.believeRevenue, 0)
    const bandcamp = revenues.reduce((s, r) => s + r.bandcampRevenue, 0)
    const manual = revenues.reduce((s, r) => s + r.manualRevenue, 0)
    return [
      { name: 'Believe', value: believe },
      { name: 'Bandcamp', value: bandcamp },
      { name: 'Manual', value: manual },
    ].filter(d => d.value > 0)
  }, [revenues])

  // ── Empty state ───────────────────────────────────────────────────────────

  if (revenues.length === 0) {
    return (
      <div className="p-8 flex flex-col items-center justify-center text-center gap-4 min-h-64">
        <div className="p-4 bg-primary/10 rounded-full">
          <ChartLine size={40} className="text-primary" />
        </div>
        <h3 className="text-xl font-semibold">No Data Yet</h3>
        <p className="text-muted-foreground max-w-sm">
          Upload CSV files on the Upload tab to see reporting charts and analytics here.
        </p>
      </div>
    )
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-3 bg-gradient-to-br from-primary to-accent rounded-lg">
          <TrendUp size={28} weight="duotone" className="text-primary-foreground" />
        </div>
        <div>
          <h2 className="text-2xl font-bold font-['Space_Grotesk']">Reports & Analytics</h2>
          <p className="text-sm text-muted-foreground">Performance overview across all artists and sources</p>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Total Payout" value={fmtEur(totalPayout)} sub={`${revenues.length} artist(s)`} />
        <KPICard label="Total Streams / Units" value={fmtNum(totalQuantity)} />
        <KPICard label="Avg Split %" value={`${avgSplit.toFixed(1)} %`} />
        <KPICard label="Top Artist" value={topArtist?.artist ?? '—'} sub={topArtist ? fmtEur(topArtist.finalAmount) : undefined} />
      </div>

      {/* Monthly revenue trend */}
      {monthlyData.length > 0 && (
        <ChartSection title="Monthly Revenue Trend" icon={<ChartLine size={20} className="text-primary" />}>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={monthlyData} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_COLORS[0]} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={CHART_COLORS[0]} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" strokeOpacity={0.5} />
              <XAxis dataKey="month" tick={AXIS_STYLE} axisLine={false} tickLine={false} />
              <YAxis tick={AXIS_STYLE} axisLine={false} tickLine={false} tickFormatter={fmtEurShort} width={72} />
              <Tooltip content={<CurrencyTooltip />} />
              <Area
                type="monotone"
                dataKey="revenue"
                name="Revenue"
                stroke={CHART_COLORS[0]}
                strokeWidth={2.5}
                fill="url(#revenueGradient)"
                dot={{ fill: CHART_COLORS[0], r: 3 }}
                activeDot={{ r: 6, strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartSection>
      )}

      {/* Two-column: Artist comparison + Source pie */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Artist comparison */}
        {artistComparison.length > 0 && (
          <ChartSection title="Artist Revenue Comparison" icon={<MusicNote size={20} className="text-primary" />}>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={artistComparison} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--color-border)" strokeOpacity={0.5} />
                <XAxis type="number" tick={AXIS_STYLE} axisLine={false} tickLine={false} tickFormatter={fmtEurShort} />
                <YAxis dataKey="artist" type="category" tick={{ ...AXIS_STYLE, fontSize: 10 }} axisLine={false} tickLine={false} width={90} />
                <Tooltip
                  content={({ active, payload, label }: { active?: boolean; payload?: {name: string; value: number; color: string}[]; label?: string }) => {
                    if (!active || !payload?.length) return null
                    const full = revenues.find(r => r.artist.startsWith(label?.replace('…', '') ?? ''))
                    return (
                      <div style={TOOLTIP_STYLE} className="p-3 shadow-lg">
                        <p className="font-semibold mb-1">{full?.artist ?? label}</p>
                        {payload.map((p, i) => (
                          <div key={i} className="flex gap-2">
                            <span className="text-muted-foreground text-xs">{p.name}:</span>
                            <span className="font-mono text-xs">{fmtEur(p.value)}</span>
                          </div>
                        ))}
                      </div>
                    )
                  }}
                />
                <Bar dataKey="believe" name="Believe" stackId="a" fill={CHART_COLORS[0]} radius={[0, 0, 0, 0]} />
                <Bar dataKey="bandcamp" name="Bandcamp" stackId="a" fill={CHART_COLORS[1]} />
                <Bar dataKey="manual" name="Manual" stackId="a" fill={CHART_COLORS[2]} radius={[0, 4, 4, 0]} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </BarChart>
            </ResponsiveContainer>
          </ChartSection>
        )}

        {/* Source breakdown pie */}
        {sourceData.length > 0 && (
          <ChartSection title="Revenue by Source" icon={<ChartBar size={20} className="text-primary" />}>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={sourceData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  innerRadius={50}
                  paddingAngle={2}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                  labelLine={{ stroke: 'var(--muted-foreground)', strokeWidth: 1 }}
                >
                  {sourceData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </ChartSection>
        )}
      </div>

      {/* Platform breakdown */}
      {platformData.length > 0 && (
        <ChartSection title="Revenue by Platform" icon={<ChartBar size={20} className="text-primary" />}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={platformData} margin={{ top: 8, right: 16, left: 8, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" strokeOpacity={0.5} />
              <XAxis
                dataKey="platform"
                tick={{ ...AXIS_STYLE, fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                angle={-35}
                textAnchor="end"
                interval={0}
              />
              <YAxis tick={AXIS_STYLE} axisLine={false} tickLine={false} tickFormatter={fmtEurShort} width={72} />
              <Tooltip
                content={({ active, payload, label }: { active?: boolean; payload?: {value: number; name: string}[]; label?: string }) => {
                  if (!active || !payload?.length) return null
                  const qty = platformData.find(p => p.platform === label)?.quantity ?? 0
                  return (
                    <div style={TOOLTIP_STYLE} className="p-3">
                      <p className="font-semibold mb-1">{label}</p>
                      <p className="font-mono text-primary">{fmtEur(payload[0].value)}</p>
                      <p className="text-xs text-muted-foreground">{fmtNum(qty)} units</p>
                    </div>
                  )
                }}
              />
              <Bar dataKey="revenue" name="Revenue" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]}>
                {platformData.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartSection>
      )}

      {/* Country breakdown */}
      {countryData.length > 0 && (
        <ChartSection title="Top 10 Countries by Revenue" icon={<Globe size={20} className="text-primary" />}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={countryData} layout="vertical" margin={{ top: 4, right: 80, left: 8, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--color-border)" strokeOpacity={0.5} />
              <XAxis type="number" tick={AXIS_STYLE} axisLine={false} tickLine={false} tickFormatter={fmtEurShort} />
              <YAxis dataKey="country" type="category" tick={AXIS_STYLE} axisLine={false} tickLine={false} width={40} />
              <Tooltip
                content={({ active, payload, label }: { active?: boolean; payload?: {value: number}[]; label?: string }) => {
                  if (!active || !payload?.length) return null
                  return (
                    <div style={TOOLTIP_STYLE} className="p-3">
                      <p className="font-semibold mb-1">{label}</p>
                      <p className="font-mono text-primary">{fmtEur(payload[0].value)}</p>
                    </div>
                  )
                }}
              />
              <Bar dataKey="revenue" name="Revenue" radius={[0, 4, 4, 0]}>
                {countryData.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartSection>
      )}
    </div>
  )
}
