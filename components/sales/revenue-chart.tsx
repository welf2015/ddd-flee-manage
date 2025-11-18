"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Line, LineChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
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
    .select("completed_at, current_negotiation_amount, actual_cost")
    .gte("completed_at", startDate.toISOString())
    .not("completed_at", "is", null)
    .order("completed_at")

  // Group by period
  const grouped = bookings?.reduce((acc: any, booking) => {
    const date = new Date(booking.completed_at!)
    let key: string
    if (timeRange === "weekly") {
      key = date.toLocaleDateString("en-US", { weekday: "short" })
    } else if (timeRange === "monthly") {
      key = date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
    } else {
      key = date.toLocaleDateString("en-US", { month: "short" })
    }

    if (!acc[key]) {
      acc[key] = { period: key, revenue: 0, costs: 0 }
    }
    acc[key].revenue += Number(booking.current_negotiation_amount) || 0
    acc[key].costs += Number(booking.actual_cost) || 0
    return acc
  }, {})

  return Object.values(grouped || {})
}

interface RevenueChartProps {
  timeRange: string
}

export function RevenueChart({ timeRange }: RevenueChartProps) {
  const { data } = useSWR(`revenue-chart-${timeRange}`, () => fetcher(timeRange), {
    refreshInterval: 10000,
  })

  return (
    <Card className="bg-background/50 backdrop-blur">
      <CardHeader>
        <CardTitle>Revenue vs Costs</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data || []}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="period" stroke="hsl(var(--muted-foreground))" />
            <YAxis stroke="hsl(var(--muted-foreground))" />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
              }}
            />
            <Legend />
            <Line type="monotone" dataKey="revenue" stroke="hsl(var(--accent))" name="Revenue" />
            <Line type="monotone" dataKey="costs" stroke="hsl(var(--destructive))" name="Costs" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
