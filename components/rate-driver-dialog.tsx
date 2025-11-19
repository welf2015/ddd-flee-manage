"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useState } from "react"
import { toast } from "sonner"
import cn from "classnames"

type RateDriverDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  booking: any
  onSuccess: () => void
}

export function RateDriverDialog({ open, onOpenChange, booking, onSuccess }: RateDriverDialogProps) {
  const [loading, setLoading] = useState(false)
  const [driverRating, setDriverRating] = useState(booking.driver_rating || 0)
  const [punctualityRating, setPunctualityRating] = useState(booking.punctuality_rating || 0)
  const [vehicleConditionRating, setVehicleConditionRating] = useState(booking.vehicle_condition_rating || 0)
  const [communicationRating, setCommunicationRating] = useState(booking.communication_rating || 0)
  const [feedback, setFeedback] = useState(booking.driver_feedback || "")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (driverRating === 0) {
      toast.error("Please provide a driver behavior rating")
      return
    }

    setLoading(true)

    const formData = new FormData()
    formData.append("booking_id", booking.id)
    formData.append("driver_rating", driverRating.toString())
    formData.append("punctuality_rating", punctualityRating.toString())
    formData.append("vehicle_condition_rating", vehicleConditionRating.toString())
    formData.append("communication_rating", communicationRating.toString())
    formData.append("feedback", feedback)

    try {
      const { saveDriverFeedback } = await import("@/app/actions/bookings")
      const result = await saveDriverFeedback(formData)

      if (result.success) {
        toast.success("Driver feedback submitted successfully")
        onSuccess()
        onOpenChange(false)
      } else {
        toast.error(result.error || "Failed to submit feedback")
      }
    } catch (error) {
      toast.error("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  const StarRating = ({ rating, setRating, label }: { rating: number; setRating: (n: number) => void; label: string }) => (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            className="transition-transform hover:scale-110"
          >
            <svg
              className={cn(
                "h-8 w-8 cursor-pointer transition-colors",
                star <= rating ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-200 hover:fill-yellow-200 hover:text-yellow-200"
              )}
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </button>
        ))}
        <span className="ml-2 text-sm font-semibold">{rating}/5</span>
      </div>
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Submit Driver Feedback</DialogTitle>
          <DialogDescription>
            Call the customer at <span className="font-semibold">{booking.client_contact}</span> to collect feedback about the driver's performance
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-6 py-4">
            <StarRating rating={driverRating} setRating={setDriverRating} label="Driver Behavior (Required)" />
            <StarRating rating={punctualityRating} setRating={setPunctualityRating} label="Punctuality" />
            <StarRating rating={vehicleConditionRating} setRating={setVehicleConditionRating} label="Vehicle Condition" />
            <StarRating rating={communicationRating} setRating={setCommunicationRating} label="Communication" />

            <div className="space-y-2">
              <Label htmlFor="feedback">Additional Comments (Optional)</Label>
              <Textarea
                id="feedback"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Enter any additional feedback from the customer..."
                rows={4}
              />
            </div>

            <div className="bg-muted/50 p-4 rounded-lg space-y-2">
              <p className="text-sm font-medium">Driver Information:</p>
              <p className="text-sm text-muted-foreground">
                <span className="font-medium">Name:</span> {booking.driver?.full_name || "N/A"}
              </p>
              <p className="text-sm text-muted-foreground">
                <span className="font-medium">Job:</span> {booking.job_id}
              </p>
              <p className="text-sm text-muted-foreground">
                <span className="font-medium">Route:</span> {booking.route}
              </p>
            </div>

            <p className="text-xs text-muted-foreground">
              This feedback will be attached to the driver's profile and contribute to their overall rating for future job assignments.
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-accent hover:bg-accent/90">
              {loading ? "Submitting..." : "Submit Feedback"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
