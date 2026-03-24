import {
  UploadSimple,
  FileCsv,
  X,
  Spinner,
  ArrowsClockwise,
  CheckCircle,
  Warning,
  WarningCircle,
} from '@phosphor-icons/react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useCallback, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { UploadedFile, FileProcessingState } from '@/lib/types'

interface FileUploadZoneProps {
  type: 'believe' | 'bandcamp'
  files: UploadedFile[]
  fileStates: Record<string, FileProcessingState>
  onFilesAdded: (files: File[]) => void
  onFileRemoved: (id: string) => void
  onFileReplaced: (id: string, file: File) => void
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return String(n)
}

/** Returns a helpful, actionable error message based on the raw error string. */
function humanizeError(error: string | undefined): string {
  if (!error) return 'Processing failed'
  if (error.toLowerCase().includes('call stack') || error.toLowerCase().includes('maximum')) {
    return 'File is too large to process in one pass. Try splitting it into smaller files (< 100k rows each).'
  }
  if (error.toLowerCase().includes('quota') || error.toLowerCase().includes('storage')) {
    return 'Browser storage is full. Clear some data or use a smaller file.'
  }
  if (error.toLowerCase().includes('encoding') || error.toLowerCase().includes('utf')) {
    return 'File encoding issue. Save the CSV as UTF-8 and try again.'
  }
  // Truncate very long raw messages
  return error.length > 120 ? `${error.substring(0, 120)}…` : error
}

function FileStatusIcon({ state, hasData }: { state: FileProcessingState | undefined; hasData: boolean }) {
  if (state?.status === 'error') {
    return <WarningCircle size={16} className="text-destructive flex-shrink-0" />
  }
  if (state?.status === 'uploading' || state?.status === 'processing') {
    return <Spinner size={16} className="text-primary animate-spin flex-shrink-0" />
  }
  if (!hasData && !state) {
    // File metadata persisted from a previous session but data not in memory.
    return <Warning size={16} className="text-amber-400 flex-shrink-0" />
  }
  return <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
}

function FileProgressBar({ state }: { state: FileProcessingState | undefined }) {
  if (!state) return null
  if (state.status === 'done' || state.status === 'idle') return null

  if (state.status === 'error') {
    return (
      <p className="text-xs text-destructive mt-1.5 leading-relaxed">
        {humanizeError(state.error)}
      </p>
    )
  }

  const label = state.status === 'uploading' ? 'Reading file…' : `Parsing rows… ${state.progress}%`

  return (
    <div className="mt-1.5 space-y-0.5">
      <Progress value={state.progress} className="h-1.5" />
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}

/** Stat pill shown on a completed file card. */
function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-primary/10 text-[11px] text-muted-foreground leading-none">
      <span className="font-mono font-semibold text-foreground/80">{value}</span>
      {label}
    </span>
  )
}

