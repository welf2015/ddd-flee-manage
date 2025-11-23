export type TimePeriod = "weekly" | "monthly" | "yearly" | "all-time"

export function getDateRange(period: TimePeriod): { startDate: Date | null; startDateISO: string | null } {
  const now = new Date()
  let startDate: Date | null = null

  switch (period) {
    case "weekly":
      // Calculate week start (Monday)
      const dayOfWeek = now.getDay()
      const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1) // Adjust to Monday
      startDate = new Date(now.setDate(diff))
      startDate.setHours(0, 0, 0, 0)
      break
    case "monthly":
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      startDate.setHours(0, 0, 0, 0)
      break
    case "yearly":
      startDate = new Date(now.getFullYear(), 0, 1)
      startDate.setHours(0, 0, 0, 0)
      break
    case "all-time":
      return { startDate: null, startDateISO: null }
    default:
      // Default to weekly
      const dayOfWeekDefault = now.getDay()
      const diffDefault = now.getDate() - dayOfWeekDefault + (dayOfWeekDefault === 0 ? -6 : 1)
      startDate = new Date(now.setDate(diffDefault))
      startDate.setHours(0, 0, 0, 0)
  }

  return { startDate, startDateISO: startDate.toISOString() }
}

export function getPeriodLabel(period: TimePeriod): string {
  switch (period) {
    case "weekly":
      return "This week"
    case "monthly":
      return "This month"
    case "yearly":
      return "This year"
    case "all-time":
      return "All time"
    default:
      return "This week"
  }
}

