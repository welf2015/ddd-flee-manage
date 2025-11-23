import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ExpensesClient } from "./expenses-client"

export const metadata = {
  title: "Expenses",
  description: "Manage prepaid expense accounts",
}

export default async function ExpensesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  return (
    <DashboardLayout>
      <ExpensesClient />
    </DashboardLayout>
  )
}

