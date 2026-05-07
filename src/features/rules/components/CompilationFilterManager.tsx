import { useTranslation } from 'react-i18next'
import { Plus, Trash, FunnelSimple, MagnifyingGlass, TextT, ListBullets, Sparkle, CheckCircle } from '@phosphor-icons/react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useCallback, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { CompilationFilter } from '@/lib/types'
import type { CompilationDetectionResult } from '@/lib/compilation-heuristics'

interface CompilationFilterManagerProps {
  filters: CompilationFilter[]
  onAddFilter: (filter: Omit<CompilationFilter, 'id'>) => void
  /** Optional bulk-add handler for adding multiple filters in one call. */
  onAddMultipleFilters?: (filters: Omit<CompilationFilter, 'id'>[]) => void
  onRemoveFilter: (id: string) => void
  /** All unique release titles from the loaded data, for the dropdown picker. */
  availableReleases?: string[]
  /** Auto-detected compilation candidates from the heuristic engine. */
  detectedCandidates?: CompilationDetectionResult[]
}

type FilterType = 'ean' | 'title' | 'catalog'

const FILTER_TYPE_LABELS: Record<FilterType, string> = {
  ean: 'EAN / UPC',
  title: 'Release Title',
  catalog: 'Catalog Number',
}

const DEFAULT_TYPE: FilterType = 'ean'

const CONFIDENCE_LABELS: Record<CompilationDetectionResult['confidence'], string> = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
}

const CONFIDENCE_VARIANT: Record<
  CompilationDetectionResult['confidence'],
  'default' | 'secondary' | 'outline'
> = {
  high: 'default',
  medium: 'secondary',
  low: 'outline',
}

// ── Dialog form hook ──────────────────────────────────────────────────────────

