"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"
import { useState } from "react"

type TimePeriod = "weekly" | "monthly" | "yearly" | "all-time"

export function FuelUsageReport() {
  const supabase = createClient()
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("weekly")

  // Calculate date range based on time period
  const getDateRange = (period: TimePeriod) => {
    const now = new Date()
    let startDate: Date

    switch (period) {
      case "weekly":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case "monthly":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case "yearly":
        startDate = new Date(now.getFullYear(), 0, 1)
        break
      case "all-time":
        return null // No filter
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    }

    return startDate.toISOString()
  }

  const { data: fuelData = [] } = useSWR(
    `fuel-usage-report-${timePeriod}`,
    async () => {
      let query = supabase
        .from("fuel_logs")
        .select("logged_at, quantity, unit, cost")
        .order("logged_at", { ascending: true })

      const startDate = getDateRange(timePeriod)
      if (startDate) {
        query = query.gte("logged_at", startDate)
      }

      const { data } = await query

      if (!data || data.length === 0) return []

      // Group by date (day for weekly/monthly, month for yearly, all for all-time)
      const grouped: any = {}
      data.forEach((f: any) => {
        const logDate = new Date(f.logged_at)
        let dateKey: string

        if (timePeriod === "yearly") {
          dateKey = `${logDate.getFullYear()}-${String(logDate.getMonth() + 1).padStart(2, "0")}`
        } else if (timePeriod === "all-time") {
          dateKey = `${logDate.getFullYear()}-${String(logDate.getMonth() + 1).padStart(2, "0")}`
        } else {
          dateKey = logDate.toISOString().split("T")[0]
        }

        if (!grouped[dateKey]) {
          grouped[dateKey] = { date: dateKey, liters: 0, cost: 0 }
        }

        // Convert quantity to liters (if unit is kWh, skip or convert)
        const quantity = parseFloat(f.quantity) || 0
        if (f.unit === "Liters") {
          grouped[dateKey].liters += quantity
        }
        grouped[dateKey].cost += parseFloat(f.cost) || 0
      })

      return Object.values(grouped).sort((a: any, b: any) => a.date.localeCompare(b.date))
    },
    { refreshInterval: 15000 },
  )

  const { data: stats } = useSWR(
    `fuel-stats-${timePeriod}`,
    async () => {
      let query = supabase.from("fuel_logs").select("quantity, unit, cost")

      const startDate = getDateRange(timePeriod)
      if (startDate) {
        query = query.gte("logged_at", startDate)
      }

      const { data } = await query

      if (!data || data.length === 0) {
        return { totalLiters: 0, totalCost: 0, avgPerLiter: 0 }
      }

      let totalLiters = 0
      let totalCost = 0

      data.forEach((f: any) => {
        const quantity = parseFloat(f.quantity) || 0
        if (f.unit === "Liters") {
          totalLiters += quantity
        }
        totalCost += parseFloat(f.cost) || 0
      })

      const avgPerLiter = totalLiters > 0 ? totalCost / totalLiters : 0

      return {
        totalLiters: totalLiters.toFixed(2),
        totalCost,
        avgPerLiter: avgPerLiter.toFixed(2),
      }
    },
    { refreshInterval: 15000 },
  )

  const getPeriodLabel = () => {
    switch (timePeriod) {
      case "weekly":
        return "Last 7 days"
      case "monthly":
        return "This month"
      case "yearly":
        return "This year"
      case "all-time":
        return "All time"
      default:
        return "Last 7 days"
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Fuel Usage Report</h2>
          <p className="text-sm text-muted-foreground">Track fuel consumption and costs over time</p>
        </div>
        <Select value={timePeriod} onValueChange={(value) => setTimePeriod(value as TimePeriod)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="yearly">Yearly</SelectItem>
            <SelectItem value="all-time">All Time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Total Fuel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalLiters || "0.00"} L</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Total Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{stats?.totalCost?.toLocaleString() || "0"}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Avg Price/Liter</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{stats?.avgPerLiter || "0.00"}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Fuel Consumption Trend</CardTitle>
          <CardDescription>{getPeriodLabel()}</CardDescription>
        </CardHeader>
        <CardContent>
          {fuelData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={fuelData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="liters" stroke="#003e31" name="Liters" />
                <Line yAxisId="right" type="monotone" dataKey="cost" stroke="#F59E0B" name="Cost (₦)" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              No fuel data available for the selected period
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
