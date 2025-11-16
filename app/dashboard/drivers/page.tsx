import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardLayout } from "@/components/dashboard-layout"
import { DriversTable } from "@/components/drivers-table"
import { CreateDriverDialog } from "@/components/create-driver-dialog"
import { DriverStats } from "@/components/driver-stats"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Drivers",
  description: "Manage drivers and their assignments",
}

export const revalidate = 0

export default async function DriversPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: drivers, error } = await supabase
    .from("drivers")
    .select(
      `
      *,
      vehicles:assigned_vehicle_id(*),
      current_job:bookings!drivers_current_job_id_fkey(id, job_id, status)
    `,
    )
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching drivers:", error)
  }

  const stats = {
    total: drivers?.length || 0,
    active: drivers?.filter((d) => d.status === "Active").length || 0,
    onJob: drivers?.filter((d) => d.status === "Currently on Job").length || 0,
    assigned: drivers?.filter((d) => d.status === "Assigned to Job").length || 0,
  }

  const handleSignOut = async () => {
    "use server"
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect("/auth/login")
  }

  return (
    <DashboardLayout onSignOut={handleSignOut}>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Drivers</h1>
          <p className="text-sm text-muted-foreground">Manage drivers and their vehicle assignments</p>
        </div>
        <CreateDriverDialog />
      </div>

      <DriverStats {...stats} />

      <DriversTable drivers={drivers || []} />
    </DashboardLayout>
  )
}
