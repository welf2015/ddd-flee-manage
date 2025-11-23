"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Truck, ClipboardCheck, AlertTriangle, Users, Building2, Package, Fuel } from 'lucide-react'
import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"
import { formatCurrency } from "@/lib/utils"

const fetcher = async () => {
  const supabase = createClient()

  // Get fuel vendor ID first
  const { data: fuelVendor } = await supabase
    .from("expense_vendors")
    .select("id")
    .eq("vendor_type", "Fuel")
    .single()

  const [bookingsRes, vehiclesRes, driversRes, incidentsRes, clientsRes, inventoryRes, fuelRes] = await Promise.all([
    supabase.from("bookings").select("status", { count: "exact", head: false }),
    supabase.from("vehicles").select("status", { count: "exact", head: false }),
    supabase.from("drivers").select("id", { count: "exact", head: true }),
    supabase.from("incidents").select("severity,status", { count: "exact", head: false }),
    supabase.from("clients").select("id", { count: "exact", head: true }),
    supabase.from("inventory_parts").select("current_stock,reorder_level", { count: "exact", head: false }),
    fuelVendor 
      ? supabase.from("prepaid_accounts").select("total_spent, total_deposited").eq("vendor_id", fuelVendor.id)
      : Promise.resolve({ data: [], error: null }),
  ])

  // Calculate active bookings (not completed or closed)
  const activeBookings =
    bookingsRes.data?.filter((b) => !["Completed", "Closed"].includes(b.status)).length || 0

  // Calculate vehicle statistics
  const activeVehicles = vehiclesRes.data?.filter((v) => v.status === "Active").length || 0
  const maintenanceVehicles = vehiclesRes.data?.filter((v) => v.status === "Maintenance").length || 0

  // Calculate pending approvals (Open bookings waiting for admin action)
  const pendingApprovals = bookingsRes.data?.filter((b) => b.status === "Open").length || 0

  // Calculate open incidents with high priority
  const openIncidents = incidentsRes.data?.filter((i) => i.status === "Open").length || 0
  const highPriorityIncidents = incidentsRes.data?.filter((i) => i.severity === "High" && i.status === "Open").length || 0

  // Calculate low stock items
  const lowStockItems =
    inventoryRes.data?.filter((item) => item.current_stock <= item.reorder_level).length || 0

  // Calculate fuel spending
  const fuelAccounts = fuelRes.data || []
  const totalFuelSpent = fuelAccounts.reduce((sum: number, acc: any) => sum + Number(acc.total_spent || 0), 0)
  const totalFuelDeposited = fuelAccounts.reduce((sum: number, acc: any) => sum + Number(acc.total_deposited || 0), 0)
  const fuelProgress = totalFuelDeposited > 0 
    ? Math.min((totalFuelSpent / totalFuelDeposited) * 100, 100) 
    : 0

  return {
    activeBookings,
    totalBookings: bookingsRes.count || 0,
    activeVehicles,
    maintenanceVehicles,
    totalVehicles: vehiclesRes.count || 0,
    pendingApprovals,
    openIncidents,
    highPriorityIncidents,
    totalDrivers: driversRes.count || 0,
    totalClients: clientsRes.count || 0,
    lowStockItems,
    totalInventory: inventoryRes.count || 0,
    totalFuelSpent,
    totalFuelDeposited,
    fuelProgress,
  }
}

export function FleetStats() {
  const { data, error } = useSWR("dashboard-stats", fetcher, {
    refreshInterval: 5000, // Refresh every 5 seconds
  })

  const stats = [
    {
      title: "Total Bookings",
      value: data?.totalBookings?.toString() || "0",
      icon: ClipboardCheck,
      description: `${data?.activeBookings || 0} active`,
      trend: "neutral",
    },
    {
      title: "Total Vehicles",
      value: data?.totalVehicles?.toString() || "0",
      icon: Truck,
      description: `${data?.activeVehicles || 0} active, ${data?.maintenanceVehicles || 0} maintenance`,
      trend: "neutral",
    },
    {
      title: "Pending Approvals",
      value: data?.pendingApprovals?.toString() || "0",
      icon: ClipboardCheck,
      description: "Booking approvals needed",
      trend: "neutral",
    },
    {
      title: "Open Incidents",
      value: data?.openIncidents?.toString() || "0",
      icon: AlertTriangle,
      description: `${data?.highPriorityIncidents || 0} high priority`,
      trend: "down",
    },
    {
      title: "Total Drivers",
      value: data?.totalDrivers?.toString() || "0",
      icon: Users,
      description: "Active drivers",
      trend: "neutral",
    },
    {
      title: "Total Clients",
      value: data?.totalClients?.toString() || "0",
      icon: Building2,
      description: "Registered clients",
      trend: "neutral",
    },
    {
      title: "Inventory",
      value: data?.totalInventory?.toString() || "0",
      icon: Package,
      description: `${data?.lowStockItems || 0} low stock`,
      trend: "neutral",
    },
    {
      title: "Fuel Spending Progress",
      value: formatCurrency(data?.totalFuelSpent || 0),
      icon: Fuel,
      description: `${data?.fuelProgress?.toFixed(1) || 0}% of ${formatCurrency(data?.totalFuelDeposited || 0)}`,
      trend: "neutral",
    },
  ]

  if (error) {
    return (
      <Card className="bg-background/50 backdrop-blur">
        <CardContent className="p-6">
          <p className="text-sm text-destructive">Failed to load dashboard statistics</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4">
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
