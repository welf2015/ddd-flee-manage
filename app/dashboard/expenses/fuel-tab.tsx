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
}

export function FuelTab({ onAddTopup }: FuelTabProps) {
  // Get fuel accounts
  const { data: fuelAccounts = [], mutate: mutateFuelAccounts } = useSWR("fuel-accounts", async () => {
    const { data } = await getPrepaidAccounts("Fuel")
    // Filter to ensure only Fuel type accounts
    return (data || []).filter((a: any) => a.vendor?.vendor_type === "Fuel")
  })

  // Get total fuel spent
  const { data: totalFuelSpent = 0, mutate: mutateFuelSpent } = useSWR("total-fuel-spent", async () => {
    const { data } = await getTotalFuelSpent()
    return data || 0
  })

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
      const { data } = await getTopups(mainAccount.id)
      return data || []
    },
  )

  // Filter to get only Fuel type accounts (not Allowance)
  const fuelOnlyAccounts = fuelAccounts.filter((a: any) => a.vendor?.vendor_type === "Fuel")
  const mainAccount = fuelOnlyAccounts[0] // Total Energies main account

  return (
    <div className="space-y-4">
      {/* Fuel Meter Section */}
      <Card>
        <CardHeader>
          <CardTitle>Fuel Spending Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Total Spent Display */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">Total Spent</p>
            <p className="text-3xl font-bold">{formatCurrency(totalFuelSpent, "NGN")}</p>
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </div>

          {/* Fuel Meter Visualization */}
          <FuelMeter totalSpent={totalFuelSpent} />
        </CardContent>
      </Card>

      {/* Account Balance */}
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

      {/* Recent Transactions */}
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
                      {transaction.quantity && ` • ${transaction.quantity} ${transaction.unit}`}
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

      {/* Top-up History */}
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

