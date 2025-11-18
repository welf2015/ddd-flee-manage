import { redirect } from 'next/navigation'
import { createClient } from "@/lib/supabase/server"
import { DashboardLayout } from "@/components/dashboard-layout"
import { VehicleManagementStats } from "@/components/vehicle-management-stats"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Vehicle Management",
  description: "Overview of vehicle management operations",
}

export default async function VehicleManagementPage() {
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Vehicle Management</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Comprehensive overview of vehicle operations, onboarding, and compliance
        </p>
      </div>

      <VehicleManagementStats />
    </DashboardLayout>
  )
}
