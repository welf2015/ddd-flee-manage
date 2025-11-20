import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardLayout } from "@/components/dashboard-layout"
import { VehiclesClient } from "./vehicles-client"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Vehicles",
  description: "Manage your fleet vehicles",
}

export default async function VehiclesPage() {
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
      <VehiclesClient />
    </DashboardLayout>
  )
}
