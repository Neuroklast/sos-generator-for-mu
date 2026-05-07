import { ComponentProps } from "react"
import ChevronDown from "lucide-react/dist/esm/icons/chevron-down"
import ChevronLeft from "lucide-react/dist/esm/icons/chevron-left"
import ChevronRight from "lucide-react/dist/esm/icons/chevron-right"
import ChevronUp from "lucide-react/dist/esm/icons/chevron-up"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        root: "select-none",
        // Month layout — `relative` so the absolute Nav overlay aligns with the caption row
        months: "relative flex flex-col sm:flex-row gap-2",
        month: "flex flex-col gap-4",
        month_caption: "flex justify-center pt-1 items-center min-h-7",
        // Shared by plain CaptionLabel and the visible label inside each Dropdown
        caption_label:
          "flex items-center gap-1 text-sm font-medium pointer-events-none",
        // Navigation — absolute so it overlays the caption row inside `months`
        nav: "absolute top-0 left-0 right-0 flex items-center justify-between pointer-events-none",
        button_previous: cn(
          buttonVariants({ variant: "outline" }),
          "size-7 bg-transparent p-0 opacity-50 hover:opacity-100 pointer-events-auto",
        ),
        button_next: cn(
          buttonVariants({ variant: "outline" }),
          "size-7 bg-transparent p-0 opacity-50 hover:opacity-100 pointer-events-auto",
        ),
        // Dropdown navigation (used when captionLayout="dropdown" is passed)
        dropdowns: "flex gap-1 items-center",
        dropdown_root: cn(
          "relative inline-flex items-center gap-1 rounded-md border border-border/60 bg-background/50 px-2 py-1",
          "hover:bg-accent/50 transition-colors cursor-pointer",
          "[&[data-disabled]]:opacity-50 [&[data-disabled]]:pointer-events-none",
        ),
        // The <select> sits invisibly on top of the styled label, forwarding clicks to native UI
        dropdown: "absolute inset-0 z-10 w-full cursor-pointer opacity-0",
        // Grid
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday:
          "text-muted-foreground rounded-md w-8 font-normal text-[0.8rem] text-center",
        week: "flex w-full mt-2",
        day: cn(
          "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent [&:has([aria-selected].day-range-end)]:rounded-r-md",
          props.mode === "range"
            ? "[&:has(>.day-range-end)]:rounded-r-md [&:has(>.day-range-start)]:rounded-l-md first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md"
            : "[&:has([aria-selected])]:rounded-md",
        ),
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "size-8 p-0 font-normal aria-selected:opacity-100",
        ),
        // Day-state modifiers (v9 names)
        selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        today: "bg-accent text-accent-foreground",
        outside: "text-muted-foreground aria-selected:text-muted-foreground",
        disabled: "text-muted-foreground opacity-50",
        range_start:
          "day-range-start aria-selected:bg-primary aria-selected:text-primary-foreground",
        range_end:
          "day-range-end aria-selected:bg-primary aria-selected:text-primary-foreground",
        range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        /**
         * Replace the built-in polygon SVG chevron with lucide icons so the
         * arrows match the rest of the app's icon set. The `orientation` prop
         * controls direction; "left"/"right" are used by nav buttons, "down"
         * is used by the dropdown affordance indicator.
         */
        Chevron: ({ orientation, className: chevronClassName }) => {
          const cls = cn("size-4", chevronClassName)
          if (orientation === "left") return <ChevronLeft className={cls} />
          if (orientation === "right") return <ChevronRight className={cls} />
          // Dropdown affordance chevrons ("up"/"down") sit inside the compact
          // caption label, so a slightly smaller size fits the row height better.
          if (orientation === "up") return <ChevronUp className={cn("size-3", chevronClassName)} />
          return <ChevronDown className={cn("size-3", chevronClassName)} />
        },
      }}
      {...props}
    />
  )
}

export { Calendar }
