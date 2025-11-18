"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"

export function FuelLogsTable({ onUpdate }: { onUpdate: () => void }) {
  const supabase = createClient()

  const { data: logs = [] } = useSWR("fuel-logs-list", async () => {
    const { data } = await supabase
      .from("fuel_logs")
      .select("*, vehicle:vehicles(vehicle_number), driver:drivers(full_name)")
      .order("logged_at", { ascending: false })
      .limit(50)
    return data || []
  })

  return (
    <Card>
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
          {logs.map((log: any) => (
            <TableRow key={log.id}>
              <TableCell>{new Date(log.logged_at).toLocaleDateString()}</TableCell>
              <TableCell>{log.vehicle?.vehicle_number || "N/A"}</TableCell>
              <TableCell>{log.driver?.full_name || "N/A"}</TableCell>
              <TableCell>
                <Badge variant="outline">{log.fuel_type}</Badge>
              </TableCell>
              <TableCell>
                {log.quantity} {log.unit}
              </TableCell>
              <TableCell>₦{log.cost.toLocaleString()}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{log.station_name || "N/A"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  )
}
