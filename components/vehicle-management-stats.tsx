"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Truck, AlertTriangle, Wrench, ClipboardCheck, Star, FileCheck } from 'lucide-react'
import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { Button } from "@/components/ui/button"

const fetcher = async () => {
  const supabase = createClient()

  const [vehiclesRes, onboardingRes, incidentsRes, maintenanceRes, feedbackRes, complianceRes] =
    await Promise.all([
      supabase.from("vehicles").select("status", { count: "exact", head: false }),
      supabase
        .from("procurement")
        .select("status", { count: "exact", head: false })
        .eq("status", "Onboarding"),
      supabase
        .from("incidents")
        .select("status,severity", { count: "exact", head: false })
        .eq("status", "Open"),
      supabase
        .from("maintenance_logs")
        .select("status", { count: "exact", head: false })
        .in("status", ["Scheduled", "In Progress"]),
      supabase.from("bookings").select("id", { count: "exact", head: true }),
      supabase.from("vehicles").select("id", { count: "exact", head: true }),
    ])

  const activeVehicles = vehiclesRes.data?.filter((v) => v.status === "Active").length || 0
  const maintenanceVehicles = vehiclesRes.data?.filter((v) => v.status === "Maintenance").length || 0
  const onboardingCount = onboardingRes.count || 0
  const openIncidents = incidentsRes.count || 0
  const highPriorityIncidents =
    incidentsRes.data?.filter((i) => i.severity === "High").length || 0
  const scheduledMaintenance = maintenanceRes.count || 0

  return {
    totalVehicles: vehiclesRes.count || 0,
    activeVehicles,
    maintenanceVehicles,
    onboardingCount,
    openIncidents,
    highPriorityIncidents,
    scheduledMaintenance,
    complianceRate: complianceRes.count ? Math.round((activeVehicles / complianceRes.count) * 100) : 0,
  }
}

export function VehicleManagementStats() {
  const { data } = useSWR("vehicle-management-stats", fetcher, {
    refreshInterval: 5000,
  })

  const stats = [
    {
      title: "Total Vehicles",
      value: data?.totalVehicles?.toString() || "0",
      icon: Truck,
      description: `${data?.activeVehicles || 0} active, ${data?.maintenanceVehicles || 0} maintenance`,
      href: "/dashboard/vehicles",
    },
    {
      title: "Onboarding",
      value: data?.onboardingCount?.toString() || "0",
      icon: ClipboardCheck,
      description: "Vehicles in onboarding",
      href: "/dashboard/vehicle-management/onboarding",
    },
    {
      title: "Open Incidents",
      value: data?.openIncidents?.toString() || "0",
      icon: AlertTriangle,
      description: `${data?.highPriorityIncidents || 0} high priority`,
      href: "/dashboard/incidents",
    },
    {
      title: "Maintenance",
      value: data?.scheduledMaintenance?.toString() || "0",
      icon: Wrench,
      description: "Scheduled & in progress",
      href: "/dashboard/vehicle-management/maintenance",
    },
    {
      title: "Compliance Rate",
      value: `${data?.complianceRate || 0}%`,
      icon: FileCheck,
      description: "Active vehicles compliant",
      href: "/dashboard/vehicle-management/compliance",
    },
    {
      title: "Avg. Rating",
      value: "4.5",
      icon: Star,
      description: "Customer feedback",
      href: "/dashboard/vehicle-management/feedbacks",
    },
  ]

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Link key={stat.title} href={stat.href}>
              <Card className="bg-background/50 backdrop-blur hover:bg-accent/10 transition-colors cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">{stat.description}</p>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="bg-background/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/dashboard/vehicles">
              <Button variant="outline" className="w-full justify-start">
                <Truck className="mr-2 h-4 w-4" />
                Manage Vehicles
              </Button>
            </Link>
            <Link href="/dashboard/vehicle-management/maintenance">
              <Button variant="outline" className="w-full justify-start">
                <Wrench className="mr-2 h-4 w-4" />
                Schedule Maintenance
              </Button>
            </Link>
            <Link href="/dashboard/incidents">
              <Button variant="outline" className="w-full justify-start">
                <AlertTriangle className="mr-2 h-4 w-4" />
                Report Incident
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="bg-background/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-base">Recent Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Activity logs and recent updates will appear here
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
