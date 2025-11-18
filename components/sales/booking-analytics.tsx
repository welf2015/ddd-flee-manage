"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"

const fetcher = async (timeRange: string) => {
  const supabase = createClient()
  
  const now = new Date()
  let startDate = new Date()
  if (timeRange === "weekly") {
    startDate.setDate(now.getDate() - 7)
  } else if (timeRange === "monthly") {
    startDate.setMonth(now.getMonth() - 1)
  } else {
    startDate.setFullYear(now.getFullYear() - 1)
  }

  const { data: bookings } = await supabase
    .from("bookings")
    .select("status, created_at")
    .gte("created_at", startDate.toISOString())

  const statusCounts = bookings?.reduce((acc: any, b) => {
    acc[b.status] = (acc[b.status] || 0) + 1
    return acc
  }, {})

  return {
    total: bookings?.length || 0,
    ...statusCounts,
  }
}

interface BookingAnalyticsProps {
  timeRange: string
}

export function BookingAnalytics({ timeRange }: BookingAnalyticsProps) {
  const { data } = useSWR(`booking-analytics-${timeRange}`, () => fetcher(timeRange), {
    refreshInterval: 10000,
  })

  const stats = [
    { label: "Total Bookings", value: data?.total || 0, variant: "default" as const },
    { label: "Completed", value: data?.Completed || 0, variant: "default" as const },
    { label: "In Progress", value: data?.["In Progress"] || 0, variant: "secondary" as const },
    { label: "Closed", value: data?.Closed || 0, variant: "outline" as const },
    { label: "Failed/Cancelled", value: (data?.Failed || 0) + (data?.Cancelled || 0), variant: "destructive" as const },
  ]

  return (
    <Card className="bg-background/50 backdrop-blur">
      <CardHeader>
        <CardTitle>Booking Status Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-5">
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col items-center space-y-2">
              <Badge variant={stat.variant} className="text-lg px-4 py-2">
                {stat.value}
              </Badge>
              <p className="text-xs text-muted-foreground text-center">{stat.label}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
