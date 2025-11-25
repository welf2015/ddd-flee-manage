"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { updateBooking } from "@/app/actions/bookings"

type UpdateJobDetailsDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  booking: any
  onSuccess: () => void
}

export function UpdateJobDetailsDialog({
  open,
  onOpenChange,
  booking,
  onSuccess,
}: UpdateJobDetailsDialogProps) {
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    client_address: "",
    pickup_address: "",
    delivery_address: "",
    destination_contact_name: "",
    destination_contact_phone: "",
    request_details: "",
    route: "",
    timeline: "",
    number_of_loads: "",
  })

  useEffect(() => {
    if (booking && open) {
      setFormData({
        client_address: booking.client_address || "",
        pickup_address: booking.pickup_address || "",
        delivery_address: booking.delivery_address || "",
        destination_contact_name: booking.destination_contact_name || "",
        destination_contact_phone: booking.destination_contact_phone || "",
        request_details: booking.request_details || "",
        route: booking.route || "",
        timeline: booking.timeline || "",
        number_of_loads: booking.number_of_loads?.toString() || "",
      })
    }
  }, [booking, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const form = new FormData()
      form.append("client_address", formData.client_address)
      form.append("pickup_address", formData.pickup_address)
      form.append("delivery_address", formData.delivery_address)
      form.append("destination_contact_name", formData.destination_contact_name)
      form.append("destination_contact_phone", formData.destination_contact_phone)
      form.append("request_details", formData.request_details)
      form.append("route", formData.route)
      form.append("timeline", formData.timeline)
      form.append("number_of_loads", formData.number_of_loads)

      const result = await updateBooking(booking.id, form)

      if (result.success) {
        toast.success("Job details updated successfully")
        onSuccess()
        onOpenChange(false)
      } else {
        toast.error(result.error || "Failed to update job details")
      }
    } catch (error) {
      console.error("Error updating job details:", error)
      toast.error("An error occurred while updating job details")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Update Job Details</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="client_address">Client Address</Label>
              <Input
                id="client_address"
                value={formData.client_address}
                onChange={(e) => setFormData({ ...formData, client_address: e.target.value })}
                placeholder="Enter client address"
              />
            </div>

            <div>
              <Label htmlFor="route">Route</Label>
              <Input
                id="route"
                value={formData.route}
                onChange={(e) => setFormData({ ...formData, route: e.target.value })}
                placeholder="e.g., Lagos → Abuja"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="pickup_address">Pickup Address</Label>
            <Input
              id="pickup_address"
              value={formData.pickup_address}
              onChange={(e) => setFormData({ ...formData, pickup_address: e.target.value })}
              placeholder="Enter pickup address"
            />
          </div>

          <div>
            <Label htmlFor="delivery_address">Delivery Address</Label>
            <Input
              id="delivery_address"
              value={formData.delivery_address}
              onChange={(e) => setFormData({ ...formData, delivery_address: e.target.value })}
              placeholder="Enter delivery address"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="destination_contact_name">Destination Contact Name</Label>
              <Input
                id="destination_contact_name"
                value={formData.destination_contact_name}
                onChange={(e) => setFormData({ ...formData, destination_contact_name: e.target.value })}
                placeholder="Recipient name"
              />
            </div>
            <div>
              <Label htmlFor="destination_contact_phone">Destination Contact Phone</Label>
              <Input
                id="destination_contact_phone"
                value={formData.destination_contact_phone}
                onChange={(e) => setFormData({ ...formData, destination_contact_phone: e.target.value })}
                placeholder="Recipient phone"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="request_details">Request Details</Label>
            <Textarea
              id="request_details"
              value={formData.request_details}
              onChange={(e) => setFormData({ ...formData, request_details: e.target.value })}
              placeholder="Enter request details"
              rows={4}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="timeline">Timeline</Label>
              <Input
                id="timeline"
                value={formData.timeline}
                onChange={(e) => setFormData({ ...formData, timeline: e.target.value })}
                placeholder="e.g., 3 days"
              />
            </div>

            <div>
              <Label htmlFor="number_of_loads">Number of Loads</Label>
              <Input
                id="number_of_loads"
                type="number"
                value={formData.number_of_loads}
                onChange={(e) => setFormData({ ...formData, number_of_loads: e.target.value })}
                placeholder="Enter number of loads"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

