"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { updateDriverTransaction } from "@/app/actions/driver-spending"
import { toast } from "sonner"

interface EditDriverTransactionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  transaction: any
  onTransactionUpdated: () => void
}

export default function EditDriverTransactionDialog({
  open,
  onOpenChange,
  transaction,
  onTransactionUpdated,
}: EditDriverTransactionDialogProps) {
  const [loading, setLoading] = useState(false)
  const [amount, setAmount] = useState(transaction.amount.toString())
  const [notes, setNotes] = useState(transaction.notes || "")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const newAmount = Number.parseFloat(amount)
      const oldAmount = transaction.amount

      // Determine adjustment type based on amount change
      let adjustmentType = null
      if (newAmount > oldAmount) {
        adjustmentType = "manual_debit" // Increased spending = debit adjustment
      } else if (newAmount < oldAmount) {
        adjustmentType = "refund" // Decreased spending = refund adjustment
      }

      const result = await updateDriverTransaction({
        transactionId: transaction.id,
        amount: newAmount,
        notes,
        adjustmentType,
      })

      if (result.success) {
        toast.success("Transaction updated successfully")
        onTransactionUpdated()
        onOpenChange(false)
      } else {
        toast.error(result.error || "Failed to update transaction")
      }
    } catch (error) {
      toast.error("An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const amountDifference = Number.parseFloat(amount) - transaction.amount
  const adjustmentLabel =
    amountDifference > 0 ? "Manual Debit Adjustment" : amountDifference < 0 ? "Refund Adjustment" : "No Adjustment"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Transaction</DialogTitle>
          <DialogDescription>Update transaction details. Changes will be logged as adjustments.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (₦)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
            {amountDifference !== 0 && (
              <p className={`text-sm ${amountDifference > 0 ? "text-red-600" : "text-green-600"}`}>
                {adjustmentLabel}: {amountDifference > 0 ? "+" : ""}₦{Math.abs(amountDifference).toLocaleString()}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Optional notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Updating..." : "Update Transaction"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
