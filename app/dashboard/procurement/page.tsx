import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProcurementClient } from "./procurement-client"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Procurement",
  description: "Manage vehicle procurement orders and vendors",
}

export default async function ProcurementPage() {
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
      <div className="mb-6 flex flex-col gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Procurement Management</h1>
          <p className="text-sm text-muted-foreground">
            Manage vehicle procurement orders, vendors, and clearing agents
          </p>
        </div>
      </div>

      <ProcurementClient />
    </DashboardLayout>
  )
}
