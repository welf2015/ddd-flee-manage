"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from "recharts"
import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"
import { getDateRange, getPeriodLabel, type TimePeriod } from "@/lib/report-utils"

type TripsAnalyticsReportProps = {
  timePeriod?: TimePeriod
}

export function TripsAnalyticsReport({ timePeriod = "weekly" }: TripsAnalyticsReportProps) {
  const supabase = createClient()
  const { startDateISO } = getDateRange(timePeriod)

  const { data: tripsData = [] } = useSWR(
    `trips-analytics-${timePeriod}`,
    async () => {
      let query = supabase
        .from("bookings")
        .select("job_date, status")
        .order("job_date", { ascending: true })

      if (startDateISO) {
        query = query.gte("job_date", startDateISO)
      }

      const { data } = await query

      if (!data) return []

      // Group by date
      const grouped: any = {}
      data.forEach((booking: any) => {
        const date = new Date(booking.job_date).toLocaleDateString()
        if (!grouped[date]) grouped[date] = { date, total: 0, completed: 0, inTransit: 0 }
        grouped[date].total++
        if (booking.status === "Completed") grouped[date].completed++
        if (booking.status === "In Transit") grouped[date].inTransit++
      })

      return Object.values(grouped)
    },
    { refreshInterval: 10000 },
  )

  const { data: stats } = useSWR(`trips-stats-${timePeriod}`, async () => {
    let query = supabase.from("bookings").select("status, job_date")

    if (startDateISO) {
      query = query.gte("job_date", startDateISO)
    }

    const { data } = await query
    if (!data) return { total: 0, completed: 0, pending: 0 }

    return {
      total: data.length,
      completed: data.filter((b: any) => b.status === "Completed").length,
      pending: data.filter((b: any) => ["Open", "Negotiation", "Approved"].includes(b.status)).length,
    }
  })

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Total Trips</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.completed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats?.pending}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Trip Volume Trend</CardTitle>
          <CardDescription>{getPeriodLabel(timePeriod)}</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={tripsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="total" fill="#003e31" name="Total Trips" />
              <Bar dataKey="completed" fill="#22C55E" name="Completed" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
