import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardLayout } from "@/components/dashboard-layout"
import { FleetStats } from "@/components/fleet-stats"
import { FleetChart } from "@/components/fleet-chart"
import { RecentActivity } from "@/components/recent-activity"
import { ActiveJobsSection } from "@/components/active-jobs-section"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Dashboard",
  description: "View fleet overview, statistics, and recent activities",
}

export default async function DashboardPage() {
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
          <h1 className="text-2xl font-bold">Fleet Overview</h1>
          <div className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </div>
        </div>
      </div>

      <FleetStats />

      <div className="mt-6">
        <ActiveJobsSection />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <FleetChart />
        <RecentActivity />
      </div>
    </DashboardLayout>
  )
}
