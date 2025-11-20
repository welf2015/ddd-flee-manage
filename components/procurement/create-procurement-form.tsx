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
import { Plus } from "lucide-react"
import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"
import { AddVendorDialog } from "./add-vendor-dialog"

interface CreateProcurementFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateProcurementForm({ open, onOpenChange }: CreateProcurementFormProps) {
  const supabase = createClient()
  const [isSubmitting, setIsSubmitting] = useState(false)
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
  })

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
        currency: currency, // Include currency in procurement creation
        notes: formData.notes,
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
