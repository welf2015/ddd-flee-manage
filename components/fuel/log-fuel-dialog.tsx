"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

type LogFuelDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function LogFuelDialog({ open, onOpenChange, onSuccess }: LogFuelDialogProps) {
  const [fuelType, setFuelType] = useState("Petrol")
  const [quantity, setQuantity] = useState("")
  const [cost, setCost] = useState("")
  const [station, setStation] = useState("")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleSubmit = async () => {
    if (!quantity || !cost) {
      toast.error("Please fill in quantity and cost")
      return
    }

    setLoading(true)

    const { data: user } = await supabase.auth.getUser()

    const { error } = await supabase.from("fuel_logs").insert({
      fuel_type: fuelType,
      quantity: parseFloat(quantity),
      unit: fuelType === "Electric" ? "kWh" : "Liters",
      cost: parseFloat(cost),
      station_name: station,
      notes,
      logged_by: user.user?.id,
    })

    setLoading(false)

    if (error) {
      toast.error("Failed to log fuel")
    } else {
      toast.success("Fuel logged successfully")
      onSuccess()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log Fuel/Charging</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Fuel Type *</Label>
            <Select value={fuelType} onValueChange={setFuelType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Petrol">Petrol</SelectItem>
                <SelectItem value="Diesel">Diesel</SelectItem>
                <SelectItem value="Electric">Electric</SelectItem>
                <SelectItem value="CNG">CNG</SelectItem>
                <SelectItem value="Hybrid">Hybrid</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Quantity *</Label>
              <Input
                type="number"
                placeholder={fuelType === "Electric" ? "kWh" : "Liters"}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Cost (₦) *</Label>
              <Input
                type="number"
                placeholder="Amount paid"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Station/Location</Label>
            <Input
              placeholder="Station name or location"
              value={station}
              onChange={(e) => setStation(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              placeholder="Additional notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading} className="flex-1">
              {loading ? "Logging..." : "Log Fuel"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
