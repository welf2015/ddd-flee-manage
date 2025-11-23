"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { getPrepaidAccounts, getExpenseTransactions, getTopups } from "@/app/actions/expenses"
import useSWR from "swr"
import { formatCurrency, formatRelativeTime } from "@/lib/utils"

type AllowanceTabProps = {
  onAddTopup: (accountId?: string) => void
}

export function AllowanceTab({ onAddTopup }: AllowanceTabProps) {
  const { data: accounts = [] } = useSWR("allowance-accounts", async () => {
    const { data } = await getPrepaidAccounts("Allowance")
    // Filter to ensure only Allowance accounts
    return (data || []).filter((a: any) => a.vendor?.vendor_type === "Allowance")
  })

  const { data: transactions = [] } = useSWR("allowance-transactions", async () => {
    const { data } = await getExpenseTransactions({ expenseType: "Allowance" })
    return data || []
  })

  const mainAccount = accounts[0]

  const { data: topups = [] } = useSWR(
    mainAccount ? `allowance-topups-${mainAccount.id}` : null,
    async () => {
      if (!mainAccount) return []
      const { data } = await getTopups(mainAccount.id)
      return data || []
    },
  )

  return (
    <div className="space-y-4">
      {mainAccount && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{mainAccount.account_name}</CardTitle>
            <Button size="sm" onClick={() => onAddTopup(mainAccount.id)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Top-up
            </Button>
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

      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length > 0 ? (
            <div className="space-y-2">
              {transactions.slice(0, 10).map((transaction: any) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                >
                  <div>
                    <p className="font-medium">
                      {transaction.booking?.job_id || "Manual Entry"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {transaction.driver?.full_name || "N/A"} • {transaction.vehicle?.vehicle_number || "N/A"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatRelativeTime(transaction.transaction_date)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatCurrency(transaction.amount, "NGN")}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">No transactions yet</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Top-up History</CardTitle>
        </CardHeader>
        <CardContent>
          {topups.length > 0 ? (
            <div className="space-y-2">
              {topups.slice(0, 10).map((topup: any) => (
                <div
                  key={topup.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                >
                  <div>
                    <p className="font-medium">{topup.account?.account_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {topup.receipt_number && `Receipt: ${topup.receipt_number} • `}
                      {topup.deposited_by_profile?.full_name || "System"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatRelativeTime(topup.topup_date)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">
                      +{formatCurrency(topup.amount, "NGN")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">No top-ups yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