export function FileUploadZone({
  type,
  files,
  fileStates,
  onFilesAdded,
  onFileRemoved,
  onFileReplaced,
}: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [sizeWarning, setSizeWarning] = useState<string | null>(null)
  const [typeError, setTypeError] = useState<string | null>(null)
  const replaceRefs = useRef<Map<string, HTMLInputElement>>(new Map())

  // Stable ref-setter factory: creates one stable callback per file.id
  const makeRefSetter = useCallback(
    (id: string) => (el: HTMLInputElement | null) => {
      if (el) replaceRefs.current.set(id, el)
      else replaceRefs.current.delete(id)
    },
    []
  )

  const typeLabel = type === 'believe' ? 'Believe' : 'Bandcamp'
  const isAnyProcessing = Object.values(fileStates).some(
    s => s.status === 'uploading' || s.status === 'processing'
  )

  const filterCSV = (raw: File[]): { valid: File[]; rejected: number } => {
    const valid = raw.filter(f => f.name.toLowerCase().endsWith('.csv'))
    return { valid, rejected: raw.length - valid.length }
  }

  const warnIfLarge = useCallback((csvFiles: File[]) => {
    const LARGE_THRESHOLD = 50 * 1024 * 1024 // 50 MB
    const large = csvFiles.find(f => f.size > LARGE_THRESHOLD)
    if (large) {
      setSizeWarning(`"${large.name}" is ${formatFileSize(large.size)}. Large files may take a minute to process.`)
      setTimeout(() => setSizeWarning(null), 8000)
    }
  }, [])

  const showTypeError = useCallback((rejectedCount: number) => {
    setTypeError(`${rejectedCount} file${rejectedCount !== 1 ? 's' : ''} rejected — only CSV files are accepted.`)
    setTimeout(() => setTypeError(null), 6000)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => setIsDragging(false), [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const all = Array.from(e.dataTransfer.files)
      const { valid, rejected } = filterCSV(all)
      if (rejected > 0) showTypeError(rejected)
      if (valid.length > 0) {
        warnIfLarge(valid)
        onFilesAdded(valid)
      }
    },
    [onFilesAdded, warnIfLarge, showTypeError]
  )

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files) return
      const all = Array.from(e.target.files)
      const { valid, rejected } = filterCSV(all)
      if (rejected > 0) showTypeError(rejected)
      if (valid.length > 0) {
        warnIfLarge(valid)
        onFilesAdded(valid)
      }
      // Reset so the same file can be re-selected
      e.target.value = ''
    },
    [onFilesAdded, warnIfLarge, showTypeError]
  )

  const handleReplaceInput = useCallback(
    (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) onFileReplaced(id, file)
      e.target.value = ''
    },
    [onFileReplaced]
  )

  const triggerReplace = useCallback((id: string) => {
    replaceRefs.current.get(id)?.click()
  }, [])

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={[
          'relative border-2 border-dashed rounded-lg p-8 transition-all duration-200',
          isDragging
            ? 'border-accent bg-accent/5 shadow-lg shadow-accent/20'
            : 'border-border hover:border-accent/50 hover:bg-accent/5',
        ].join(' ')}
      >
        <input
          type="file"
          accept=".csv"
          multiple
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          id={`file-input-${type}`}
        />

        <div className="flex flex-col items-center gap-3 pointer-events-none">
          <div
            className={[
              'p-4 rounded-full transition-colors',
              isDragging ? 'bg-accent text-accent-foreground' : 'bg-primary/10 text-primary',
            ].join(' ')}
          >
            {isAnyProcessing ? (
              <Spinner size={32} weight="bold" className="animate-spin" />
            ) : (
              <UploadSimple size={32} weight="bold" />
            )}
          </div>

          <div className="text-center">
            <p className="text-base font-semibold mb-1">
              {isAnyProcessing
                ? `Processing ${typeLabel} files…`
                : `Upload ${typeLabel} CSV files`}
            </p>
            <p className="text-sm text-muted-foreground">
              {isAnyProcessing
                ? 'Please wait — parsing your data'
                : 'Drag & drop files here or click to browse'}
            </p>
          </div>

          {!isAnyProcessing && (
            <Badge variant="secondary" className="text-xs">
              CSV files only · multiple allowed
            </Badge>
          )}
        </div>
      </div>

      {/* Large file size warning */}
      <AnimatePresence>
        {sizeWarning && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-400 text-xs"
          >
            <Warning size={14} className="shrink-0 mt-0.5" />
            <span>{sizeWarning}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Non-CSV file rejection error */}
      <AnimatePresence>
        {typeError && (
          <motion.div
            role="alert"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-start gap-2 px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-xs"
          >
            <WarningCircle size={14} className="shrink-0 mt-0.5" aria-hidden="true" />
            <span>{typeError}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Uploaded files list */}
      <AnimatePresence mode="popLayout">
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            {files.map((file, index) => {
              const state = fileStates[file.id]
              const isProcessingFile =
                state?.status === 'uploading' || state?.status === 'processing'
              const isDone = !state || state.status === 'done' || state.status === 'idle'
              const hasData = Boolean(file.data)
              const needsReupload = isDone && !hasData && !file.rowsParsed

              return (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -24 }}
                  transition={{ delay: index * 0.04 }}
                >
                  {/* Hidden replace input per file */}
                  <input
                    type="file"
                    accept=".csv"
                    className="hidden"
                    ref={makeRefSetter(file.id)}
                    onChange={e => handleReplaceInput(file.id, e)}
                  />

                  <Card
                    className={[
                      'p-3 transition-shadow',
                      state?.status === 'error'
                        ? 'border-destructive/40 bg-destructive/5'
                        : needsReupload
                          ? 'border-amber-500/30 bg-amber-500/5'
                          : 'bg-card hover:shadow-md',
                    ].join(' ')}
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-primary/10 rounded flex-shrink-0 mt-0.5">
                        <FileCsv size={20} weight="fill" className="text-primary" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <FileStatusIcon state={state} hasData={hasData} />
                          <p className="text-sm font-medium truncate">{file.name}</p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatFileSize(file.size)}
                        </p>

                        {/* Stats row — shown after successful parse */}
                        {isDone && (file.rowsParsed != null || file.rowsSkipped != null) && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {file.rowsParsed != null && (
                              <StatPill label="rows" value={formatCount(file.rowsParsed)} />
                            )}
                            {file.uniqueArtistsCount != null && file.uniqueArtistsCount > 0 && (
                              <StatPill label="artists" value={formatCount(file.uniqueArtistsCount)} />
                            )}
                            {file.rowsSkipped != null && file.rowsSkipped > 0 && (
                              <StatPill label="skipped" value={formatCount(file.rowsSkipped)} />
                            )}
                          </div>
                        )}

                        {/* Re-upload hint for stale metadata */}
                        {needsReupload && (
                          <p className="text-xs text-amber-400 mt-1">
                            Data not in memory — re-upload to process
                          </p>
                        )}

                        <FileProgressBar state={state} />
                      </div>

                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => triggerReplace(file.id)}
                          disabled={isProcessingFile}
                          title="Replace file"
                          className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
                        >
                          <ArrowsClockwise size={15} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onFileRemoved(file.id)}
                          disabled={isProcessingFile}
                          title="Remove file"
                          className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                        >
                          <X size={15} />
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

