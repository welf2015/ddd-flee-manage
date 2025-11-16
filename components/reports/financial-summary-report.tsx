"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"

export function FinancialSummaryReport() {
  const supabase = createClient()

  const { data: financialData } = useSWR(
    "financial-summary",
    async () => {
      const { data: bookings } = await supabase
        .from("bookings")
        .select("proposed_client_budget, actual_cost, created_at, status")

      const { data: fuelLogs } = await supabase.from("fuel_logs").select("cost")

      const { data: maintenance } = await supabase.from("maintenance_logs").select("cost")

      if (!bookings) return null

      const totalRevenue = bookings
        .filter((b: any) => b.status === "Completed")
        .reduce((sum: number, b: any) => sum + (b.proposed_client_budget || 0), 0)

      const totalActualCost = bookings.reduce((sum: number, b: any) => sum + (b.actual_cost || 0), 0)

      const totalFuelCost = fuelLogs?.reduce((sum: number, f: any) => sum + (f.cost || 0), 0) || 0
      const totalMaintenanceCost = maintenance?.reduce((sum: number, m: any) => sum + (m.cost || 0), 0) || 0

      const totalExpenses = totalActualCost + totalFuelCost + totalMaintenanceCost
      const profit = totalRevenue - totalExpenses

      return {
        totalRevenue,
        totalExpenses,
        profit,
        breakdown: [
          { name: "Revenue", value: totalRevenue },
          { name: "Job Costs", value: totalActualCost },
          { name: "Fuel", value: totalFuelCost },
          { name: "Maintenance", value: totalMaintenanceCost },
        ],
      }
    },
    { refreshInterval: 20000 },
  )

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ₦{financialData?.totalRevenue?.toLocaleString() || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ₦{financialData?.totalExpenses?.toLocaleString() || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Net Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${financialData?.profit && financialData.profit >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              ₦{financialData?.profit?.toLocaleString() || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Financial Breakdown</CardTitle>
          <CardDescription>Revenue vs Expenses</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={financialData?.breakdown || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => `₦${(value / 1000000).toFixed(2)}M`} />
              <Bar dataKey="value" fill="#003e31" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
