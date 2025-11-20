"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState } from "react"
import { updateBooking } from "@/app/actions/bookings"
import { toast } from "sonner"

type EditBookingDialogProps = {
  booking: any
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function EditBookingDialog({ booking, open, onOpenChange, onSuccess }: EditBookingDialogProps) {
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)

    try {
      const result = await updateBooking(booking.id, formData)

      if (result.success) {
        toast.success("Booking updated successfully")
        onSuccess()
        onOpenChange(false)
      } else {
        toast.error(result.error || "Failed to update booking")
      }
    } catch (error) {
      toast.error("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Booking</DialogTitle>
          <DialogDescription>Update booking details for {booking.job_id}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="company_name">Company Name</Label>
              <Input
                id="company_name"
                name="company_name"
                defaultValue={booking.company_name || ""}
                placeholder="Company name (optional)"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="client_name">Client Name</Label>
              <Input
                id="client_name"
                name="client_name"
                defaultValue={booking.client_name || ""}
                placeholder="Contact person name"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="client_address">Client/Company Address</Label>
              <Input
                id="client_address"
                name="client_address"
                defaultValue={booking.client_address || ""}
                placeholder="Full address"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="client_contact">Client Phone</Label>
                <Input
                  id="client_contact"
                  name="client_contact"
                  defaultValue={booking.client_contact || ""}
                  placeholder="Phone number"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="destination_contact_name">Destination Contact</Label>
                <Input
                  id="destination_contact_name"
                  name="destination_contact_name"
                  defaultValue={booking.destination_contact_name || ""}
                  placeholder="Recipient name"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="destination_contact_phone">Destination Phone</Label>
              <Input
                id="destination_contact_phone"
                name="destination_contact_phone"
                defaultValue={booking.destination_contact_phone || ""}
                placeholder="Recipient phone"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="route">Route</Label>
              <Input id="route" name="route" defaultValue={booking.route || ""} placeholder="From → To" required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="number_of_loads">Number of Loads</Label>
                <Input
                  id="number_of_loads"
                  name="number_of_loads"
                  type="number"
                  defaultValue={booking.number_of_loads || 1}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="proposed_client_budget">Proposed Budget (₦)</Label>
                <Input
                  id="proposed_client_budget"
                  name="proposed_client_budget"
                  type="number"
                  defaultValue={booking.proposed_client_budget || 0}
                  required
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="timeline">Timeline</Label>
              <Select name="timeline" defaultValue={booking.timeline || ""} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select timeline" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="4 hours">4 Hours</SelectItem>
                  <SelectItem value="5 hours">5 Hours</SelectItem>
                  <SelectItem value="8 hours">8 Hours</SelectItem>
                  <SelectItem value="1 day">1 Day</SelectItem>
                  <SelectItem value="2 days">2 Days</SelectItem>
                  <SelectItem value="3 days">3 Days</SelectItem>
                  <SelectItem value="4 days">4 Days</SelectItem>
                  <SelectItem value="5 days">5 Days</SelectItem>
                  <SelectItem value="1 week">1 Week</SelectItem>
                  <SelectItem value="2 weeks">2 Weeks</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="request_details">Request Details</Label>
              <Textarea
                id="request_details"
                name="request_details"
                defaultValue={booking.request_details || ""}
                placeholder="Describe the cargo, special requirements, etc."
                rows={4}
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-accent hover:bg-accent/90">
              {loading ? "Updating..." : "Update Booking"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
