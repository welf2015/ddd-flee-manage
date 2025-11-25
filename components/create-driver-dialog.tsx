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

    const formData = new FormData(e.currentTarget)

    const tempLicenseNumber = `TEMP-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    formData.set("license_number", tempLicenseNumber)

    const result = await createDriver(formData)

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
      <DialogContent className="max-w-md bg-background/95 backdrop-blur-xl border-border/50">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add New Driver</DialogTitle>
            <DialogDescription>Add a driver and assign them to a vehicle</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="full_name">Driver Name *</Label>
              <Input id="full_name" name="full_name" placeholder="John Doe" required />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="assigned_vehicle_id">Assign Vehicle *</Label>
              <Select name="assigned_vehicle_id" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select a vehicle" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.vehicle_number} - {vehicle.make} {vehicle.model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <input type="hidden" name="phone" value="N/A" />
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
