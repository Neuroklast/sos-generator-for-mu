import { useMemo, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ChartBar,
  TrendUp,
  Globe,
  Storefront,
  CalendarBlank,
  MusicNote,
  CurrencyEur,
  Users,
  Playlist,
} from '@phosphor-icons/react'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type { ArtistRevenue } from '@/lib/types'

interface AnalyticsDashboardProps {
  revenues: ArtistRevenue[]
}

const CHART_COLORS = [
  'oklch(0.65 0.28 295)',
  'oklch(0.70 0.30 290)',
  'oklch(0.60 0.25 300)',
  'oklch(0.55 0.22 285)',
  'oklch(0.75 0.32 280)',
  'oklch(0.62 0.26 292)',
  'oklch(0.68 0.29 288)',
  'oklch(0.58 0.24 297)',
]

export function AnalyticsDashboard({ revenues }: AnalyticsDashboardProps) {
  const [selectedArtist, setSelectedArtist] = useState<string>('all')
  const [timeRange, setTimeRange] = useState<'all' | '3m' | '6m' | '12m'>('all')

  const filteredRevenues = useMemo(() => {
    if (selectedArtist === 'all') return revenues
    return revenues.filter(r => r.artist === selectedArtist)
  }, [revenues, selectedArtist])

  const stats = useMemo(() => {
    const total = revenues.reduce((sum, r) => sum + r.totalRevenue, 0)
    const totalFinal = revenues.reduce((sum, r) => sum + r.finalAmount, 0)
    const totalQuantity = revenues.reduce((sum, r) => sum + r.totalQuantity, 0)
    const avgSplit = revenues.length > 0 
      ? revenues.reduce((sum, r) => sum + r.splitPercentage, 0) / revenues.length 
      : 0

    const allPlatforms = new Set<string>()
    const allCountries = new Set<string>()
    revenues.forEach(r => {
      r.platformBreakdown.forEach(p => allPlatforms.add(p.platform))
      r.countryBreakdown.forEach(c => allCountries.add(c.country))
    })

    return {
      totalRevenue: total,
      totalFinalAmount: totalFinal,
      totalQuantity,
      artistCount: revenues.length,
      platformCount: allPlatforms.size,
      countryCount: allCountries.size,
      averageSplit: avgSplit,
    }
  }, [revenues])

  const topArtists = useMemo(() => {
    return [...revenues]
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 10)
      .map(r => ({
        name: r.artist.length > 20 ? r.artist.substring(0, 20) + '...' : r.artist,
        fullName: r.artist,
        revenue: r.totalRevenue,
        finalAmount: r.finalAmount,
        quantity: r.totalQuantity,
      }))
  }, [revenues])

  const platformData = useMemo(() => {
    const platformMap = new Map<string, { revenue: number, quantity: number }>()
    
    filteredRevenues.forEach(r => {
      r.platformBreakdown.forEach(p => {
        const existing = platformMap.get(p.platform) || { revenue: 0, quantity: 0 }
        platformMap.set(p.platform, {
          revenue: existing.revenue + p.revenue,
          quantity: existing.quantity + p.quantity,
        })
      })
    })

    return Array.from(platformMap.entries())
      .map(([platform, data]) => ({
        name: platform,
        revenue: parseFloat(data.revenue.toFixed(2)),
        quantity: data.quantity,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 15)
  }, [filteredRevenues])

  const countryData = useMemo(() => {
    const countryMap = new Map<string, number>()
    
    filteredRevenues.forEach(r => {
      r.countryBreakdown.forEach(c => {
        countryMap.set(c.country, (countryMap.get(c.country) || 0) + c.revenue)
      })
    })

    return Array.from(countryMap.entries())
      .map(([country, revenue]) => ({
        name: country,
        revenue: parseFloat(revenue.toFixed(2)),
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 12)
  }, [filteredRevenues])

  const monthlyData = useMemo(() => {
    const monthMap = new Map<string, number>()
    
    filteredRevenues.forEach(r => {
      r.monthlyBreakdown.forEach(m => {
        monthMap.set(m.month, (monthMap.get(m.month) || 0) + m.revenue)
      })
    })

    return Array.from(monthMap.entries())
      .map(([month, revenue]) => ({
        month,
        revenue: parseFloat(revenue.toFixed(2)),
      }))
      .sort((a, b) => a.month.localeCompare(b.month))
  }, [filteredRevenues])

  const revenueSourceData = useMemo(() => {
    const believe = filteredRevenues.reduce((sum, r) => sum + r.believeRevenue, 0)
    const bandcamp = filteredRevenues.reduce((sum, r) => sum + r.bandcampRevenue, 0)
    const manual = filteredRevenues.reduce((sum, r) => sum + r.manualRevenue, 0)

    return [
      { name: 'Believe', value: parseFloat(believe.toFixed(2)) },
      { name: 'Bandcamp', value: parseFloat(bandcamp.toFixed(2)) },
      { name: 'Manual', value: parseFloat(manual.toFixed(2)) },
    ].filter(item => item.value > 0)
  }, [filteredRevenues])

  const releaseTypeData = useMemo(() => {
    let digital = 0
    let physical = 0

    filteredRevenues.forEach(r => {
      r.releaseBreakdown.forEach(rel => {
        if (rel.isPhysical) {
          physical += rel.revenue
        } else {
          digital += rel.revenue
        }
      })
    })

    return [
      { name: 'Digital', value: parseFloat(digital.toFixed(2)) },
      { name: 'Physical', value: parseFloat(physical.toFixed(2)) },
    ].filter(item => item.value > 0)
  }, [filteredRevenues])

  const formatCurrency = (value: number) => `€${value.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border-2 border-primary/30 p-4 rounded-lg shadow-xl">
          <p className="font-semibold text-foreground mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {typeof entry.value === 'number' ? formatCurrency(entry.value) : entry.value}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-3">
            <ChartBar size={32} weight="duotone" className="text-primary" />
            Visual Analytics
          </h2>
          <p className="text-muted-foreground mt-1">
            Comprehensive revenue insights and breakdowns
          </p>
        </div>

        <div className="flex gap-3">
          <Select value={selectedArtist} onValueChange={setSelectedArtist}>
            <SelectTrigger className="w-[200px] border-primary/30">
              <SelectValue placeholder="Select artist" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Artists</SelectItem>
              {revenues.map(r => (
                <SelectItem key={r.artist} value={r.artist}>
                  {r.artist}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 border-2 border-primary/30 bg-gradient-to-br from-card to-card/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-medium">Total Revenue</p>
              <p className="text-2xl font-bold text-primary mt-1">
                {formatCurrency(stats.totalRevenue)}
              </p>
            </div>
            <CurrencyEur size={40} weight="duotone" className="text-primary/30" />
          </div>
        </Card>

        <Card className="p-6 border-2 border-primary/30 bg-gradient-to-br from-card to-card/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-medium">Final Payout</p>
              <p className="text-2xl font-bold text-accent mt-1">
                {formatCurrency(stats.totalFinalAmount)}
              </p>
            </div>
            <TrendUp size={40} weight="duotone" className="text-accent/30" />
          </div>
        </Card>

        <Card className="p-6 border-2 border-primary/30 bg-gradient-to-br from-card to-card/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-medium">Total Units</p>
              <p className="text-2xl font-bold text-foreground mt-1">
                {stats.totalQuantity.toLocaleString('de-DE')}
              </p>
            </div>
            <MusicNote size={40} weight="duotone" className="text-primary/30" />
          </div>
        </Card>

        <Card className="p-6 border-2 border-primary/30 bg-gradient-to-br from-card to-card/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-medium">Artists</p>
              <p className="text-2xl font-bold text-foreground mt-1">
                {stats.artistCount}
              </p>
            </div>
            <Users size={40} weight="duotone" className="text-primary/30" />
          </div>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-card/70 border-2 border-primary/20">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="platforms">Platforms</TabsTrigger>
          <TabsTrigger value="geography">Geography</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="artists">Artists</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6 border-2 border-primary/30">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Storefront size={20} weight="duotone" className="text-primary" />
                Revenue by Source
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={revenueSourceData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {revenueSourceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-6 border-2 border-primary/30">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Playlist size={20} weight="duotone" className="text-primary" />
                Digital vs Physical
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={releaseTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {releaseTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index + 2]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </div>

          <Card className="p-6 border-2 border-primary/30">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TrendUp size={20} weight="duotone" className="text-primary" />
              Revenue Distribution
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Platforms</p>
                <p className="text-xl font-bold">{stats.platformCount}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Countries</p>
                <p className="text-xl font-bold">{stats.countryCount}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Avg Split</p>
                <p className="text-xl font-bold">{stats.averageSplit.toFixed(1)}%</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Active Artists</p>
                <p className="text-xl font-bold">{stats.artistCount}</p>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="platforms" className="space-y-6">
          <Card className="p-6 border-2 border-primary/30">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Storefront size={20} weight="duotone" className="text-primary" />
              Revenue by Platform
            </h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={platformData}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.20 0.03 285)" />
                <XAxis 
                  dataKey="name" 
                  angle={-45} 
                  textAnchor="end" 
                  height={100}
                  stroke="oklch(0.55 0.01 285)"
                />
                <YAxis stroke="oklch(0.55 0.01 285)" />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="revenue" fill={CHART_COLORS[0]} name="Revenue (€)" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-6 border-2 border-primary/30">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <MusicNote size={20} weight="duotone" className="text-primary" />
              Units by Platform
            </h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={platformData}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.20 0.03 285)" />
                <XAxis 
                  dataKey="name" 
                  angle={-45} 
                  textAnchor="end" 
                  height={100}
                  stroke="oklch(0.55 0.01 285)"
                />
                <YAxis stroke="oklch(0.55 0.01 285)" />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="quantity" fill={CHART_COLORS[1]} name="Units" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>

        <TabsContent value="geography" className="space-y-6">
          <Card className="p-6 border-2 border-primary/30">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Globe size={20} weight="duotone" className="text-primary" />
              Revenue by Country/Region
            </h3>
            <ResponsiveContainer width="100%" height={500}>
              <BarChart data={countryData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.20 0.03 285)" />
                <XAxis type="number" stroke="oklch(0.55 0.01 285)" />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  width={80}
                  stroke="oklch(0.55 0.01 285)"
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="revenue" fill={CHART_COLORS[2]} name="Revenue (€)" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-6">
          <Card className="p-6 border-2 border-primary/30">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <CalendarBlank size={20} weight="duotone" className="text-primary" />
              Monthly Revenue Trend
            </h3>
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS[0]} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={CHART_COLORS[0]} stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.20 0.03 285)" />
                <XAxis 
                  dataKey="month" 
                  stroke="oklch(0.55 0.01 285)"
                />
                <YAxis stroke="oklch(0.55 0.01 285)" />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke={CHART_COLORS[0]} 
                  fillOpacity={1} 
                  fill="url(#colorRevenue)"
                  name="Revenue (€)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-6 border-2 border-primary/30">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TrendUp size={20} weight="duotone" className="text-primary" />
              Revenue Growth Line
            </h3>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.20 0.03 285)" />
                <XAxis 
                  dataKey="month" 
                  stroke="oklch(0.55 0.01 285)"
                />
                <YAxis stroke="oklch(0.55 0.01 285)" />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke={CHART_COLORS[1]} 
                  strokeWidth={3}
                  dot={{ fill: CHART_COLORS[1], r: 5 }}
                  activeDot={{ r: 8 }}
                  name="Revenue (€)"
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>

        <TabsContent value="artists" className="space-y-6">
          <Card className="p-6 border-2 border-primary/30">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Users size={20} weight="duotone" className="text-primary" />
              Top 10 Artists by Revenue
            </h3>
            <ResponsiveContainer width="100%" height={500}>
              <BarChart data={topArtists} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.20 0.03 285)" />
                <XAxis type="number" stroke="oklch(0.55 0.01 285)" />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  width={150}
                  stroke="oklch(0.55 0.01 285)"
                />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload
                      return (
                        <div className="bg-card border-2 border-primary/30 p-4 rounded-lg shadow-xl">
                          <p className="font-semibold text-foreground mb-2">{data.fullName}</p>
                          <p className="text-sm text-primary">
                            Revenue: {formatCurrency(data.revenue)}
                          </p>
                          <p className="text-sm text-accent">
                            Final: {formatCurrency(data.finalAmount)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Units: {data.quantity.toLocaleString('de-DE')}
                          </p>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Legend />
                <Bar dataKey="revenue" fill={CHART_COLORS[0]} name="Total Revenue (€)" />
                <Bar dataKey="finalAmount" fill={CHART_COLORS[1]} name="Final Payout (€)" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
