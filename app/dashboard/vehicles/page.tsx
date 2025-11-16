import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { VehiclesPageClient } from "@/components/vehicles-page-client"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Vehicles",
  description: "Manage your fleet vehicles and maintenance schedules",
}

export default async function VehiclesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: vehicles, error } = await supabase
    .from("vehicles")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching vehicles:", error)
  }

  const stats = {
    total: vehicles?.length || 0,
    active: vehicles?.filter((v) => v.status === "Active").length || 0,
    maintenance: vehicles?.filter((v) => v.status === "In Maintenance").length || 0,
    inactive: vehicles?.filter((v) => v.status === "Inactive").length || 0,
  }

  const handleSignOut = async () => {
    "use server"
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect("/auth/login")
  }

  return <VehiclesPageClient vehicles={vehicles || []} stats={stats} onSignOut={handleSignOut} />
}
