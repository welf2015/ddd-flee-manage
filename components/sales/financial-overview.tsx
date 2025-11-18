"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, TrendingUp, TrendingDown, Activity } from 'lucide-react'
import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"

const fetcher = async (timeRange: string) => {
  const supabase = createClient()
  
  // Calculate date range
  const now = new Date()
  let startDate = new Date()
  if (timeRange === "weekly") {
    startDate.setDate(now.getDate() - 7)
  } else if (timeRange === "monthly") {
    startDate.setMonth(now.getMonth() - 1)
  } else {
    startDate.setFullYear(now.getFullYear() - 1)
  }

  // Fetch bookings data
  const { data: bookings } = await supabase
    .from("bookings")
    .select("status, current_negotiation_amount, actual_cost, completed_at")
    .gte("created_at", startDate.toISOString())

  // Fetch maintenance costs
  const { data: maintenance } = await supabase
    .from("maintenance_logs")
    .select("cost")
    .gte("service_date", startDate.toISOString().split("T")[0])

  // Fetch procurement costs
  const { data: procurements } = await supabase
    .from("procurements")
    .select("final_price, status")
    .gte("created_at", startDate.toISOString())

  // Fetch job costs
  const { data: jobCosts } = await supabase
    .from("job_costs")
    .select("amount")
    .gte("created_at", startDate.toISOString())

  // Calculate metrics
  const totalRevenue = bookings
    ?.filter((b) => ["Completed", "Closed"].includes(b.status))
    .reduce((sum, b) => sum + (Number(b.current_negotiation_amount) || 0), 0) || 0

  const totalJobCosts = jobCosts?.reduce((sum, c) => sum + (Number(c.amount) || 0), 0) || 0
  
  const totalMaintenanceCosts = maintenance?.reduce((sum, m) => sum + (Number(m.cost) || 0), 0) || 0
  
  const totalProcurementCosts = procurements
    ?.filter((p) => p.status === "Completed")
    .reduce((sum, p) => sum + (Number(p.final_price) || 0), 0) || 0

  const totalCosts = totalJobCosts + totalMaintenanceCosts + totalProcurementCosts
  const netProfit = totalRevenue - totalCosts

  const completedJobs = bookings?.filter((b) => b.status === "Completed").length || 0
  const failedJobs = bookings?.filter((b) => b.status === "Closed" && !b.completed_at).length || 0
  const totalJobs = bookings?.length || 0

  return {
    totalRevenue,
    totalCosts,
    netProfit,
    completedJobs,
    failedJobs,
    totalJobs,
  }
}

interface FinancialOverviewProps {
  timeRange: string
}

export function FinancialOverview({ timeRange }: FinancialOverviewProps) {
  const { data } = useSWR(`financial-overview-${timeRange}`, () => fetcher(timeRange), {
    refreshInterval: 10000,
  })

  const stats = [
    {
      title: "Total Revenue",
      value: `₦${(data?.totalRevenue || 0).toLocaleString()}`,
      icon: DollarSign,
      description: `${data?.completedJobs || 0} completed jobs`,
      trend: "up",
    },
    {
      title: "Total Costs",
      value: `₦${(data?.totalCosts || 0).toLocaleString()}`,
      icon: TrendingDown,
      description: "All operational expenses",
      trend: "neutral",
    },
    {
      title: "Net Profit",
      value: `₦${(data?.netProfit || 0).toLocaleString()}`,
      icon: TrendingUp,
      description: "Revenue minus costs",
      trend: data?.netProfit && data.netProfit > 0 ? "up" : "down",
    },
    {
      title: "Job Success Rate",
      value: data?.totalJobs
        ? `${Math.round((data.completedJobs / data.totalJobs) * 100)}%`
        : "0%",
      icon: Activity,
      description: `${data?.failedJobs || 0} failed jobs`,
      trend: "neutral",
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <Card key={stat.title} className="bg-background/50 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
