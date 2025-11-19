import { redirect } from 'next/navigation'
import { createClient } from "@/lib/supabase/server"
import { DashboardLayout } from "@/components/dashboard-layout"
import { FleetStats } from "@/components/fleet-stats"
import { FleetChart } from "@/components/fleet-chart"
import { RecentActivity } from "@/components/recent-activity"
import { ActiveJobsSection } from "@/components/active-jobs-section"
import { Button } from "@/components/ui/button"
import { ClipboardList } from 'lucide-react'
import Link from 'next/link'
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

  const { count: pendingInspections } = await supabase
    .from("vehicle_inspections")
    .select("*", { count: "exact", head: true })
    .eq("status", "Pending")

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
        {pendingInspections && pendingInspections > 0 && (
          <Link href="/dashboard/vehicle-management/inspections">
            <Button className="gap-2 bg-accent hover:bg-accent/90 text-accent-foreground">
              <ClipboardList className="h-4 w-4" />
              Review Inspections ({pendingInspections})
            </Button>
          </Link>
        )}
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
