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
  if (diffInSeconds < 604800)
    return `${Math.floor(diffInSeconds / 86400)} day${Math.floor(diffInSeconds / 86400) > 1 ? "s" : ""} ago`
  if (diffInSeconds < 2592000)
    return `${Math.floor(diffInSeconds / 604800)} week${Math.floor(diffInSeconds / 604800) > 1 ? "s" : ""} ago`
  if (diffInSeconds < 7776000)
    return `${Math.floor(diffInSeconds / 2592000)} month${Math.floor(diffInSeconds / 2592000) > 1 ? "s" : ""} ago`

  // After 3 months, show full date with time
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
