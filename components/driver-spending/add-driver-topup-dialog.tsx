"use client"

import type React from "react"
import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { addDriverTopup } from "@/app/actions/driver-spending"
import { toast } from "sonner"

interface AddDriverTopupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export default function AddDriverTopupDialog({ open, onOpenChange, onSuccess }: AddDriverTopupDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    amount: "",
    notes: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await addDriverTopup({
        driver_id: "CENTRAL_WALLET", // Will be handled by getCentralWallet() function
        amount: Number.parseFloat(formData.amount),
        notes: formData.notes || "Central Driver Wallet Top-up",
      })

      if (result.success) {
        toast.success("Top-up added to driver wallet successfully")
        onOpenChange(false)
        setFormData({ amount: "", notes: "" })
        onSuccess?.()
      } else {
        toast.error(result.error || "Failed to add top-up")
      }
    } catch (error) {
      toast.error("An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Driver Wallet Top-up</DialogTitle>
          <DialogDescription>Add funds to the central driver spending wallet</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (₦)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Optional notes..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add Top-up"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
