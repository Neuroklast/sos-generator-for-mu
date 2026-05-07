import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, test, vi } from "vitest"

import { DatePickerInput } from "@/components/ui/date-picker-input"

vi.mock("lucide-react", () => ({
  CalendarDays: () => <svg data-testid="calendar-icon" />,
}))

vi.mock("@/components/ui/calendar", () => ({
  Calendar: ({
    selected,
    onSelect,
  }: {
    selected?: Date
    onSelect?: (date?: Date) => void
  }) => (
    <div
      data-testid="calendar"
      data-selected={selected ? [
        selected.getFullYear(),
        String(selected.getMonth() + 1).padStart(2, "0"),
        String(selected.getDate()).padStart(2, "0"),
      ].join("-") : ""}
    >
      <button type="button" onClick={() => onSelect?.(new Date(2024, 0, 15))}>
        Select 15 Jan 2024
      </button>
    </div>
  ),
}))

describe("DatePickerInput", () => {
  test("renders a formatted label and preserves the local calendar date from YYYY-MM-DD input", async () => {
    const user = userEvent.setup()

    render(
      <DatePickerInput
        value="2024-01-01"
        onChange={vi.fn()}
        placeholder="Select date"
      />,
    )

    expect(screen.getByRole("button", { name: /1 jan 2024/i })).toBeTruthy()

    await user.click(screen.getByRole("button", { name: /1 jan 2024/i }))

    expect(screen.getByTestId("calendar").getAttribute("data-selected")).toBe("2024-01-01")
  })

  test("emits a YYYY-MM-DD value and closes the popover after selecting a date", async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn()

    render(
      <DatePickerInput
        value=""
        onChange={handleChange}
        placeholder="Select date"
      />,
    )

    await user.click(screen.getByRole("button", { name: /select date/i }))
    await user.click(screen.getByRole("button", { name: /select 15 jan 2024/i }))

    expect(handleChange).toHaveBeenCalledWith("2024-01-15")

    await waitFor(() => {
      expect(screen.queryByTestId("calendar")).toBeNull()
    })
  })
})
