"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Truck, User, Calendar, AlertCircle } from "lucide-react"
import { useState, useEffect } from "react"
import { assignDriverToBooking } from "@/app/actions/bookings"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

type AssignDriverDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  bookingId: string
  onSuccess: () => void
}

export function AssignDriverDialog({ open, onOpenChange, bookingId, onSuccess }: AssignDriverDialogProps) {
  const [drivers, setDrivers] = useState<any[]>([])
  const [selectedDriver, setSelectedDriver] = useState("")
  const [driverDetails, setDriverDetails] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      fetchDrivers()
    }
  }, [open])

  useEffect(() => {
    if (selectedDriver) {
      const driver = drivers.find((d) => d.id === selectedDriver)
      setDriverDetails(driver)
    } else {
      setDriverDetails(null)
    }
  }, [selectedDriver, drivers])

  const fetchDrivers = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("drivers")
      .select("*, vehicles:assigned_vehicle_id(*)")
      .eq("status", "Active")

    if (error) {
      toast.error("Failed to fetch drivers")
      return
    }

    setDrivers(data || [])
  }

  const handleAssign = async () => {
    if (!selectedDriver) {
      toast.error("Please select a driver")
      return
    }

    setLoading(true)
    const result = await assignDriverToBooking(bookingId, selectedDriver)
    setLoading(false)

    if (result.success) {
      toast.success("Driver assigned successfully")
      onSuccess()
    } else {
      toast.error(result.error || "Failed to assign driver")
    }
  }

  const isVehicleAvailable = (vehicle: any) => {
    return vehicle && vehicle.status === "Active"
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-background/95 backdrop-blur-xl border-border/50">
        <DialogHeader>
          <DialogTitle>Assign Driver to Job</DialogTitle>
          <DialogDescription>Select an available driver to assign to this booking</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Select Driver</Label>
            <Select value={selectedDriver} onValueChange={setSelectedDriver}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a driver..." />
              </SelectTrigger>
              <SelectContent>
                {drivers.map((driver) => {
                  const hasVehicle = driver.vehicles
                  const vehicleAvailable = hasVehicle && isVehicleAvailable(driver.vehicles)

                  return (
                    <SelectItem
                      key={driver.id}
                      value={driver.id}
                      disabled={!vehicleAvailable}
                      className={!vehicleAvailable ? "opacity-50" : ""}
                    >
                      {driver.full_name} - {driver.license_number}
                      {!hasVehicle && " (No Vehicle)"}
                      {hasVehicle && !vehicleAvailable && " (Vehicle Unavailable)"}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Only drivers with available vehicles are selectable</p>
          </div>

          {driverDetails && (
            <Card className="border-green-500/20 bg-green-500/5">
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {driverDetails.photo_url ? (
                      <img
                        src={driverDetails.photo_url || "/placeholder.svg"}
                        alt={driverDetails.full_name}
                        className="h-12 w-12 rounded-full object-cover border-2 border-accent"
                      />
                    ) : (
                      <div className="p-2 rounded-full bg-green-500/10">
                        <User className="h-5 w-5 text-green-500" />
                      </div>
                    )}
                    <div>
                      <p className="font-semibold">{driverDetails.full_name}</p>
                      <p className="text-sm text-muted-foreground">{driverDetails.phone}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-green-500/10 text-green-500">
                    {driverDetails.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="text-muted-foreground">License Number</label>
                    <p className="font-medium">{driverDetails.license_number}</p>
                  </div>
                  <div>
                    <label className="text-muted-foreground">License Expiry</label>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span className="font-medium">
                        {driverDetails.license_expiry
                          ? new Date(driverDetails.license_expiry).toLocaleDateString()
                          : "N/A"}
                      </span>
                    </div>
                  </div>
                </div>

                {driverDetails.vehicles ? (
                  <>
                    <div className="border-t pt-4">
                      <label className="text-sm font-medium text-muted-foreground mb-2 block">Assigned Vehicle</label>
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-blue-500/10">
                          <Truck className="h-5 w-5 text-blue-500" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold">{driverDetails.vehicles.vehicle_number}</p>
                          <p className="text-sm text-muted-foreground">
                            {driverDetails.vehicles.make} {driverDetails.vehicles.model} (
                            {driverDetails.vehicles.vehicle_type})
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={
                            isVehicleAvailable(driverDetails.vehicles)
                              ? "bg-green-500/10 text-green-500"
                              : "bg-gray-500/10 text-gray-500"
                          }
                        >
                          {driverDetails.vehicles.status}
                        </Badge>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="border-t pt-4 flex items-center gap-2 text-yellow-500">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">No vehicle assigned to this driver</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleAssign}
              disabled={!selectedDriver || loading || (driverDetails && !isVehicleAvailable(driverDetails.vehicles))}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {loading ? "Assigning..." : "Assign Driver"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
