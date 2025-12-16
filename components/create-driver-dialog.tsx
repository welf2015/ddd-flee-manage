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
import { createDriver, updateDriver } from "@/app/actions/drivers"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

type CreateDriverDialogProps = {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  driver?: any
  onSuccess?: () => void
}

export function CreateDriverDialog({ open: controlledOpen, onOpenChange, driver, onSuccess }: CreateDriverDialogProps = {}) {
  const isEditing = !!driver
  const [internalOpen, setInternalOpen] = useState(false)
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = onOpenChange || setInternalOpen

  const [loading, setLoading] = useState(false)
  const [vehicles, setVehicles] = useState<any[]>([])
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "N/A",
    assigned_vehicle_id: "",
  })
  const router = useRouter()

  useEffect(() => {
    if (open) {
      fetchVehicles()
      if (driver) {
        setFormData({
          full_name: driver.full_name || "",
          phone: driver.phone || "N/A",
          assigned_vehicle_id: driver.assigned_vehicle_id || "",
        })
      } else {
        setFormData({
          full_name: "",
          phone: "N/A",
          assigned_vehicle_id: "",
        })
      }
    }
  }, [open, driver])

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

    if (isEditing && driver) {
      // Update existing driver
      const result = await updateDriver(driver.id, {
        full_name: formData.full_name,
        phone: formData.phone,
        assigned_vehicle_id: formData.assigned_vehicle_id,
        status: driver.status,
        license_number: driver.license_number,
      })

      if (result.success) {
        toast.success("Driver updated successfully")
        setOpen(false)
        onSuccess?.()
        router.refresh()
      } else {
        toast.error(result.error || "Failed to update driver")
      }
    } else {
      // Create new driver
      const formDataObj = new FormData(e.currentTarget)

      const tempLicenseNumber = `TEMP-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
      formDataObj.set("license_number", tempLicenseNumber)

      const result = await createDriver(formDataObj)

      if (result.success) {
        toast.success("Driver created successfully")
        setOpen(false)
        router.refresh()
      } else {
        toast.error(result.error || "Failed to create driver")
      }
    }

    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isEditing && (
        <DialogTrigger asChild>
          <Button className="bg-accent hover:bg-accent/90">
            <Plus className="mr-2 h-4 w-4" />
            Add Driver
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-md bg-background/95 backdrop-blur-xl border-border/50">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit Driver" : "Add New Driver"}</DialogTitle>
            <DialogDescription>
              {isEditing ? "Update driver information" : "Add a driver and assign them to a vehicle"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="full_name">Driver Name *</Label>
              <Input
                id="full_name"
                name="full_name"
                placeholder="John Doe"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="assigned_vehicle_id">Assign Vehicle {!isEditing && "*"}</Label>
              <Select
                name="assigned_vehicle_id"
                value={formData.assigned_vehicle_id || "none"}
                onValueChange={(value) => setFormData({ ...formData, assigned_vehicle_id: value === "none" ? "" : value })}
                required={!isEditing}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a vehicle" />
                </SelectTrigger>
                <SelectContent>
                  {isEditing && <SelectItem value="none">None (Unassigned)</SelectItem>}
                  {vehicles.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.vehicle_number} - {vehicle.make} {vehicle.model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <input type="hidden" name="phone" value={formData.phone} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" className="bg-accent hover:bg-accent/90" disabled={loading}>
              {loading ? (isEditing ? "Saving..." : "Adding...") : (isEditing ? "Save" : "Add Driver")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
