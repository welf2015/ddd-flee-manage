"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Fuel, Wrench, AlertTriangle, Calendar } from "lucide-react"
import { formatRelativeTime } from "@/lib/utils"

type VehicleDetailDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  vehicle: {
    id: string
    vehicle_number: string
    vehicle_type: string
    make: string
    model: string
    year: number
    status: string
    last_service_date: string | null
    next_service_date: string | null
    created_at: string
  } | null
}

export function VehicleDetailDialog({ open, onOpenChange, vehicle }: VehicleDetailDialogProps) {
  if (!vehicle) return null

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-500/10 text-green-500 border-green-500/20"
      case "In Maintenance":
        return "bg-accent/10 text-accent border-accent/20"
      case "Inactive":
        return "bg-gray-500/10 text-gray-500 border-gray-500/20"
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20"
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto backdrop-blur-xl bg-background/95">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{vehicle.vehicle_number}</span>
            <Badge variant="outline" className={getStatusColor(vehicle.status)}>
              {vehicle.status}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Vehicle Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Vehicle Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Make & Model</div>
                <div className="font-medium">
                  {vehicle.make} {vehicle.model}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Year</div>
                <div className="font-medium">{vehicle.year}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Type</div>
                <div className="font-medium">{vehicle.vehicle_type}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Registration Date</div>
                <div className="font-medium">{formatRelativeTime(vehicle.created_at)}</div>
              </div>
            </CardContent>
          </Card>

          {/* Service Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Wrench className="h-4 w-4" />
                Service History
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Last Service</span>
                </div>
                <span className="text-sm font-medium">
                  {vehicle.last_service_date
                    ? formatRelativeTime(vehicle.last_service_date)
                    : "No service recorded"}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-accent" />
                  <span className="text-sm">Next Service Due</span>
                </div>
                <span className="text-sm font-medium">
                  {vehicle.next_service_date
                    ? formatRelativeTime(vehicle.next_service_date)
                    : "Not scheduled"}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <Fuel className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <div className="text-2xl font-bold">0</div>
                <div className="text-sm text-muted-foreground">Fuel Logs</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <Wrench className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <div className="text-2xl font-bold">0</div>
                <div className="text-sm text-muted-foreground">Maintenance</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <div className="text-2xl font-bold">0</div>
                <div className="text-sm text-muted-foreground">Incidents</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
