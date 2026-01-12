import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardLayout } from "@/components/dashboard-layout"
import { InsightsClient } from "./insights-client"

export const metadata = {
  title: "Expense Insights",
  description: "Executive analytics for fuel, ticketing, and allowance expenses",
}

export const revalidate = 0

export default async function InsightsPage() {
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
      <InsightsClient />
    </DashboardLayout>
  )
}
