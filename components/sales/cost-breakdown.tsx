"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Pie, PieChart, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"
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

  const [maintenanceRes, procurementRes, jobCostsRes] = await Promise.all([
    supabase
      .from("maintenance_logs")
      .select("cost")
      .gte("service_date", startDate.toISOString().split("T")[0]),
    supabase
      .from("procurements")
      .select("final_price")
      .eq("status", "Completed")
      .gte("created_at", startDate.toISOString()),
    supabase
      .from("job_costs")
      .select("amount")
      .gte("created_at", startDate.toISOString()),
  ])

  const maintenanceCosts = maintenanceRes.data?.reduce((sum, m) => sum + (Number(m.cost) || 0), 0) || 0
  const procurementCosts = procurementRes.data?.reduce((sum, p) => sum + (Number(p.final_price) || 0), 0) || 0
  const jobCosts = jobCostsRes.data?.reduce((sum, c) => sum + (Number(c.amount) || 0), 0) || 0

  return [
    { name: "Maintenance", value: maintenanceCosts },
    { name: "Procurement", value: procurementCosts },
    { name: "Job Costs", value: jobCosts },
  ]
}

const COLORS = ["hsl(var(--accent))", "hsl(var(--chart-2))", "hsl(var(--chart-3))"]

interface CostBreakdownProps {
  timeRange: string
}

export function CostBreakdown({ timeRange }: CostBreakdownProps) {
  const { data } = useSWR(`cost-breakdown-${timeRange}`, () => fetcher(timeRange), {
    refreshInterval: 10000,
  })

  return (
    <Card className="bg-background/50 backdrop-blur">
      <CardHeader>
        <CardTitle>Cost Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data || []}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {(data || []).map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
