"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

type TripHoldDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  bookingId: string
  onSuccess: () => void
}

export function TripHoldDialog({ open, onOpenChange, bookingId, onSuccess }: TripHoldDialogProps) {
  const [holdReason, setHoldReason] = useState<string>("Breakdown")
  const [notes, setNotes] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!notes.trim()) {
      toast.error("Please provide details about the hold-up")
      return
    }

    setSubmitting(true)
    try {
      const { reportTripHold } = await import("@/app/actions/bookings")
      const result = await reportTripHold(bookingId, holdReason, notes)

      if (result.success) {
        toast.success("Trip hold reported")
        onSuccess()
        onOpenChange(false)
      } else {
        toast.error(result.error || "Failed to report hold")
      }
    } catch (error) {
      console.error("Error reporting hold:", error)
      toast.error("Failed to report hold")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report Trip Hold-Up</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Reason for Hold-Up</Label>
            <Select value={holdReason} onValueChange={setHoldReason}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Breakdown">Vehicle Breakdown</SelectItem>
                <SelectItem value="Road Safety">Road Safety Issues</SelectItem>
                <SelectItem value="Police Issues">Police Checkpoint/Issues</SelectItem>
                <SelectItem value="Accident">Accident</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Details</Label>
            <Textarea
              placeholder="Please provide details about the situation..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
            />
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting} className="flex-1">
              {submitting ? "Reporting..." : "Report Hold-Up"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
