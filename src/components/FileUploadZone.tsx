import { UploadSimple, FileCsv, X, Spinner } from '@phosphor-icons/react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { UploadedFile } from '@/lib/types'

interface FileUploadZoneProps {
  type: 'believe' | 'bandcamp'
  files: UploadedFile[]
  onFilesAdded: (files: File[]) => void
  onFileRemoved: (id: string) => void
  isProcessing?: boolean
  uploadProgress?: number
}

export function FileUploadZone({ type, files, onFilesAdded, onFileRemoved, isProcessing, uploadProgress }: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    if (isProcessing) return
    
    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      file => file.name.endsWith('.csv')
    )
    
    if (droppedFiles.length > 0) {
      onFilesAdded(droppedFiles)
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isProcessing) return
    
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files).filter(
        file => file.name.endsWith('.csv')
      )
      if (selectedFiles.length > 0) {
        onFilesAdded(selectedFiles)
      }
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const typeLabel = type === 'believe' ? 'Believe' : 'Bandcamp'

  return (
    <div className="space-y-4">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg p-8 transition-all duration-200
          ${isProcessing ? 'opacity-60 pointer-events-none' : ''}
          ${isDragging 
            ? 'border-accent bg-accent/5 shadow-lg shadow-accent/20' 
            : 'border-border hover:border-accent/50 hover:bg-accent/5'
          }
        `}
      >
        <input
          type="file"
          accept=".csv"
          multiple
          onChange={handleFileInput}
          disabled={isProcessing}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          id={`file-input-${type}`}
        />
        
        <div className="flex flex-col items-center gap-3 pointer-events-none">
          <div className={`
            p-4 rounded-full transition-colors
            ${isDragging ? 'bg-accent text-accent-foreground' : 'bg-primary/10 text-primary'}
          `}>
            {isProcessing ? (
              <Spinner size={32} weight="bold" className="animate-spin" />
            ) : (
              <UploadSimple size={32} weight="bold" />
            )}
          </div>
          
          <div className="text-center">
            <p className="text-base font-semibold mb-1">
              {isProcessing ? `Processing ${typeLabel} Files...` : `Upload ${typeLabel} CSV Files`}
            </p>
            <p className="text-sm text-muted-foreground">
              {isProcessing ? 'Please wait while we process your data' : 'Drag & drop files here or click to browse'}
            </p>
          </div>
          
          {!isProcessing && (
            <Badge variant="secondary" className="text-xs">
              CSV files only
            </Badge>
          )}
        </div>
        
        {isProcessing && uploadProgress !== undefined && (
          <div className="mt-4 pointer-events-none">
            <Progress value={uploadProgress} className="h-2" />
            <p className="text-xs text-center mt-2 text-muted-foreground">
              {uploadProgress}% complete
            </p>
          </div>
        )}
      </div>

      <AnimatePresence mode="popLayout">
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            {files.map((file, index) => (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="p-3 flex items-center gap-3 bg-card hover:shadow-md transition-shadow">
                  <div className="p-2 bg-primary/10 rounded">
                    <FileCsv size={20} weight="fill" className="text-primary" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onFileRemoved(file.id)}
                    className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                  >
                    <X size={16} />
                  </Button>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
