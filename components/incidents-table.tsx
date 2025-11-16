"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Eye } from "lucide-react"
import { useState } from "react"
import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"
import { IncidentDetailSheet } from "./incident-detail-sheet"

export function IncidentsTable() {
  const supabase = createClient()
  const [selectedIncident, setSelectedIncident] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  const { data: incidents = [] } = useSWR(
    "incidents",
    async () => {
      try {
        const { data, error } = await supabase
          .from("incidents")
          .select("id, incident_number, vehicle_id, driver_id, incident_date, description, severity, status, location")
          .order("incident_date", { ascending: false })

        if (error) {
          console.error("[v0] Incidents query error:", error)
          return []
        }

        const enrichedIncidents = await Promise.all(
          (data || []).map(async (incident) => {
            let vehicle_number = "N/A"
            let driver_name = "Unknown"

            if (incident.vehicle_id) {
              const { data: vehicle } = await supabase
                .from("vehicles")
                .select("vehicle_number")
                .eq("id", incident.vehicle_id)
                .single()
              vehicle_number = vehicle?.vehicle_number || "N/A"
            }

            if (incident.driver_id) {
              const { data: driver } = await supabase
                .from("drivers")
                .select("full_name")
                .eq("id", incident.driver_id)
                .single()
              driver_name = driver?.full_name || "Unknown"
            }

            return {
              ...incident,
              vehicle_number,
              driver_name,
            }
          }),
        )

        return enrichedIncidents
      } catch (err) {
        console.error("[v0] Incidents fetch error:", err)
        return []
      }
    },
    { refreshInterval: 5000 },
  )

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

  const filteredIncidents = incidents.filter(
    (incident: any) =>
      incident.incident_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      incident.driver_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      incident.vehicle_number.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <>
      <Card className="bg-background/50 backdrop-blur">
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>All Incidents</CardTitle>
            <Input
              placeholder="Search incidents..."
              className="sm:w-[250px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Incident #</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Driver</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredIncidents.map((incident: any) => (
                <TableRow key={incident.id}>
                  <TableCell className="font-medium">{incident.incident_number}</TableCell>
                  <TableCell>{incident.vehicle_number}</TableCell>
                  <TableCell>{incident.driver_name}</TableCell>
                  <TableCell>{new Date(incident.incident_date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getSeverityColor(incident.severity)}>
                      {incident.severity}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getStatusColor(incident.status)}>
                      {incident.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedIncident(incident.id)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selectedIncident && (
        <IncidentDetailSheet
          incidentId={selectedIncident}
          open={!!selectedIncident}
          onOpenChange={(open) => !open && setSelectedIncident(null)}
        />
      )}
    </>
  )
}
