"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { getPrepaidAccounts, getExpenseTransactions, getTopups } from "@/app/actions/expenses"
import useSWR from "swr"
import { formatCurrency, formatRelativeTime } from "@/lib/utils"

type AllowanceTabProps = {
  onAddTopup: (accountId?: string) => void
  initialAccounts?: any[]
}

export function AllowanceTab({ onAddTopup, initialAccounts = [] }: AllowanceTabProps) {
  const initialAllowanceAccounts = initialAccounts.filter((a: any) => a.vendor?.vendor_type === "Allowance")
  const { data: accounts = initialAllowanceAccounts } = useSWR(
    "allowance-accounts",
    async () => {
      const { data } = await getPrepaidAccounts("Allowance")
      // Filter to ensure only Allowance accounts
      return (data || []).filter((a: any) => a.vendor?.vendor_type === "Allowance")
    },
    {
      fallbackData: initialAllowanceAccounts,
      revalidateOnMount: false,
    },
  )

  const mainAccount = accounts[0]

  const { data: transactions = [] } = useSWR(
    mainAccount ? "allowance-transactions" : null,
    async () => {
      const { data } = await getExpenseTransactions({ expenseType: "Allowance" })
      return data || []
    },
    {
      revalidateOnMount: false,
    },
  )

  const { data: topups = [] } = useSWR(
    mainAccount ? `allowance-topups-${mainAccount.id}` : null,
    async () => {
      if (!mainAccount) return []
      const { data } = await getTopups(mainAccount.id)
      return data || []
    },
    {
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
      {/* Account Card at Top */}
      {mainAccount && (
        <Card>
          <CardHeader>
            <CardTitle>{mainAccount.account_name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Current Balance</p>
                <p
                  className={`text-2xl font-bold ${
                    mainAccount.current_balance < 0 ? "text-red-500" : "text-green-500"
                  }`}
                >
                  {formatCurrency(mainAccount.current_balance, "NGN")}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Total Deposited</p>
                  <p className="font-medium">{formatCurrency(mainAccount.total_deposited, "NGN")}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total Spent</p>
                  <p className="font-medium">{formatCurrency(mainAccount.total_spent, "NGN")}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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

