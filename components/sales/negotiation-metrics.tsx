"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
    .select("job_id, client_name, proposed_client_budget, current_negotiation_amount, status, created_at")
    .gte("created_at", startDate.toISOString())
    .in("status", ["Negotiation", "Approved", "Completed", "Closed"])

  const negotiations = bookings?.filter((b) => b.proposed_client_budget)

  const totalNegotiations = negotiations?.length || 0
  const successfulNegotiations = negotiations?.filter((b) => 
    ["Approved", "Completed", "Closed"].includes(b.status)
  ).length || 0
  
  const avgOriginalBudget = negotiations?.reduce((sum, b) => 
    sum + (Number(b.proposed_client_budget) || 0), 0
  ) / (totalNegotiations || 1)

  const avgFinalAmount = negotiations?.reduce((sum, b) => 
    sum + (Number(b.current_negotiation_amount) || 0), 0
  ) / (totalNegotiations || 1)

  const avgNegotiationIncrease = avgFinalAmount - avgOriginalBudget

  return {
    totalNegotiations,
    successfulNegotiations,
    successRate: totalNegotiations > 0 ? (successfulNegotiations / totalNegotiations) * 100 : 0,
    avgOriginalBudget,
    avgFinalAmount,
    avgNegotiationIncrease,
    recentNegotiations: negotiations?.slice(0, 5) || [],
  }
}

interface NegotiationMetricsProps {
  timeRange: string
}

export function NegotiationMetrics({ timeRange }: NegotiationMetricsProps) {
  const { data } = useSWR(`negotiation-metrics-${timeRange}`, () => fetcher(timeRange), {
    refreshInterval: 10000,
  })

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-background/50 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Negotiations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.totalNegotiations || 0}</div>
          </CardContent>
        </Card>

        <Card className="bg-background/50 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data?.successRate ? data.successRate.toFixed(1) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              {data?.successfulNegotiations || 0} successful
            </p>
          </CardContent>
        </Card>

        <Card className="bg-background/50 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg. Original Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₦{(data?.avgOriginalBudget || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-background/50 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg. Negotiation Gain</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">
              +₦{(data?.avgNegotiationIncrease || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-background/50 backdrop-blur">
        <CardHeader>
          <CardTitle>Recent Negotiations</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job ID</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Original Budget</TableHead>
                <TableHead>Final Amount</TableHead>
                <TableHead>Increase</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.recentNegotiations?.map((neg: any) => {
                const increase = (Number(neg.current_negotiation_amount) || 0) - (Number(neg.proposed_client_budget) || 0)
                return (
                  <TableRow key={neg.job_id}>
                    <TableCell className="font-medium">{neg.job_id}</TableCell>
                    <TableCell>{neg.client_name || "Unknown"}</TableCell>
                    <TableCell>₦{(Number(neg.proposed_client_budget) || 0).toLocaleString()}</TableCell>
                    <TableCell>₦{(Number(neg.current_negotiation_amount) || 0).toLocaleString()}</TableCell>
                    <TableCell className={increase >= 0 ? "text-accent" : "text-destructive"}>
                      {increase >= 0 ? "+" : ""}₦{increase.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          neg.status === "Completed" || neg.status === "Approved"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {neg.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                )
              })}
              {(!data?.recentNegotiations || data.recentNegotiations.length === 0) && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No negotiations data available
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
