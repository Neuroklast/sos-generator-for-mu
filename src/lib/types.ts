/** Raw file record persisted in KV storage. uploadedAt is stored as ISO string. */
export interface UploadedFile {
  id: string
  name: string
  size: number
  type: 'believe' | 'bandcamp'
  data: string
  uploadedAt: string
}

/** Transient per-file processing state (not persisted). */
export type FileStatus = 'idle' | 'uploading' | 'processing' | 'done' | 'error'

export interface FileProcessingState {
  status: FileStatus
  progress: number
  error?: string
}

export interface CompilationFilter {
  id: string
  identifier: string
  type: 'ean' | 'title' | 'catalog'
  label: string
}

export interface ArtistMapping {
  id: string
  featuringName: string
  primaryArtist: string
}

export interface SplitFee {
  artist: string
  percentage: number
}

export interface ManualRevenue {
  id: string
  artist: string
  description: string
  amount: number
}

export interface LabelInfo {
  name: string
  address: string
  logo?: string
}

export interface ArtistRevenue {
  artist: string
  believeRevenue: number
  bandcampRevenue: number
  manualRevenue: number
  totalRevenue: number
  splitPercentage: number
  finalAmount: number
}
