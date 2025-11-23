"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { formatRelativeTime, formatCurrency } from "@/lib/utils"
import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"
import { useState } from "react"

type DriverActivitiesTabProps = {
  initialBookings: any[]
  initialDrivers: any[]
}

export function DriverActivitiesTab({ initialBookings, initialDrivers }: DriverActivitiesTabProps) {
  const supabase = createClient()
  const [selectedDriver, setSelectedDriver] = useState<string>("all")

  // Calculate week start
  const now = new Date()
  const dayOfWeek = now.getDay()
  const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
  const weekStart = new Date(now.setDate(diff))
  weekStart.setHours(0, 0, 0, 0)
  const weekStartISO = weekStart.toISOString()

  // Fetch bookings for this week
  const { data: bookings = initialBookings } = useSWR(
    `driver-bookings-week-${selectedDriver}`,
    async () => {
      let query = supabase
        .from("bookings")
        .select(
          `
          *,
          driver:drivers!bookings_assigned_driver_id_fkey(
            id, full_name, phone, license_number, status, photo_url
          ),
          vehicle:vehicles!bookings_assigned_vehicle_id_fkey(
            id, vehicle_number, vehicle_type, make, model
          ),
          client:clients(name)
        `
        )
        .gte("created_at", weekStartISO)
        .order("created_at", { ascending: false })

      if (selectedDriver !== "all") {
        query = query.eq("assigned_driver_id", selectedDriver)
      }

      const { data } = await query
      return data || []
    },
    {
      fallbackData: initialBookings,
      revalidateOnMount: false,
    }
  )

  // Get unique drivers from bookings
  const activeDrivers = bookings
    .filter((b) => b.driver)
    .map((b) => ({
      id: b.driver.id,
      name: b.driver.full_name,
    }))
    .filter((d, index, self) => index === self.findIndex((t) => t.id === d.id))

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      Open: "bg-blue-100 text-blue-800",
      Negotiation: "bg-yellow-100 text-yellow-800",
      Approved: "bg-green-100 text-green-800",
      Assigned: "bg-purple-100 text-purple-800",
      "In Progress": "bg-orange-100 text-orange-800",
      "In Transit": "bg-indigo-100 text-indigo-800",
      Completed: "bg-gray-100 text-gray-800",
      Closed: "bg-red-100 text-red-800",
    }
    return colors[status] || "bg-gray-100 text-gray-800"
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Driver Activities - This Week</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <label className="text-sm font-medium mb-2 block">Filter by Driver</label>
            <select
              value={selectedDriver}
              onChange={(e) => setSelectedDriver(e.target.value)}
              className="w-full max-w-xs rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="all">All Drivers</option>
              {activeDrivers.map((driver) => (
                <option key={driver.id} value={driver.id}>
                  {driver.name}
                </option>
              ))}
            </select>
          </div>

          {bookings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No driver activities for this week
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job ID</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Budget</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell className="font-medium">{booking.job_id}</TableCell>
                    <TableCell>
                      {booking.driver ? (
                        <div>
                          <div className="font-medium">{booking.driver.full_name}</div>
                          <div className="text-sm text-muted-foreground">{booking.driver.phone}</div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Not assigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {booking.vehicle ? (
                        <div>
                          <div className="font-medium">{booking.vehicle.vehicle_number}</div>
                          <div className="text-sm text-muted-foreground">
                            {booking.vehicle.make} {booking.vehicle.model}
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Not assigned</span>
                      )}
                    </TableCell>
                    <TableCell>{booking.client?.name || booking.client_name || "N/A"}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(booking.status)}>{booking.status}</Badge>
                    </TableCell>
                    <TableCell>
                      {booking.proposed_client_budget
                        ? formatCurrency(booking.proposed_client_budget)
                        : "N/A"}
                    </TableCell>
                    <TableCell>{formatRelativeTime(booking.created_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

