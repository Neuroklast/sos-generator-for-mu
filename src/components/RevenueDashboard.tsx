import { DownloadSimple, FilePdf, FileXls, ChartBar } from '@phosphor-icons/react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import type { ArtistRevenue } from '@/lib/types'

interface RevenueDashboardProps {
  revenues: ArtistRevenue[]
  onDownloadAll: () => void
  onDownloadPDF: (artist: string) => void
  onDownloadExcel: (artist: string) => void
}

export function RevenueDashboard({
  revenues,
  onDownloadAll,
  onDownloadPDF,
  onDownloadExcel,
}: RevenueDashboardProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(value)
  }

  const handleDownload = (type: 'pdf' | 'excel' | 'all', artist?: string) => {
    if (type === 'all') {
      toast.success('Generating all statements...', {
        description: 'Your ZIP file will download shortly',
      })
      onDownloadAll()
    } else if (artist) {
      const format = type === 'pdf' ? 'PDF' : 'Excel'
      toast.success(`Generating ${format} for ${artist}...`)
      if (type === 'pdf') {
        onDownloadPDF(artist)
      } else {
        onDownloadExcel(artist)
      }
    }
  }

  const totalRevenue = revenues.reduce((sum, r) => sum + r.finalAmount, 0)

  return (
    <div className="space-y-6 p-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-primary to-accent rounded-lg">
            <ChartBar size={28} weight="duotone" className="text-primary-foreground" />
          </div>
          <h2 className="text-3xl font-bold font-['Space_Grotesk']">Revenue Dashboard</h2>
        </div>
        
        {revenues.length > 0 && (
          <Button onClick={() => handleDownload('all')} size="lg" className="gap-2 bg-accent hover:bg-accent/90 shadow-lg shadow-accent/20">
            <DownloadSimple size={20} weight="bold" />
            Download All as ZIP
          </Button>
        )}
      </div>

      {revenues.length > 0 ? (
        <>
          <Card className="p-8 bg-gradient-to-br from-primary/5 to-accent/5 border-2">
            <div className="flex items-baseline gap-3">
              <span className="text-sm uppercase tracking-wider font-semibold text-muted-foreground">
                Total Revenue
              </span>
              <span className="text-4xl font-bold font-mono bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                {formatCurrency(totalRevenue)}
              </span>
            </div>
          </Card>

          <Card className="overflow-hidden border-2">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Artist</TableHead>
                  <TableHead className="text-right font-mono font-semibold">Believe</TableHead>
                  <TableHead className="text-right font-mono font-semibold">Bandcamp</TableHead>
                  <TableHead className="text-right font-mono font-semibold">Manual</TableHead>
                  <TableHead className="text-right font-mono font-semibold">Split %</TableHead>
                  <TableHead className="text-right font-mono font-semibold">Final Amount</TableHead>
                  <TableHead className="text-right font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {revenues.map((revenue, index) => (
                  <motion.tr
                    key={revenue.artist}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="group hover:bg-primary/5 border-b transition-colors"
                  >
                    <TableCell className="font-semibold text-base">{revenue.artist}</TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {formatCurrency(revenue.believeRevenue)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {formatCurrency(revenue.bandcampRevenue)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {formatCurrency(revenue.manualRevenue)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm text-primary font-semibold">
                      {revenue.splitPercentage}%
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold text-lg text-accent">
                      {formatCurrency(revenue.finalAmount)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="gap-2 hover:bg-primary hover:text-primary-foreground">
                            <DownloadSimple size={16} />
                            Download
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => handleDownload('pdf', revenue.artist)} className="cursor-pointer">
                            <FilePdf size={16} className="mr-2 text-destructive" />
                            PDF Statement
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDownload('excel', revenue.artist)} className="cursor-pointer">
                            <FileXls size={16} className="mr-2 text-green-600" />
                            Excel Spreadsheet
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          </Card>
        </>
      ) : (
        <Card className="p-12 text-center border-dashed">
          <ChartBar size={48} className="mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No Revenue Data Yet</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Upload CSV files and configure your settings to generate artist revenue statements
          </p>
        </Card>
      )}
    </div>
  )
}
