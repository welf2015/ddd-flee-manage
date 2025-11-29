import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardLayout } from "@/components/dashboard-layout"
import { WorkDriveClient } from "./workdrive-client"

export const metadata = {
  title: "WorkDrive | Document Management",
  description: "Manage and organize your company documents",
}

export default async function WorkDrivePage() {
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
      <WorkDriveClient />
    </DashboardLayout>
  )
}
