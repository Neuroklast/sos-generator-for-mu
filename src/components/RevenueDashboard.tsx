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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ChartBar size={24} weight="bold" className="text-primary" />
          <h2 className="text-2xl font-bold font-['Space_Grotesk']">Revenue Dashboard</h2>
        </div>
        
        {revenues.length > 0 && (
          <Button onClick={() => handleDownload('all')} size="lg" className="gap-2">
            <DownloadSimple size={20} weight="bold" />
            Download All as ZIP
          </Button>
        )}
      </div>

      {revenues.length > 0 ? (
        <>
          <Card className="p-6">
            <div className="flex items-baseline gap-2">
              <span className="text-sm uppercase tracking-wide text-muted-foreground">
                Total Revenue
              </span>
              <span className="text-3xl font-bold font-mono text-primary">
                {formatCurrency(totalRevenue)}
              </span>
            </div>
          </Card>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Artist</TableHead>
                  <TableHead className="text-right font-mono">Believe</TableHead>
                  <TableHead className="text-right font-mono">Bandcamp</TableHead>
                  <TableHead className="text-right font-mono">Manual</TableHead>
                  <TableHead className="text-right font-mono">Split %</TableHead>
                  <TableHead className="text-right font-mono">Final Amount</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {revenues.map((revenue, index) => (
                  <motion.tr
                    key={revenue.artist}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="group hover:bg-muted/50"
                  >
                    <TableCell className="font-semibold">{revenue.artist}</TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {formatCurrency(revenue.believeRevenue)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {formatCurrency(revenue.bandcampRevenue)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {formatCurrency(revenue.manualRevenue)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {revenue.splitPercentage}%
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold text-accent">
                      {formatCurrency(revenue.finalAmount)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="gap-2">
                            <DownloadSimple size={16} />
                            Download
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleDownload('pdf', revenue.artist)}>
                            <FilePdf size={16} className="mr-2" />
                            PDF Statement
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDownload('excel', revenue.artist)}>
                            <FileXls size={16} className="mr-2" />
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
