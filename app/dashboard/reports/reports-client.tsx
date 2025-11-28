"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TripsAnalyticsReport } from "@/components/reports/trips-analytics-report"
import { MaintenanceCostReport } from "@/components/reports/maintenance-cost-report"
import { FuelUsageReport } from "@/components/reports/fuel-usage-report"
import { ClientPerformanceReport } from "@/components/reports/client-performance-report"
import { DriverPerformanceReport } from "@/components/reports/driver-performance-report"
import { FinancialSummaryReport } from "@/components/reports/financial-summary-report"
import { DriverSpendingReport } from "@/components/reports/driver-spending-report"

type TimePeriod = "weekly" | "monthly" | "yearly" | "all-time"

export function ReportsClient() {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("weekly")

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Reports & Analytics</h2>
          <p className="text-sm text-muted-foreground">View detailed fleet reports and performance metrics</p>
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

      <Tabs defaultValue="trips" className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7">
          <TabsTrigger value="trips">Trips</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="fuel">Fuel</TabsTrigger>
          <TabsTrigger value="clients">Clients</TabsTrigger>
          <TabsTrigger value="drivers">Drivers</TabsTrigger>
          <TabsTrigger value="driver-spending">Driver Spending</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
        </TabsList>

        <TabsContent value="trips" className="space-y-4 mt-4">
          <TripsAnalyticsReport timePeriod={timePeriod} />
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-4 mt-4">
          <MaintenanceCostReport timePeriod={timePeriod} />
        </TabsContent>

        <TabsContent value="fuel" className="space-y-4 mt-4">
          <FuelUsageReport />
        </TabsContent>

        <TabsContent value="clients" className="space-y-4 mt-4">
          <ClientPerformanceReport timePeriod={timePeriod} />
        </TabsContent>

        <TabsContent value="drivers" className="space-y-4 mt-4">
          <DriverPerformanceReport timePeriod={timePeriod} />
        </TabsContent>

        <TabsContent value="driver-spending" className="space-y-4 mt-4">
          <DriverSpendingReport timePeriod={timePeriod} />
        </TabsContent>

        <TabsContent value="financial" className="space-y-4 mt-4">
          <FinancialSummaryReport timePeriod={timePeriod} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
