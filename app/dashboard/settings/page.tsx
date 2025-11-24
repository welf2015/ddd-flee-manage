import type React from "react"
import { CardContent } from "@/components/ui/card"
import { CardDescription } from "@/components/ui/card"
import { CardTitle } from "@/components/ui/card"
import { CardHeader } from "@/components/ui/card"
import { Card } from "@/components/ui/card"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProfileSettings } from "@/components/profile-settings"
import { DriversTable } from "@/components/drivers-table"
import { CreateDriverDialog } from "@/components/create-driver-dialog"
import { AccessControlSettings } from "@/components/settings/access-control-settings"
import { StaffDirectorySettings } from "@/components/settings/staff-directory-settings"
import { SETTINGS_TAB_ACCESS, type SettingsTabKey, type SystemRole } from "@/lib/roles"

export default async function SettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
  const viewerRole = (profile?.role || "Staff") as SystemRole

  const { data: drivers } = await supabase
    .from("drivers")
    .select(
      `
      *,
      vehicles:assigned_vehicle_id(*),
      current_job:bookings!drivers_current_job_id_fkey(id, job_id, status)
    `,
    )
    .order("created_at", { ascending: false })

  const handleSignOut = async () => {
    "use server"
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect("/auth/login")
  }

  const tabs: Array<{ key: SettingsTabKey; label: string; content: React.ReactNode }> = [
    {
      key: "profile",
      label: "Profile",
      content: <ProfileSettings />,
    },
    {
      key: "drivers",
      label: "Drivers",
      content: (
        <>
          <Card className="bg-background/50 backdrop-blur mb-4">
            <CardHeader>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle>Driver Management</CardTitle>
                  <CardDescription>Add and manage drivers for your fleet</CardDescription>
                </div>
                <CreateDriverDialog />
              </div>
            </CardHeader>
          </Card>
          <DriversTable drivers={drivers || []} />
        </>
      ),
    },
    {
      key: "staff",
      label: "Staff Directory",
      content: <StaffDirectorySettings />,
    },
    {
      key: "access-control",
      label: "Access Control",
      content: <AccessControlSettings currentRole={viewerRole} />,
    },
    {
      key: "notifications",
      label: "Notifications",
      content: (
        <Card className="bg-background/50 backdrop-blur">
          <CardHeader>
            <CardTitle>Notification Preferences</CardTitle>
            <CardDescription>Manage how you receive notifications</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Notification settings will be available soon.</p>
          </CardContent>
        </Card>
      ),
    },
  ]

  const allowedTabs = tabs.filter((tab) => SETTINGS_TAB_ACCESS[tab.key].includes(viewerRole))
  const defaultTab = allowedTabs[0]?.key ?? "profile"

  return (
    <DashboardLayout onSignOut={handleSignOut}>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Settings</h1>
          <div className="text-sm text-muted-foreground">Manage your account settings and drivers</div>
        </div>
      </div>

      <Tabs defaultValue={defaultTab} className="space-y-6">
        <TabsList className="w-full sm:w-auto">
          {allowedTabs.map((tab) => (
            <TabsTrigger key={tab.key} value={tab.key} className="flex-1 sm:flex-none">
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {allowedTabs.map((tab) => (
          <TabsContent key={tab.key} value={tab.key}>
            {tab.content}
          </TabsContent>
        ))}
      </Tabs>
    </DashboardLayout>
  )
}
