"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from "@/components/ui/alert"

type LogFuelDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function LogFuelDialog({ open, onOpenChange, onSuccess }: LogFuelDialogProps) {
  const [vehicles, setVehicles] = useState<any[]>([])
  const [selectedVehicle, setSelectedVehicle] = useState("")
  const [fuelType, setFuelType] = useState("Petrol")
  const [quantity, setQuantity] = useState("")
  const [cost, setCost] = useState("")
  const [station, setStation] = useState("")
  const [odometer, setOdometer] = useState("")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)
  const [recentFuelWarning, setRecentFuelWarning] = useState("")
  const supabase = createClient()

  useEffect(() => {
    async function fetchVehicles() {
      const { data } = await supabase
        .from("vehicles")
        .select("id, vehicle_number, make, model, vehicle_type")
        .eq("status", "Active")
        .order("vehicle_number")
      
      if (data) setVehicles(data)
    }
    fetchVehicles()
  }, [])

  useEffect(() => {
    async function checkRecentFuel() {
      if (!selectedVehicle) {
        setRecentFuelWarning("")
        return
      }

      const threeDaysAgo = new Date()
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)

      const { data } = await supabase
        .from("fuel_logs")
        .select("*")
        .eq("vehicle_id", selectedVehicle)
        .gte("logged_at", threeDaysAgo.toISOString())
        .order("logged_at", { ascending: false })
        .limit(1)

      if (data && data.length > 0) {
        const lastFuel = data[0]
        const daysSince = Math.floor(
          (new Date().getTime() - new Date(lastFuel.logged_at).getTime()) / (1000 * 60 * 60 * 24)
        )
        setRecentFuelWarning(
          `⚠️ This vehicle was last fueled ${daysSince} day(s) ago (${lastFuel.quantity} ${lastFuel.unit}). Frequent refueling may indicate issues.`
        )
      } else {
        setRecentFuelWarning("")
      }
    }
    checkRecentFuel()
  }, [selectedVehicle])

  const handleSubmit = async () => {
    if (!selectedVehicle || !quantity || !cost) {
      toast.error("Please fill in vehicle, quantity and cost")
      return
    }

    setLoading(true)

    const { data: user } = await supabase.auth.getUser()

    const { error } = await supabase.from("fuel_logs").insert({
      vehicle_id: selectedVehicle,
      fuel_type: fuelType,
      quantity: parseFloat(quantity),
      unit: fuelType === "Electric" ? "kWh" : "Liters",
      cost: parseFloat(cost),
      station_name: station || null,
      odometer_reading: odometer ? parseInt(odometer) : null,
      notes: notes || null,
      logged_by: user.user?.id,
    })

    setLoading(false)

    if (error) {
      console.error("[v0] Fuel log error:", error)
      toast.error("Failed to log fuel: " + error.message)
    } else {
      toast.success("Fuel logged successfully")
      onSuccess()
      onOpenChange(false)
      // Reset form
      setSelectedVehicle("")
      setQuantity("")
      setCost("")
      setStation("")
      setOdometer("")
      setNotes("")
      setRecentFuelWarning("")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Log Fuel/Charging</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Vehicle *</Label>
            <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
              <SelectTrigger>
                <SelectValue placeholder="Select vehicle" />
              </SelectTrigger>
              <SelectContent>
                {vehicles.map((vehicle) => (
                  <SelectItem key={vehicle.id} value={vehicle.id}>
                    {vehicle.vehicle_number} - {vehicle.make} {vehicle.model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {recentFuelWarning && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{recentFuelWarning}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label>Fuel/Energy Type *</Label>
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
              <Label>{fuelType === "Electric" ? "Quantity (kWh) *" : "Quantity (Liters) *"}</Label>
              <Input
                type="number"
                step="0.01"
                placeholder={fuelType === "Electric" ? "e.g. 50" : "e.g. 45"}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Cost (₦) *</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="Amount paid"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Station/Location</Label>
            <Input
              placeholder="Station name or charging location"
              value={station}
              onChange={(e) => setStation(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Odometer Reading (Optional)</Label>
            <Input
              type="number"
              placeholder="Current mileage"
              value={odometer}
              onChange={(e) => setOdometer(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              placeholder="Additional notes or observations"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading} className="flex-1 bg-accent hover:bg-accent/90">
              {loading ? "Logging..." : "Log Fuel"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
