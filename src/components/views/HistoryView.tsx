import { Card } from '@/components/ui/card'
import { HistoryPanel } from '@/components/HistoryPanel'
import type { HistoryEntry } from '@/lib/types'

interface HistoryViewProps {
  historyEntries: HistoryEntry[]
  clearHistory: () => void
}

export function HistoryView({ historyEntries, clearHistory }: HistoryViewProps) {
  return (
    <Card className="border border-white/10 bg-card backdrop-blur-md rounded-2xl overflow-hidden">
      <HistoryPanel entries={historyEntries} onClearHistory={clearHistory} />
    </Card>
  )
}
