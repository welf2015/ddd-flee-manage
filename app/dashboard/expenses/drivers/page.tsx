import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardLayout } from "@/components/dashboard-layout"
import DriverExpensesClient from "./driver-expenses-client"
import { getAllDriversWithAccounts } from "@/app/actions/driver-spending"

export const metadata = {
  title: "Driver Spending",
  description: "Manage driver spending accounts and allowances",
}

export const revalidate = 0

export default async function DriverExpensesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Pre-fetch drivers with their spending accounts
  const { data: drivers = [] } = await getAllDriversWithAccounts()

  // Get current week number
  const now = new Date()
  const yearStart = new Date(Date.UTC(now.getFullYear(), 0, 1))
  const dayNum = now.getUTCDay() || 7
  const weekStart = new Date(now)
  weekStart.setUTCDate(now.getUTCDate() + 4 - dayNum)
  const currentWeekNumber = Math.ceil(((weekStart.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)

  // Pre-fetch driver spending transactions for current week
  const { data: allTransactions = [], error } = await supabase
    .from("driver_spending_transactions")
    .select(
      `
      *,
      driver:drivers(id, full_name, phone, status),
      booking:bookings(job_id)
    `,
    )
    .eq("week_number", currentWeekNumber)
    .eq("year", now.getFullYear())
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(100)

  if (error) {
    console.error("Error fetching driver transactions:", error)
  }

  // Calculate summary data
  const totalBalance = drivers.reduce((sum, d: any) => sum + Number(d.account?.current_balance || 0), 0)

  // Calculate weekly and daily spending
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const weeklySpending = (allTransactions || [])
    .filter(
      (t: any) =>
        (t.transaction_type === "expense" || t.transaction_type === "manual_debit") && t.direction === "DEBIT",
    )
    .reduce((sum, t: any) => sum + Number(t.amount), 0)

  const dailySpending = (allTransactions || [])
    .filter(
      (t: any) =>
        (t.transaction_type === "expense" || t.transaction_type === "manual_debit") &&
        t.direction === "DEBIT" &&
        new Date(t.created_at) >= today,
    )
    .reduce((sum, t: any) => sum + Number(t.amount), 0)

  const handleSignOut = async () => {
    "use server"
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect("/auth/login")
  }

  return (
    <DashboardLayout onSignOut={handleSignOut}>
      <DriverExpensesClient
        initialDrivers={drivers}
        initialTransactions={allTransactions || []}
        initialSummary={{
          totalBalance,
          weeklySpending,
          dailySpending,
        }}
      />
    </DashboardLayout>
  )
}
