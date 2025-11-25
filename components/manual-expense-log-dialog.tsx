"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Fuel, Ticket, Wallet } from "lucide-react"
import { toast } from "sonner"
import { getPrepaidAccounts, createExpenseTransaction } from "@/app/actions/expenses"
import { formatCurrency } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"

type ManualExpenseLogDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  bookingId: string
  vehicleId?: string | null
  onSuccess: () => void
}

export function ManualExpenseLogDialog({
  open,
  onOpenChange,
  bookingId,
  vehicleId,
  onSuccess,
}: ManualExpenseLogDialogProps) {
  const [saving, setSaving] = useState(false)
  const [loadingAccounts, setLoadingAccounts] = useState(false)
  const [fuelAccount, setFuelAccount] = useState<any>(null)
  const [ticketingAccount, setTicketingAccount] = useState<any>(null)
  const [allowanceAccount, setAllowanceAccount] = useState<any>(null)
  
  const [fuelAmount, setFuelAmount] = useState("")
  const [fuelLiters, setFuelLiters] = useState("")
  const [ticketingAmount, setTicketingAmount] = useState("")
  const [allowanceAmount, setAllowanceAmount] = useState("")

  const supabase = createClient()

  useEffect(() => {
    if (open) {
      setLoadingAccounts(true)
      fetchAccounts().finally(() => setLoadingAccounts(false))
    } else {
      // Reset accounts when dialog closes
      setFuelAccount(null)
      setTicketingAccount(null)
      setAllowanceAccount(null)
    }
  }, [open])

  const fetchAccounts = async () => {
    try {
      const { data: accounts, error } = await getPrepaidAccounts()
      
      if (error) {
        console.error("Error fetching accounts:", error)
        toast.error("Failed to load accounts")
        return
      }

      if (!accounts || accounts.length === 0) {
        console.warn("No accounts found")
        return
      }
      
      // Filter and select best accounts
      const fuelOnly = accounts.filter((a: any) => a.vendor?.vendor_type === "Fuel")
      const ticketingOnly = accounts.filter((a: any) => a.vendor?.vendor_type === "Ticketing")
      const allowanceOnly = accounts.filter((a: any) => a.vendor?.vendor_type === "Allowance")

      const selectBestAccount = (accounts: any[]) => {
        if (accounts.length === 0) return null
        
        // Prefer account with actual data
        const withData = accounts.find((a: any) => 
          parseFloat(a.total_deposited || 0) > 0 || parseFloat(a.total_spent || 0) > 0
        )
        if (withData) {
          return {
            ...withData,
            current_balance: parseFloat(withData.current_balance || 0),
          }
        }
        
        // If all are zero, prefer the one with most recent update
        const sorted = accounts.sort((a: any, b: any) => 
          new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime()
        )
        return {
          ...sorted[0],
          current_balance: parseFloat(sorted[0].current_balance || 0),
        }
      }

      if (fuelOnly.length > 0) {
        const selected = selectBestAccount(fuelOnly)
        if (selected) {
          console.log("⛽ [Manual Expense] Setting fuel account:", selected.account_name, "Balance:", selected.current_balance)
          setFuelAccount(selected)
        }
      } else {
        console.warn("⚠️ [Manual Expense] No fuel account found")
      }

      if (ticketingOnly.length > 0) {
        const selected = selectBestAccount(ticketingOnly)
        if (selected) {
          console.log("🎫 [Manual Expense] Setting ticketing account:", selected.account_name, "Balance:", selected.current_balance)
          setTicketingAccount(selected)
        }
      } else {
        console.warn("⚠️ [Manual Expense] No ticketing account found")
      }

      if (allowanceOnly.length > 0) {
        const selected = selectBestAccount(allowanceOnly)
        if (selected) {
          console.log("💰 [Manual Expense] Setting allowance account:", selected.account_name, "Balance:", selected.current_balance)
          setAllowanceAccount(selected)
        }
      } else {
        console.warn("⚠️ [Manual Expense] No allowance account found")
      }
    } catch (error) {
      console.error("Error fetching accounts:", error)
      toast.error("Failed to load accounts")
    }
  }

  const handleSubmit = async () => {
    if (!fuelAccount) {
      toast.error("Fuel account not found. Please contact administrator.")
      return
    }

    setSaving(true)

    try {
      // Fuel transaction - always required for accounting
      if (fuelAccount) {
        const fuelAmt = fuelAmount ? parseFloat(fuelAmount) : 0
        const fuelLitersValue = fuelLiters ? parseFloat(fuelLiters) : undefined

        const fuelResult = await createExpenseTransaction(fuelAccount.id, {
          bookingId,
          vehicleId: vehicleId || undefined,
          expenseType: "Fuel",
          amount: fuelAmt,
          quantity: fuelLitersValue,
          unit: "Liters",
          notes: fuelAmt > 0 ? `Manual fuel log for booking ${bookingId}` : `No fuel expense for booking ${bookingId}`,
        })

        if (!fuelResult.success) {
          console.error("Failed to create fuel transaction:", fuelResult.error)
          toast.error(`Failed to log fuel expense: ${fuelResult.error}`)
        }
      }

      // Ticketing transaction
      if (ticketingAmount && ticketingAccount) {
        const ticketingResult = await createExpenseTransaction(ticketingAccount.id, {
          bookingId,
          vehicleId: vehicleId || undefined,
          expenseType: "Ticketing",
          amount: parseFloat(ticketingAmount),
          notes: `Manual ticketing log for booking ${bookingId}`,
        })
        if (!ticketingResult.success) {
          console.error("Failed to create ticketing transaction:", ticketingResult.error)
          toast.error(`Failed to log ticketing expense: ${ticketingResult.error}`)
        }
      }

      // Allowance transaction
      if (allowanceAmount && allowanceAccount) {
        const allowanceResult = await createExpenseTransaction(allowanceAccount.id, {
          bookingId,
          vehicleId: vehicleId || undefined,
          expenseType: "Allowance",
          amount: parseFloat(allowanceAmount),
          notes: `Manual allowance log for booking ${bookingId}`,
        })
        if (!allowanceResult.success) {
          console.error("Failed to create allowance transaction:", allowanceResult.error)
          toast.error(`Failed to log allowance expense: ${allowanceResult.error}`)
        }
      }

      toast.success("Expenses logged successfully")
      onSuccess()
      onOpenChange(false)
      
      // Reset form
      setFuelAmount("")
      setFuelLiters("")
      setTicketingAmount("")
      setAllowanceAmount("")
    } catch (error) {
      console.error("Error logging expenses:", error)
      toast.error("An error occurred while logging expenses")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Log Expenses Manually</DialogTitle>
          <DialogDescription>
            Record expenses for this booking. Fuel expense is required for accounting (can be 0).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Fuel Required */}
          <Card className="border-blue-500/20 bg-blue-500/5">
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Fuel className="h-5 w-5 text-blue-500" />
                <Label className="text-base font-semibold">Fuel Required</Label>
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="fuelAmount">
                      Amount (NGN) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="fuelAmount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={fuelAmount}
                      onChange={(e) => setFuelAmount(e.target.value)}
                      placeholder="0.00"
                      required
                    />
                    <p className="text-xs text-muted-foreground">Required for accounting. Enter 0 if no fuel needed.</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fuelLiters">Liters</Label>
                    <Input
                      id="fuelLiters"
                      type="number"
                      step="0.01"
                      min="0"
                      value={fuelLiters}
                      onChange={(e) => setFuelLiters(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div className="pt-2 border-t">
                  {loadingAccounts ? (
                    <p className="text-xs text-muted-foreground">Loading account balance...</p>
                  ) : fuelAccount ? (
                    <>
                      <p className="text-xs text-muted-foreground mb-1">Account Balance</p>
                      <p
                        className={`text-sm font-medium ${
                          (fuelAccount.current_balance || 0) < 0 ? "text-red-500" : "text-green-500"
                        }`}
                      >
                        {formatCurrency(fuelAccount.current_balance || 0, "NGN")}
                        {(fuelAccount.current_balance || 0) < 0 && " (Overdrawn)"}
                      </p>
                    </>
                  ) : (
                    <p className="text-xs text-muted-foreground">No fuel account found</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Government Ticketing */}
          <Card className="border-purple-500/20 bg-purple-500/5">
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Ticket className="h-5 w-5 text-purple-500" />
                <Label className="text-base font-semibold">Government Ticketing</Label>
              </div>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="ticketingAmount">Amount (NGN)</Label>
                  <Input
                    id="ticketingAmount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={ticketingAmount}
                    onChange={(e) => setTicketingAmount(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div className="pt-2 border-t">
                  {loadingAccounts ? (
                    <p className="text-xs text-muted-foreground">Loading account balance...</p>
                  ) : ticketingAccount ? (
                    <>
                      <p className="text-xs text-muted-foreground mb-1">Account Balance</p>
                      <p
                        className={`text-sm font-medium ${
                          (ticketingAccount.current_balance || 0) < 0 ? "text-red-500" : "text-green-500"
                        }`}
                      >
                        {formatCurrency(ticketingAccount.current_balance || 0, "NGN")}
                        {(ticketingAccount.current_balance || 0) < 0 && " (Overdrawn)"}
                      </p>
                    </>
                  ) : (
                    <p className="text-xs text-muted-foreground">No ticketing account found</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Driver Allowance */}
          <Card className="border-green-500/20 bg-green-500/5">
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Wallet className="h-5 w-5 text-green-500" />
                <Label className="text-base font-semibold">Driver Allowance</Label>
              </div>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="allowanceAmount">Amount (NGN)</Label>
                  <Input
                    id="allowanceAmount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={allowanceAmount}
                    onChange={(e) => setAllowanceAmount(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div className="pt-2 border-t">
                  {loadingAccounts ? (
                    <p className="text-xs text-muted-foreground">Loading account balance...</p>
                  ) : allowanceAccount ? (
                    <>
                      <p className="text-xs text-muted-foreground mb-1">Account Balance</p>
                      <p
                        className={`text-sm font-medium ${
                          (allowanceAccount.current_balance || 0) < 0 ? "text-red-500" : "text-green-500"
                        }`}
                      >
                        {formatCurrency(allowanceAccount.current_balance || 0, "NGN")}
                        {(allowanceAccount.current_balance || 0) < 0 && " (Overdrawn)"}
                      </p>
                    </>
                  ) : (
                    <p className="text-xs text-muted-foreground">No allowance account found</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving || !fuelAccount} className="bg-green-600 hover:bg-green-700">
            {saving ? "Logging..." : "Log Expenses"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
