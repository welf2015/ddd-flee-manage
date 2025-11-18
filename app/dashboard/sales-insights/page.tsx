import { redirect } from 'next/navigation'
import { createClient } from "@/lib/supabase/server"
import { DashboardLayout } from "@/components/dashboard-layout"
import { SalesInsightsClient } from "./sales-insights-client"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Sales Insights & Financial Tracking",
  description: "Comprehensive financial overview and sales analytics",
}

export default async function SalesInsightsPage() {
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
      <SalesInsightsClient />
    </DashboardLayout>
  )
}
