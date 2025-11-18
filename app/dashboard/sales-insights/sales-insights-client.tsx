"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FinancialOverview } from "@/components/sales/financial-overview"
import { RevenueChart } from "@/components/sales/revenue-chart"
import { TopClientsTable } from "@/components/sales/top-clients-table"
import { BookingAnalytics } from "@/components/sales/booking-analytics"
import { CostBreakdown } from "@/components/sales/cost-breakdown"
import { NegotiationMetrics } from "@/components/sales/negotiation-metrics"

export function SalesInsightsClient() {
  const [timeRange, setTimeRange] = useState("monthly")

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Sales Insights & Financial Tracking</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Comprehensive financial overview and performance analytics
          </p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="yearly">Yearly</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <FinancialOverview timeRange={timeRange} />

      <div className="grid gap-6 lg:grid-cols-2">
        <RevenueChart timeRange={timeRange} />
        <CostBreakdown timeRange={timeRange} />
      </div>

      <Tabs defaultValue="bookings" className="space-y-4">
        <TabsList>
          <TabsTrigger value="bookings">Booking Analytics</TabsTrigger>
          <TabsTrigger value="clients">Top Clients</TabsTrigger>
          <TabsTrigger value="negotiations">Negotiations</TabsTrigger>
        </TabsList>
        <TabsContent value="bookings" className="space-y-4">
          <BookingAnalytics timeRange={timeRange} />
        </TabsContent>
        <TabsContent value="clients" className="space-y-4">
          <TopClientsTable timeRange={timeRange} />
        </TabsContent>
        <TabsContent value="negotiations" className="space-y-4">
          <NegotiationMetrics timeRange={timeRange} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
