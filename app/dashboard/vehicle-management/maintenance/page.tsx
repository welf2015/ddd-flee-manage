import { Suspense } from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardLayout } from "@/components/dashboard-layout"
import MaintenanceClient from "./maintenance-client"

export default async function MaintenancePage() {
  const supabase = await createClient()

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  // Fetch maintenance schedules with vehicle info
  const { data: schedules } = await supabase
    .from("maintenance_schedules")
    .select(`
      *,
      vehicle:vehicles(vehicle_number, make, model, vehicle_type, status),
      scheduled_by_user:profiles!maintenance_schedules_scheduled_by_fkey(full_name, email),
      approved_by_user:profiles!maintenance_schedules_approved_by_fkey(full_name, email)
    `)
    .order("scheduled_date", { ascending: true })

  // Fetch maintenance logs
  const { data: logs } = await supabase
    .from("maintenance_logs")
    .select(`
      *,
      vehicle:vehicles(vehicle_number, make, model, vehicle_type),
      logged_by_user:profiles!maintenance_logs_logged_by_fkey(full_name)
    `)
    .order("service_date", { ascending: false })

  // Fetch vehicles for creating new schedules
  const { data: vehicles } = await supabase.from("vehicles").select("*").order("vehicle_number")

  const handleSignOut = async () => {
    "use server"
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect("/auth/login")
  }

  return (
    <DashboardLayout onSignOut={handleSignOut}>
      <Suspense fallback={<div>Loading maintenance schedules...</div>}>
        <MaintenanceClient initialSchedules={schedules || []} initialLogs={logs || []} vehicles={vehicles || []} />
      </Suspense>
    </DashboardLayout>
  )
}
