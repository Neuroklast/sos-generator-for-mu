"use client"

import { useCallback, useMemo, useState } from "react"
import { format } from "date-fns"
import { CalendarDays } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface DatePickerInputProps {
  id?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

const ISO_DATE_VALUE_RE = /^\d{4}-\d{2}-\d{2}$/
const MIN_MONTH = 1
const MAX_MONTH = 12
const MIN_DAY = 1
const MAX_DAY = 31

/**
 * Parses the persisted `YYYY-MM-DD` form value into a local calendar date.
 *
 * We intentionally split the string into date parts instead of passing the raw
 * ISO date into the `Date` constructor because bare ISO dates are interpreted
 * as UTC in many environments. That causes off-by-one rendering bugs in
 * negative UTC offsets, which is unacceptable for statement periods.
 *
 * Invalid or impossible dates such as `2024-02-30` return `undefined` so the
 * picker can fall back to its placeholder state rather than rendering a wrong
 * day.
 */
function parseDateValue(value: string): Date | undefined {
  if (!ISO_DATE_VALUE_RE.test(value)) {
    return undefined
  }

  const dateParts = value.split("-")

  if (dateParts.length !== 3) {
    return undefined
  }

  const [year, month, day] = dateParts.map(Number)

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day) ||
    year < 1 ||
    month < MIN_MONTH ||
    month > MAX_MONTH ||
    day < MIN_DAY ||
    day > MAX_DAY
  ) {
    return undefined
  }

  const parsedDate = new Date(year, month - 1, day)

  if (
    parsedDate.getFullYear() !== year ||
    parsedDate.getMonth() !== month - 1 ||
    parsedDate.getDate() !== day
  ) {
    return undefined
  }

  return parsedDate
}

/**
 * Serialises a selected local calendar date back into the canonical
 * `YYYY-MM-DD` string stored in application state.
 *
 * The value is composed from local date parts to preserve the exact day the
 * user picked in the calendar and to avoid timezone shifts when the value is
 * later rehydrated.
 */
function formatDateValue(date: Date): string {
  const year = String(date.getFullYear()).padStart(4, "0")
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

/**
 * Styled single-date picker that keeps external state in the repository's
 * existing `YYYY-MM-DD` string format.
 *
 * This wraps the shared `Calendar` inside a `Popover` so period inputs match
 * the app's UI instead of relying on inconsistent native browser date pickers.
 * Parsing and formatting are handled explicitly to keep reporting periods
 * stable across timezones.
 */
export function DatePickerInput({
  id,
  value,
  onChange,
  placeholder = "Select date",
  className,
  disabled = false,
}: DatePickerInputProps) {
  const [open, setOpen] = useState(false)

  const selectedDate = useMemo(() => parseDateValue(value), [value])
  const triggerLabel = selectedDate ? format(selectedDate, "d MMM yyyy") : placeholder
  const handleSelect = useCallback((date: Date | undefined) => {
    if (!date) {
      return
    }

    onChange(formatDateValue(date))
    setOpen(false)
  }, [onChange])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "h-10 w-full justify-between border-border/60 bg-background/50 px-3 text-left font-normal hover:bg-accent/50 focus-visible:border-primary/60",
            !selectedDate && "text-muted-foreground",
            className,
          )}
        >
          <span className="truncate">{triggerLabel}</span>
          <CalendarDays className="size-4 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-auto p-0"
        onOpenAutoFocus={event => event.preventDefault()}
      >
        <Calendar
          mode="single"
          selected={selectedDate}
          defaultMonth={selectedDate}
          onSelect={handleSelect}
        />
      </PopoverContent>
    </Popover>
  )
}
