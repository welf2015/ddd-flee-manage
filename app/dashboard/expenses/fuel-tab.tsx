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

  const { data: accounts = [], isLoading: accountsLoading } = useSWR(
    "fuel-prepaid-accounts",
    () => getPrepaidAccounts("Fuel"),
    { revalidateOnMount: true },
  )

  const mainAccount = accounts[0]

  const { data: transactions = [], isLoading: transactionsLoading } = useSWR(
    "fuel-transactions",
    () => getExpenseTransactions("Fuel"),
    { revalidateOnMount: true },
  )

  const {
    data: topups = [],
    isLoading: topupsLoading,
    mutate: mutateTopups,
  } = useSWR(
    mainAccount ? `fuel-topups-${mainAccount.id}` : null,
    () => (mainAccount ? getTopups(mainAccount.id) : Promise.resolve([])),
    { revalidateOnMount: true },
  )

  const { data: fuelRateData, mutate: mutateFuelRate } = useSWR("fuel-rate", getFuelRate, { revalidateOnMount: true })

  const fuelRate = fuelRateData?.rate || 1010

  const isLoading = accountsLoading || transactionsLoading || topupsLoading

  // Calculate totals from actual data
  // Total purchased liters = total_deposited / fuel rate
  const totalDepositedAmount = mainAccount?.total_deposited || 0
  const totalPurchasedLiters = totalDepositedAmount / fuelRate

  // Total used liters = sum of quantity from fuel transactions
  const totalUsedLiters = transactions.reduce((sum: number, t: any) => sum + (Number(t.quantity) || 0), 0)

  // Remaining liters
  const remainingLiters = totalPurchasedLiters - totalUsedLiters

  // Calculate percentages
  const usagePercentage = totalPurchasedLiters > 0 ? (totalUsedLiters / totalPurchasedLiters) * 100 : 0
  const remainingPercentage = Math.max(0, 100 - usagePercentage)

  const totalPipes = 40
  const filledPipes = Math.round((remainingPercentage / 100) * totalPipes)
  const emptyPipes = totalPipes - filledPipes
  const progressBar = "│".repeat(filledPipes) + "·".repeat(emptyPipes)

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
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base font-medium">Fuel Progress (Liters)</CardTitle>
          <Button variant="outline" size="sm" onClick={() => setShowRateSettings(true)}>
            <Settings className="h-4 w-4 mr-2" />
            Fuel Rate Settings
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Purchased:</span>
              <p className="font-semibold text-green-600">
                {totalPurchasedLiters.toLocaleString(undefined, { maximumFractionDigits: 0 })} L
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Used:</span>
              <p className="font-semibold text-red-600">
                {totalUsedLiters.toLocaleString(undefined, { maximumFractionDigits: 0 })} L
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Remaining:</span>
              <p className={`font-semibold ${remainingLiters < 100 ? "text-red-600" : "text-green-600"}`}>
                {remainingLiters.toLocaleString(undefined, { maximumFractionDigits: 0 })} L
              </p>
            </div>
          </div>

          <div className="pt-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-red-500">L</span>
              <span className="font-mono text-sm tracking-tighter flex-1 text-center">{progressBar}</span>
              <span className="text-xs font-medium text-green-500">F</span>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-1">
              {remainingPercentage.toFixed(0)}% remaining
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Balance and Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Fuel Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(mainAccount?.current_balance || 0, "NGN")}
            </div>
            <p className="text-xs text-muted-foreground">Available</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Current Fuel Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{fuelRate.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">per liter</p>
          </CardContent>
        </Card>
      </div>

      {/* Top Up Button */}
      {mainAccount && (
        <Button onClick={() => setShowTopUp(true)} className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Add Top-up / Refund
        </Button>
      )}

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
                  <tr className="border-b text-left text-sm text-muted-foreground">
                    <th className="pb-2 font-medium">Date</th>
                    <th className="pb-2 font-medium">Type</th>
                    <th className="pb-2 font-medium">Details</th>
                    <th className="pb-2 font-medium text-right">Liters</th>
                    <th className="pb-2 font-medium text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {allTransactions.map((t: any, i: number) => {
                    const badge = getTypeBadge(t.type)
                    return (
                      <tr key={t.id || i} className="border-b last:border-0">
                        <td className="py-3 text-sm">{formatRelativeTime(t.date)}</td>
                        <td className="py-3">
                          <Badge variant="secondary" className={badge.className}>
                            {badge.label}
                          </Badge>
                        </td>
                        <td className="py-3 text-sm text-muted-foreground">
                          {t.type === "expense"
                            ? t.notes || `Fuel for ${t.booking?.job_id || "job"}`
                            : t.notes || t.receipt_number || "Top-up"}
                        </td>
                        <td className="py-3 text-sm text-right">
                          {t.type === "expense" ? (
                            <span className="text-red-600">-{t.liters.toLocaleString()} L</span>
                          ) : (
                            <span className="text-green-600">
                              +{t.liters.toLocaleString(undefined, { maximumFractionDigits: 0 })} L
                            </span>
                          )}
                        </td>
                        <td className="py-3 text-sm text-right font-medium">
                          {t.amount < 0 ? (
                            <span className="text-red-600">-{formatCurrency(Math.abs(t.amount), "NGN")}</span>
                          ) : (
                            <span className="text-green-600">+{formatCurrency(t.amount, "NGN")}</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No transactions yet</p>
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
