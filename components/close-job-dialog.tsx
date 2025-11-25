"use client"

import type React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Upload, Loader2 } from "lucide-react"
import { useState, useEffect } from "react"
import { closeBooking } from "@/app/actions/bookings"
import { toast } from "sonner"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { TripExpenseDialog } from "@/components/trip-expense-dialog"

type CloseJobDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  booking: any
  onSuccess: () => void
}

export function CloseJobDialog({ open, onOpenChange, booking, onSuccess }: CloseJobDialogProps) {
  const [waybillFile, setWaybillFile] = useState<File | null>(null)
  const [incidentReport, setIncidentReport] = useState("")
  const [hasIncident, setHasIncident] = useState(false)
  const [loading, setLoading] = useState(false)
  const [workerUrl, setWorkerUrl] = useState("")
  const [authKey, setAuthKey] = useState("")
  const [uploadError, setUploadError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      const fetchConfig = async () => {
        try {
          const res = await fetch("/api/upload")
          if (res.ok) {
            const data = await res.json()
            setWorkerUrl(data.workerUrl)
            setAuthKey(data.authKey)
          }
        } catch (error) {
          console.error("Failed to fetch upload config", error)
        }
      }
      fetchConfig()
    }
  }, [open])

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
    let uploadedWaybillUrl: string | null = null

    try {
      if (waybillFile) {
        if (!workerUrl || !authKey) {
          throw new Error("Upload service not available")
        }

        // Construct worker URL with query parameters
        const workerUrlObj = new URL(workerUrl)
        workerUrlObj.searchParams.set("filename", waybillFile.name)
        workerUrlObj.searchParams.set("folder", `waybills/${booking.id}`)

        // Upload using PUT method with file body directly
        const uploadRes = await fetch(workerUrlObj.toString(), {
          method: "PUT",
          headers: {
            "X-Auth-Key": authKey,
            "Content-Type": waybillFile.type,
          },
          body: waybillFile,
        })

        if (!uploadRes.ok) {
          const errorText = await uploadRes.text()
          console.error("Upload error response:", errorText)
          throw new Error("Failed to upload waybill")
        }

        const data = await uploadRes.json()
        uploadedWaybillUrl = data.url || data.key || workerUrlObj.toString()
        console.log("Upload successful:", { url: uploadedWaybillUrl, data })
      }

      console.log("Calling closeBooking with:", {
        bookingId: booking.id,
        waybillUrl: uploadedWaybillUrl,
        hasIncident,
        incidentReport: hasIncident ? incidentReport : null,
      })

      const result = await closeBooking(booking.id, {
        waybillUrl: uploadedWaybillUrl,
        incidentReport: hasIncident ? incidentReport : null,
        additionalCosts: "",
        actualCost: null,
      })

      console.log("closeBooking result:", result)

      if (result.success) {
        toast.success("Job closed successfully")
        onSuccess()
        onOpenChange(false)
      } else {
        toast.error(result.error || "Failed to close job")
      }
    } catch (error: any) {
      console.error("Close job error:", error)
      setUploadError(error.message || "An error occurred")
      toast.error(error.message || "An error occurred while closing the job")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden bg-background/95 backdrop-blur-xl border-border/50">
        <DialogHeader>
          <DialogTitle>Close Job - {booking.job_id}</DialogTitle>
          <DialogDescription>Review expenses and complete the job</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="expenses" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="expenses">Trip Expenses</TabsTrigger>
            <TabsTrigger value="completion">Job Completion</TabsTrigger>
          </TabsList>

          <TabsContent value="expenses" className="space-y-4 max-h-[60vh] overflow-y-auto scrollbar-hide">
            <TripExpenseDialog bookingId={booking.id} embedded={true} onSuccess={() => {}} />
          </TabsContent>

          <TabsContent value="completion" className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 scrollbar-hide">
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
          </TabsContent>
        </Tabs>

        <div className="flex gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleClose} disabled={loading} className="flex-1 bg-green-600 hover:bg-green-700">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Complete & Close Job"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
