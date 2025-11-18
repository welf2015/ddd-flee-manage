import { redirect } from 'next/navigation'
import { createClient } from "@/lib/supabase/server"
import { DashboardLayout } from "@/components/dashboard-layout"
import { OnboardingClient } from "./onboarding-client"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Vehicle Onboarding",
  description: "Manage vehicle onboarding process",
}

export default async function OnboardingPage() {
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
      <OnboardingClient />
    </DashboardLayout>
  )
}
