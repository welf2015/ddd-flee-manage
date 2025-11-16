"use client"

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Calendar, MapPin, User, Truck, FileText } from "lucide-react"
import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"

interface IncidentDetailSheetProps {
  incidentId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function IncidentDetailSheet({ incidentId, open, onOpenChange }: IncidentDetailSheetProps) {
  const supabase = createClient()

  const { data: incident } = useSWR(
    open ? `incident-${incidentId}` : null,
    async () => {
      const { data } = await supabase.from("incidents").select("*").eq("id", incidentId).single()

      if (data && data.vehicle_id) {
        const { data: vehicle } = await supabase.from("vehicles").select("*").eq("id", data.vehicle_id).single()
        data.vehicle = vehicle
      }

      if (data && data.driver_id) {
        const { data: driver } = await supabase.from("drivers").select("*").eq("id", data.driver_id).single()
        data.driver = driver
      }

      return data
    },
    { refreshInterval: 5000 },
  )

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "Critical":
        return "bg-red-500/10 text-red-500 border-red-500/20"
      case "High":
        return "bg-accent/10 text-accent border-accent/20"
      case "Medium":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
      case "Low":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20"
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Open":
        return "bg-red-500/10 text-red-500 border-red-500/20"
      case "Resolved":
        return "bg-green-500/10 text-green-500 border-green-500/20"
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20"
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:w-3/4 lg:w-2/3">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-accent" />
            {incident?.incident_number}
          </SheetTitle>
        </SheetHeader>

        {incident && (
          <div className="space-y-6 py-6">
            {/* Severity & Status */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-background/50 backdrop-blur border-0">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Severity</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant="outline" className={getSeverityColor(incident.severity)}>
                    {incident.severity}
                  </Badge>
                </CardContent>
              </Card>
              <Card className="bg-background/50 backdrop-blur border-0">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant="outline" className={getStatusColor(incident.status)}>
                    {incident.status}
                  </Badge>
                </CardContent>
              </Card>
            </div>

            {/* Incident Details */}
            <Card className="bg-background/50 backdrop-blur border-0">
              <CardHeader>
                <CardTitle className="text-base">Incident Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Description</p>
                  <p className="text-sm">{incident.description}</p>
                </div>

                <div className="flex items-start gap-2">
                  <Calendar className="h-4 w-4 text-accent mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Date & Time</p>
                    <p className="text-sm font-medium">{new Date(incident.incident_date).toLocaleString()}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-accent mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Location</p>
                    <p className="text-sm font-medium">{incident.location || "Not specified"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Driver Information */}
            {incident.driver && (
              <Card className="bg-background/50 backdrop-blur border-0">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Driver Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Name</p>
                    <p className="text-sm font-medium">{incident.driver.full_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Phone</p>
                    <p className="text-sm font-medium">{incident.driver.phone}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">License Number</p>
                    <p className="text-sm font-medium">{incident.driver.license_number}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Emergency Contact</p>
                    <p className="text-sm font-medium">
                      {incident.driver.emergency_contact_name} ({incident.driver.emergency_contact_phone})
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Vehicle Information */}
            {incident.vehicle && (
              <Card className="bg-background/50 backdrop-blur border-0">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    Vehicle Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Vehicle Number</p>
                    <p className="text-sm font-medium">{incident.vehicle.vehicle_number}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Type</p>
                    <p className="text-sm font-medium">{incident.vehicle.vehicle_type}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Make & Model</p>
                    <p className="text-sm font-medium">
                      {incident.vehicle.make} {incident.vehicle.model} ({incident.vehicle.year})
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Resolution Notes */}
            {incident.resolution_notes && (
              <Card className="bg-background/50 backdrop-blur border-0">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Resolution Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{incident.resolution_notes}</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
