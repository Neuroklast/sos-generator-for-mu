"use client"

import { useMemo, useState } from "react"
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

function parseDateValue(value: string): Date | undefined {
  if (!ISO_DATE_VALUE_RE.test(value)) {
    return undefined
  }

  const [year, month, day] = value.split("-").map(Number)

  if (!year || !month || !day) {
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

function formatDateValue(date: Date): string {
  const year = String(date.getFullYear()).padStart(4, "0")
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

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
          onSelect={date => {
            onChange(date ? formatDateValue(date) : "")
            setOpen(false)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}
