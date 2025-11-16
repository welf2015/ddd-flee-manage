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
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, X } from "lucide-react"
import { useState } from "react"
import { createBooking } from "@/app/actions/bookings"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export function CreateBookingDialog() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [destinations, setDestinations] = useState([{ from: "", to: "" }])
  const [requiresWaybill, setRequiresWaybill] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)

    const route = destinations.map((d) => `${d.from} → ${d.to}`).join(", ")
    formData.set("route", route)
    formData.set("requires_waybill", requiresWaybill.toString())

    try {
      const result = await createBooking(formData)

      if (result.success) {
        toast.success("Booking created successfully")
        setOpen(false)
        router.refresh()
        ;(e.target as HTMLFormElement).reset()
        setDestinations([{ from: "", to: "" }])
        setRequiresWaybill(false)
      } else {
        toast.error(result.error || "Failed to create booking")
      }
    } catch (error) {
      toast.error("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  const addDestination = () => {
    setDestinations([...destinations, { from: "", to: "" }])
  }

  const removeDestination = (index: number) => {
    setDestinations(destinations.filter((_, i) => i !== index))
  }

  const updateDestination = (index: number, field: "from" | "to", value: string) => {
    const updated = [...destinations]
    updated[index][field] = value
    setDestinations(updated)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-accent hover:bg-accent/90">
          <Plus className="mr-2 h-4 w-4" />
          Create Booking
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto backdrop-blur-md bg-background/95">
        <DialogHeader>
          <DialogTitle>Create New Booking</DialogTitle>
          <DialogDescription>Add a new truck booking request to the system</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="text-sm text-muted-foreground">Job ID will be automatically generated</div>

            <div className="grid gap-2">
              <Label htmlFor="client_name">Client Name</Label>
              <Input id="client_name" name="client_name" placeholder="Company or person name" required />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="client_contact">Client Contact</Label>
              <Input id="client_contact" name="client_contact" placeholder="Phone or email" required />
            </div>

            <div className="grid gap-2">
              <Label>Route (Destinations)</Label>
              {destinations.map((dest, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <Input
                    placeholder="From (e.g., Lagos)"
                    value={dest.from}
                    onChange={(e) => updateDestination(index, "from", e.target.value)}
                    required
                  />
                  <span className="text-muted-foreground">→</span>
                  <Input
                    placeholder="To (e.g., Abuja)"
                    value={dest.to}
                    onChange={(e) => updateDestination(index, "to", e.target.value)}
                    required
                  />
                  {destinations.length > 1 && (
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeDestination(index)}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addDestination}
                className="w-fit bg-transparent"
              >
                <Plus className="mr-2 h-3 w-3" />
                Add Destination
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="number_of_loads">Number of Loads</Label>
                <Input id="number_of_loads" name="number_of_loads" type="number" placeholder="1" required />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="proposed_client_budget">Proposed Budget (₦)</Label>
                <Input
                  id="proposed_client_budget"
                  name="proposed_client_budget"
                  type="number"
                  placeholder="500000"
                  required
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="timeline">Timeline</Label>
              <Select name="timeline" required>
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
                placeholder="Describe the cargo, special requirements, etc."
                rows={4}
                required
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="requires_waybill"
                checked={requiresWaybill}
                onCheckedChange={(checked) => setRequiresWaybill(checked as boolean)}
              />
              <label
                htmlFor="requires_waybill"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                This job requires waybill documentation
              </label>
            </div>

            <input type="hidden" name="status" value="Open" />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-accent hover:bg-accent/90">
              {loading ? "Creating..." : "Create Booking"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
