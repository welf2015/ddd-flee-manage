"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState } from "react"
import { updateBookingStatus } from "@/app/actions/bookings"
import { toast } from "sonner"

type UpdateJobStatusDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  booking: any
  onSuccess: () => void
}

export function UpdateJobStatusDialog({ open, onOpenChange, booking, onSuccess }: UpdateJobStatusDialogProps) {
  const [status, setStatus] = useState(booking.status)
  const [loading, setLoading] = useState(false)

  const availableStatuses = ["Assigned", "In Progress", "In Transit"]

  const handleUpdate = async () => {
    if (status === booking.status) {
      toast.error("Please select a different status")
      return
    }

    setLoading(true)
    const result = await updateBookingStatus(booking.id, status)
    setLoading(false)

    if (result.success) {
      toast.success("Status updated successfully")
      onSuccess()
    } else {
      toast.error(result.error || "Failed to update status")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-background/95 backdrop-blur-xl border-border/50">
        <DialogHeader>
          <DialogTitle>Update Job Status</DialogTitle>
          <DialogDescription>Change the current status of this job</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Current Status</Label>
            <div className="p-3 rounded-lg bg-muted/50 text-sm">{booking.status}</div>
          </div>

          <div className="space-y-2">
            <Label>New Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableStatuses.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={loading} className="flex-1 bg-green-600 hover:bg-green-700">
              {loading ? "Updating..." : "Update Status"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
