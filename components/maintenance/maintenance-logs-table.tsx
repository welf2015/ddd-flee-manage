"use client"

import { useState } from "react"
import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search } from "lucide-react"
import { format } from "date-fns"

const fetcher = async () => {
  const supabase = createClient()
  const { data } = await supabase
    .from("maintenance_logs")
    .select(`
      *,
      vehicle:vehicles(vehicle_number, make, model, vehicle_type),
      logged_by_user:profiles!maintenance_logs_logged_by_fkey(full_name)
    `)
    .order("service_date", { ascending: false })

  return data || []
}

export default function MaintenanceLogsTable({ initialLogs }: any) {
  const { data: logs } = useSWR("maintenance-logs", fetcher, {
    fallbackData: initialLogs,
    refreshInterval: 5000,
  })

  const [searchQuery, setSearchQuery] = useState("")

  const filteredLogs = logs?.filter(
    (log: any) =>
      log.vehicle?.vehicle_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.maintenance_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.service_centre?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const getTypeBadge = (type: string) => {
    const variants: Record<string, string> = {
      Routine: "bg-blue-500/10 text-blue-700 border-blue-500/20",
      Major: "bg-orange-500/10 text-orange-700 border-orange-500/20",
    }

    return (
      <Badge variant="outline" className={variants[type] || ""}>
        {type}
      </Badge>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Maintenance Logs</h2>
        <div className="relative w-96">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by vehicle, type, or service centre..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Service Date</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Service Centre</TableHead>
              <TableHead>Cost</TableHead>
              <TableHead>Mileage</TableHead>
              <TableHead>Next Service</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLogs?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No maintenance logs found
                </TableCell>
              </TableRow>
            ) : (
              filteredLogs?.map((log: any) => (
                <TableRow key={log.id}>
                  <TableCell className="font-medium">{format(new Date(log.service_date), "MMM dd, yyyy")}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{log.vehicle?.vehicle_number}</div>
                      <div className="text-sm text-muted-foreground">
                        {log.vehicle?.make} {log.vehicle?.model}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getTypeBadge(log.maintenance_type)}</TableCell>
                  <TableCell>{log.service_centre || "N/A"}</TableCell>
                  <TableCell>{log.cost ? `₦${Number(log.cost).toLocaleString()}` : "N/A"}</TableCell>
                  <TableCell>
                    {log.current_mileage ? `${Number(log.current_mileage).toLocaleString()} km` : "N/A"}
                  </TableCell>
                  <TableCell>
                    {log.next_service_date ? format(new Date(log.next_service_date), "MMM dd, yyyy") : "N/A"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
