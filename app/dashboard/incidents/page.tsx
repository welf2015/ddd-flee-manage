import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardLayout } from "@/components/dashboard-layout"
import { IncidentsTable } from "@/components/incidents-table"
import { CreateIncidentDialog } from "@/components/create-incident-dialog"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Incidents",
  description: "Track and manage fleet incidents",
}

export default async function IncidentsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
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
          <h1 className="text-2xl font-bold">Incidents</h1>
          <p className="text-sm text-muted-foreground">Track and manage fleet incidents</p>
        </div>
        <CreateIncidentDialog />
      </div>

      <IncidentsTable />
    </DashboardLayout>
  )
}
