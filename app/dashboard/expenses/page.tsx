import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ExpensesClient } from "./expenses-client"
import { getPrepaidAccounts } from "@/app/actions/expenses"

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

  // Pre-fetch accounts on server for faster initial load
  const { data: initialAccounts = [] } = await getPrepaidAccounts()

  const handleSignOut = async () => {
    "use server"
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect("/auth/login")
  }

  return (
    <DashboardLayout onSignOut={handleSignOut}>
      <ExpensesClient initialAccounts={initialAccounts} />
    </DashboardLayout>
  )
}

