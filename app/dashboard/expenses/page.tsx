import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ExpensesClient } from "./expenses-client"
import { getPrepaidAccounts } from "@/app/actions/expenses"

export const metadata = {
  title: "Expenses",
  description: "Manage prepaid expense accounts",
}

export const revalidate = 0

export default async function ExpensesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Pre-fetch all data on server for faster initial load (like bookings page)
  const { data: initialAccounts = [] } = await getPrepaidAccounts()

  // Pre-fetch transactions and top-ups for all accounts
  const { getExpenseTransactions, getTopups } = await import("@/app/actions/expenses")

  const [fuelAccounts, ticketingAccounts, allowanceAccounts] = [
    initialAccounts.filter((a: any) => a.vendor?.vendor_type === "Fuel"),
    initialAccounts.filter((a: any) => a.vendor?.vendor_type === "Ticketing"),
    initialAccounts.filter((a: any) => a.vendor?.vendor_type === "Allowance"),
  ]

  const fuelAccount = fuelAccounts[0]
  const ticketingAccount = ticketingAccounts[0]
  const allowanceAccount = allowanceAccounts[0]

  const [fuelTransactions, ticketingTransactions, allowanceTransactions, fuelTopups, ticketingTopups, allowanceTopups] =
    await Promise.all([
      getExpenseTransactions({ expenseType: "Fuel" }).then((r) => r.data || []),
      getExpenseTransactions({ expenseType: "Ticketing" }).then((r) => r.data || []),
      getExpenseTransactions({ expenseType: "Allowance" }).then((r) => r.data || []),
      fuelAccount ? getTopups(fuelAccount.id).then((r) => r.data || []) : Promise.resolve([]),
      ticketingAccount ? getTopups(ticketingAccount.id).then((r) => r.data || []) : Promise.resolve([]),
      allowanceAccount ? getTopups(allowanceAccount.id).then((r) => r.data || []) : Promise.resolve([]),
    ])

  const handleSignOut = async () => {
    "use server"
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect("/auth/login")
  }

  return (
    <DashboardLayout onSignOut={handleSignOut}>
      <ExpensesClient
        initialAccounts={initialAccounts}
        initialFuelTransactions={fuelTransactions}
        initialTicketingTransactions={ticketingTransactions}
        initialAllowanceTransactions={allowanceTransactions}
        initialFuelTopups={fuelTopups}
        initialTicketingTopups={ticketingTopups}
        initialAllowanceTopups={allowanceTopups}
      />
    </DashboardLayout>
  )
}
