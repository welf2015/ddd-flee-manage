"use client"

import { useState } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Printer, Save } from 'lucide-react'
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface InventorySpreadsheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  part?: any
  onSuccess: () => void
}

export function InventorySpreadsheet({ open, onOpenChange, part, onSuccess }: InventorySpreadsheetProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    part_name: part?.name || "",
    category: part?.category || "",
    applicable_vehicle_type: part?.applicable_vehicle_type || "All",
    description: part?.description || "",
    current_qty: part?.current_stock || 0,
    reorder_level: part?.reorder_level || 0,
    supplier_brand: part?.supplier_brand || "",
  })
  
  const supabase = createClient()
  
  const handleSave = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      const partData = {
        name: formData.part_name,
        part_number: `PART-${Date.now()}`,
        description: formData.description,
        current_stock: parseInt(formData.current_qty.toString()) || 0,
        reorder_level: parseInt(formData.reorder_level.toString()) || 0,
        unit_price: 0,
        category: formData.category,
        applicable_vehicle_type: formData.applicable_vehicle_type,
        supplier_brand: formData.supplier_brand,
      }
      
      if (part) {
        const { error } = await supabase
          .from('inventory_parts')
          .update(partData)
          .eq('id', part.id)
        
        if (error) throw error
        toast.success("Part updated successfully")
      } else {
        const { error } = await supabase
          .from('inventory_parts')
          .insert(partData)
        
        if (error) throw error
        toast.success("Part added successfully")
      }
      
      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      console.error("[v0] Inventory error:", error)
      toast.error(error.message || "Failed to save part")
    } finally {
      setLoading(false)
    }
  }
  
  const handlePrint = () => {
    window.print()
  }
  
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[90vw] max-w-[1400px] overflow-y-auto print:w-full">
        <SheetHeader className="print:hidden">
          <div className="flex items-center justify-between">
            <SheetTitle>{part ? 'Edit Part' : 'Add Part'}</SheetTitle>
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </div>
        </SheetHeader>
        
        <div className="hidden print:block mb-6">
          <h1 className="text-2xl font-bold">Spare Parts Inventory</h1>
          <p className="text-sm text-muted-foreground">Generated on {new Date().toLocaleDateString()}</p>
        </div>
        
        <div className="mt-6 space-y-6">
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[20%]">Field</TableHead>
                  <TableHead className="w-[80%]">Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Part Name</TableCell>
                  <TableCell>
                    <Input
                      value={formData.part_name}
                      onChange={(e) => setFormData({ ...formData, part_name: e.target.value })}
                      placeholder="e.g., Engine Oil"
                    />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Category</TableCell>
                  <TableCell>
                    <Input
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      placeholder="e.g., Lubricant, Engine, Brake System"
                    />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Applicable Vehicle Type</TableCell>
                  <TableCell>
                    <Input
                      value={formData.applicable_vehicle_type}
                      onChange={(e) => setFormData({ ...formData, applicable_vehicle_type: e.target.value })}
                      placeholder="e.g., All, Cars & Trucks, Motorbikes"
                    />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Description / Notes</TableCell>
                  <TableCell>
                    <Input
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="e.g., 5W-30 / 20W-50"
                    />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Current Quantity</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={formData.current_qty}
                      onChange={(e) => setFormData({ ...formData, current_qty: parseInt(e.target.value) || 0 })}
                      placeholder="0"
                    />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Reorder Level</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={formData.reorder_level}
                      onChange={(e) => setFormData({ ...formData, reorder_level: parseInt(e.target.value) || 0 })}
                      placeholder="0"
                    />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Supplier / Brand</TableCell>
                  <TableCell>
                    <Input
                      value={formData.supplier_brand}
                      onChange={(e) => setFormData({ ...formData, supplier_brand: e.target.value })}
                      placeholder="e.g., NGK / Bosch"
                    />
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
          
          <div className="flex justify-end print:hidden">
            <Button onClick={handleSave} disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? "Saving..." : "Save Part"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
