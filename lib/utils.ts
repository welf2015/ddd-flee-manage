import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatRelativeTime(date: string | Date): string {
  const now = new Date()
  const then = new Date(date)
  const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000)

  if (diffInSeconds < 60) return `${diffInSeconds}sec ago`
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}min ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}hr ago`

  // After 24 hours, show the actual date
  return formatDateTime(then)
}

export function formatDateTime(date: string | Date): string {
  const d = new Date(date)
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  const month = months[d.getMonth()]
  const day = d.getDate()
  const year = d.getFullYear()

  let hours = d.getHours()
  const minutes = d.getMinutes()
  const ampm = hours >= 12 ? "pm" : "am"
  hours = hours % 12 || 12
  const minutesStr = minutes > 0 ? `:${minutes.toString().padStart(2, "0")}` : ""

  return `${month} ${day}, ${year} ${hours}${minutesStr}${ampm}`
}

export function formatCurrency(amount: number, currency: "NGN" | "USD" = "NGN"): string {
  const symbol = currency === "NGN" ? "₦" : "$"
  return `${symbol}${amount.toLocaleString()}`
}

export function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  const weekStart = new Date(d.setDate(diff))
  weekStart.setHours(0, 0, 0, 0)
  return weekStart
}

export function getWeekEnd(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  const weekStart = new Date(d.setDate(diff))
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 6)
  weekEnd.setHours(23, 59, 59, 999)
  return weekEnd
}

export function formatWeekRange(startDate: Date): string {
  const endDate = new Date(startDate)
  endDate.setDate(endDate.getDate() + 6)

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  const startMonth = months[startDate.getMonth()]
  const endMonth = months[endDate.getMonth()]
  const startDay = startDate.getDate()
  const endDay = endDate.getDate()
  const year = startDate.getFullYear()

  if (startMonth === endMonth) {
    return `${startMonth} ${startDay} - ${endDay}, ${year}`
  } else {
    return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`
  }
}

export function groupTransactionsByWeek(transactions: any[]): Map<string, any[]> {
  const groups = new Map<string, any[]>()

  transactions.forEach((item) => {
    const weekStart = getWeekStart(new Date(item.date))
    const weekKey = weekStart.toISOString().split("T")[0]

    if (!groups.has(weekKey)) {
      groups.set(weekKey, [])
    }
    groups.get(weekKey)!.push(item)
  })

  // Sort weeks by most recent first
  return new Map(
    [...groups.entries()].sort((a, b) => {
      const dateA = new Date(a[0])
      const dateB = new Date(b[0])
      return dateB.getTime() - dateA.getTime()
    }),
  )
}
