"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { getPrepaidAccounts, getExpenseTransactions, getTotalFuelSpent } from "@/app/actions/expenses"
import useSWR from "swr"
import { formatCurrency, formatRelativeTime } from "@/lib/utils"
import { FuelMeter } from "./fuel-meter"

type FuelTabProps = {
  onAddTopup: (accountId?: string) => void
  initialAccounts?: any[]
}

export function FuelTab({ onAddTopup, initialAccounts = [] }: FuelTabProps) {
  // Get fuel accounts - filter initial accounts if provided
  const initialFuelAccounts = initialAccounts.filter((a: any) => a.vendor?.vendor_type === "Fuel")
  const { data: fuelAccounts = initialFuelAccounts, mutate: mutateFuelAccounts } = useSWR(
    "fuel-accounts",
    async () => {
      const { data } = await getPrepaidAccounts("Fuel")
      // Filter to ensure only Fuel type accounts
      return (data || []).filter((a: any) => a.vendor?.vendor_type === "Fuel")
    },
    {
      fallbackData: initialFuelAccounts,
      revalidateOnMount: true,
    },
  )

  // Filter to get only Fuel type accounts (not Allowance)
  const fuelOnlyAccounts = fuelAccounts.filter((a: any) => a.vendor?.vendor_type === "Fuel")
  const mainAccount = fuelOnlyAccounts[0] // Total Energies main account

  // Get total fuel spent from account (more reliable than calculating from transactions)
  const totalFuelSpent = mainAccount ? Number(mainAccount.total_spent || 0) : 0

  // Get fuel transactions
  const { data: transactions = [], mutate: mutateTransactions } = useSWR("fuel-transactions", async () => {
    const { data } = await getExpenseTransactions({ expenseType: "Fuel" })
    return data || []
  })

  // Get topups for fuel accounts
  const { data: topups = [] } = useSWR(
    mainAccount ? `fuel-topups-${mainAccount.id}` : null,
    async () => {
      if (!mainAccount) return []
      const { getTopups } = await import("@/app/actions/expenses")
      const result = await getTopups(mainAccount.id)
      return result.data || []
    },
  )

  // Combine transactions and top-ups into one unified list
  const allTransactions = [
    ...transactions.map((t: any) => ({
      ...t,
      type: "expense" as const,
      date: t.transaction_date,
      amount: -Number(t.amount), // Negative for expenses
    })),
    ...topups.map((t: any) => ({
      ...t,
      type: "topup" as const,
      date: t.topup_date,
      amount: Number(t.amount), // Positive for top-ups
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return (
    <div className="space-y-4">
      {/* Unified Transactions List */}
      <Card>
        <CardHeader>
          <CardTitle>All Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {allTransactions.length > 0 ? (
            <div className="space-y-2">
              {allTransactions.slice(0, 20).map((item: any, index: number) => (
                <div
                  key={item.id || `item-${index}`}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                >
                  <div className="flex-1">
                    {item.type === "expense" ? (
                      <>
                        <p className="font-medium">
                          {item.booking?.job_id || "Manual Entry"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {item.driver?.full_name || "N/A"} • {item.vehicle?.vehicle_number || "N/A"}
                          {item.quantity && ` • ${item.quantity} ${item.unit}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatRelativeTime(item.date)}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="font-medium">Top-up: {item.account?.account_name || "Account"}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.receipt_number && `Receipt: ${item.receipt_number} • `}
                          {item.deposited_by_profile?.full_name || "System"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatRelativeTime(item.date)}
                        </p>
                      </>
                    )}
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-bold ${
                        item.type === "topup" ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {item.type === "topup" ? "+" : "-"}
                      {formatCurrency(Math.abs(item.amount), "NGN")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">No transactions yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

