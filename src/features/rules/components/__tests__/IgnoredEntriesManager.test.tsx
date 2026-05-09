import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, test, vi, beforeEach } from 'vitest'
import { IgnoredEntriesManager } from '@/features/rules/components/IgnoredEntriesManager'
import type { IgnoredEntry } from '@/lib/types'

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

const makeEntry = (overrides: Partial<IgnoredEntry> = {}): IgnoredEntry => ({
  id: 'e1',
  artist: 'Artist A',
  createdAt: new Date().toISOString(),
  ...overrides,
})

describe('IgnoredEntriesManager', () => {
  const onAdd = vi.fn()
  const onRemove = vi.fn()

  beforeEach(() => {
    onAdd.mockClear()
    onRemove.mockClear()
  })

  test('renders artist and release comboboxes', () => {
    render(
      <IgnoredEntriesManager
        entries={[]}
        artists={ARTISTS}
        releaseTitlesByArtist={RELEASE_TITLES_BY_ARTIST}
        onAdd={onAdd}
        onRemove={onRemove}
      />
    )
    expect(screen.getByPlaceholderText(/search artist/i)).toBeTruthy()
    expect(screen.getByPlaceholderText(/search release/i)).toBeTruthy()
  })

  test('shows all releases when no artist is selected', () => {
    render(
      <IgnoredEntriesManager
        entries={[]}
        artists={ARTISTS}
        releaseTitlesByArtist={RELEASE_TITLES_BY_ARTIST}
        onAdd={onAdd}
        onRemove={onRemove}
      />
    )
    const releaseInput = screen.getByPlaceholderText(/search release/i)
    fireEvent.focus(releaseInput)

    expect(screen.getByText('Album One')).toBeTruthy()
    expect(screen.getByText('Album Two')).toBeTruthy()
    expect(screen.getByText('Record X')).toBeTruthy()
  })

  test('filters release dropdown to selected artist', async () => {
    const user = userEvent.setup()
    render(
      <IgnoredEntriesManager
        entries={[]}
        artists={ARTISTS}
        releaseTitlesByArtist={RELEASE_TITLES_BY_ARTIST}
        onAdd={onAdd}
        onRemove={onRemove}
      />
    )

    // Select Artist A
    const artistInput = screen.getByPlaceholderText(/search artist/i)
    fireEvent.focus(artistInput)
    await user.click(screen.getByText('Artist A'))

    // Open release dropdown
    const releaseInput = screen.getByPlaceholderText(/search release/i)
    fireEvent.focus(releaseInput)

    expect(screen.getByText('Album One')).toBeTruthy()
    expect(screen.getByText('Album Two')).toBeTruthy()
    expect(screen.queryByText('Record X')).toBeNull()
  })

  test('clears release when artist changes', async () => {
    const user = userEvent.setup()
    render(
      <IgnoredEntriesManager
        entries={[]}
        artists={ARTISTS}
        releaseTitlesByArtist={RELEASE_TITLES_BY_ARTIST}
        onAdd={onAdd}
        onRemove={onRemove}
      />
    )

    // Select Artist A and then Album One
    const artistInput = screen.getByPlaceholderText(/search artist/i)
    fireEvent.focus(artistInput)
    await user.click(screen.getByText('Artist A'))

    const releaseInput = screen.getByPlaceholderText(/search release/i)
    fireEvent.focus(releaseInput)
    await user.click(screen.getByText('Album One'))
    expect((releaseInput as HTMLInputElement).value).toBe('Album One')

    // Clear and switch to Artist B — release should be cleared
    await user.clear(artistInput)
    fireEvent.focus(artistInput)
    await user.click(screen.getByText('Artist B'))
    expect((releaseInput as HTMLInputElement).value).toBe('')
  })

  test('calls onAdd with artist only when no release selected', async () => {
    const user = userEvent.setup()
    render(
      <IgnoredEntriesManager
        entries={[]}
        artists={ARTISTS}
        releaseTitlesByArtist={RELEASE_TITLES_BY_ARTIST}
        onAdd={onAdd}
        onRemove={onRemove}
      />
    )

    const artistInput = screen.getByPlaceholderText(/search artist/i)
    fireEvent.focus(artistInput)
    await user.click(screen.getByText('Artist B'))

    await user.click(screen.getByRole('button', { name: /add ignored entry/i }))

    expect(onAdd).toHaveBeenCalledWith({
      artist: 'Artist B',
      releaseTitle: undefined,
      note: undefined,
    })
  })

  test('calls onAdd with artist and release when both are selected', async () => {
    const user = userEvent.setup()
    render(
      <IgnoredEntriesManager
        entries={[]}
        artists={ARTISTS}
        releaseTitlesByArtist={RELEASE_TITLES_BY_ARTIST}
        onAdd={onAdd}
        onRemove={onRemove}
      />
    )

    const artistInput = screen.getByPlaceholderText(/search artist/i)
    fireEvent.focus(artistInput)
    await user.click(screen.getByText('Artist A'))

    const releaseInput = screen.getByPlaceholderText(/search release/i)
    fireEvent.focus(releaseInput)
    await user.click(screen.getByText('Album Two'))

    await user.click(screen.getByRole('button', { name: /add ignored entry/i }))

    expect(onAdd).toHaveBeenCalledWith({
      artist: 'Artist A',
      releaseTitle: 'Album Two',
      note: undefined,
    })
  })

  test('renders existing entries', () => {
    render(
      <IgnoredEntriesManager
        entries={[makeEntry({ artist: 'Artist A', releaseTitle: 'Album One' })]}
        artists={ARTISTS}
        releaseTitlesByArtist={RELEASE_TITLES_BY_ARTIST}
        onAdd={onAdd}
        onRemove={onRemove}
      />
    )
    expect(screen.getByText('Artist A')).toBeTruthy()
    expect(screen.getByText('Album One')).toBeTruthy()
  })

  test('calls onRemove when the delete button is clicked', async () => {
    const user = userEvent.setup()
    render(
      <IgnoredEntriesManager
        entries={[makeEntry({ id: 'del1' })]}
        artists={ARTISTS}
        releaseTitlesByArtist={RELEASE_TITLES_BY_ARTIST}
        onAdd={onAdd}
        onRemove={onRemove}
      />
    )
    await user.click(screen.getByRole('button', { name: '' }))
    expect(onRemove).toHaveBeenCalledWith('del1')
  })
})
