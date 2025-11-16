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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Plus } from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createDriver } from "@/app/actions/drivers"
import { createClient } from "@/lib/supabase/client"

export function CreateDriverDialog() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [vehicles, setVehicles] = useState<any[]>([])
  const router = useRouter()

  useEffect(() => {
    if (open) {
      fetchVehicles()
    }
  }, [open])

  const fetchVehicles = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from("vehicles")
      .select("id, vehicle_number, make, model, vehicle_type")
      .eq("status", "Active")
      .order("vehicle_number")

    if (data) {
      setVehicles(data)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    console.log("[v0] Starting driver creation...")
    const formData = new FormData(e.currentTarget)

    // Log form data
    for (const [key, value] of formData.entries()) {
      console.log(`[v0] Form field ${key}:`, value)
    }

    const result = await createDriver(formData)
    console.log("[v0] Create driver result:", result)

    if (result.success) {
      setOpen(false)
      router.refresh()
    } else {
      alert(result.error || "Failed to create driver")
    }

    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-accent hover:bg-accent/90">
          <Plus className="mr-2 h-4 w-4" />
          Add Driver
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl bg-background/95 backdrop-blur-xl border-border/50 max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add New Driver</DialogTitle>
            <DialogDescription>Add a new driver to your fleet with all necessary information</DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            <div className="grid gap-2">
              <Label htmlFor="photo_url">Driver Photo URL (Optional)</Label>
              <Input id="photo_url" name="photo_url" type="url" placeholder="https://example.com/photo.jpg" />
              <p className="text-xs text-muted-foreground">Upload photo to a service and paste the URL here</p>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Personal Information</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="full_name">Full Name *</Label>
                  <Input id="full_name" name="full_name" placeholder="John Doe" required />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input id="phone" name="phone" type="tel" placeholder="+234 800 000 0000" required />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="address">Address</Label>
                <Textarea id="address" name="address" placeholder="Full residential address" rows={2} />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-lg">License Information</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="license_number">License Number *</Label>
                  <Input id="license_number" name="license_number" placeholder="DL-123456" required />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="license_expiry">License Expiry Date</Label>
                  <Input id="license_expiry" name="license_expiry" type="date" />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Emergency Contact</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="emergency_contact_name">Contact Name</Label>
                  <Input id="emergency_contact_name" name="emergency_contact_name" placeholder="Jane Doe" />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="emergency_contact_phone">Contact Phone</Label>
                  <Input
                    id="emergency_contact_phone"
                    name="emergency_contact_phone"
                    type="tel"
                    placeholder="+234 800 000 0000"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="emergency_contact_relationship">Relationship</Label>
                  <Select name="emergency_contact_relationship">
                    <SelectTrigger>
                      <SelectValue placeholder="Select relationship" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Spouse">Spouse</SelectItem>
                      <SelectItem value="Parent">Parent</SelectItem>
                      <SelectItem value="Sibling">Sibling</SelectItem>
                      <SelectItem value="Child">Child</SelectItem>
                      <SelectItem value="Friend">Friend</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Vehicle Assignment</h3>
              <div className="grid gap-2">
                <Label htmlFor="assigned_vehicle_id">Assign Vehicle (Optional)</Label>
                <Select name="assigned_vehicle_id">
                  <SelectTrigger>
                    <SelectValue placeholder="Select a vehicle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No vehicle</SelectItem>
                    {vehicles.map((vehicle) => (
                      <SelectItem key={vehicle.id} value={vehicle.id}>
                        {vehicle.vehicle_number} - {vehicle.make} {vehicle.model} ({vehicle.vehicle_type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" className="bg-accent hover:bg-accent/90" disabled={loading}>
              {loading ? "Adding..." : "Add Driver"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
