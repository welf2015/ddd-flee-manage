"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TripsAnalyticsReport } from "@/components/reports/trips-analytics-report"
import { MaintenanceCostReport } from "@/components/reports/maintenance-cost-report"
import { FuelUsageReport } from "@/components/reports/fuel-usage-report"
import { ClientPerformanceReport } from "@/components/reports/client-performance-report"
import { DriverPerformanceReport } from "@/components/reports/driver-performance-report"
import { FinancialSummaryReport } from "@/components/reports/financial-summary-report"

export function ReportsClient() {
  return (
    <Tabs defaultValue="trips" className="w-full">
      <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
        <TabsTrigger value="trips">Trips</TabsTrigger>
        <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
        <TabsTrigger value="fuel">Fuel</TabsTrigger>
        <TabsTrigger value="clients">Clients</TabsTrigger>
        <TabsTrigger value="drivers">Drivers</TabsTrigger>
        <TabsTrigger value="financial">Financial</TabsTrigger>
      </TabsList>

      <TabsContent value="trips" className="space-y-4 mt-4">
        <TripsAnalyticsReport />
      </TabsContent>

      <TabsContent value="maintenance" className="space-y-4 mt-4">
        <MaintenanceCostReport />
      </TabsContent>

      <TabsContent value="fuel" className="space-y-4 mt-4">
        <FuelUsageReport />
      </TabsContent>

      <TabsContent value="clients" className="space-y-4 mt-4">
        <ClientPerformanceReport />
      </TabsContent>

      <TabsContent value="drivers" className="space-y-4 mt-4">
        <DriverPerformanceReport />
      </TabsContent>

      <TabsContent value="financial" className="space-y-4 mt-4">
        <FinancialSummaryReport />
      </TabsContent>
    </Tabs>
  )
}
