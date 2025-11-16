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
import { useState } from "react"
import { createVehicle } from "@/app/actions/vehicles"
import { useRouter } from "next/navigation"

export function CreateVehicleDialog() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    console.log("[v0] Starting vehicle creation...")
    const formData = new FormData(e.currentTarget)

    // Log form data
    for (const [key, value] of formData.entries()) {
      console.log(`[v0] Form field ${key}:`, value)
    }

    const result = await createVehicle(formData)
    console.log("[v0] Create vehicle result:", result)

    if (result.success) {
      setOpen(false)
      router.refresh()
      ;(e.target as HTMLFormElement).reset()
    } else {
      alert(result.error || "Failed to create vehicle")
    }

    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-accent hover:bg-accent/90">
          <Plus className="mr-2 h-4 w-4" />
          Add Vehicle
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg bg-background/95 backdrop-blur-xl border-border/50">
        <DialogHeader>
          <DialogTitle>Add New Vehicle</DialogTitle>
          <DialogDescription>Add a new vehicle to your fleet</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="vehicle_number">Vehicle Number *</Label>
              <Input id="vehicle_number" name="vehicle_number" placeholder="TRK-001" required />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="vehicle_type">Vehicle Type *</Label>
              <Select name="vehicle_type" defaultValue="Truck" required>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Truck">Truck</SelectItem>
                  <SelectItem value="Car">Car</SelectItem>
                  <SelectItem value="Bike">Bike</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="make">Make *</Label>
                <Input id="make" name="make" placeholder="Mercedes-Benz" required />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="model">Model *</Label>
                <Input id="model" name="model" placeholder="Actros" required />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="year">Year *</Label>
              <Input id="year" name="year" type="number" placeholder="2024" min="1900" max="2100" required />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="status">Status *</Label>
              <Select name="status" defaultValue="Active" required>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="In Maintenance">In Maintenance</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" className="bg-accent hover:bg-accent/90" disabled={loading}>
              {loading ? "Adding..." : "Add Vehicle"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
