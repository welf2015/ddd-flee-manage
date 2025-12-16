"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import useSWR from "swr"

type UpdateProcurementDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  procurementId: string
  onProcurementUpdated?: () => void
}

export function UpdateProcurementDialog({
  open,
  onOpenChange,
  procurementId,
  onProcurementUpdated,
}: UpdateProcurementDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    vendor_id: "",
    vehicle_make: "",
    vehicle_model: "",
    year_of_manufacture: "",
    vin_chassis_number: "",
    engine_number: "",
    vehicle_color: "",
    fuel_type: "",
    transmission_type: "",
    quantity: "",
    initial_quote: "",
    negotiated_price: "",
    final_price: "",
    clearing_agent_id: "",
    waybill_number: "",
    shipping_tracking_no: "",
    shipping_date: "",
    estimated_delivery_months: "",
    license_plate_number: "",
    clearing_date: "",
    customs_documents: "",
    notes: "",
  })
  const supabase = createClient()

  // Fetch vendors and agents
  const { data: vendors = [] } = useSWR("vendors", async () => {
    const { data } = await supabase.from("vendors").select("*").order("name")
    return data || []
  })

  const { data: agents = [] } = useSWR("clearing-agents", async () => {
    const { data } = await supabase.from("clearing_agents").select("*").order("name")
    return data || []
  })

  useEffect(() => {
    if (procurementId && open) {
      const fetchProcurement = async () => {
        const { data } = await supabase.from("procurements").select("*").eq("id", procurementId).single()

        if (data) {
          setFormData({
            vendor_id: data.vendor_id || "",
            vehicle_make: data.vehicle_make || "",
            vehicle_model: data.vehicle_model || "",
            year_of_manufacture: data.year_of_manufacture || "",
            vin_chassis_number: data.vin_chassis_number || "",
            engine_number: data.engine_number || "",
            vehicle_color: data.vehicle_color || "",
            fuel_type: data.fuel_type || "",
            transmission_type: data.transmission_type || "",
            quantity: data.quantity || "",
            initial_quote: data.initial_quote || "",
            negotiated_price: data.negotiated_price || "",
            final_price: data.final_price || "",
            clearing_agent_id: data.clearing_agent_id || "",
            waybill_number: data.waybill_number || "",
            shipping_tracking_no: data.shipping_tracking_no || "",
            shipping_date: data.shipping_date || "",
            estimated_delivery_months: data.estimated_delivery_months || "",
            license_plate_number: data.license_plate_number || "",
            clearing_date: data.clearing_date || "",
            customs_documents: data.customs_documents || "",
            notes: data.notes || "",
          })
        }
      }
      fetchProcurement()
    }
  }, [procurementId, open, supabase])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!procurementId) return

    setIsLoading(true)

    const updateData: any = {
      vendor_id: formData.vendor_id || null,
      vehicle_make: formData.vehicle_make,
      vehicle_model: formData.vehicle_model,
      year_of_manufacture: formData.year_of_manufacture ? Number(formData.year_of_manufacture) : null,
      vin_chassis_number: formData.vin_chassis_number,
      engine_number: formData.engine_number,
      vehicle_color: formData.vehicle_color,
      fuel_type: formData.fuel_type,
      transmission_type: formData.transmission_type,
      quantity: formData.quantity ? Number(formData.quantity) : 1,
      initial_quote: formData.initial_quote ? Number(formData.initial_quote) : 0,
      negotiated_price: formData.negotiated_price ? Number(formData.negotiated_price) : null,
      final_price: formData.final_price ? Number(formData.final_price) : null,
      clearing_agent_id: formData.clearing_agent_id || null,
      waybill_number: formData.waybill_number,
      shipping_tracking_no: formData.shipping_tracking_no,
      shipping_date: formData.shipping_date || null,
      estimated_delivery_months: formData.estimated_delivery_months ? Number(formData.estimated_delivery_months) : null,
      license_plate_number: formData.license_plate_number,
      clearing_date: formData.clearing_date || null,
      customs_documents: formData.customs_documents,
      notes: formData.notes,
    }

    const { error } = await supabase.from("procurements").update(updateData).eq("id", procurementId)

    setIsLoading(false)

    if (error) {
      toast.error(error.message || "Failed to update procurement")
    } else {
      toast.success("Procurement updated successfully")
      onProcurementUpdated?.()
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Update Procurement Details</DialogTitle>
          <DialogDescription>Edit the vehicle and procurement information</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Tabs defaultValue="vehicle" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="vehicle">Vehicle</TabsTrigger>
              <TabsTrigger value="vendor">Vendor & Pricing</TabsTrigger>
              <TabsTrigger value="shipping">Shipping</TabsTrigger>
              <TabsTrigger value="clearing">Clearing</TabsTrigger>
            </TabsList>

            {/* Vehicle Details Tab */}
            <TabsContent value="vehicle" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="vehicle_make">Vehicle Make</Label>
                  <Input
                    name="vehicle_make"
                    placeholder="e.g., Toyota"
                    value={formData.vehicle_make}
                    onChange={(e) => setFormData({ ...formData, vehicle_make: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="vehicle_model">Vehicle Model</Label>
                  <Input
                    name="vehicle_model"
                    placeholder="e.g., Camry"
                    value={formData.vehicle_model}
                    onChange={(e) => setFormData({ ...formData, vehicle_model: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="year_of_manufacture">Year of Manufacture</Label>
                  <Input
                    name="year_of_manufacture"
                    type="number"
                    placeholder="e.g., 2024"
                    value={formData.year_of_manufacture}
                    onChange={(e) => setFormData({ ...formData, year_of_manufacture: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    name="quantity"
                    type="number"
                    placeholder="Number of vehicles"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="vin_chassis_number">VIN/Chassis Number</Label>
                  <Input
                    name="vin_chassis_number"
                    placeholder="Vehicle identification number"
                    value={formData.vin_chassis_number}
                    onChange={(e) => setFormData({ ...formData, vin_chassis_number: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="engine_number">Engine Number</Label>
                  <Input
                    name="engine_number"
                    placeholder="Engine number"
                    value={formData.engine_number}
                    onChange={(e) => setFormData({ ...formData, engine_number: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="vehicle_color">Vehicle Color</Label>
                  <Input
                    name="vehicle_color"
                    placeholder="e.g., White"
                    value={formData.vehicle_color}
                    onChange={(e) => setFormData({ ...formData, vehicle_color: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="fuel_type">Fuel Type</Label>
                  <Input
                    name="fuel_type"
                    placeholder="e.g., Petrol, Diesel, Electric"
                    value={formData.fuel_type}
                    onChange={(e) => setFormData({ ...formData, fuel_type: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="transmission_type">Transmission Type</Label>
                  <Input
                    name="transmission_type"
                    placeholder="e.g., Automatic, Manual"
                    value={formData.transmission_type}
                    onChange={(e) => setFormData({ ...formData, transmission_type: e.target.value })}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Vendor & Pricing Tab */}
            <TabsContent value="vendor" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="vendor_id">Vendor</Label>
                  <Select value={formData.vendor_id} onValueChange={(value) => setFormData({ ...formData, vendor_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select vendor" />
                    </SelectTrigger>
                    <SelectContent>
                      {vendors.map((vendor: any) => (
                        <SelectItem key={vendor.id} value={vendor.id}>
                          {vendor.name} - {vendor.country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="initial_quote">Initial Quote (₦)</Label>
                  <Input
                    name="initial_quote"
                    type="number"
                    placeholder="0.00"
                    value={formData.initial_quote}
                    onChange={(e) => setFormData({ ...formData, initial_quote: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="negotiated_price">Negotiated Price (₦)</Label>
                  <Input
                    name="negotiated_price"
                    type="number"
                    placeholder="0.00"
                    value={formData.negotiated_price}
                    onChange={(e) => setFormData({ ...formData, negotiated_price: e.target.value })}
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="final_price">Final Price (₦)</Label>
                  <Input
                    name="final_price"
                    type="number"
                    placeholder="0.00"
                    value={formData.final_price}
                    onChange={(e) => setFormData({ ...formData, final_price: e.target.value })}
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    name="notes"
                    placeholder="Additional notes or special requirements"
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Shipping Tab */}
            <TabsContent value="shipping" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="waybill_number">Waybill Number</Label>
                  <Input
                    name="waybill_number"
                    placeholder="Enter waybill number"
                    value={formData.waybill_number}
                    onChange={(e) => setFormData({ ...formData, waybill_number: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="shipping_tracking_no">Tracking Number</Label>
                  <Input
                    name="shipping_tracking_no"
                    placeholder="Shipping tracking number"
                    value={formData.shipping_tracking_no}
                    onChange={(e) => setFormData({ ...formData, shipping_tracking_no: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="shipping_date">Shipping Date</Label>
                  <Input
                    name="shipping_date"
                    type="date"
                    value={formData.shipping_date}
                    onChange={(e) => setFormData({ ...formData, shipping_date: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="estimated_delivery_months">Estimated Delivery (Months)</Label>
                  <Input
                    name="estimated_delivery_months"
                    type="number"
                    placeholder="Number of months"
                    value={formData.estimated_delivery_months}
                    onChange={(e) => setFormData({ ...formData, estimated_delivery_months: e.target.value })}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Clearing Tab */}
            <TabsContent value="clearing" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="clearing_agent_id">Clearing Agent</Label>
                  <Select
                    value={formData.clearing_agent_id}
                    onValueChange={(value) => setFormData({ ...formData, clearing_agent_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select clearing agent" />
                    </SelectTrigger>
                    <SelectContent>
                      {agents.map((agent: any) => (
                        <SelectItem key={agent.id} value={agent.id}>
                          {agent.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="license_plate_number">License Plate Number</Label>
                  <Input
                    name="license_plate_number"
                    placeholder="e.g., ABC-123-XY"
                    value={formData.license_plate_number}
                    onChange={(e) => setFormData({ ...formData, license_plate_number: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="clearing_date">Clearing Date</Label>
                  <Input
                    name="clearing_date"
                    type="date"
                    value={formData.clearing_date}
                    onChange={(e) => setFormData({ ...formData, clearing_date: e.target.value })}
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="customs_documents">Customs Documents Notes</Label>
                  <Textarea
                    name="customs_documents"
                    placeholder="Document reference numbers, taxes paid, levies..."
                    rows={3}
                    value={formData.customs_documents}
                    onChange={(e) => setFormData({ ...formData, customs_documents: e.target.value })}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <Separator />

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-accent hover:bg-accent/90">
              {isLoading ? "Updating..." : "Update Procurement"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
