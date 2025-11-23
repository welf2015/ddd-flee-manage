"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createProcurement } from "@/app/actions/procurement"
import { Plus, Upload, X } from "lucide-react"
import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"
import { AddVendorDialog } from "./add-vendor-dialog"
import { toast } from "sonner"

interface CreateProcurementFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateProcurementForm({ open, onOpenChange }: CreateProcurementFormProps) {
  const supabase = createClient()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [showAddVendor, setShowAddVendor] = useState(false)
  const [currency, setCurrency] = useState<"NGN" | "USD">("NGN")
  const [formData, setFormData] = useState({
    vendorId: "",
    vehicleMake: "",
    vehicleModel: "",
    yearOfManufacture: "",
    vinChassisNumber: "",
    engineNumber: "",
    vehicleColor: "",
    fuelType: "",
    transmissionType: "",
    quantity: "1",
    initialQuote: "",
    notes: "",
    warrantyDetails: "",
    carDesignPhotos: [] as string[],
  })

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return

    setUploading(true)
    const newPhotos: string[] = []

    try {
      const configRes = await fetch("/api/upload")
      if (!configRes.ok) {
        throw new Error("Upload service not configured")
      }

      const { workerUrl, authKey } = await configRes.json()

      if (!workerUrl || !authKey) {
        throw new Error("Worker URL or Auth Key not configured")
      }

      for (let i = 0; i < e.target.files.length; i++) {
        const file = e.target.files[i]
        const formDataUpload = new FormData()
        formDataUpload.append("file", file)
        formDataUpload.append("folder", "procurement")

        const response = await fetch(workerUrl, {
          method: "POST",
          headers: {
            "X-Auth-Key": authKey,
          },
          body: formDataUpload,
        })

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`Upload failed: ${errorText}`)
        }

