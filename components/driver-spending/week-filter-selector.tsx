"use client"

import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "lucide-react"

interface WeekFilterSelectorProps {
  selectedWeek: string
  selectedYear: number
  onWeekChange: (week: string) => void
  onYearChange: (year: number) => void
}

export default function WeekFilterSelector({
  selectedWeek,
  selectedYear,
  onWeekChange,
  onYearChange,
}: WeekFilterSelectorProps) {
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 3 }, (_, i) => currentYear - i)

  function getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
    const dayNum = d.getUTCDay() || 7
    d.setUTCDate(d.getUTCDate() + 4 - dayNum)
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  }

  const currentWeek = getWeekNumber(new Date())

  // Generate last 10 weeks dynamically
  const generateWeeks = () => {
    const weeksList = []
    weeksList.push({ value: "all", label: "All Time" })
    weeksList.push({ value: "current", label: `Current Week (Week ${currentWeek})` })

    // Add current week (if not already handled by "current" logic, but user might want explicit number)
    // Actually, "current" is good. Let's list the previous 10 weeks.
    for (let i = 1; i <= 10; i++) {
      const w = currentWeek - i
      if (w > 0) {
        weeksList.push({ value: w.toString(), label: `Week ${w}` })
      }
    }
    return weeksList
  }

  const weekOptions = generateWeeks()

  return (
    <div className="flex items-center gap-4 p-2">
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Week Filter:</span>
      </div>

      <div className="flex items-center gap-2">
        <Select value={selectedWeek} onValueChange={onWeekChange}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select week" />
          </SelectTrigger>
          <SelectContent>
            {weekOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
            <SelectItem value="previous">All Previous Weeks</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedYear.toString()} onValueChange={(value) => onYearChange(Number(value))}>
          <SelectTrigger className="w-24">
            <SelectValue placeholder="Year" />
          </SelectTrigger>
          <SelectContent>
            {years.map((year) => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {selectedWeek === "current" && (
          <span>Week {currentWeek}, {currentYear}</span>
        )}
        {selectedWeek !== "current" && selectedWeek !== "previous" && (
          <span>Week {selectedWeek}, {selectedYear}</span>
        )}
        {selectedWeek === "previous" && (
          <span>Previous Weeks, {selectedYear}</span>
        )}
      </div>
    </div>
  )
}
