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
  initialTransactions?: any[]
  initialTopups?: any[]
}

export function FuelTab({ onAddTopup, initialAccounts = [], initialTransactions = [], initialTopups = [] }: FuelTabProps) {
  // Get fuel accounts - filter initial accounts if provided
  const initialFuelAccounts = initialAccounts.filter((a: any) => a.vendor?.vendor_type === "Fuel")
  const { data: fuelAccounts = initialFuelAccounts } = useSWR(
    "fuel-accounts",
    async () => {
      const { data } = await getPrepaidAccounts("Fuel")
      // Filter to ensure only Fuel type accounts
      return (data || []).filter((a: any) => a.vendor?.vendor_type === "Fuel")
    },
    {
      fallbackData: initialFuelAccounts,
      revalidateOnMount: false, // Don't revalidate on mount if we have initial data
    },
  )

  // Filter to get only Fuel type accounts (not Allowance)
  const fuelOnlyAccounts = fuelAccounts.filter((a: any) => a.vendor?.vendor_type === "Fuel")
  const mainAccount = fuelOnlyAccounts[0] // Total Energies main account

  // Get total fuel spent from account (more reliable than calculating from transactions)
  const totalFuelSpent = mainAccount ? Number(mainAccount.total_spent || 0) : 0

  // Get fuel transactions - use initial data from server
  const { data: transactions = initialTransactions } = useSWR(
    mainAccount ? "fuel-transactions" : null,
    async () => {
      const { data } = await getExpenseTransactions({ expenseType: "Fuel" })
      return data || []
    },
    {
      fallbackData: initialTransactions,
      revalidateOnMount: false,
    },
  )

  // Get topups for fuel accounts - use initial data from server
  const { data: topups = initialTopups } = useSWR(
    mainAccount ? `fuel-topups-${mainAccount.id}` : null,
    async () => {
      if (!mainAccount) return []
      const { getTopups } = await import("@/app/actions/expenses")
      const result = await getTopups(mainAccount.id)
      return result.data || []
    },
    {
      fallbackData: initialTopups,
      revalidateOnMount: false,
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
      {/* Unified Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {allTransactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Type</th>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Details</th>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">By</th>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Date</th>
                    <th className="text-right p-3 text-sm font-medium text-muted-foreground">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {allTransactions.slice(0, 20).map((item: any, index: number) => (
                    <tr key={item.id || `item-${index}`} className="border-b hover:bg-muted/50">
                      <td className="p-3">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            item.type === "topup"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {item.type === "topup" ? "Top-up" : "Expense"}
                        </span>
                      </td>
                      <td className="p-3">
                        {item.type === "expense" ? (
                          <div>
                            <p className="font-medium">
                              {item.booking?.job_id || "Manual Entry"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {item.vehicle?.vehicle_number || "N/A"}
                              {item.quantity && ` • ${item.quantity} ${item.unit}`}
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p className="font-medium">{item.account?.account_name || "Account"}</p>
                            {item.receipt_number && (
                              <p className="text-sm text-muted-foreground">Receipt: {item.receipt_number}</p>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        <p className="text-sm">
                          {item.type === "expense"
                            ? item.driver?.full_name || "N/A"
                            : item.deposited_by_profile?.full_name || "System"}
                        </p>
                      </td>
                      <td className="p-3">
                        <p className="text-sm text-muted-foreground">{formatRelativeTime(item.date)}</p>
                      </td>
                      <td className="p-3 text-right">
                        <p
                          className={`font-bold ${
                            item.type === "topup" ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {item.type === "topup" ? "+" : "-"}
                          {formatCurrency(Math.abs(item.amount), "NGN")}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">No transactions yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
