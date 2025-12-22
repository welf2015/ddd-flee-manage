"use client"

import { useState, useEffect } from "react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Pencil, Trash2, User, Phone } from "lucide-react"
import useSWR, { useSWRConfig } from "swr"
import { format } from "date-fns"
import EditDriverTransactionDialog from "./edit-driver-transaction-dialog"
import ConfirmDialog from "@/components/ui/confirm-dialog"
import { deleteDriverTransaction } from "@/app/actions/driver-spending"
import { toast } from "sonner"
import { createBrowserClient } from "@/lib/supabase/client"
import AdjustBalanceDialog from "./adjust-balance-dialog"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface DriverDetailSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  driver: any
}

export default function DriverDetailSheet({ open, onOpenChange, driver }: DriverDetailSheetProps) {
  const { mutate: globalMutate } = useSWRConfig()
  const [editTransaction, setEditTransaction] = useState<any>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [showAdjustDialog, setShowAdjustDialog] = useState(false)

  const { data: transactions, mutate } = useSWR(
    driver ? `/api/driver-spending/driver-transactions?driverId=${driver.id}` : null,
    fetcher,
    { refreshInterval: 5000 },
  )

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

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Driver Spending Details</SheetTitle>
            <SheetDescription>View weekly transactions and spending details</SheetDescription>
          </SheetHeader>

          <div className="space-y-6 mt-6">
            {/* Driver Info */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-lg">{driver.full_name}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        {driver.phone || driver.phone_number}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div>
                      <p className="text-sm text-muted-foreground">Spent Today</p>
                      <p className="text-2xl font-bold text-orange-600">
                        ₦{(driver.account?.daily_spent || driver.daily_spent || 0).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Account Balance</p>
                      <p className={`text-2xl font-bold ${Number(driver.account?.current_balance || driver.current_balance || 0) < 0 ? 'text-red-600' : 'text-primary'}`}>
                        ₦{Number(driver.account?.current_balance || driver.current_balance || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {canEditDelete && (
                    <div className="pt-4 flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-accent/10 text-accent border-accent/20 hover:bg-accent hover:text-white"
                        onClick={() => setShowAdjustDialog(true)}
                      >
                        Adjust Account Balance
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Weekly Transactions */}
            <div>
              <h3 className="font-semibold mb-4">This Week's Transactions</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date/Time</TableHead>
                    <TableHead>Job ID</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Balance After</TableHead>
                    {canEditDelete && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions?.map((transaction: any) => (
                    <TableRow key={transaction.id}>
                      <TableCell>{format(new Date(transaction.transaction_date), "MMM dd, HH:mm")}</TableCell>
                      <TableCell>{transaction.job_id || "-"}</TableCell>
                      <TableCell
                        className={`text-right font-medium ${transaction.transaction_type === "expense" || transaction.transaction_type === "manual_debit"
                          ? "text-red-600"
                          : "text-green-600"
                          }`}
                      >
                        {transaction.transaction_type === "expense" || transaction.transaction_type === "manual_debit"
                          ? "-"
                          : "+"}
                        ₦{transaction.amount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ₦{transaction.balance_after?.toLocaleString() || "0"}
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
                  {!transactions?.length && (
                    <TableRow>
                      <TableCell colSpan={canEditDelete ? 5 : 4} className="text-center text-muted-foreground">
                        No transactions this week
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Edit Dialog */}
      {editTransaction && (
        <EditDriverTransactionDialog
          open={!!editTransaction}
          onOpenChange={(open) => !open && setEditTransaction(null)}
          transaction={editTransaction}
          onTransactionUpdated={() => mutate()}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Transaction"
        description="Are you sure you want to delete this transaction? This action cannot be undone."
        loading={isDeleting}
      />

      {showAdjustDialog && (
        <AdjustBalanceDialog
          open={showAdjustDialog}
          onOpenChange={setShowAdjustDialog}
          driverId={driver.id}
          driverName={driver.full_name}
          currentBalance={Number(driver.account?.current_balance || driver.current_balance || 0)}
          onSuccess={() => {
            mutate()
            globalMutate("/api/driver-spending/drivers")
            globalMutate("/api/driver-spending/summary")
          }}
        />
      )}
    </>
  )
}
