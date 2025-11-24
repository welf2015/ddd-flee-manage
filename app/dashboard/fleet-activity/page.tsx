import { redirect } from 'next/navigation'
import { createClient } from "@/lib/supabase/server"
import { DashboardLayout } from "@/components/dashboard-layout"
import { FleetActivityClient } from "./fleet-activity-client"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Fleet Activity",
  description: "View driver and vehicle activities",
}

export const revalidate = 0

export default async function FleetActivityPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Calculate week start (Monday)
  const now = new Date()
  const dayOfWeek = now.getDay()
  const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1) // Adjust to Monday
  const weekStart = new Date(now.setDate(diff))
  weekStart.setHours(0, 0, 0, 0)
  const weekStartISO = weekStart.toISOString()

  // Fetch driver activities (bookings for this week)
  const { data: driverBookings } = await supabase
    .from("bookings")
    .select(
      `
      *,
      driver:drivers!bookings_assigned_driver_id_fkey(
        id, full_name, phone, license_number, status, photo_url
      ),
      vehicle:vehicles!bookings_assigned_vehicle_id_fkey(
        id, vehicle_number, vehicle_type, make, model
      ),
      client:clients(name)
    `
    )
    .gte("created_at", weekStartISO)
    .order("created_at", { ascending: false })

  // Fetch all drivers for the driver activities tab
  const { data: drivers } = await supabase
    .from("drivers")
    .select("*, vehicle:vehicles(id, vehicle_number, vehicle_type, make, model)")
    .order("full_name", { ascending: true })

  // Fetch vehicle activities (fuel logs, maintenance, incidents for this week)
  const { data: vehicleFuelLogs } = await supabase
    .from("fuel_logs")
    .select("*, vehicle:vehicles(vehicle_number, vehicle_type, make, model), driver:drivers(full_name)")
    .gte("logged_at", weekStartISO)
    .order("logged_at", { ascending: false })

  const { data: vehicleMaintenance } = await supabase
    .from("maintenance_logs")
    .select("*, vehicle:vehicles(vehicle_number, vehicle_type, make, model)")
    .gte("service_date", weekStart.toISOString().split("T")[0])
    .order("service_date", { ascending: false })

  const { data: vehicleIncidents } = await supabase
    .from("incidents")
    .select("*, vehicle:vehicles(vehicle_number, vehicle_type, make, model)")
    .gte("incident_date", weekStart.toISOString().split("T")[0])
    .order("incident_date", { ascending: false })

  // Fetch all vehicles for the vehicle activities tab
  const { data: vehicles } = await supabase
    .from("vehicles")
    .select("*, driver:drivers(id, full_name, phone)")
    .order("vehicle_number", { ascending: true })

  const handleSignOut = async () => {
    "use server"
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect("/auth/login")
  }

  return (
    <DashboardLayout onSignOut={handleSignOut}>
      <div className="mb-6 flex flex-col gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Fleet Activity</h1>
          <p className="text-sm text-muted-foreground">View driver and vehicle activities for the week</p>
        </div>
      </div>

      <FleetActivityClient
        initialDriverBookings={driverBookings || []}
        initialDrivers={drivers || []}
        initialVehicleFuelLogs={vehicleFuelLogs || []}
        initialVehicleMaintenance={vehicleMaintenance || []}
        initialVehicleIncidents={vehicleIncidents || []}
        initialVehicles={vehicles || []}
      />
    </DashboardLayout>
  )
}
