import { render, screen, fireEvent } from '@testing-library/react'
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { WorkspaceManager } from '../WorkspaceManager'
import { DEFAULT_APP_DEFAULTS, DEFAULT_PDF_EXPORT_SETTINGS, DEFAULT_EMAIL_CONFIG } from '@/lib/defaults'
import { DEFAULT_CSV_PROFILES } from '@/features/ingest/lib/default-profiles'

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
      compilationFilters: [{ id: '1', title: 'Filter 1', type: 'ean' as const, identifier: 'Filter 1', label: 'Filter 1' }],
      artistMappings: [{ id: '1', featuringName: 'Alias A', primaryArtist: 'Artist A' }],
      splitFees: [{ artist: 'Artist A', percentage: 50 }],
      manualRevenues: [{ id: '1', artist: 'Artist A', amount: 100, date: '2023-01-01', description: 'Test', type: 'digital' as const }],
      csvAliases: [{ id: '1', fieldName: 'artist', synonym: 'interpret' }],
      labelInfo: { name: 'Test Label', address: '123 Main St' },
      labelArtists: [{ id: '1', name: 'Artist A', email: 'test@test.com', isEuNonGerman: false }],
      ignoredEntries: [{ id: '1', artist: 'IGNORE', createdAt: '2023-01-01T00:00:00.000Z' }],
      trackRevenueAssignments: [{ id: '1', trackTitle: 'My Track', ownerArtist: 'Artist A' }],
      excludePhysical: true,
      guestPayoutRules: [{ id: 'g1', guestName: 'Guest A', hostArtist: 'Artist A', percentage: 20 }],
      appDefaults: { ...DEFAULT_APP_DEFAULTS, defaultSplitPercentage: 60 },
      pdfExportSettings: { ...DEFAULT_PDF_EXPORT_SETTINGS, includeCountryBreakdown: true },
      emailConfig: { ...DEFAULT_EMAIL_CONFIG, fromName: 'My Label' },
      csvImportProfiles: DEFAULT_CSV_PROFILES,
      onImport: vi.fn(),
    }

    render(<WorkspaceManager {...mockData} />)

    fireEvent.click(screen.getByText('Export Workspace'))

    expect(stringifySpy).toHaveBeenCalled()
    const exportedObject = stringifySpy.mock.calls[0][0]

    expect(exportedObject).toEqual({
      schemaVersion: 2,
      exportedAt: mockDate.toISOString(),
      compilationFilters: mockData.compilationFilters,
      artistMappings: mockData.artistMappings,
      splitFees: mockData.splitFees,
      manualRevenues: mockData.manualRevenues,
      csvAliases: mockData.csvAliases,
      labelInfo: mockData.labelInfo,
      labelArtists: mockData.labelArtists,
      ignoredEntries: mockData.ignoredEntries,
      trackRevenueAssignments: mockData.trackRevenueAssignments,
      excludePhysical: mockData.excludePhysical,
      guestPayoutRules: mockData.guestPayoutRules,
      appDefaults: mockData.appDefaults,
      pdfExportSettings: mockData.pdfExportSettings,
      emailConfig: mockData.emailConfig,
      csvImportProfiles: mockData.csvImportProfiles,
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
    labelInfo: { name: 'Test Label', address: '' },
    labelArtists: [],
    ignoredEntries: [],
    trackRevenueAssignments: [],
    excludePhysical: false,
    guestPayoutRules: [],
    appDefaults: DEFAULT_APP_DEFAULTS,
    pdfExportSettings: DEFAULT_PDF_EXPORT_SETTINGS,
    emailConfig: DEFAULT_EMAIL_CONFIG,
    csvImportProfiles: DEFAULT_CSV_PROFILES,
    onImport: vi.fn(),
  }

  test('imports v2 workspace and preserves all properties without losing data', async () => {
    const mockOnImport = vi.fn()
    render(<WorkspaceManager {...defaultProps} onImport={mockOnImport} />)

    const fullBackup = {
      schemaVersion: 2,
      exportedAt: '2023-01-01T00:00:00.000Z',
      compilationFilters: [{ id: '1', title: 'Filter 1', type: 'ean' }],
      artistMappings: [{ id: '1', name: 'Artist A', aliases: ['Alias A'] }],
      splitFees: [{ artist: 'Artist A', percentage: 50 }],
      manualRevenues: [{ id: '1', artist: 'Artist A', amount: 100, date: '2023-01-01', description: 'Test', type: 'digital' }],
      csvAliases: [{ id: '1', fieldName: 'artist', synonym: 'interpret' }],
      labelInfo: { name: 'New Label', address: '456 Side St' },
      labelArtists: [{ id: '1', name: 'Artist A', email: 'test@test.com', isEuNonGerman: false }],
      ignoredEntries: [{ id: '1', artist: 'IGNORE', createdAt: '2023-01-01T00:00:00.000Z' }],
      trackRevenueAssignments: [{ id: '1', trackTitle: 'My Track', ownerArtist: 'Artist A' }],
      excludePhysical: true,
      guestPayoutRules: [{ id: 'g1', guestName: 'Guest A', hostArtist: 'Artist A', percentage: 20 }],
      appDefaults: { ...DEFAULT_APP_DEFAULTS, defaultSplitPercentage: 70 },
      pdfExportSettings: { ...DEFAULT_PDF_EXPORT_SETTINGS, includePieChart: false },
      emailConfig: { ...DEFAULT_EMAIL_CONFIG, fromName: 'Imported Label' },
      csvImportProfiles: [],
    }

    const file = new File([JSON.stringify(fullBackup)], 'backup.json', { type: 'application/json' })

    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    expect(input).not.toBeNull()

    fireEvent.change(input, { target: { files: [file] } })

    await new Promise((resolve) => setTimeout(resolve, 50))

    expect(mockOnImport).toHaveBeenCalledWith(expect.objectContaining({
      schemaVersion: 2,
      excludePhysical: true,
      guestPayoutRules: fullBackup.guestPayoutRules,
      appDefaults: fullBackup.appDefaults,
      pdfExportSettings: fullBackup.pdfExportSettings,
      emailConfig: fullBackup.emailConfig,
      csvImportProfiles: [],
    }))
  })

  test('imports v1 workspace with backward-compatible defaults for missing v2 fields', async () => {
    const mockOnImport = vi.fn()
    render(<WorkspaceManager {...defaultProps} onImport={mockOnImport} />)

    const v1Backup = {
      schemaVersion: 1,
      exportedAt: '2023-01-01T00:00:00.000Z',
      compilationFilters: [],
      artistMappings: [],
      splitFees: [],
      manualRevenues: [],
      csvAliases: [],
      labelInfo: { name: 'Old Label', address: '789 Legacy Ave' },
      labelArtists: [],
      ignoredEntries: [],
      trackRevenueAssignments: [],
    }

    const file = new File([JSON.stringify(v1Backup)], 'v1-backup.json', { type: 'application/json' })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement

    fireEvent.change(input, { target: { files: [file] } })
    await new Promise((resolve) => setTimeout(resolve, 50))

    expect(mockOnImport).toHaveBeenCalledWith(expect.objectContaining({
      schemaVersion: 1,
      excludePhysical: false,
      guestPayoutRules: [],
      appDefaults: DEFAULT_APP_DEFAULTS,
      pdfExportSettings: DEFAULT_PDF_EXPORT_SETTINGS,
      emailConfig: DEFAULT_EMAIL_CONFIG,
      csvImportProfiles: DEFAULT_CSV_PROFILES,
    }))
  })
})
