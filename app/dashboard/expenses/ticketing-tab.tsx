"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getPrepaidAccounts, getExpenseTransactions, getTopups } from "@/app/actions/expenses"
import useSWR from "swr"
import { formatCurrency, formatRelativeTime } from "@/lib/utils"

type TicketingTabProps = {
  onAddTopup: (accountId?: string) => void
  initialAccounts?: any[]
  initialTransactions?: any[]
  initialTopups?: any[]
}

export function TicketingTab({
  onAddTopup,
  initialAccounts = [],
  initialTransactions = [],
  initialTopups = [],
}: TicketingTabProps) {
  const initialTicketingAccounts = initialAccounts.filter((a: any) => a.vendor?.vendor_type === "Ticketing")
  const { data: accounts = initialTicketingAccounts } = useSWR(
    "ticketing-accounts",
    async () => {
      const { data } = await getPrepaidAccounts("Ticketing")
      // Filter to ensure only Ticketing accounts
      return (data || []).filter((a: any) => a.vendor?.vendor_type === "Ticketing")
    },
    {
      fallbackData: initialTicketingAccounts,
      revalidateOnMount: true,
    },
  )

  const mainAccount = accounts[0]

  const { data: transactions = initialTransactions } = useSWR(
    "ticketing-transactions",
    async () => {
      const { data } = await getExpenseTransactions({ expenseType: "Ticketing" })
      return data || []
    },
    {
      fallbackData: initialTransactions,
      revalidateOnMount: true,
    },
  )

  const { data: topups = initialTopups } = useSWR(
    "ticketing-topups",
    async () => {
      const result = await getTopups(mainAccount?.id)
      if (mainAccount?.id) {
        return (result.data || []).filter((t: any) => t.account_id === mainAccount.id)
      }
      return result.data || []
    },
    {
      fallbackData: initialTopups,
      revalidateOnMount: true,
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
      type: t.topup_type === "refund" ? ("refund" as const) : ("topup" as const),
      date: t.topup_date,
      amount: Number(t.amount), // Positive for top-ups
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "topup":
        return { className: "bg-green-100 text-green-700", label: "Top-up" }
      case "refund":
        return { className: "bg-blue-100 text-blue-700", label: "Refund" }
      case "expense":
      default:
        return { className: "bg-red-100 text-red-700", label: "Expense" }
    }
  }

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
                  {allTransactions.map((item: any, index: number) => {
                    const badge = getTypeBadge(item.type)
                    return (
                      <tr key={item.id || `item-${index}`} className="border-b hover:bg-muted/50">
                        <td className="p-3">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${badge.className}`}
                          >
                            {badge.label}
                          </span>
                        </td>
                        <td className="p-3">
                          {item.type === "expense" ? (
                            <div>
                              <p className="font-medium">{item.booking?.job_id || "Manual Entry"}</p>
                              <p className="text-sm text-muted-foreground">{item.driver?.full_name || "N/A"}</p>
                            </div>
                          ) : (
                            <div>
                              <p className="font-medium">{item.account?.account_name || "Account"}</p>
                              {item.receipt_number && (
                                <p className="text-sm text-muted-foreground">Receipt: {item.receipt_number}</p>
                              )}
                              {item.notes && <p className="text-sm text-muted-foreground">{item.notes}</p>}
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
                          <p className={`font-bold ${item.type === "expense" ? "text-red-600" : "text-green-600"}`}>
                            {item.type === "expense" ? "-" : "+"}
                            {formatCurrency(Math.abs(item.amount), "NGN")}
                          </p>
                        </td>
                      </tr>
                    )
                  })}
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
