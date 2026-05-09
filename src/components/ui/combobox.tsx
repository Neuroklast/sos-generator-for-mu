import { useEffect, useState } from 'react'
import { CaretUpDown, Check } from '@phosphor-icons/react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandGroup, CommandItem, CommandList } from '@/components/ui/command'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export interface SearchableComboboxProps {
  /** Currently selected value (controlled). */
  value: string
  /** Called whenever the user selects an option or changes the free-text input. */
  onChange: (value: string) => void
  /** Options to display and filter. */
  options: string[]
  /** Input placeholder shown when no value has been typed/selected. */
  placeholder?: string
  /** Message shown in the dropdown when no options match the search. */
  emptyText?: string
  /** HTML id forwarded to the underlying <input> — used for <label> association. */
  id?: string
  /** Additional className applied to the root wrapper div. */
  className?: string
  /** When true the input is non-interactive. */
  disabled?: boolean
}

/**
 * A controlled, searchable combobox that combines a free-text input with a
 * filtered option list rendered in a Popover.
 *
 * Interaction model:
 * - The text `<input>` doubles as the search field.
 * - The dropdown opens when the input receives focus.
 * - Typing narrows the visible options (case-insensitive substring match).
 * - Selecting an item writes that value to the input and closes the dropdown.
 * - Free-text values that are not in `options` are still accepted.
 * - When the controlled `value` prop changes externally (e.g. form reset), the
 *   display value is synchronised via `useEffect`.
 */
export function SearchableCombobox({
  value,
  onChange,
  options,
  placeholder,
  emptyText = 'No results',
  id,
  className,
  disabled = false,
}: SearchableComboboxProps) {
  const [open, setOpen] = useState(false)
  const [inputValue, setInputValue] = useState(value)

  // Sync display value when the controlled prop changes externally.
  useEffect(() => {
    setInputValue(value)
  }, [value])

  const handleInputChange = (val: string) => {
    setInputValue(val)
    onChange(val)
  }

  const handleSelect = (selected: string) => {
    setInputValue(selected)
    onChange(selected)
    setOpen(false)
  }

  const filtered = options.filter(o =>
    o.toLowerCase().includes(inputValue.toLowerCase())
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className={cn('relative', className)}>
          <Input
            id={id}
            value={inputValue}
            onChange={e => handleInputChange(e.target.value)}
            placeholder={placeholder}
            className="h-9 text-sm border-border/60 bg-background/50 focus:border-primary/60 pr-8"
            onFocus={() => setOpen(true)}
            disabled={disabled}
            autoComplete="off"
          />
          <CaretUpDown
            size={14}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
        </div>
      </PopoverTrigger>

      {open && (
        <PopoverContent
          className="p-0 w-[var(--radix-popover-trigger-width)]"
          align="start"
          onOpenAutoFocus={e => e.preventDefault()}
        >
          {filtered.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">{emptyText}</p>
          ) : (
            <Command>
              <CommandList>
                <CommandGroup>
                  {filtered.map(option => (
                    <CommandItem
                      key={option}
                      value={option}
                      onSelect={() => handleSelect(option)}
                    >
                      <Check
                        size={14}
                        className={cn('mr-2 shrink-0', value === option ? 'opacity-100' : 'opacity-0')}
                      />
                      {option}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          )}
        </PopoverContent>
      )}
    </Popover>
  )
}
