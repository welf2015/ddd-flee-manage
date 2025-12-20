"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Trash2 } from "lucide-react"
import { formatCurrency, formatRelativeTime } from "@/lib/utils"
import { deleteDriverTransaction } from "@/app/actions/driver-spending"
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

interface DriverTransactionsTableProps {
    transactions: any[]
    isLoading?: boolean
    onTransactionDeleted?: () => void
}

export default function DriverTransactionsTable({
    transactions,
    isLoading,
    onTransactionDeleted
}: DriverTransactionsTableProps) {
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; transaction: any | null }>({
        open: false,
        transaction: null,
    })
    const [isDeleting, setIsDeleting] = useState(false)
    const [userRole, setUserRole] = useState<string | null>(null)

    useState(() => {
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
    })

    const getTypeBadge = (type: string) => {
        switch (type) {
            case "top_up":
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
            const result = await deleteDriverTransaction(deleteDialog.transaction.id)
            if (result.success) {
                toast.success("Transaction deleted successfully")
                onTransactionDeleted?.()
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

    const canDelete = userRole === "MD" || userRole === "ED" || userRole === "Fleet Officer"

    return (
        <div className="space-y-4">
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
                    ) : transactions.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left p-3 text-sm font-medium text-muted-foreground">Type</th>
                                        <th className="text-left p-3 text-sm font-medium text-muted-foreground">Details</th>
                                        <th className="text-left p-3 text-sm font-medium text-muted-foreground">Driver</th>
                                        <th className="text-left p-3 text-sm font-medium text-muted-foreground">Date</th>
                                        <th className="text-right p-3 text-sm font-medium text-muted-foreground">Amount</th>
                                        {canDelete && <th className="text-right p-3 text-sm font-medium text-muted-foreground">Actions</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {transactions.map((item: any, index: number) => {
                                        const badge = getTypeBadge(item.transaction_type)
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
                                                    {item.transaction_type === "expense" ? (
                                                        <div>
                                                            <p className="font-medium">{item.booking?.job_id || item.job_id || "Manual Entry"}</p>
                                                            {item.notes && <p className="text-sm text-muted-foreground">{item.notes}</p>}
                                                        </div>
                                                    ) : (
                                                        <div>
                                                            <p className="font-medium">{item.notes || "Account Top-up"}</p>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="p-3">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-medium">{item.driver_name || "N/A"}</span>
                                                        <span className="text-xs text-muted-foreground">{item.driver_phone}</span>
                                                    </div>
                                                </td>
                                                <td className="p-3">
                                                    <p className="text-sm text-muted-foreground">{formatRelativeTime(item.transaction_date)}</p>
                                                </td>
                                                <td className="p-3 text-right">
                                                    <p className={`font-bold ${item.transaction_type === "expense" ? "text-red-600" : "text-green-600"}`}>
                                                        {item.transaction_type === "expense" ? "-" : "+"}
                                                        {formatCurrency(Math.abs(item.amount), "NGN")}
                                                    </p>
                                                </td>
                                                {canDelete && (
                                                    <td className="p-3 text-right">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                            onClick={() => setDeleteDialog({ open: true, transaction: item })}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </td>
                                                )}
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-8">No transactions found</p>
                    )}
                </CardContent>
            </Card>

            <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, transaction: null })}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Transaction</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this {deleteDialog.transaction?.transaction_type?.replace('_', ' ')} transaction?
                            {deleteDialog.transaction && (
                                <div className="mt-2 p-3 bg-muted rounded-md text-sm">
                                    <span className="font-medium block">
                                        {deleteDialog.transaction.driver_name} - {formatCurrency(deleteDialog.transaction.amount, "NGN")}
                                    </span>
                                </div>
                            )}
                            <span className="mt-2 text-destructive font-medium block">
                                This will revert the balance adjustment.
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
