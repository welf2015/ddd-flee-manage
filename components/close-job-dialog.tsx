"use client"

import type React from "react"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Upload } from "lucide-react"
import { useState } from "react"
import { closeBooking } from "@/app/actions/bookings"
import { toast } from "sonner"

type CloseJobDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  booking: any
  onSuccess: () => void
}

export function CloseJobDialog({ open, onOpenChange, booking, onSuccess }: CloseJobDialogProps) {
  const [waybillFile, setWaybillFile] = useState<File | null>(null)
  const [incidentReport, setIncidentReport] = useState("")
  const [additionalCosts, setAdditionalCosts] = useState("")
  const [actualCost, setActualCost] = useState("")
  const [hasIncident, setHasIncident] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setWaybillFile(e.target.files[0])
    }
  }

  const handleClose = async () => {
    if (booking.requires_waybill && !waybillFile) {
      toast.error("Please upload the waybill document")
      return
    }

    setLoading(true)

    // In a real app, you would upload the file to storage first
    const result = await closeBooking(booking.id, {
      waybillUrl: waybillFile ? "uploaded_waybill_url" : null,
      incidentReport: hasIncident ? incidentReport : null,
      additionalCosts,
      actualCost: actualCost ? Number.parseFloat(actualCost) : null,
    })

    setLoading(false)

    if (result.success) {
      toast.success("Job closed successfully")
      onSuccess()
    } else {
      toast.error(result.error || "Failed to close job")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-background/95 backdrop-blur-xl border-border/50">
        <DialogHeader>
          <DialogTitle>Close Job</DialogTitle>
          <DialogDescription>Complete the job and upload required documents</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          {booking.requires_waybill && (
            <div className="space-y-2">
              <Label>Waybill Document *</Label>
              <div className="border-2 border-dashed rounded-lg p-4 hover:bg-muted/50 transition-colors">
                <input
                  type="file"
                  id="waybill"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label htmlFor="waybill" className="flex flex-col items-center gap-2 cursor-pointer">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {waybillFile ? waybillFile.name : "Click to upload waybill"}
                  </span>
                </label>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Actual Cost</Label>
            <Input
              type="number"
              placeholder="Enter actual cost incurred"
              value={actualCost}
              onChange={(e) => setActualCost(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Additional Costs</Label>
            <Textarea
              placeholder="Describe any additional costs (fuel, tolls, parking, etc.)"
              value={additionalCosts}
              onChange={(e) => setAdditionalCosts(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="incident"
              checked={hasIncident}
              onCheckedChange={(checked) => setHasIncident(checked as boolean)}
            />
            <label
              htmlFor="incident"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Report an incident
            </label>
          </div>

          {hasIncident && (
            <div className="space-y-2">
              <Label>Incident Report</Label>
              <Textarea
                placeholder="Describe the incident that occurred during this job"
                value={incidentReport}
                onChange={(e) => setIncidentReport(e.target.value)}
                rows={4}
              />
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleClose} disabled={loading} className="flex-1 bg-green-600 hover:bg-green-700">
            {loading ? "Closing Job..." : "Close Job"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
