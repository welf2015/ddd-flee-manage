"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { updateVehicle } from "@/app/actions/vehicles"
import { useToast } from "@/hooks/use-toast"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface EditVehicleDialogProps {
  open: boolean
  onClose: () => void
  vehicle: any
  onSuccess?: () => void
}

export function EditVehicleDialog({ open, onClose, vehicle, onSuccess }: EditVehicleDialogProps) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    vehicle_number: vehicle?.vehicle_number || "",
    vehicle_type: vehicle?.vehicle_type || "",
    make: vehicle?.make || "",
    model: vehicle?.model || "",
    year: vehicle?.year || new Date().getFullYear(),
    status: vehicle?.status || "Active",
    registration_date: vehicle?.registration_date ? new Date(vehicle.registration_date) : undefined,
    registration_expiry_date: vehicle?.registration_expiry_date
      ? new Date(vehicle.registration_expiry_date)
      : undefined,
    insurance_expiry_date: vehicle?.insurance_expiry_date ? new Date(vehicle.insurance_expiry_date) : undefined,
    road_worthiness_expiry_date: vehicle?.road_worthiness_expiry_date
      ? new Date(vehicle.road_worthiness_expiry_date)
      : undefined,
    hackney_permit_expiry_date: vehicle?.hackney_permit_expiry_date
      ? new Date(vehicle.hackney_permit_expiry_date)
      : undefined,
    vehicle_license_expiry_date: vehicle?.vehicle_license_expiry_date
      ? new Date(vehicle.vehicle_license_expiry_date)
      : undefined,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await updateVehicle(vehicle.id, formData)

      if (result.success) {
        toast({
          title: "Success",
          description: "Vehicle updated successfully",
        })
        onSuccess?.()
        onClose()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update vehicle",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An error occurred",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const DatePickerField = ({
    label,
    value,
    onChange,
  }: {
    label: string
    value: Date | undefined
    onChange: (date: Date | undefined) => void
  }) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn("w-full justify-start text-left font-normal", !value && "text-muted-foreground")}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value ? format(value, "PPP") : <span>Pick a date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar mode="single" selected={value} onSelect={onChange} initialFocus />
        </PopoverContent>
      </Popover>
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Vehicle</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="vehicle_number">Vehicle Number</Label>
            <Input
              id="vehicle_number"
              value={formData.vehicle_number}
              onChange={(e) => setFormData({ ...formData, vehicle_number: e.target.value })}
              placeholder="e.g., FLT-001"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="vehicle_type">Vehicle Type</Label>
            <Select
              value={formData.vehicle_type}
              onValueChange={(value) => setFormData({ ...formData, vehicle_type: value })}
            >
              <SelectTrigger id="vehicle_type">
                <SelectValue placeholder="Select vehicle type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Truck">Truck</SelectItem>
                <SelectItem value="Car">Car</SelectItem>
                <SelectItem value="Bike">Bike</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="make">Make</Label>
              <Input
                id="make"
                value={formData.make}
                onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                placeholder="e.g., Hino"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <Input
                id="model"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                placeholder="e.g., 500 Series"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="year">Year</Label>
              <Input
                id="year"
                type="number"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: Number.parseInt(e.target.value) })}
                min="1990"
                max={new Date().getFullYear() + 1}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                  <SelectItem value="Maintenance">Maintenance</SelectItem>
                  <SelectItem value="Retired">Retired</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="text-sm font-medium mb-3">Document Expiry Dates</h3>
            <div className="grid gap-4">
              <DatePickerField
                label="Registration Date"
                value={formData.registration_date}
                onChange={(date) => setFormData({ ...formData, registration_date: date })}
              />

              <DatePickerField
                label="Registration Expiry Date"
                value={formData.registration_expiry_date}
                onChange={(date) => setFormData({ ...formData, registration_expiry_date: date })}
              />

              <DatePickerField
                label="Insurance Expiry Date"
                value={formData.insurance_expiry_date}
                onChange={(date) => setFormData({ ...formData, insurance_expiry_date: date })}
              />

              <DatePickerField
                label="Road Worthiness Expiry Date"
                value={formData.road_worthiness_expiry_date}
                onChange={(date) => setFormData({ ...formData, road_worthiness_expiry_date: date })}
              />

              <DatePickerField
                label="Hackney Permit Expiry Date"
                value={formData.hackney_permit_expiry_date}
                onChange={(date) => setFormData({ ...formData, hackney_permit_expiry_date: date })}
              />

              <DatePickerField
                label="Vehicle License Expiry Date"
                value={formData.vehicle_license_expiry_date}
                onChange={(date) => setFormData({ ...formData, vehicle_license_expiry_date: date })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-accent text-accent-foreground hover:bg-accent/90">
              {loading ? "Updating..." : "Update Vehicle"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
