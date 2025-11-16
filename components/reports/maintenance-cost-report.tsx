"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts"
import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"

export function MaintenanceCostReport() {
  const supabase = createClient()

  const { data: maintenanceData = [] } = useSWR(
    "maintenance-report",
    async () => {
      const { data } = await supabase
        .from("maintenance_logs")
        .select("maintenance_type, cost, service_date")
        .order("service_date", { ascending: false })
        .limit(100)

      if (!data) return []

      const grouped: any = {}
      data.forEach((m: any) => {
        if (!grouped[m.maintenance_type]) {
          grouped[m.maintenance_type] = { name: m.maintenance_type, value: 0, count: 0 }
        }
        grouped[m.maintenance_type].value += m.cost || 0
        grouped[m.maintenance_type].count++
      })

      return Object.values(grouped)
    },
    { refreshInterval: 15000 },
  )

  const { data: totalCost } = useSWR("total-maintenance-cost", async () => {
    const { data } = await supabase.from("maintenance_logs").select("cost")
    return data?.reduce((sum: number, m: any) => sum + (m.cost || 0), 0) || 0
  })

  const COLORS = ["#003e31", "#22C55E", "#3B82F6", "#F59E0B", "#EF4444"]

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Total Maintenance Cost</CardTitle>
          <CardDescription>All time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">₦{totalCost?.toLocaleString() || 0}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Maintenance by Type</CardTitle>
          <CardDescription>Cost distribution</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={maintenanceData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ₦${(value / 1000).toFixed(0)}K`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {maintenanceData.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `₦${(value / 1000).toFixed(0)}K`} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
