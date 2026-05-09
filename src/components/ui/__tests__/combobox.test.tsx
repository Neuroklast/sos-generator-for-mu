import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, test, vi } from 'vitest'
import { SearchableCombobox } from '@/components/ui/combobox'

// Radix UI Popover uses a portal which renders outside the component tree.
// We stub it to render children inline so that the option list is accessible
// to testing-library queries even when `open` is true.
vi.mock('@/components/ui/popover', () => ({
  Popover: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PopoverTrigger: ({ children }: { children: React.ReactNode; asChild?: boolean }) => <div>{children}</div>,
  PopoverContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="popover-content">{children}</div>
  ),
}))

// cmdk uses ResizeObserver which is not available in jsdom.  Stub the Command
// primitives so they just render their children.
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

const OPTIONS = ['Artist Alpha', 'Artist Beta', 'Band Gamma']

describe('SearchableCombobox', () => {
  test('renders an input with the given placeholder', () => {
    render(
      <SearchableCombobox value="" onChange={vi.fn()} options={OPTIONS} placeholder="Pick an artist" />
    )
    expect(screen.getByPlaceholderText('Pick an artist')).toBeTruthy()
  })

  test('displays the controlled value in the input', () => {
    render(<SearchableCombobox value="Artist Alpha" onChange={vi.fn()} options={OPTIONS} />)
    const input = screen.getByRole('textbox') as HTMLInputElement
    expect(input.value).toBe('Artist Alpha')
  })

  test('shows the option list when the input is focused', () => {
    render(<SearchableCombobox value="" onChange={vi.fn()} options={OPTIONS} placeholder="Search" />)
    expect(screen.queryByTestId('popover-content')).toBeNull()
    fireEvent.focus(screen.getByRole('textbox'))
    expect(screen.getByTestId('popover-content')).toBeTruthy()
    expect(screen.getByText('Artist Alpha')).toBeTruthy()
    expect(screen.getByText('Artist Beta')).toBeTruthy()
    expect(screen.getByText('Band Gamma')).toBeTruthy()
  })

  test('filters options by typed substring (case-insensitive)', async () => {
    const user = userEvent.setup()
    render(<SearchableCombobox value="" onChange={vi.fn()} options={OPTIONS} placeholder="Search" />)

    fireEvent.focus(screen.getByRole('textbox'))
    await user.type(screen.getByRole('textbox'), 'artist')

    expect(screen.getByText('Artist Alpha')).toBeTruthy()
    expect(screen.getByText('Artist Beta')).toBeTruthy()
    expect(screen.queryByText('Band Gamma')).toBeNull()
  })

  test('shows emptyText when no options match the search', async () => {
    const user = userEvent.setup()
    render(
      <SearchableCombobox
        value=""
        onChange={vi.fn()}
        options={OPTIONS}
        placeholder="Search"
        emptyText="Nothing found"
      />
    )

    fireEvent.focus(screen.getByRole('textbox'))
    await user.type(screen.getByRole('textbox'), 'zzz')

    expect(screen.getByText('Nothing found')).toBeTruthy()
  })

  test('calls onChange when the user types', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<SearchableCombobox value="" onChange={onChange} options={OPTIONS} placeholder="Search" />)

    await user.type(screen.getByRole('textbox'), 'Alp')

    expect(onChange).toHaveBeenCalledWith('A')
    expect(onChange).toHaveBeenLastCalledWith('Alp')
  })

  test('calls onChange with the selected option and closes the dropdown on selection', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<SearchableCombobox value="" onChange={onChange} options={OPTIONS} placeholder="Search" />)

    fireEvent.focus(screen.getByRole('textbox'))
    await user.click(screen.getByText('Artist Beta'))

    expect(onChange).toHaveBeenLastCalledWith('Artist Beta')
    // Dropdown should close after selection (popover-content no longer rendered)
    expect(screen.queryByTestId('popover-content')).toBeNull()
  })

  test('syncs display value when controlled value changes externally', () => {
    const { rerender } = render(
      <SearchableCombobox value="Artist Alpha" onChange={vi.fn()} options={OPTIONS} />
    )
    const input = screen.getByRole('textbox') as HTMLInputElement
    expect(input.value).toBe('Artist Alpha')

    rerender(<SearchableCombobox value="" onChange={vi.fn()} options={OPTIONS} />)
    expect(input.value).toBe('')
  })

  test('renders as disabled when disabled prop is true', () => {
    render(<SearchableCombobox value="" onChange={vi.fn()} options={OPTIONS} disabled />)
    const input = screen.getByRole('textbox') as HTMLInputElement
    expect(input.disabled).toBe(true)
  })
})
