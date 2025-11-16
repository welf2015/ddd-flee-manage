"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"

export function FuelUsageReport() {
  const supabase = createClient()

  const { data: fuelData = [] } = useSWR(
    "fuel-usage-report",
    async () => {
      const { data } = await supabase
        .from("fuel_logs")
        .select("fuel_date, quantity_liters, cost")
        .order("fuel_date", { ascending: true })
        .limit(60)

      if (!data) return []

      const grouped: any = {}
      data.forEach((f: any) => {
        const date = f.fuel_date
        if (!grouped[date]) grouped[date] = { date, liters: 0, cost: 0 }
        grouped[date].liters += f.quantity_liters || 0
        grouped[date].cost += f.cost || 0
      })

      return Object.values(grouped).slice(-30)
    },
    { refreshInterval: 15000 },
  )

  const { data: stats } = useSWR("fuel-stats", async () => {
    const { data } = await supabase.from("fuel_logs").select("quantity_liters, cost")
    if (!data) return { totalLiters: 0, totalCost: 0, avgPerLiter: 0 }

    const totalLiters = data.reduce((sum: number, f: any) => sum + (f.quantity_liters || 0), 0)
    const totalCost = data.reduce((sum: number, f: any) => sum + (f.cost || 0), 0)

    return {
      totalLiters: totalLiters.toFixed(2),
      totalCost,
      avgPerLiter: (totalCost / totalLiters).toFixed(2),
    }
  })

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Total Fuel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalLiters} L</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Total Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{stats?.totalCost?.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Avg Price/Liter</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{stats?.avgPerLiter}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Fuel Consumption Trend</CardTitle>
          <CardDescription>Last 30 days</CardDescription>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>
    </div>
  )
}
