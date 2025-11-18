"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

export function IncidentsTable({ onUpdate }: { onUpdate: () => void }) {
  const supabase = createClient()

  const { data: incidents = [], mutate } = useSWR("incidents-list", async () => {
    const { data } = await supabase
      .from("incidents")
      .select("*, vehicle:vehicles(vehicle_number), driver:drivers(full_name)")
      .order("incident_date", { ascending: false })
    return data || []
  })

  const handleStatusChange = async (id: string, newStatus: string) => {
    const { error } = await supabase.from("incidents").update({ status: newStatus }).eq("id", id)

    if (error) {
      toast.error("Failed to update status")
    } else {
      toast.success(`Status updated to ${newStatus}`)
      mutate()
      onUpdate()
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Open":
        return "bg-red-500/10 text-red-500"
      case "Insurance":
        return "bg-yellow-500/10 text-yellow-500"
      case "Tow":
        return "bg-orange-500/10 text-orange-500"
      case "Closed":
        return "bg-green-500/10 text-green-500"
      default:
        return "bg-gray-500/10 text-gray-500"
    }
  }

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Vehicle</TableHead>
            <TableHead>Driver</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {incidents.map((incident: any) => (
            <TableRow key={incident.id}>
              <TableCell>{new Date(incident.incident_date).toLocaleDateString()}</TableCell>
              <TableCell>
                <Badge variant="outline">{incident.incident_type}</Badge>
              </TableCell>
              <TableCell>{incident.vehicle?.vehicle_number || "N/A"}</TableCell>
              <TableCell>{incident.driver?.full_name || "N/A"}</TableCell>
              <TableCell className="text-sm">{incident.location}</TableCell>
              <TableCell>
                <Badge variant="outline" className={getStatusColor(incident.status)}>
                  {incident.status}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  {incident.status !== "Closed" && (
                    <Button size="sm" variant="outline" onClick={() => handleStatusChange(incident.id, "Closed")}>
                      Close
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  )
}
