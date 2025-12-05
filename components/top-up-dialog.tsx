"use client"

import type React from "react"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { addTopUp } from "@/app/actions/expenses"

type TopUpDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  accountId: string
  accountName: string
  onSuccess?: () => void
}

export function TopUpDialog({ open, onOpenChange, accountId, accountName, onSuccess }: TopUpDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [topupType, setTopupType] = useState<"topup" | "refund">("topup")
  const [amount, setAmount] = useState("")
  const [receiptNumber, setReceiptNumber] = useState("")
  const [notes, setNotes] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const result = await addTopUp(accountId, {
        amount: Number.parseFloat(amount),
        topupType,
        receiptNumber: receiptNumber || undefined,
        notes: notes || undefined,
      })

      if (result.success) {
        toast.success(topupType === "topup" ? "Top-up added successfully" : "Refund recorded successfully")
        onOpenChange(false)
        onSuccess?.()
        // Reset form
        setAmount("")
        setReceiptNumber("")
        setNotes("")
        setTopupType("topup")
      } else {
        toast.error(result.error || "Failed to add top-up")
      }
    } catch (error) {
      console.error("Error adding top-up:", error)
      toast.error("An error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{topupType === "topup" ? "Add Top-up" : "Record Refund"}</DialogTitle>
          <DialogDescription>
            {topupType === "topup" ? `Add funds to ${accountName}` : `Record a refund for ${accountName}`}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="topup_type">Type</Label>
              <Select value={topupType} onValueChange={(v) => setTopupType(v as "topup" | "refund")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="topup">Top-up</SelectItem>
                  <SelectItem value="refund">Refund</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="amount">Amount (₦)</Label>
              <Input
                id="amount"
                type="number"
                min="0"
                step="0.01"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="receipt_number">Receipt Number (Optional)</Label>
              <Input
                id="receipt_number"
                placeholder="e.g., RCP-001234"
                value={receiptNumber}
                onChange={(e) => setReceiptNumber(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : topupType === "topup" ? "Add Top-up" : "Record Refund"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
