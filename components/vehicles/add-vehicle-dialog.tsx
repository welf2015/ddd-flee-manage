"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { createVehicleWithOnboarding } from "@/app/actions/vehicles"
import { toast } from "sonner"

interface AddVehicleDialogProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function AddVehicleDialog({ open, onClose, onSuccess }: AddVehicleDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    vehicle_number: "",
    vehicle_type: "",
    make: "",
    model: "",
    year: new Date().getFullYear(),
    status: "Active",
    createOnboarding: true,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await createVehicleWithOnboarding(formData)

      if (result.success) {
        toast.success(
          formData.createOnboarding ? "Vehicle added and onboarding initiated" : "Vehicle added successfully",
        )
        onSuccess?.()
        onClose()
        setFormData({
          vehicle_number: "",
          vehicle_type: "",
          make: "",
          model: "",
          year: new Date().getFullYear(),
          status: "Active",
          createOnboarding: true,
        })
      } else {
        toast.error(result.error || "Failed to add vehicle")
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Vehicle</DialogTitle>
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
                <SelectItem value="Van">Van</SelectItem>
                <SelectItem value="Trailer">Trailer</SelectItem>
                <SelectItem value="Flatbed">Flatbed</SelectItem>
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

          <div className="flex items-center space-x-2">
            <Checkbox
              id="createOnboarding"
              checked={formData.createOnboarding}
              onCheckedChange={(checked) => setFormData({ ...formData, createOnboarding: checked as boolean })}
            />
            <Label htmlFor="createOnboarding" className="cursor-pointer text-sm">
              Create onboarding checklist for this vehicle
            </Label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-accent text-accent-foreground hover:bg-accent/90">
              {loading ? "Adding..." : "Add Vehicle"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
