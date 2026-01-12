"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  getPrepaidAccounts,
  getExpenseTransactions,
  getTopups,
  deleteExpenseTransaction,
  deleteTopup,
} from "@/app/actions/expenses"
import useSWR from "swr"
import { formatCurrency, formatRelativeTime, groupTransactionsByWeek, formatWeekRange } from "@/lib/utils"
import { Trash2, ChevronDown } from "lucide-react"
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
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible"

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

  const initialTicketingAccounts = initialAccounts.filter((a: any) => a.vendor?.vendor_type === "Ticketing")
  const { data: accounts = initialTicketingAccounts } = useSWR(
    "ticketing-accounts",
    async () => {
      const { data } = await getPrepaidAccounts("Ticketing")
      return (data || []).filter((a: any) => a.vendor?.vendor_type === "Ticketing")
    },
    {
      fallbackData: initialTicketingAccounts,
      revalidateOnMount: true,
    },
  )

  const mainAccount = accounts[0]

  const { data: transactions = initialTransactions, mutate: mutateTransactions } = useSWR(
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

  const { data: topups = initialTopups, mutate: mutateTopups } = useSWR(
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

  const allTransactions = [
    ...transactions.map((t: any) => ({
      ...t,
      type: "expense" as const,
      date: t.transaction_date,
      amount: -Number(t.amount),
    })),
    ...topups.map((t: any) => ({
      ...t,
      type: t.topup_type === "refund" ? ("refund" as const) : ("topup" as const),
      date: t.topup_date,
      amount: Number(t.amount),
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
    console.log("[v0] handleDeleteTransaction called")
    console.log("[v0] Transaction to delete:", deleteDialog.transaction)

    if (!deleteDialog.transaction) {
      console.log("[v0] No transaction selected for deletion")
      return
    }

    const isTopupOrRefund = deleteDialog.transaction.type === "topup" || deleteDialog.transaction.type === "refund"
    console.log("[v0] Is topup/refund:", isTopupOrRefund)
    console.log("[v0] Transaction ID:", deleteDialog.transaction.id)

    setIsDeleting(true)
    try {
      console.log("[v0] Calling delete function...")
      const result = await (isTopupOrRefund ? deleteTopup : deleteExpenseTransaction)(deleteDialog.transaction.id)

      console.log("[v0] Delete result:", result)

      if (result.success) {
        console.log("[v0] Delete successful, refreshing data...")
        toast.success(
          isTopupOrRefund ? "Topup transaction deleted successfully" : "Expense transaction deleted successfully",
        )
        await Promise.all([
          mutateTransactions(undefined, { revalidate: true }),
          mutateTopups(undefined, { revalidate: true }),
        ])
        console.log("[v0] Data refreshed")
      } else {
        console.error("[v0] Delete failed:", result.error)
        toast.error(result.error || "Failed to delete transaction")
      }
    } catch (error) {
      console.error("[v0] Exception during delete:", error)
      toast.error("An error occurred while deleting the transaction")
    } finally {
      setIsDeleting(false)
      setDeleteDialog({ open: false, transaction: null })
    }
  }

  const canDelete = userRole === "MD" || userRole === "ED"

  return (
    <div className="space-y-4">
      {/* Unified Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {allTransactions.length > 0 ? (
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

      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, transaction: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteDialog.transaction?.type === "topup" || deleteDialog.transaction?.type === "refund"
                ? "Delete Topup Transaction"
                : "Delete Expense Transaction"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this ticketing{" "}
              {deleteDialog.transaction?.type === "topup" || deleteDialog.transaction?.type === "refund"
                ? "topup"
                : "expense"}{" "}
              transaction?
              {deleteDialog.transaction && (
                <div className="mt-2 p-3 bg-muted rounded-md text-sm">
                  <span className="font-medium block">
                    {deleteDialog.transaction.type === "topup" || deleteDialog.transaction.type === "refund"
                      ? deleteDialog.transaction.account?.account_name || "Account"
                      : deleteDialog.transaction.booking?.job_id || "Manual Entry"}
                    {deleteDialog.transaction.receipt_number && ` - ${deleteDialog.transaction.receipt_number}`}
                  </span>
                  <span
                    className={`text-${deleteDialog.transaction.type === "topup" || deleteDialog.transaction.type === "refund" ? "green" : "red"}-600 font-bold mt-1 block`}
                  >
                    {formatCurrency(Math.abs(deleteDialog.transaction.amount), "NGN")}
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
