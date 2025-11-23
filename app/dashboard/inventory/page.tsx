import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardLayout } from "@/components/dashboard-layout"
import { InventoryClient } from "./inventory-client"
import type { Metadata } from "next"
import { LogCollectionButton } from "./log-collection-button"

export const metadata: Metadata = {
  title: "Inventory",
  description: "Manage parts and inventory",
}

export default async function InventoryPage() {
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
          <h1 className="text-2xl font-bold">Inventory Management</h1>
          <p className="text-sm text-muted-foreground">Track vehicle parts and supplies in stock</p>
        </div>
        <LogCollectionButton />
      </div>

      <InventoryClient />
    </DashboardLayout>
  )
}