        const { url } = await response.json()
        newPhotos.push(url)
      }

      setFormData((prev) => ({
        ...prev,
        carDesignPhotos: [...prev.carDesignPhotos, ...newPhotos],
      }))
      toast.success("Photos uploaded successfully")
    } catch (error) {
      console.error("Upload error:", error)
      toast.error(`Failed to upload photos: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setUploading(false)
    }
  }

  const removePhoto = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      carDesignPhotos: prev.carDesignPhotos.filter((_, i) => i !== index),
    }))
  }

  const { data: vendors = [], mutate: mutateVendors } = useSWR("vendors-list", async () => {
    const { data } = await supabase.from("vendors").select("*").order("name")
    return data || []
  })

  const selectedVendor = vendors.find((v: any) => v.id === formData.vendorId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.vendorId || !formData.vehicleMake || !formData.initialQuote) return

    setIsSubmitting(true)
    try {
      await createProcurement({
        vendor_id: formData.vendorId,
        vehicle_make: formData.vehicleMake,
        vehicle_model: formData.vehicleModel,
        year_of_manufacture: formData.yearOfManufacture ? Number.parseInt(formData.yearOfManufacture) : null,
        vin_chassis_number: formData.vinChassisNumber,
        engine_number: formData.engineNumber,
        vehicle_color: formData.vehicleColor,
        fuel_type: formData.fuelType,
        transmission_type: formData.transmissionType,
        quantity: Number.parseInt(formData.quantity),
        initial_quote: Number.parseFloat(formData.initialQuote.replace(/,/g, "")),
        currency: currency,
        notes: formData.notes,
        car_design_photos: formData.carDesignPhotos,
        warranty_details: formData.warrantyDetails,
      })

      onOpenChange(false)
      // Reset form
      setFormData({
        vendorId: "",
        vehicleMake: "",
        vehicleModel: "",
        yearOfManufacture: "",
        vinChassisNumber: "",
        engineNumber: "",
        vehicleColor: "",
        fuelType: "",
        transmissionType: "",
        quantity: "1",
        initialQuote: "",
        notes: "",
        warrantyDetails: "",
        carDesignPhotos: [],
      })
      setCurrency("NGN")
    } catch (error) {
      console.error("Error creating procurement:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatNairaNumber = (value: string) => {
    const number = value.replace(/,/g, "")
    if (!number || isNaN(Number(number))) return value
    return Number(number).toLocaleString()
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Procurement Order - Stage 1</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Initial vehicle details and vendor selection. Additional details can be added after deal closure.
            </p>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6 mt-4">
            {/* Vendor Selection */}
            <div className="space-y-4 p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Vendor Information</h3>
                <Button type="button" variant="outline" size="sm" onClick={() => setShowAddVendor(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Vendor
                </Button>
              </div>

              <div>
                <Label>Select Vendor *</Label>
                <Select
                  value={formData.vendorId}
                  onValueChange={(value) => setFormData({ ...formData, vendorId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    {vendors.map((vendor: any) => (
                      <SelectItem key={vendor.id} value={vendor.id}>
                        <div className="flex items-center gap-2">
                          {vendor.country && <span className="text-xl">{getCountryFlag(vendor.country)}</span>}
                          <span>{vendor.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedVendor && (
                <div className="grid grid-cols-2 gap-4 p-3 bg-muted/50 rounded text-sm">
                  <div>
                    <p className="text-muted-foreground">Contact</p>
                    <p className="font-medium">{selectedVendor.contact_name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Phone</p>
                    <p className="font-medium">{selectedVendor.phone}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Email</p>
                    <p className="font-medium">{selectedVendor.email}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Country</p>
                    <p className="font-medium flex items-center gap-2">
                      {getCountryFlag(selectedVendor.country)} {selectedVendor.country}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Vehicle Details */}
            <div className="space-y-4 p-4 border rounded-lg">
              <h3 className="font-semibold">Vehicle Details</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Vehicle Make *</Label>
                  <Input
                    value={formData.vehicleMake}
                    onChange={(e) => setFormData({ ...formData, vehicleMake: e.target.value })}
                    placeholder="e.g., Toyota, Mercedes"
                    required
                  />
                </div>
                <div>
                  <Label>Vehicle Model *</Label>
                  <Input
                    value={formData.vehicleModel}
                    onChange={(e) => setFormData({ ...formData, vehicleModel: e.target.value })}
                    placeholder="e.g., Hilux, Actros"
                    required
                  />
                </div>
                <div>
                  <Label>Year of Manufacture</Label>
                  <Input
                    type="number"
                    value={formData.yearOfManufacture}
                    onChange={(e) => setFormData({ ...formData, yearOfManufacture: e.target.value })}
                    placeholder="e.g., 2024"
                  />
                </div>
                <div>
                  <Label>VIN / Chassis Number</Label>
                  <Input
                    value={formData.vinChassisNumber}
                    onChange={(e) => setFormData({ ...formData, vinChassisNumber: e.target.value })}
                    placeholder="17-character VIN"
                  />
                </div>
                <div>
                  <Label>Engine Number</Label>
                  <Input
                    value={formData.engineNumber}
                    onChange={(e) => setFormData({ ...formData, engineNumber: e.target.value })}
                    placeholder="Engine serial number"
                  />
                </div>
                <div>
                  <Label>Vehicle Color</Label>
                  <Input
                    value={formData.vehicleColor}
                    onChange={(e) => setFormData({ ...formData, vehicleColor: e.target.value })}
                    placeholder="e.g., White, Blue"
                  />
                </div>
                <div>
                  <Label>Fuel Type</Label>
                  <Select
                    value={formData.fuelType}
                    onValueChange={(value) => setFormData({ ...formData, fuelType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select fuel type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Diesel">Diesel</SelectItem>
                      <SelectItem value="Petrol">Petrol</SelectItem>
                      <SelectItem value="Electric">Electric</SelectItem>
                      <SelectItem value="Hybrid">Hybrid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Transmission Type</Label>
                  <Select
                    value={formData.transmissionType}
                    onValueChange={(value) => setFormData({ ...formData, transmissionType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select transmission" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Manual">Manual</SelectItem>
                      <SelectItem value="Automatic">Automatic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label>Warranty Details</Label>
                  <Textarea
                    value={formData.warrantyDetails}
                    onChange={(e) => setFormData({ ...formData, warrantyDetails: e.target.value })}
                    placeholder="Enter warranty information (e.g., 3 years / 100,000 km)"
                    rows={2}
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Car Design Photos</Label>
                  <div className="grid grid-cols-4 gap-4">
                    {formData.carDesignPhotos.map((photo, index) => (
                      <div key={index} className="relative aspect-video bg-muted rounded-lg overflow-hidden group">
                        <img
                          src={photo || "/placeholder.svg"}
                          alt={`Design ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(index)}
                          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    <div className="relative aspect-video bg-muted border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-muted/80 transition-colors">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        disabled={uploading}
                      />
                      <Upload className="h-6 w-6 text-muted-foreground mb-2" />
                      <span className="text-xs text-muted-foreground">{uploading ? "Uploading..." : "Add Photos"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="space-y-4 p-4 border rounded-lg">
              <h3 className="font-semibold">Pricing Information</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Initial Quote *</Label>
                  <div className="flex gap-2">
                    <Select value={currency} onValueChange={(value: "NGN" | "USD") => setCurrency(value)}>
                      <SelectTrigger className="w-[100px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NGN">₦ NGN</SelectItem>
                        <SelectItem value="USD">$ USD</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      type="text"
                      value={formatNairaNumber(formData.initialQuote)}
                      onChange={(e) => {
                        const rawValue = e.target.value.replace(/,/g, "")
                        setFormData({ ...formData, initialQuote: rawValue })
                      }}
                      placeholder="Enter amount"
                      className="flex-1"
                      required
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label>Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes about the procurement..."
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-accent hover:bg-accent/90">
                {isSubmitting ? "Creating..." : "Create Procurement"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {showAddVendor && (
        <AddVendorDialog
          open={showAddVendor}
          onOpenChange={setShowAddVendor}
          onVendorAdded={() => {
            mutateVendors()
            setShowAddVendor(false)
          }}
        />
      )}
    </>
  )
}

function getCountryFlag(countryName: string): string {
  const flagMap: Record<string, string> = {
    Nigeria: "🇳🇬",
    "United States": "🇺🇸",
    "United Kingdom": "🇬🇧",
    Germany: "🇩🇪",
    Japan: "🇯🇵",
    China: "🇨🇳",
    France: "🇫🇷",
    Italy: "🇮🇹",
    "South Korea": "🇰🇷",
    India: "🇮🇳",
    UAE: "🇦🇪",
    "South Africa": "🇿🇦",
    Ghana: "🇬🇭",
    Kenya: "🇰🇪",
    Brazil: "🇧🇷",
  }
  return flagMap[countryName] || "🌍"
}
