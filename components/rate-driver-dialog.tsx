"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Star } from "lucide-react"
import { useState } from "react"
import { rateDriver } from "@/app/actions/drivers"
import { toast } from "sonner"

type RateDriverDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  booking: any
  onSuccess: () => void
}

export function RateDriverDialog({ open, onOpenChange, booking, onSuccess }: RateDriverDialogProps) {
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [feedback, setFeedback] = useState("")
  const [clientFeedback, setClientFeedback] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Please select a rating")
      return
    }

    setLoading(true)
    const result = await rateDriver(booking.assigned_driver_id, booking.id, {
      rating,
      feedback,
      clientFeedback,
    })
    setLoading(false)

    if (result.success) {
      toast.success("Driver rating submitted successfully")
      onSuccess()
    } else {
      toast.error(result.error || "Failed to submit rating")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-background/95 backdrop-blur-xl border-border/50">
        <DialogHeader>
          <DialogTitle>Rate Driver Performance</DialogTitle>
          <DialogDescription>Provide feedback for {booking.driver?.full_name} on this completed job</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label>Rating *</Label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= (hoveredRating || rating) ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Your Feedback</Label>
            <Textarea
              placeholder="Enter your feedback about the driver's performance..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Client Feedback</Label>
            <Textarea
              placeholder="Enter any feedback received from the client..."
              value={clientFeedback}
              onChange={(e) => setClientFeedback(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading} className="flex-1 bg-green-600 hover:bg-green-700">
              {loading ? "Submitting..." : "Submit Rating"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