function useDialogForm() {
  const [type, setType] = useState<FilterType>(DEFAULT_TYPE)
  const [identifier, setIdentifier] = useState('')

  const reset = useCallback(() => {
    setType(DEFAULT_TYPE)
    setIdentifier('')
  }, [])

  return { type, setType, identifier, setIdentifier, reset }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Returns true when `label` already exists as a filter (case-insensitive). */
function isDuplicate(filters: CompilationFilter[], identifier: string): boolean {
  return filters.some(f => f.identifier.toLowerCase() === identifier.toLowerCase())
}

// ── Sub-components ────────────────────────────────────────────────────────────

interface ManualTabProps {
  type: FilterType
  setType: (t: FilterType) => void
  identifier: string
  setIdentifier: (v: string) => void
  onAdd: () => void
}

function ManualTab({ type, setType, identifier, setIdentifier, onAdd }: ManualTabProps) {
  const { t } = useTranslation()

  const getFilterTypeLabel = (filterType: FilterType) =>
    filterType === 'title' ? t('compilationFilter.releaseTitle') : FILTER_TYPE_LABELS[filterType]

  const currentLabel = getFilterTypeLabel(type)

  return (
    <div className="space-y-4 py-2">
      <div className="space-y-2">
        <Label htmlFor="filter-type">Identifier Type</Label>
        <Select value={type} onValueChange={v => setType(v as FilterType)}>
          <SelectTrigger id="filter-type">
            <SelectValue placeholder={t('compilationFilter.selectRelease')} />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(FILTER_TYPE_LABELS) as FilterType[]).map(filterType => (
              <SelectItem key={filterType} value={filterType}>
                {getFilterTypeLabel(filterType)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="filter-value">{currentLabel}</Label>
        <Input
          id="filter-value"
          value={identifier}
          onChange={e => setIdentifier(e.target.value)}
          placeholder={`Enter ${currentLabel.toLowerCase()}`}
          onKeyDown={e => e.key === 'Enter' && onAdd()}
          autoFocus
        />
      </div>
    </div>
  )
}

interface ReleasePickerTabProps {
  availableReleases: string[]
  filters: CompilationFilter[]
  onAdd: (releaseTitle: string) => void
}

function ReleasePickerTab({ availableReleases, filters, onAdd }: ReleasePickerTabProps) {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return q ? availableReleases.filter(r => r.toLowerCase().includes(q)) : availableReleases
  }, [availableReleases, search])

  return (
    <div className="space-y-3 py-2">
      <div className="relative">
        <MagnifyingGlass size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search releases…"
          className="pl-8"
          autoFocus
        />
      </div>

      <div className="max-h-52 overflow-y-auto space-y-1 pr-1">
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">No releases found</p>
        )}
        {filtered.map(title => {
          const alreadyAdded = isDuplicate(filters, title)
          return (
            <button
              key={title}
              type="button"
              disabled={alreadyAdded}
              onClick={() => onAdd(title)}
              className="w-full text-left text-sm px-3 py-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-40 disabled:pointer-events-none flex items-center justify-between gap-2"
            >
              <span className="truncate">{title}</span>
              {alreadyAdded && (
                <Badge variant="outline" className="text-xs shrink-0">Added</Badge>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function CompilationFilterManager({
  filters,
  onAddFilter,
  onAddMultipleFilters,
  onRemoveFilter,
  availableReleases = [],
  detectedCandidates = [],
}: CompilationFilterManagerProps) {
  const [open, setOpen] = useState(false)
  const { t } = useTranslation()
  const { type, setType, identifier, setIdentifier, reset } = useDialogForm()

  // Keyword section state
  const [keywordInput, setKeywordInput] = useState('')

  const handleOpenChange = useCallback(
    (next: boolean) => {
      setOpen(next)
      if (!next) reset()
    },
    [reset]
  )

  const handleAddManual = useCallback(() => {
    const trimmed = identifier.trim()
    if (!trimmed) return
    onAddFilter({ identifier: trimmed, type, label: trimmed })
    handleOpenChange(false)
  }, [identifier, type, onAddFilter, handleOpenChange])

  const handleAddFromRelease = useCallback(
    (releaseTitle: string) => {
      onAddFilter({ identifier: releaseTitle, type: 'title', label: releaseTitle })
      handleOpenChange(false)
    },
    [onAddFilter, handleOpenChange]
  )

  const handleAddKeyword = useCallback(() => {
    const trimmed = keywordInput.trim()
    if (!trimmed) return
    onAddFilter({ identifier: trimmed, type: 'title', label: `Keyword: ${trimmed}` })
    setKeywordInput('')
  }, [keywordInput, onAddFilter])

  const handleAddCandidate = useCallback(
    (candidate: CompilationDetectionResult) => {
      if (isDuplicate(filters, candidate.releaseTitle)) return
      onAddFilter({ identifier: candidate.releaseTitle, type: 'title', label: candidate.releaseTitle })
    },
    [filters, onAddFilter]
  )

  const handleAddAllHighConfidence = useCallback(() => {
    // Build a Set of existing identifiers for O(n+m) duplicate checking
    const existingIds = new Set(filters.map(f => f.identifier.toLowerCase()))
    const toAdd = detectedCandidates
      .filter(c => c.confidence === 'high' && !existingIds.has(c.releaseTitle.toLowerCase()))
      .map(c => ({ identifier: c.releaseTitle, type: 'title' as const, label: c.releaseTitle }))
    if (toAdd.length === 0) return
    if (onAddMultipleFilters) {
      // Preferred: single call with all new filters to avoid stale-ref issues
      onAddMultipleFilters(toAdd)
    } else {
      toAdd.forEach(f => onAddFilter(f))
    }
  }, [detectedCandidates, filters, onAddFilter, onAddMultipleFilters])

  const hasReleases = availableReleases.length > 0
  const hasCandidates = detectedCandidates.length > 0
  const highConfidenceCount = useMemo(
    () => detectedCandidates.filter(c => c.confidence === 'high' && !isDuplicate(filters, c.releaseTitle)).length,
    [detectedCandidates, filters]
  )

  /**
   * Detects whether a filter was added via the keyword path by checking its label prefix.
   *
   * We use a label prefix convention ('Keyword: ') rather than adding a new field to
   * `CompilationFilter` to stay backward-compatible: existing persisted filters, the
   * `isCompilation` logic, and any serialised workspace backups are unaffected.
   * The prefix is an intentional, stable part of the UI contract — it must remain
   * exactly 'Keyword: ' (with a trailing space) as shown in handleAddKeyword.
   */
  const isKeywordFilter = (filter: CompilationFilter) => filter.label.startsWith('Keyword: ')

  return (
    <div className="space-y-4">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FunnelSimple size={20} weight="bold" className="text-primary" />
          <h3 className="font-semibold">{t('compilationFilter.title')}</h3>
        </div>

        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus size={16} weight="bold" />
              {t('compilationFilter.addFilter')}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Exclude Compilation</DialogTitle>
              <DialogDescription>
                Add a compilation to exclude from artist statements
              </DialogDescription>
            </DialogHeader>

            {hasReleases ? (
              <Tabs defaultValue="manual" className="mt-1">
                <TabsList className="w-full">
                  <TabsTrigger value="manual" className="flex-1 gap-1.5">
                    <TextT size={14} />
                    Enter manually
                  </TabsTrigger>
                  <TabsTrigger value="pick" className="flex-1 gap-1.5">
                    <ListBullets size={14} />
                    Select from releases
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="manual">
                  <ManualTab
                    type={type}
                    setType={setType}
                    identifier={identifier}
                    setIdentifier={setIdentifier}
                    onAdd={handleAddManual}
                  />
                  <DialogFooter className="mt-4">
                    <Button variant="outline" onClick={() => handleOpenChange(false)}>{t('common.cancel')}</Button>
                    <Button onClick={handleAddManual} disabled={!identifier.trim()}>{t('compilationFilter.addFilter')}</Button>
                  </DialogFooter>
                </TabsContent>

                <TabsContent value="pick">
                  <ReleasePickerTab
                    availableReleases={availableReleases}
                    filters={filters}
                    onAdd={handleAddFromRelease}
                  />
                  <DialogFooter className="mt-4">
                    <Button variant="outline" onClick={() => handleOpenChange(false)}>{t('common.cancel')}</Button>
                  </DialogFooter>
                </TabsContent>
              </Tabs>
            ) : (
              <>
                <ManualTab
                  type={type}
                  setType={setType}
                  identifier={identifier}
                  setIdentifier={setIdentifier}
                  onAdd={handleAddManual}
                />
                <DialogFooter>
                  <Button variant="outline" onClick={() => handleOpenChange(false)}>{t('common.cancel')}</Button>
                  <Button onClick={handleAddManual} disabled={!identifier.trim()}>{t('compilationFilter.addFilter')}</Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* ── Existing filter list ────────────────────────────────────────── */}
      <AnimatePresence mode="popLayout">
        {filters.length > 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
            {filters.map((filter, index) => (
              <motion.div
                key={filter.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="p-3 flex items-center gap-3 bg-card hover:shadow-md transition-shadow">
                  <div className="flex-1 min-w-0 flex items-center gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{filter.label}</p>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">
                        {filter.type === 'title'
                          ? t('compilationFilter.releaseTitle')
                          : FILTER_TYPE_LABELS[filter.type]}
                      </p>
                    </div>
                    {isKeywordFilter(filter) && (
                      <Badge variant="secondary" className="text-[10px] shrink-0">KEYWORD</Badge>
                    )}
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveFilter(filter.id)}
                    className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash size={16} />
                  </Button>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <Card className="p-8 text-center border-dashed">
            <FunnelSimple size={32} className="mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{t('compilationFilter.noFiltersYet')}</p>
          </Card>
        )}
      </AnimatePresence>

      {/* ── Keyword Exclusions ──────────────────────────────────────────── */}
      <div className="space-y-2 pt-2 border-t border-white/10">
        <div className="flex items-center gap-2 mb-2">
          <TextT size={16} className="text-primary" />
          <h4 className="text-sm font-semibold">Keyword Exclusions</h4>
        </div>
        <p className="text-xs text-muted-foreground">
          Exclude all releases whose title contains the given substring (e.g. "Compilation", "Various Artists").
        </p>
        <div className="flex gap-2 mt-2">
          <Input
            value={keywordInput}
            onChange={e => setKeywordInput(e.target.value)}
            placeholder="e.g. Compilation"
            onKeyDown={e => e.key === 'Enter' && handleAddKeyword()}
            className="flex-1"
          />
          <Button size="sm" onClick={handleAddKeyword} disabled={!keywordInput.trim()} className="gap-1.5 shrink-0">
            <Plus size={14} weight="bold" />
            {t('common.add')}
          </Button>
        </div>
      </div>

      {/* ── Auto-Detection Panel ────────────────────────────────────────── */}
      {hasCandidates && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3 pt-2 border-t border-white/10"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sparkle size={16} className="text-primary" />
              <h4 className="text-sm font-semibold">{t('compilationFilter.autoDetected')}</h4>
              <Badge variant="secondary" className="text-xs">{detectedCandidates.length}</Badge>
            </div>
            {highConfidenceCount > 0 && (
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-xs h-7"
                onClick={handleAddAllHighConfidence}
              >
                <CheckCircle size={12} />
                {t('compilationFilter.addAllCandidates')} ({highConfidenceCount})
              </Button>
            )}
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {detectedCandidates.map(candidate => {
              const alreadyAdded = isDuplicate(filters, candidate.releaseTitle)
              return (
                <Card
                  key={`${candidate.upcEan || ''}-${candidate.catalogNumber || ''}-${candidate.releaseTitle}`}
                  className="p-3 flex items-start gap-3 bg-card/50"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium truncate">{candidate.releaseTitle}</p>
                      <Badge variant={CONFIDENCE_VARIANT[candidate.confidence]} className="text-[10px] shrink-0">
                        {CONFIDENCE_LABELS[candidate.confidence]}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {candidate.reasons.join(' · ')}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant={alreadyAdded ? 'ghost' : 'outline'}
                    disabled={alreadyAdded}
                    onClick={() => handleAddCandidate(candidate)}
                    className="h-7 text-xs shrink-0"
                  >
                    {alreadyAdded ? 'Added' : 'Exclude'}
                  </Button>
                </Card>
              )
            })}
          </div>
        </motion.div>
      )}
    </div>
  )
}
