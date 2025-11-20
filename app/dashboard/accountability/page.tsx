import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardLayout } from "@/components/dashboard-layout"
import { AccountabilityClient } from "./accountability-client"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Accountability",
  description: "System activity log and audit trail",
}

export default async function AccountabilityPage() {
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
      <AccountabilityClient />
    </DashboardLayout>
  )
}
