"use client"

import { useState } from "react"
import useSWR from "swr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Settings, Plus } from "lucide-react"
import { formatCurrency, formatRelativeTime } from "@/lib/utils"
import { getExpenseTransactions, getTopups, getPrepaidAccounts } from "@/app/actions/expenses"
import { getFuelRate } from "@/app/actions/settings"
import { TopUpDialog } from "@/components/top-up-dialog"
import { FuelRateSettingsDialog } from "@/components/fuel-rate-settings-dialog"

export function FuelTab() {
  const [showTopUp, setShowTopUp] = useState(false)
  const [showRateSettings, setShowRateSettings] = useState(false)

  const { data: accountsResult, isLoading: accountsLoading } = useSWR(
    "fuel-prepaid-accounts",
    async () => {
      const result = await getPrepaidAccounts("Fuel")
      return result
    },
    { revalidateOnMount: true },
  )

  const accounts = accountsResult?.data || []
  const mainAccount = accounts[0]

  const { data: transactionsResult, isLoading: transactionsLoading } = useSWR(
    "fuel-transactions",
    () => getExpenseTransactions({ expenseType: "Fuel" }),
    { revalidateOnMount: true },
  )

  const transactions = transactionsResult?.data || []

  const { data: topupsResult, isLoading: topupsLoading, mutate: mutateTopups } = useSWR(
    mainAccount ? `fuel-topups-${mainAccount.id}` : null,
    () => (mainAccount ? getTopups(mainAccount.id) : Promise.resolve({ data: [] })),
    { revalidateOnMount: true },
  )

  const topups = topupsResult?.data || []

  const { data: fuelRateData, mutate: mutateFuelRate } = useSWR("fuel-rate", getFuelRate, { revalidateOnMount: true })

  const fuelRate = fuelRateData?.rate || 1010

  const isLoading = accountsLoading || transactionsLoading || topupsLoading

  // Use total account balance for fuel gauge
  const currentBalance = mainAccount?.current_balance || 0
  const totalDeposited = mainAccount?.total_deposited || 0
  const totalSpent = mainAccount?.total_spent || 0

  // Convert balance to liters
  const remainingLiters = currentBalance / fuelRate
  const totalPurchasedLiters = totalDeposited / fuelRate
  const totalUsedLiters = totalSpent / fuelRate

  // Calculate percentages for fuel gauge (based on total deposited vs spent)
  const usagePercentage = totalDeposited > 0 ? (totalSpent / totalDeposited) * 100 : 0
  const remainingPercentage = Math.max(0, 100 - usagePercentage)

  // Longer progress bar (80 pipes instead of 40)
  const totalPipes = 80
  const filledPipes = Math.round((remainingPercentage / 100) * totalPipes)
  const emptyPipes = totalPipes - filledPipes

  // Create gradient colored segments (red at start, yellow middle, green at end)
  const greenPipes = Math.floor(filledPipes * 0.6) // 60% green
  const yellowPipes = Math.floor(filledPipes * 0.3) // 30% yellow
  const redPipes = filledPipes - greenPipes - yellowPipes // remaining red

  // Combine transactions and top-ups
  const allTransactions = [
    ...transactions.map((t: any) => ({
      ...t,
      type: "expense" as const,
      date: t.transaction_date,
      amount: -Number(t.amount),
      liters: Number(t.quantity) || 0,
    })),
    ...topups.map((t: any) => ({
      ...t,
      type: t.topup_type === "refund" ? ("refund" as const) : ("topup" as const),
      date: t.topup_date,
      amount: Number(t.amount),
      liters: Number(t.amount) / fuelRate,
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
      {/* Fuel Progress Gauge */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="space-y-1">
            <CardTitle className="text-base font-medium">Fuel Balance</CardTitle>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>Current Rate: ₦{fuelRate.toLocaleString()}/L</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 text-blue-600 hover:text-blue-700"
                onClick={() => setShowRateSettings(true)}
              >
                <Settings className="h-3 w-3 mr-1" />
                Change Rate
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="pt-2">
            <div className="flex items-center gap-1">
              <span className="text-xs font-medium text-red-500">L</span>
              <span className="font-mono text-xs tracking-tighter flex-1">
                <span className="text-red-500">{"|".repeat(redPipes)}</span>
                <span className="text-yellow-500">{"|".repeat(yellowPipes)}</span>
                <span className="text-green-500">{"|".repeat(greenPipes)}</span>
                <span className="text-muted-foreground/30">{"·".repeat(emptyPipes)}</span>
              </span>
              <span className="text-xs font-medium text-green-500">F</span>
            </div>
            <p className="text-center mt-3">
              <span className={`text-2xl font-bold ${remainingLiters < 100 ? "text-red-600" : "text-green-600"}`}>
                {remainingLiters.toLocaleString(undefined, { maximumFractionDigits: 0 })} L
              </span>
              <span className="text-sm text-muted-foreground ml-2">remaining</span>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : allTransactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Type</th>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Details</th>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">By</th>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Date</th>
                    <th className="text-right p-3 text-sm font-medium text-muted-foreground">Liters</th>
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
                              <p className="font-medium">{item.account?.account_name || "Fuel Account"}</p>
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
                          <p className={`font-medium ${item.type === "expense" ? "text-red-600" : "text-green-600"}`}>
                            {item.type === "expense" ? "-" : "+"}
                            {item.liters.toLocaleString(undefined, { maximumFractionDigits: 0 })} L
                          </p>
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

      {/* Dialogs */}
      {mainAccount && (
        <TopUpDialog
          open={showTopUp}
          onOpenChange={setShowTopUp}
          accountId={mainAccount.id}
          accountName={mainAccount.account_name}
          onSuccess={() => mutateTopups()}
        />
      )}

      <FuelRateSettingsDialog
        open={showRateSettings}
        onOpenChange={setShowRateSettings}
        currentRate={fuelRate}
        onSuccess={() => mutateFuelRate()}
      />
    </div>
  )
}
