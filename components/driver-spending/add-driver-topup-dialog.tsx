"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import useSWR from "swr"
import { addDriverTopup } from "@/app/actions/driver-spending"
import { toast } from "sonner"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface AddDriverTopupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export default function AddDriverTopupDialog({ open, onOpenChange, onSuccess }: AddDriverTopupDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    driverId: "",
    amount: "",
    notes: "",
  })

  const { data: drivers } = useSWR("/api/drivers", fetcher)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await addDriverTopup({
        driver_id: formData.driverId,
        amount: Number.parseFloat(formData.amount),
        notes: formData.notes,
      })

      if (result.success) {
        toast.success("Top-up added successfully")
        onOpenChange(false)
        setFormData({ driverId: "", amount: "", notes: "" })
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
          <DialogTitle>Add Driver Top-up</DialogTitle>
          <DialogDescription>Add funds to a driver's spending account</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="driver">Driver</Label>
            <Select value={formData.driverId} onValueChange={(value) => setFormData({ ...formData, driverId: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select driver" />
              </SelectTrigger>
              <SelectContent>
                {Array.isArray(drivers) &&
                  drivers.map((driver: any) => (
                    <SelectItem key={driver.id} value={driver.id}>
                      {driver.full_name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

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
