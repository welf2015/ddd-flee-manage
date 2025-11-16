"use client"

import type React from "react"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useState } from "react"
import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

type AddPartDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddPartDialog({ open, onOpenChange }: AddPartDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  const { data: vendors = [] } = useSWR("vendors-for-inventory", async () => {
    const { data } = await supabase.from("vendors").select("id, name")
    return data || []
  })

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)

    const { error } = await supabase.from("inventory_parts").insert({
      part_number: formData.get("part_number"),
      name: formData.get("name"),
      description: formData.get("description"),
      unit_price: formData.get("unit_price") ? Number.parseFloat(formData.get("unit_price") as string) : null,
      reorder_level: Number.parseInt(formData.get("reorder_level") as string) || 5,
      current_stock: Number.parseInt(formData.get("current_stock") as string) || 0,
      location: formData.get("location"),
      supplier_id: formData.get("supplier_id") || null,
    })

    setIsLoading(false)

    if (error) {
      toast.error(error.message)
    } else {
      toast.success("Part added successfully")
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Part</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="part_number">Part Number</Label>
            <Input name="part_number" placeholder="e.g., SPARK-001" required />
          </div>

          <div>
            <Label htmlFor="name">Part Name</Label>
            <Input name="name" placeholder="e.g., Spark Plug" required />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea name="description" placeholder="Part description" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="unit_price">Unit Price (₦)</Label>
              <Input name="unit_price" type="number" placeholder="0" step="0.01" />
            </div>
            <div>
              <Label htmlFor="current_stock">Current Stock</Label>
              <Input name="current_stock" type="number" placeholder="0" defaultValue="0" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="reorder_level">Reorder Level</Label>
              <Input name="reorder_level" type="number" placeholder="5" defaultValue="5" />
            </div>
            <div>
              <Label htmlFor="location">Location</Label>
              <Input name="location" placeholder="Storage location" />
            </div>
          </div>

          <div>
            <Label htmlFor="supplier_id">Supplier</Label>
            <Select name="supplier_id">
              <SelectTrigger>
                <SelectValue placeholder="Select supplier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {vendors.map((v: any) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" disabled={isLoading} className="w-full bg-accent hover:bg-accent/90">
            {isLoading ? "Adding..." : "Add Part"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
