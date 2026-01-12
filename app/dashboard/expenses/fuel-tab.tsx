"use client"

import { useState, useEffect } from "react"
import useSWR from "swr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Settings, Trash2, ChevronDown } from "lucide-react"
import { formatCurrency, formatRelativeTime, groupTransactionsByWeek, formatWeekRange } from "@/lib/utils"
import { getExpenseTransactions, getTopups, getPrepaidAccounts, deleteExpenseTransaction } from "@/app/actions/expenses"
import { getFuelRate } from "@/app/actions/settings"
import { TopUpDialog } from "@/components/top-up-dialog"
import { FuelRateSettingsDialog } from "@/components/fuel-rate-settings-dialog"
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"

export function FuelTab() {
  const [showTopUp, setShowTopUp] = useState(false)
  const [showRateSettings, setShowRateSettings] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; transaction: any | null }>({
    open: false,
    transaction: null,
  })
  const [isDeleting, setIsDeleting] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [expandedWeeks, setExpandedWeeks] = useState<Set<string>>(new Set())
  const [initialLoadDone, setInitialLoadDone] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        supabase
          .from("profiles")
          .select("role")
          .eq("id", data.user.id)
          .single()
          .then(({ data: profile }) => {
            setUserRole(profile?.role || null)
          })
      }
    })
  }, [])

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

  const {
    data: transactionsResult,
    isLoading: transactionsLoading,
    mutate: mutateTransactions,
  } = useSWR("fuel-transactions", () => getExpenseTransactions({ expenseType: "Fuel" }), { revalidateOnMount: true })

  const transactions = transactionsResult?.data || []

  const {
    data: topupsResult,
    isLoading: topupsLoading,
    mutate: mutateTopups,
  } = useSWR(
    mainAccount ? `fuel-topups-${mainAccount.id}` : null,
    () => (mainAccount ? getTopups(mainAccount.id) : Promise.resolve({ data: [] })),
    { revalidateOnMount: true },
  )

  const topups = topupsResult?.data || []

  const { data: fuelRateData, mutate: mutateFuelRate } = useSWR("fuel-rate", getFuelRate, { revalidateOnMount: true })

  const fuelRate = fuelRateData?.rate || 1010

  const isLoading = accountsLoading || transactionsLoading || topupsLoading

  const currentBalance = mainAccount?.current_balance || 0
  const totalDeposited = mainAccount?.total_deposited || 0
  const totalSpent = mainAccount?.total_spent || 0

  const weekStart = new Date()
  const dayOfWeek = weekStart.getDay()
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  weekStart.setDate(weekStart.getDate() + diff)
  weekStart.setHours(0, 0, 0, 0)

  const weeklySpent = transactions
    .filter((t: any) => new Date(t.transaction_date) >= weekStart)
    .reduce((sum, t: any) => sum + Number(t.amount), 0)

  const weeklyTopups = topups
    .filter((t: any) => new Date(t.topup_date) >= weekStart)
    .reduce((sum, t: any) => sum + Number(t.amount), 0)

  const weeklyClosingBalance = currentBalance - weeklySpent

  useEffect(() => {
    console.log("[v0] Fuel Tab Debug:", {
      currentBalance,
      weeklySpent,
      weeklyClosingBalance,
      weekStart: weekStart.toISOString(),
      transactionsCount: transactions.length,
    })
  }, [currentBalance, weeklySpent])

  const remainingLiters = currentBalance / fuelRate
  const totalPurchasedLiters = totalDeposited / fuelRate
  const totalUsedLiters = totalSpent / fuelRate

  const usagePercentage = totalDeposited > 0 ? (totalSpent / totalDeposited) * 100 : 0
  const remainingPercentage = Math.max(0, 100 - usagePercentage)

  const totalPipes = 80
  const filledPipes = Math.round((remainingPercentage / 100) * totalPipes)
  const emptyPipes = totalPipes - filledPipes

  const greenPipes = Math.floor(filledPipes * 0.6) // 60% green
  const yellowPipes = Math.floor(filledPipes * 0.3) // 30% yellow
  const redPipes = filledPipes - greenPipes - yellowPipes // remaining red

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

  const groupedTransactions = groupTransactionsByWeek(allTransactions)

  useEffect(() => {
    if (groupedTransactions.size > 0 && !initialLoadDone) {
      const weeks = Array.from(groupedTransactions.keys())
      const firstThreeWeeks = new Set(weeks.slice(0, 3))
      setExpandedWeeks(firstThreeWeeks)
      setInitialLoadDone(true)
    }
  }, [groupedTransactions.size, initialLoadDone])

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

  const handleDeleteTransaction = async () => {
    if (!deleteDialog.transaction) return

    setIsDeleting(true)
    try {
      const result = await deleteExpenseTransaction(deleteDialog.transaction.id)
      if (result.success) {
        toast.success("Expense transaction deleted successfully")
        mutateTransactions()
      } else {
        toast.error(result.error || "Failed to delete transaction")
      }
    } catch (error) {
      toast.error("An error occurred while deleting the transaction")
    } finally {
      setIsDeleting(false)
      setDeleteDialog({ open: false, transaction: null })
    }
  }

  const canDelete = userRole === "MD" || userRole === "ED"

  return (
    <div className="space-y-4">
      {/* Weekly closing balance card */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">Closing Balance This Week</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`text-3xl font-bold ${weeklyClosingBalance < 0 ? "text-red-600" : "text-green-600"}`}>
            ₦{weeklyClosingBalance.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Current Balance: ₦{currentBalance.toLocaleString()} - Spent: ₦{weeklySpent.toLocaleString()}
          </p>
        </CardContent>
      </Card>

      {/* Fuel balance card */}
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

      {/* All Transactions card with weekly grouping */}
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
            <div className="space-y-2">
              {Array.from(groupedTransactions.entries()).map(([weekKey, items]) => {
                const weekStart = new Date(weekKey)
                const isExpanded = expandedWeeks.has(weekKey)

                return (
                  <Collapsible
                    key={weekKey}
                    open={isExpanded}
                    onOpenChange={(open) => {
                      const newExpanded = new Set(expandedWeeks)
                      if (open) {
                        newExpanded.add(weekKey)
                      } else {
                        newExpanded.delete(weekKey)
                      }
                      setExpandedWeeks(newExpanded)
                    }}
                  >
                    <CollapsibleTrigger asChild>
                      <button className="flex items-center justify-between w-full p-3 hover:bg-muted rounded-lg font-semibold text-sm">
                        <span>{formatWeekRange(weekStart)}</span>
                        <ChevronDown
                          className={`h-5 w-5 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                        />
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="overflow-x-auto">
                      <table className="w-full mt-2">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-3 text-sm font-medium text-muted-foreground">Type</th>
                            <th className="text-left p-3 text-sm font-medium text-muted-foreground">Details</th>
                            <th className="text-left p-3 text-sm font-medium text-muted-foreground">By</th>
                            <th className="text-left p-3 text-sm font-medium text-muted-foreground">Date</th>
                            <th className="text-right p-3 text-sm font-medium text-muted-foreground">Liters</th>
                            <th className="text-right p-3 text-sm font-medium text-muted-foreground">Amount</th>
                            {canDelete && (
                              <th className="text-right p-3 text-sm font-medium text-muted-foreground">Actions</th>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {items.map((item: any, index: number) => {
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
                                  <p
                                    className={`font-medium ${item.type === "expense" ? "text-red-600" : "text-green-600"}`}
                                  >
                                    {item.type === "expense" ? "-" : "+"}
                                    {item.liters.toLocaleString(undefined, { maximumFractionDigits: 0 })} L
                                  </p>
                                </td>
                                <td className="p-3 text-right">
                                  <p
                                    className={`font-bold ${item.type === "expense" ? "text-red-600" : "text-green-600"}`}
                                  >
                                    {item.type === "expense" ? "-" : "+"}
                                    {formatCurrency(Math.abs(item.amount), "NGN")}
                                  </p>
                                </td>
                                {canDelete && (
                                  <td className="p-3 text-right">
                                    {(item.type === "topup" || item.type === "refund") && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                        onClick={() => setDeleteDialog({ open: true, transaction: item })}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    )}
                                  </td>
                                )}
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </CollapsibleContent>
                  </Collapsible>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">No transactions yet</p>
          )}
        </CardContent>
      </Card>

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

      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, transaction: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Expense Transaction</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this fuel expense transaction?
              {deleteDialog.transaction && (
                <div className="mt-2 p-3 bg-muted rounded-md text-sm">
                  <span className="font-medium block">
                    {deleteDialog.transaction.booking?.job_id || "Manual Entry"} -{" "}
                    {deleteDialog.transaction.driver?.full_name || "N/A"}
                  </span>
                  <span className="text-red-600 font-bold mt-1 block">
                    {formatCurrency(deleteDialog.transaction.amount, "NGN")}
                  </span>
                </div>
              )}
              <span className="mt-2 text-destructive font-medium block">
                This action cannot be undone and will be logged for accountability.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTransaction}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
