import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, test, vi, beforeEach } from 'vitest'
import { TrackRevenueAssignmentManager } from '@/features/rules/components/TrackRevenueAssignmentManager'
import type { TrackRevenueAssignment } from '@/lib/types'

// Stub Popover, Command, and framer-motion to avoid portal / ResizeObserver
// issues in jsdom while keeping the key rendering logic testable.
vi.mock('@/components/ui/popover', () => ({
  Popover: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PopoverTrigger: ({ children }: { children: React.ReactNode; asChild?: boolean }) => <div>{children}</div>,
  PopoverContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="popover-content">{children}</div>
  ),
}))

vi.mock('@/components/ui/command', () => ({
  Command: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CommandList: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CommandGroup: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CommandItem: ({
    children,
    onSelect,
  }: {
    children: React.ReactNode
    onSelect?: () => void
    value?: string
  }) => (
    <div role="option" onClick={onSelect}>
      {children}
    </div>
  ),
}))

vi.mock('framer-motion', () => ({
  motion: {
    li: ({ children, ...rest }: React.HTMLAttributes<HTMLLIElement>) => <li {...rest}>{children}</li>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn(), info: vi.fn() },
}))

const RELEASE_TITLES_BY_ARTIST: Record<string, string[]> = {
  'Artist A': ['Album One', 'Album Two'],
  'Artist B': ['Record X'],
}

const ARTISTS = ['Artist A', 'Artist B']

const makeAssignment = (overrides: Partial<TrackRevenueAssignment> = {}): TrackRevenueAssignment => ({
  id: 'a1',
  trackTitle: 'Album One',
  ownerArtist: 'Artist A',
  ...overrides,
})

describe('TrackRevenueAssignmentManager', () => {
  const onAdd = vi.fn()
  const onRemove = vi.fn()

  beforeEach(() => {
    onAdd.mockClear()
    onRemove.mockClear()
  })

  test('renders the owner artist and track title comboboxes', () => {
    render(
      <TrackRevenueAssignmentManager
        assignments={[]}
        releaseTitlesByArtist={RELEASE_TITLES_BY_ARTIST}
        artists={ARTISTS}
        onAdd={onAdd}
        onRemove={onRemove}
      />
    )
    expect(screen.getByPlaceholderText(/search owner artist/i)).toBeTruthy()
    expect(screen.getByPlaceholderText(/search release/i)).toBeTruthy()
  })

  test('shows all releases when no artist is selected', () => {
    render(
      <TrackRevenueAssignmentManager
        assignments={[]}
        releaseTitlesByArtist={RELEASE_TITLES_BY_ARTIST}
        artists={ARTISTS}
        onAdd={onAdd}
        onRemove={onRemove}
      />
    )
    const releaseInput = screen.getByPlaceholderText(/search release/i)
    fireEvent.focus(releaseInput)

    // All releases across all artists should be visible
    expect(screen.getByText('Album One')).toBeTruthy()
    expect(screen.getByText('Album Two')).toBeTruthy()
    expect(screen.getByText('Record X')).toBeTruthy()
  })

  test('filters release dropdown to selected artist releases', async () => {
    const user = userEvent.setup()
    render(
      <TrackRevenueAssignmentManager
        assignments={[]}
        releaseTitlesByArtist={RELEASE_TITLES_BY_ARTIST}
        artists={ARTISTS}
        onAdd={onAdd}
        onRemove={onRemove}
      />
    )

    // Select 'Artist B'
    const artistInput = screen.getByPlaceholderText(/search owner artist/i)
    fireEvent.focus(artistInput)
    await user.click(screen.getByText('Artist B'))

    // Now open the release dropdown
    const releaseInput = screen.getByPlaceholderText(/search release/i)
    fireEvent.focus(releaseInput)

    // Only Artist B's release should appear
    expect(screen.queryByText('Album One')).toBeNull()
    expect(screen.queryByText('Album Two')).toBeNull()
    expect(screen.getByText('Record X')).toBeTruthy()
  })

  test('clears track title when owner artist changes', async () => {
    const user = userEvent.setup()
    render(
      <TrackRevenueAssignmentManager
        assignments={[]}
        releaseTitlesByArtist={RELEASE_TITLES_BY_ARTIST}
        artists={ARTISTS}
        onAdd={onAdd}
        onRemove={onRemove}
      />
    )

    // Select Artist A and Album One
    const artistInput = screen.getByPlaceholderText(/search owner artist/i)
    fireEvent.focus(artistInput)
    await user.click(screen.getByText('Artist A'))

    const releaseInput = screen.getByPlaceholderText(/search release/i)
    fireEvent.focus(releaseInput)
    await user.click(screen.getByText('Album One'))
    expect((releaseInput as HTMLInputElement).value).toBe('Album One')

    // Clear and switch to Artist B — release field should be cleared
    await user.clear(artistInput)
    fireEvent.focus(artistInput)
    await user.click(screen.getByText('Artist B'))
    expect((releaseInput as HTMLInputElement).value).toBe('')
  })

  test('calls onAdd with the entered values and resets fields', async () => {
    const user = userEvent.setup()
    render(
      <TrackRevenueAssignmentManager
        assignments={[]}
        releaseTitlesByArtist={RELEASE_TITLES_BY_ARTIST}
        artists={ARTISTS}
        onAdd={onAdd}
        onRemove={onRemove}
      />
    )

    const artistInput = screen.getByPlaceholderText(/search owner artist/i)
    fireEvent.focus(artistInput)
    await user.click(screen.getByText('Artist A'))

    const releaseInput = screen.getByPlaceholderText(/search release/i)
    fireEvent.focus(releaseInput)
    await user.click(screen.getByText('Album Two'))

    await user.click(screen.getByRole('button', { name: /add assignment/i }))

    expect(onAdd).toHaveBeenCalledWith({ trackTitle: 'Album Two', ownerArtist: 'Artist A' })

    // Fields should be cleared
    expect((artistInput as HTMLInputElement).value).toBe('')
    expect((releaseInput as HTMLInputElement).value).toBe('')
  })

  test('disables add button when fields are empty', () => {
    render(
      <TrackRevenueAssignmentManager
        assignments={[]}
        releaseTitlesByArtist={RELEASE_TITLES_BY_ARTIST}
        artists={ARTISTS}
        onAdd={onAdd}
        onRemove={onRemove}
      />
    )
    const addBtn = screen.getByRole('button', { name: /add assignment/i }) as HTMLButtonElement
    expect(addBtn.disabled).toBe(true)
  })

  test('renders existing assignments', () => {
    const assignments = [makeAssignment()]
    render(
      <TrackRevenueAssignmentManager
        assignments={assignments}
        releaseTitlesByArtist={RELEASE_TITLES_BY_ARTIST}
        artists={ARTISTS}
        onAdd={onAdd}
        onRemove={onRemove}
      />
    )
    expect(screen.getByText('Album One')).toBeTruthy()
    expect(screen.getByText('Artist A')).toBeTruthy()
  })

  test('calls onRemove when the delete button is clicked', async () => {
    const user = userEvent.setup()
    const assignments = [makeAssignment({ id: 'x1' })]
    render(
      <TrackRevenueAssignmentManager
        assignments={assignments}
        releaseTitlesByArtist={RELEASE_TITLES_BY_ARTIST}
        artists={ARTISTS}
        onAdd={onAdd}
        onRemove={onRemove}
      />
    )
    await user.click(screen.getByRole('button', { name: '' }))
    expect(onRemove).toHaveBeenCalledWith('x1')
  })
})
