"use client"

import type React from "react"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState } from "react"
import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"
import { createProcurement } from "@/app/actions/procurement"
import { toast } from "sonner"

type CreateProcurementDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateProcurementDialog({ open, onOpenChange }: CreateProcurementDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  const { data: vendors = [] } = useSWR("vendors-list", async () => {
    const { data } = await supabase.from("vendors").select("id, name")
    return data || []
  })

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    const result = await createProcurement({
      vendor_id: formData.get("vendor_id") as string,
      vehicle_type: formData.get("vehicle_type") as string,
      quantity: Number.parseInt(formData.get("quantity") as string),
      initial_quote: Number.parseFloat(formData.get("initial_quote") as string),
      expected_arrival_date: formData.get("expected_arrival_date") as string,
    })

    setIsLoading(false)

    if (result.success) {
      toast.success("Procurement created successfully")
      onOpenChange(false)
    } else {
      toast.error(result.error || "Failed to create procurement")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Procurement</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="vendor_id">Vendor</Label>
            <Select name="vendor_id" required>
              <SelectTrigger>
                <SelectValue placeholder="Select vendor" />
              </SelectTrigger>
              <SelectContent>
                {vendors.map((v: any) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="vehicle_type">Vehicle Type</Label>
            <Input name="vehicle_type" placeholder="e.g., Truck, Bus" required />
          </div>

          <div>
            <Label htmlFor="quantity">Quantity</Label>
            <Input name="quantity" type="number" placeholder="1" defaultValue="1" required />
          </div>

          <div>
            <Label htmlFor="initial_quote">Initial Quote (₦)</Label>
            <Input name="initial_quote" type="number" placeholder="0" step="0.01" required />
          </div>

          <div>
            <Label htmlFor="expected_arrival_date">Expected Arrival Date</Label>
            <Input name="expected_arrival_date" type="date" required />
          </div>

          <Button type="submit" disabled={isLoading} className="w-full bg-accent hover:bg-accent/90">
            {isLoading ? "Creating..." : "Create Procurement"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
