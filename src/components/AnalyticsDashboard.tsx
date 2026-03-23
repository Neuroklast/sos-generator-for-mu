import { useMemo, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
  SelectItem,
  Select
import {
  TrendUp,
  Storefront,
  MusicNote,
  Users,
} from '@phosphor-icons/react'
  BarCha
  LineChart
  PieChart
  Cell,
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
  'oklc
  XAxis,
  'oklch
  CartesianGrid,
  'oklch(0
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type { ArtistRevenue } from '@/lib/types'

interface AnalyticsDashboardProps {
  revenues: ArtistRevenue[]
 

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
    filte

    const allPlatforms = new Set<string>()
    const allCountries = new Set<string>()
    revenues.forEach(r => {
      r.platformBreakdown.forEach(p => allPlatforms.add(p.platform))
      r.countryBreakdown.forEach(c => allCountries.add(c.country))
    })

    return {
      totalRevenue: total,
      totalFinalAmount: totalFinal,
  }, [filteredRevenu
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
  }, [filteredReve
        name: r.artist.length > 20 ? r.artist.substring(0, 20) + '...' : r.artist,
        fullName: r.artist,
        revenue: r.totalRevenue,
        finalAmount: r.finalAmount,
        quantity: r.totalQuantity,
    })
  }, [revenues])

  const platformData = useMemo(() => {
    const platformMap = new Map<string, { revenue: number, quantity: number }>()
    
    filteredRevenues.forEach(r => {
      r.platformBreakdown.forEach(p => {
        const existing = platformMap.get(p.platform) || { revenue: 0, quantity: 0 }
        platformMap.set(p.platform, {
          revenue: existing.revenue + p.revenue,
          quantity: existing.quantity + p.quantity,
      { na
      })


    let physical = 0
      .map(([platform, data]) => ({
        name: platform,
        revenue: parseFloat(data.revenue.toFixed(2)),
        } else {
      }))
      })
      .slice(0, 15)
    return [

  const countryData = useMemo(() => {
    const countryMap = new Map<string, number>()
    
    filteredRevenues.forEach(r => {
      r.countryBreakdown.forEach(c => {
        countryMap.set(c.country, (countryMap.get(c.country) || 0) + c.revenue)
        
    })

    return Array.from(countryMap.entries())
        </div>
        name: country,
        revenue: parseFloat(revenue.toFixed(2)),
      }))
  return (
      .slice(0, 12)
  }, [filteredRevenues])

  const monthlyData = useMemo(() => {
    const monthMap = new Map<string, number>()
    
    filteredRevenues.forEach(r => {

        monthMap.set(m.month, (monthMap.get(m.month) || 0) + m.revenue)
        
    })

    return Array.from(monthMap.entries())
                <SelectItem key={r.
        month,
        revenue: parseFloat(revenue.toFixed(2)),
      }))
      .sort((a, b) => a.month.localeCompare(b.month))
  }, [filteredRevenues])

  const revenueSourceData = useMemo(() => {
    const believe = filteredRevenues.reduce((sum, r) => sum + r.believeRevenue, 0)
    const bandcamp = filteredRevenues.reduce((sum, r) => sum + r.bandcampRevenue, 0)
    const manual = filteredRevenues.reduce((sum, r) => sum + r.manualRevenue, 0)

            
      { name: 'Believe', value: parseFloat(believe.toFixed(2)) },
      { name: 'Bandcamp', value: parseFloat(bandcamp.toFixed(2)) },
      { name: 'Manual', value: parseFloat(manual.toFixed(2)) },
            <div>
  }, [filteredRevenues])

  const releaseTypeData = useMemo(() => {
            <TrendU
    let physical = 0

    filteredRevenues.forEach(r => {
      r.releaseBreakdown.forEach(rel => {
        if (rel.isPhysical) {
          physical += rel.revenue
        } else {
            <MusicNote size={40}
        }

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
             
        </div>
      )
    }
               
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
             
          <h2 className="text-3xl font-bold flex items-center gap-3">
            <ChartBar size={32} weight="duotone" className="text-primary" />
            Visual Analytics
            <Ca
          <p className="text-muted-foreground mt-1">
            Comprehensive revenue insights and breakdowns
          </p>
              

                    cx="50%"
          <Select value={selectedArtist} onValueChange={setSelectedArtist}>
            <SelectTrigger className="w-[200px] border-primary/30">
              <SelectValue placeholder="Select artist" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Artists</SelectItem>
              {revenues.map(r => (
                <SelectItem key={r.artist} value={r.artist}>
                  {r.artist}
            </Card>
              ))}
          <Card className="p
          </Select>
              
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

            <h3 className="text-lg font-semibold mb-4 flex it
              Rev
            <ResponsiveContainer width="100%" height={400}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch
                  dataKey="month" 
                />
                <T
                <Line 
                
               

                />
            </ResponsiveContainer>
        </TabsCon
        <TabsContent value="artists" className="space-y-6">
            <h3 className="text-lg font-semibold mb-4 flex items-
              Top 10 Artists by Revenue
            <Respo
                <C
                <YAxis 
                
               

                    if (active && payload && payload.length) {
                      return (
                 
                            Revenue: {formatCurrency(data.revenue)}
                          <p className="text-sm text-accent">
                          </p>
                  
                  
                    }
                
               

            </ResponsiveContainer>
        </TabsContent>
    </div>
}



























































































































































































































































































