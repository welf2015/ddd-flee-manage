"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { addAccountTopup, getPrepaidAccounts } from "@/app/actions/expenses"
import { toast } from "sonner"
import useSWR from "swr"

type AddTopupDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  accountId?: string
}

export function AddTopupDialog({ open, onOpenChange, accountId }: AddTopupDialogProps) {
  const [amount, setAmount] = useState("")
  const [receiptNumber, setReceiptNumber] = useState("")
  const [notes, setNotes] = useState("")
  const [selectedAccount, setSelectedAccount] = useState(accountId || "")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { data: accounts = [] } = useSWR(open ? "all-accounts" : null, async () => {
    const { data } = await getPrepaidAccounts()
    return data || []
  })

  useEffect(() => {
    if (accountId) {
      setSelectedAccount(accountId)
    }
  }, [accountId])

  useEffect(() => {
    if (!open) {
      setAmount("")
      setReceiptNumber("")
      setNotes("")
      setSelectedAccount(accountId || "")
    }
  }, [open, accountId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedAccount) {
      toast.error("Please select an account")
      return
    }

    const amountNum = Number.parseFloat(amount)
    if (!amountNum || amountNum <= 0) {
      toast.error("Please enter a valid amount")
      return
    }

    setIsSubmitting(true)
    const result = await addAccountTopup(selectedAccount, {
      amount: amountNum,
      receiptNumber: receiptNumber || undefined,
      notes: notes || undefined,
    })

    setIsSubmitting(false)

    if (result.success) {
      toast.success("Top-up added successfully")
      onOpenChange(false)
    } else {
      toast.error(result.error || "Failed to add top-up")
    }
  }

  const selectedAccountData = accounts.find((a: any) => a.id === selectedAccount)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Top-up</DialogTitle>
          <DialogDescription>
            Enter the total amount paid. This will be added to the account balance (clears negative if any).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Select Account</Label>
            <Select value={selectedAccount} onValueChange={setSelectedAccount} disabled={!!accountId}>
              <SelectTrigger>
                <SelectValue placeholder="Select an account" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account: any) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.account_name} ({account.vendor?.vendor_name})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedAccountData && (
              <p className="text-xs text-muted-foreground">
                Current Balance:{" "}
                <span
                  className={
                    selectedAccountData.current_balance < 0 ? "text-red-500 font-medium" : "font-medium"
                  }
                >
                  ₦{selectedAccountData.current_balance.toLocaleString()}
                </span>
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">
              Total Amount Paid <span className="text-red-500">*</span>
            </Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter total amount paid"
              required
            />
            <p className="text-xs text-muted-foreground">
              Enter the total amount you paid. This will be added to the current balance.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="receiptNumber">Receipt Number</Label>
            <Input
              id="receiptNumber"
              value={receiptNumber}
              onChange={(e) => setReceiptNumber(e.target.value)}
              placeholder="Optional receipt number"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes"
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? "Adding..." : "Add Top-up"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

