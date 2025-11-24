"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { formatRelativeTime, formatCurrency } from "@/lib/utils"
import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"
import { useState } from "react"

type VehicleActivitiesTabProps = {
  initialFuelLogs: any[]
  initialMaintenance: any[]
  initialIncidents: any[]
  initialVehicles: any[]
}

export function VehicleActivitiesTab({
  initialFuelLogs,
  initialMaintenance,
  initialIncidents,
  initialVehicles,
}: VehicleActivitiesTabProps) {
  const supabase = createClient()
  const [selectedVehicle, setSelectedVehicle] = useState<string>("all")

  // Calculate week start
  const now = new Date()
  const dayOfWeek = now.getDay()
  const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
  const weekStart = new Date(now.setDate(diff))
  weekStart.setHours(0, 0, 0, 0)
  const weekStartISO = weekStart.toISOString()
  const weekStartDate = weekStart.toISOString().split("T")[0]

  // Fetch fuel logs for this week
  const { data: fuelLogs = initialFuelLogs } = useSWR(
    `vehicle-fuel-logs-week-${selectedVehicle}`,
    async () => {
      let query = supabase
        .from("fuel_logs")
        .select("*, vehicle:vehicles(vehicle_number, vehicle_type, make, model), driver:drivers(full_name)")
        .gte("logged_at", weekStartISO)
        .order("logged_at", { ascending: false })

      if (selectedVehicle !== "all") {
        query = query.eq("vehicle_id", selectedVehicle)
      }

      const { data } = await query
      return data || []
    },
    {
      fallbackData: initialFuelLogs,
      revalidateOnMount: false,
    }
  )

  // Fetch maintenance for this week
  const { data: maintenance = initialMaintenance } = useSWR(
    `vehicle-maintenance-week-${selectedVehicle}`,
    async () => {
      let query = supabase
        .from("maintenance_logs")
        .select("*, vehicle:vehicles(vehicle_number, vehicle_type, make, model)")
        .gte("service_date", weekStartDate)
        .order("service_date", { ascending: false })

      if (selectedVehicle !== "all") {
        query = query.eq("vehicle_id", selectedVehicle)
      }

      const { data } = await query
      return data || []
    },
    {
      fallbackData: initialMaintenance,
      revalidateOnMount: false,
    }
  )

  // Fetch incidents for this week
  const { data: incidents = initialIncidents } = useSWR(
    `vehicle-incidents-week-${selectedVehicle}`,
    async () => {
      let query = supabase
        .from("incidents")
        .select("*, vehicle:vehicles(vehicle_number, vehicle_type, make, model)")
        .gte("incident_date", weekStartDate)
        .order("incident_date", { ascending: false })

      if (selectedVehicle !== "all") {
        query = query.eq("vehicle_id", selectedVehicle)
      }

      const { data } = await query
      return data || []
    },
    {
      fallbackData: initialIncidents,
      revalidateOnMount: false,
    }
  )

  // Get unique vehicles from activities
  const activeVehicles = [
    ...fuelLogs.map((f) => f.vehicle_id),
    ...maintenance.map((m) => m.vehicle_id),
    ...incidents.map((i) => i.vehicle_id),
  ]
    .filter((id, index, self) => id && index === self.indexOf(id))
    .map((id) => {
      const vehicle = initialVehicles.find((v) => v.id === id)
      return vehicle ? { id: vehicle.id, name: vehicle.vehicle_number } : null
    })
    .filter(Boolean)

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Vehicle Activities - This Week</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <label className="text-sm font-medium mb-2 block">Filter by Vehicle</label>
            <select
              value={selectedVehicle}
              onChange={(e) => setSelectedVehicle(e.target.value)}
              className="w-full max-w-xs rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="all">All Vehicles</option>
              {activeVehicles.map((vehicle: any) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.name}
                </option>
              ))}
            </select>
          </div>

          <Tabs defaultValue="fuel" className="w-full">
            <TabsList>
              <TabsTrigger value="fuel">Fuel Logs ({fuelLogs.length})</TabsTrigger>
              <TabsTrigger value="maintenance">Maintenance ({maintenance.length})</TabsTrigger>
              <TabsTrigger value="incidents">Incidents ({incidents.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="fuel" className="mt-4">
              {fuelLogs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No fuel logs for this week</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Vehicle</TableHead>
                      <TableHead>Driver</TableHead>
                      <TableHead>Fuel Type</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Cost</TableHead>
                      <TableHead>Station</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fuelLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>{formatRelativeTime(log.logged_at)}</TableCell>
                        <TableCell>
                          {log.vehicle ? (
                            <div>
                              <div className="font-medium">{log.vehicle.vehicle_number}</div>
                              <div className="text-sm text-muted-foreground">
                                {log.vehicle.make} {log.vehicle.model}
                              </div>
                            </div>
                          ) : (
                            "N/A"
                          )}
                        </TableCell>
                        <TableCell>{log.driver?.full_name || "N/A"}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{log.fuel_type}</Badge>
                        </TableCell>
                        <TableCell>
                          {log.quantity} {log.unit}
                        </TableCell>
                        <TableCell>{formatCurrency(log.cost)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {log.station_name || "N/A"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            <TabsContent value="maintenance" className="mt-4">
              {maintenance.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No maintenance records for this week
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Vehicle</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Cost</TableHead>
                      <TableHead>Performed By</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {maintenance.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell>{new Date(m.service_date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          {m.vehicle ? (
                            <div>
                              <div className="font-medium">{m.vehicle.vehicle_number}</div>
                              <div className="text-sm text-muted-foreground">
                                {m.vehicle.make} {m.vehicle.model}
                              </div>
                            </div>
                          ) : (
                            "N/A"
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{m.maintenance_type}</Badge>
                        </TableCell>
                        <TableCell>{m.description || "N/A"}</TableCell>
                        <TableCell>{m.cost ? formatCurrency(m.cost) : "N/A"}</TableCell>
                        <TableCell>{m.performed_by || "N/A"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            <TabsContent value="incidents" className="mt-4">
              {incidents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No incidents for this week</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Vehicle</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {incidents.map((incident) => (
                      <TableRow key={incident.id}>
                        <TableCell>
                          {incident.incident_date
                            ? new Date(incident.incident_date).toLocaleDateString()
                            : "N/A"}
                        </TableCell>
                        <TableCell>
                          {incident.vehicle ? (
                            <div>
                              <div className="font-medium">{incident.vehicle.vehicle_number}</div>
                              <div className="text-sm text-muted-foreground">
                                {incident.vehicle.make} {incident.vehicle.model}
                              </div>
                            </div>
                          ) : (
                            "N/A"
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{incident.incident_type || "N/A"}</Badge>
                        </TableCell>
                        <TableCell>{incident.location || "N/A"}</TableCell>
                        <TableCell className="max-w-xs truncate">
                          {incident.description || "N/A"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={incident.status === "Resolved" ? "default" : "destructive"}
                          >
                            {incident.status || "Open"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
