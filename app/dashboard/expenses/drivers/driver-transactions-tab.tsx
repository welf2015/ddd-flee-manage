"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Pencil, Trash2, Search } from "lucide-react"
import useSWR from "swr"
import { format } from "date-fns"
import EditDriverTransactionDialog from "@/components/driver-spending/edit-driver-transaction-dialog"
import ConfirmDialog from "@/components/ui/confirm-dialog"
import { deleteDriverTransaction } from "@/app/actions/driver-spending"
import { toast } from "sonner"
import { createBrowserClient } from "@/lib/supabase/client"
import WeekFilterSelector from "@/components/driver-spending/week-filter-selector"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

type DriverTransactionsTabProps = {
  initialTransactions?: any[]
}

export default function DriverTransactionsTab({ initialTransactions = [] }: DriverTransactionsTabProps) {
  const [search, setSearch] = useState("")
  const [editTransaction, setEditTransaction] = useState<any>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [selectedWeek, setSelectedWeek] = useState("current")
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  const { data: transactions = initialTransactions, mutate } = useSWR(
    `/api/driver-spending/transactions?week=${selectedWeek}&year=${selectedYear}`, 
    fetcher, {
    fallbackData: initialTransactions,
    revalidateOnMount: false,
    refreshInterval: 5000,
  })

  useEffect(() => {
    const fetchUserRole = async () => {
      const supabase = createBrowserClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
        setUserRole(profile?.role || null)
      }
    }
    fetchUserRole()
  }, [])

  const canEditDelete = userRole && ["MD", "ED", "Fleet Officer"].includes(userRole)

  const filteredTransactions = Array.isArray(transactions)
    ? transactions.filter(
        (t: any) =>
          t.driver_name?.toLowerCase().includes(search.toLowerCase()) ||
          t.job_id?.toLowerCase().includes(search.toLowerCase()) ||
          t.transaction_type?.toLowerCase().includes(search.toLowerCase()),
      )
    : []

  const handleDelete = async () => {
    if (!deleteId) return
    setIsDeleting(true)
    try {
      const result = await deleteDriverTransaction(deleteId)
      if (result.success) {
        toast.success("Transaction deleted successfully")
        mutate()
      } else {
        toast.error(result.error || "Failed to delete transaction")
      }
    } catch (error) {
      toast.error("An error occurred")
    } finally {
      setIsDeleting(false)
      setDeleteId(null)
    }
  }

  const getTypeBadge = (type: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      topup: "default",
      expense: "destructive",
      refund: "secondary",
      manual_debit: "outline",
    }
    return <Badge variant={variants[type] || "default"}>{type.replace("_", " ").toUpperCase()}</Badge>
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>All Driver Transactions</CardTitle>
          <div className="flex items-center gap-4">
            <WeekFilterSelector
              selectedWeek={selectedWeek}
              selectedYear={selectedYear}
              onWeekChange={setSelectedWeek}
              onYearChange={setSelectedYear}
            />
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by driver, job, or type..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Driver</TableHead>
              <TableHead>Job ID</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              {canEditDelete && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTransactions?.map((transaction: any) => (
              <TableRow key={transaction.id}>
                <TableCell>{getTypeBadge(transaction.transaction_type)}</TableCell>
                <TableCell className="font-medium">{transaction.driver_name}</TableCell>
                <TableCell>{transaction.job_id || "-"}</TableCell>
                <TableCell>{format(new Date(transaction.transaction_date), "MMM dd, yyyy HH:mm")}</TableCell>
                <TableCell
                  className={`text-right font-medium ${
                    transaction.transaction_type === "expense" || transaction.transaction_type === "manual_debit"
                      ? "text-red-600"
                      : "text-green-600"
                  }`}
                >
                  {transaction.transaction_type === "expense" || transaction.transaction_type === "manual_debit"
                    ? "-"
                    : "+"}
                  ₦{transaction.amount.toLocaleString()}
                </TableCell>
                {canEditDelete && (
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setEditTransaction(transaction)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeleteId(transaction.id)}>
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
            {!filteredTransactions?.length && (
              <TableRow>
                <TableCell colSpan={canEditDelete ? 6 : 5} className="text-center text-muted-foreground">
                  No transactions found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>

      {editTransaction && (
        <EditDriverTransactionDialog
          open={!!editTransaction}
          onOpenChange={(open) => !open && setEditTransaction(null)}
          transaction={editTransaction}
          onTransactionUpdated={() => mutate()}
        />
      )}

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Transaction"
        description="Are you sure you want to delete this transaction? This action cannot be undone."
        loading={isDeleting}
      />
    </Card>
  )
}
