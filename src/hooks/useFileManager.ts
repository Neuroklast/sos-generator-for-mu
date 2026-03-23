import { useCallback, useState } from 'react'
import { useKV } from '@/hooks/useLocalKV'
import { toast } from 'sonner'
import { parseCSVContentStreaming } from '@/lib/streaming-csv-parser'
import type { UploadedFile, FileProcessingState } from '@/lib/types'

type FileType = 'believe' | 'bandcamp'

interface FileEventCallbacks {
  onFileAdded?: (file: UploadedFile, rowsParsed: number, rowsSkipped: number, uniqueArtists: number) => void
  onFileRemoved?: (id: string) => void
}

/**
 * Manages CSV file state for one upload zone type.
 * Handles add, remove, and replace with per-file progress tracking.
 */
export function useFileManager(type: FileType, callbacks?: FileEventCallbacks) {
  const [files, setFiles] = useKV<UploadedFile[]>(`${type}-files`, [])
  const [fileStates, setFileStates] = useState<Record<string, FileProcessingState>>({})

  const setFileState = useCallback((id: string, state: Partial<FileProcessingState>) => {
    setFileStates(prev => ({
      ...prev,
      [id]: { ...prev[id], ...state },
    }))
  }, [])

  const removeFileState = useCallback((id: string) => {
    setFileStates(prev => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }, [])

  const processAndStore = useCallback(
    async (rawFile: File, id: string): Promise<{ data: string; rowsParsed: number; rowsSkipped: number; uniqueArtists: number }> => {
      setFileState(id, { status: 'uploading', progress: 0 })

      const data = await rawFile.text()

      setFileState(id, { status: 'processing', progress: 0 })

      const result = await parseCSVContentStreaming(data, type, progress => {
        setFileState(id, { progress: progress.percentage })
      })

      setFileState(id, { status: 'done', progress: 100 })
      return {
        data,
        rowsParsed: result.transactions.length,
        rowsSkipped: result.errors.length,
        uniqueArtists: result.uniqueArtists.length,
      }
    },
    [type, setFileState]
  )

  const addFiles = useCallback(
    async (rawFiles: File[]) => {
      if (rawFiles.length === 0) return

      const ids = rawFiles.map(() => crypto.randomUUID())

      // Optimistically show placeholders while reading/parsing
      const placeholders: UploadedFile[] = rawFiles.map((f, i) => ({
        id: ids[i],
        name: f.name,
        size: f.size,
        type,
        data: '',
        uploadedAt: new Date().toISOString(),
      }))

      setFiles(current => [...(current ?? []), ...placeholders])

      const results = await Promise.allSettled(
        rawFiles.map(async (rawFile, i) => {
          const id = ids[i]
          try {
            const { data, rowsParsed, rowsSkipped, uniqueArtists } = await processAndStore(rawFile, id)
            setFiles(current =>
              (current ?? []).map(f => (f.id === id ? { ...f, data } : f))
            )
            // Notify parent for history logging
            const uploadedFile: UploadedFile = {
              id,
              name: rawFile.name,
              size: rawFile.size,
              type,
              data,
              uploadedAt: new Date().toISOString(),
            }
            callbacks?.onFileAdded?.(uploadedFile, rowsParsed, rowsSkipped, uniqueArtists)
          } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to process file'
            setFileState(id, { status: 'error', progress: 0, error: message })
            toast.error(`Failed to process "${rawFile.name}"`, { description: message })
            throw err
          }
        })
      )

      const succeeded = results.filter(r => r.status === 'fulfilled').length
      const failed = results.filter(r => r.status === 'rejected').length

      if (succeeded > 0) {
        toast.success(
          succeeded === 1
            ? `"${rawFiles[0].name}" uploaded successfully`
            : `${succeeded} file(s) uploaded successfully`
        )
      }
      if (failed > 0) {
        toast.error(`${failed} file(s) failed to upload`)
      }
    },
    [type, processAndStore, setFiles, setFileState, callbacks]
  )

  const removeFile = useCallback(
    (id: string) => {
      setFiles(current => (current ?? []).filter(f => f.id !== id))
      removeFileState(id)
      callbacks?.onFileRemoved?.(id)
      toast.info('File removed')
    },
    [setFiles, removeFileState, callbacks]
  )

  const replaceFile = useCallback(
    async (id: string, rawFile: File) => {
      // Update metadata immediately so the user sees the new name
      setFiles(current =>
        (current ?? []).map(f =>
          f.id === id ? { ...f, name: rawFile.name, size: rawFile.size, data: '' } : f
        )
      )

      try {
        const { data, rowsParsed, rowsSkipped, uniqueArtists } = await processAndStore(rawFile, id)
        setFiles(current =>
          (current ?? []).map(f => (f.id === id ? { ...f, data } : f))
        )
        const uploadedFile: UploadedFile = {
          id,
          name: rawFile.name,
          size: rawFile.size,
          type,
          data,
          uploadedAt: new Date().toISOString(),
        }
        callbacks?.onFileAdded?.(uploadedFile, rowsParsed, rowsSkipped, uniqueArtists)
        toast.success(`"${rawFile.name}" replaced successfully`)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to process file'
        setFileState(id, { status: 'error', progress: 0, error: message })
        toast.error(`Failed to replace file`, { description: message })
      }
    },
    [processAndStore, setFiles, setFileState, type, callbacks]
  )

  return {
    files: files ?? [],
    fileStates,
    addFiles,
    removeFile,
    replaceFile,
  }
}
