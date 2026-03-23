import { useMemo, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  ChartBar,
  TrendUp,
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
      totalQuantity: totalQuantity,
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
        <Card className="p-6 border-primary/20 bg-gradient-to-br from-card to-card/50">
          <div className="flex items-center gap-3 mb-2">
            <CurrencyEur size={24} weight="duotone" className="text-primary" />
            <h3 className="text-sm font-medium text-muted-foreground">Total Revenue</h3>
          </div>
          <p className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</p>
        </Card>

        <Card className="p-6 border-primary/20 bg-gradient-to-br from-card to-card/50">
          <div className="flex items-center gap-3 mb-2">
            <Users size={24} weight="duotone" className="text-accent" />
            <h3 className="text-sm font-medium text-muted-foreground">Artists</h3>
          </div>
          <p className="text-2xl font-bold">{stats.artistCount}</p>
        </Card>

        <Card className="p-6 border-primary/20 bg-gradient-to-br from-card to-card/50">
          <div className="flex items-center gap-3 mb-2">
            <Storefront size={24} weight="duotone" className="text-primary" />
            <h3 className="text-sm font-medium text-muted-foreground">Platforms</h3>
          </div>
          <p className="text-2xl font-bold">{stats.platformCount}</p>
        </Card>

        <Card className="p-6 border-primary/20 bg-gradient-to-br from-card to-card/50">
          <div className="flex items-center gap-3 mb-2">
            <MusicNote size={24} weight="duotone" className="text-accent" />
            <h3 className="text-sm font-medium text-muted-foreground">Total Units</h3>
          </div>
          <p className="text-2xl font-bold">{stats.totalQuantity.toLocaleString()}</p>
        </Card>
      </div>

      <Tabs defaultValue="monthly" className="space-y-6">
        <TabsList className="bg-card/70 backdrop-blur-md border border-primary/20">
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
          <TabsTrigger value="artists">Artists</TabsTrigger>
          <TabsTrigger value="platforms">Platforms</TabsTrigger>
          <TabsTrigger value="countries">Countries</TabsTrigger>
          <TabsTrigger value="sources">Sources</TabsTrigger>
          <TabsTrigger value="types">Types</TabsTrigger>
        </TabsList>

        <TabsContent value="monthly" className="space-y-6">
          <Card className="p-6 border-primary/20">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <CalendarBlank size={24} weight="duotone" className="text-primary" />
              Revenue Trend
            </h3>
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="oklch(0.65 0.28 295)" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="oklch(0.65 0.28 295)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.20 0.03 285)" />
                <XAxis 
                  dataKey="month" 
                  stroke="oklch(0.55 0.01 285)"
                />
                <YAxis 
                  stroke="oklch(0.55 0.01 285)"
                  tickFormatter={(value) => `€${value}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="oklch(0.65 0.28 295)" 
                  fillOpacity={1} 
                  fill="url(#colorRevenue)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>

        <TabsContent value="artists" className="space-y-6">
          <Card className="p-6 border-primary/20">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Users size={24} weight="duotone" className="text-primary" />
              Top 10 Artists by Revenue
            </h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={topArtists} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.20 0.03 285)" />
                <XAxis type="number" stroke="oklch(0.55 0.01 285)" tickFormatter={(value) => `€${value}`} />
                <YAxis type="category" dataKey="name" stroke="oklch(0.55 0.01 285)" width={120} />
                <Tooltip content={({ active, payload }) => {
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
                          Units: {data.quantity.toLocaleString()}
                        </p>
                      </div>
                    )
                  }
                  return null
                }} />
                <Bar dataKey="revenue" fill="oklch(0.65 0.28 295)" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>

        <TabsContent value="platforms" className="space-y-6">
          <Card className="p-6 border-primary/20">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Storefront size={24} weight="duotone" className="text-primary" />
              Revenue by Platform
            </h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={platformData}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.20 0.03 285)" />
                <XAxis dataKey="name" stroke="oklch(0.55 0.01 285)" angle={-45} textAnchor="end" height={100} />
                <YAxis stroke="oklch(0.55 0.01 285)" tickFormatter={(value) => `€${value}`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="revenue" fill="oklch(0.70 0.30 290)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>

        <TabsContent value="countries" className="space-y-6">
          <Card className="p-6 border-primary/20">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TrendUp size={24} weight="duotone" className="text-primary" />
              Top Countries by Revenue
            </h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={countryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.20 0.03 285)" />
                <XAxis dataKey="name" stroke="oklch(0.55 0.01 285)" />
                <YAxis stroke="oklch(0.55 0.01 285)" tickFormatter={(value) => `€${value}`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="revenue" fill="oklch(0.60 0.25 300)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>

        <TabsContent value="sources" className="space-y-6">
          <Card className="p-6 border-primary/20">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Playlist size={24} weight="duotone" className="text-primary" />
              Revenue by Source
            </h3>
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={revenueSourceData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {revenueSourceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>

        <TabsContent value="types" className="space-y-6">
          <Card className="p-6 border-primary/20">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <MusicNote size={24} weight="duotone" className="text-primary" />
              Digital vs Physical
            </h3>
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={releaseTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent, value }) => `${name}: ${formatCurrency(value)} (${(percent * 100).toFixed(1)}%)`}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {releaseTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
