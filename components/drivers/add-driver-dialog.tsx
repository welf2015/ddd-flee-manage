"use client"

import type React from "react"

import { useState } from "react"
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
import { createDriver } from "@/app/actions/drivers"
import { useToast } from "@/hooks/use-toast"
import { Plus } from "lucide-react"

interface AddDriverDialogProps {
  vehicles: any[]
}

export function AddDriverDialog({ vehicles }: AddDriverDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [photoUrl, setPhotoUrl] = useState("")
  const { toast } = useToast()

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const response = await fetch(
        `/api/upload?filename=${encodeURIComponent(file.name)}&folder=drivers&contentType=${encodeURIComponent(file.type)}`,
      )

      if (!response.ok) throw new Error("Failed to get upload config")
      const config = await response.json()

      let publicUrl = ""
      if (config.workerUrl) {
        const workerUrl = new URL(config.workerUrl)
        workerUrl.searchParams.set("filename", file.name)
        workerUrl.searchParams.set("folder", "drivers")

        const uploadResponse = await fetch(workerUrl.toString(), {
          method: "PUT",
          body: file,
          headers: {
            "X-Auth-Key": config.authKey,
            "Content-Type": file.type,
          },
        })

        if (!uploadResponse.ok) throw new Error("Worker upload failed")
        const result = await uploadResponse.json()
        publicUrl = result.url
      }

      setPhotoUrl(publicUrl)
      toast({ title: "Success", description: "Driver photo uploaded" })
    } catch (error) {
      console.error("Upload error:", error)
      toast({ title: "Error", description: "Failed to upload photo", variant: "destructive" })
    } finally {
      setUploading(false)
    }
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)

    const formData = new FormData(event.currentTarget)
    if (photoUrl) {
      formData.append("photo_url", photoUrl)
    }

    const result = await createDriver(formData)

    setLoading(false)

    if (result.success) {
      setOpen(false)
      toast({
        title: "Success",
        description: "Driver created successfully",
      })
    } else {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-accent hover:bg-accent/90 text-accent-foreground">
          <Plus className="h-4 w-4" />
          Add Driver
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Driver</DialogTitle>
          <DialogDescription>
            Create a new driver profile. This will also create an account for the driver app.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="full_name">Full Name</Label>
            <Input id="full_name" name="full_name" required />
          </div>

          <div className="grid gap-2">
            <Label>Driver Photo</Label>
            <div className="flex items-center gap-4">
              {photoUrl && (
                <img
                  src={photoUrl || "/placeholder.svg"}
                  alt="Preview"
                  className="h-16 w-16 rounded-full object-cover border"
                />
              )}
              <div className="flex-1">
                <Input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
                {uploading && <p className="text-xs text-muted-foreground mt-1">Uploading...</p>}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required placeholder="driver@example.com" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required minLength={6} placeholder="******" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="license_number">License Number</Label>
              <Input id="license_number" name="license_number" required />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="address">Address</Label>
            <Input id="address" name="address" />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="license_expiry">License Expiry</Label>
            <Input id="license_expiry" name="license_expiry" type="date" />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="assigned_vehicle_id">Assigned Vehicle</Label>
            <Select name="assigned_vehicle_id">
              <SelectTrigger>
                <SelectValue placeholder="Select a vehicle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {vehicles.map((vehicle) => (
                  <SelectItem key={vehicle.id} value={vehicle.id}>
                    {vehicle.vehicle_number} - {vehicle.make} {vehicle.model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Emergency Contact</Label>
            <div className="grid grid-cols-2 gap-2">
              <Input name="emergency_contact_name" placeholder="Name" />
              <Input name="emergency_contact_phone" placeholder="Phone" />
            </div>
            <Input name="emergency_contact_relationship" placeholder="Relationship" />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Driver"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
