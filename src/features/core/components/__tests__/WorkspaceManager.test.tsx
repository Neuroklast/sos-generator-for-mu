import { render, screen, fireEvent } from '@testing-library/react'
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { WorkspaceManager } from '../WorkspaceManager'

// Mock the lucide-react icons which might cause issues in tests
vi.mock('lucide-react', () => ({
  Download: () => <div data-testid="download-icon" />,
  Upload: () => <div data-testid="upload-icon" />,
  DatabaseBackup: () => <div data-testid="db-icon" />
}))

describe('WorkspaceManager Export', () => {
  const mockDate = new Date('2023-01-01T00:00:00.000Z')

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(mockDate)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  test('exports all properties and data without losing anything', () => {
    // Note that mock.calls[0][0] is the first argument passed to JSON.stringify,
    // which is the actual object. So we don't need to JSON.parse it.
    const stringifySpy = vi.spyOn(JSON, 'stringify')
    global.URL.createObjectURL = vi.fn(() => 'blob:test')
    global.URL.revokeObjectURL = vi.fn()

    const mockData = {
      compilationFilters: [{ id: '1', title: 'Filter 1', type: 'ean' as const }],
      artistMappings: [{ id: '1', name: 'Artist A', aliases: ['Alias A'] }],
      splitFees: [{ artist: 'Artist A', percentage: 50 }],
      manualRevenues: [{ id: '1', artist: 'Artist A', amount: 100, date: '2023-01-01', description: 'Test', type: 'digital' as const }],
      csvAliases: [{ id: '1', fieldName: 'artist', synonym: 'interpret' }],
      labelInfo: { name: 'Test Label', address: '123 Main St' },
      labelArtists: [{ id: '1', name: 'Artist A', email: 'test@test.com', isEuNonGerman: false }],
      ignoredEntries: [{ id: '1', value: 'IGNORE', type: 'artist' as const }],
      onImport: vi.fn(),
    }

    render(<WorkspaceManager {...mockData} />)

    fireEvent.click(screen.getByText('Export Workspace'))

    expect(stringifySpy).toHaveBeenCalled()
    const exportedObject = stringifySpy.mock.calls[0][0]

    expect(exportedObject).toEqual({
      schemaVersion: 1,
      exportedAt: mockDate.toISOString(),
      compilationFilters: mockData.compilationFilters,
      artistMappings: mockData.artistMappings,
      splitFees: mockData.splitFees,
      manualRevenues: mockData.manualRevenues,
      csvAliases: mockData.csvAliases,
      labelInfo: mockData.labelInfo,
      labelArtists: mockData.labelArtists,
      ignoredEntries: mockData.ignoredEntries,
    })

    stringifySpy.mockRestore()
  })
})

describe('WorkspaceManager Import', () => {
  const defaultProps = {
    compilationFilters: [],
    artistMappings: [],
    splitFees: [],
    manualRevenues: [],
    csvAliases: [],
    labelInfo: { name: 'Test Label' },
    labelArtists: [],
    ignoredEntries: [],
    onImport: vi.fn(),
  }

  test('imports workspace and preserves all properties without losing data', async () => {
    const mockOnImport = vi.fn()
    render(<WorkspaceManager {...defaultProps} onImport={mockOnImport} />)

    const fullBackup = {
      schemaVersion: 1,
      exportedAt: '2023-01-01T00:00:00.000Z',
      compilationFilters: [{ id: '1', title: 'Filter 1', type: 'ean' }],
      artistMappings: [{ id: '1', name: 'Artist A', aliases: ['Alias A'] }],
      splitFees: [{ artist: 'Artist A', percentage: 50 }],
      manualRevenues: [{ id: '1', artist: 'Artist A', amount: 100, date: '2023-01-01', description: 'Test', type: 'digital' }],
      csvAliases: [{ id: '1', fieldName: 'artist', synonym: 'interpret' }],
      labelInfo: { name: 'New Label', address: '456 Side St' },
      labelArtists: [{ id: '1', name: 'Artist A', email: 'test@test.com', isEuNonGerman: false }],
      ignoredEntries: [{ id: '1', value: 'IGNORE', type: 'artist' }],
    }

    const file = new File([JSON.stringify(fullBackup)], 'backup.json', { type: 'application/json' })

    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    expect(input).not.toBeNull()

    // Trigger file reading
    fireEvent.change(input, { target: { files: [file] } })

    // FileReader is async so we have to wait for the callback
    await new Promise((resolve) => setTimeout(resolve, 50))

    expect(mockOnImport).toHaveBeenCalledWith(fullBackup)
  })
})
