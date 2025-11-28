"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"
import { getDateRange, getPeriodLabel, type TimePeriod } from "@/lib/report-utils"

type DriverPerformanceReportProps = {
  timePeriod?: TimePeriod
}

export function DriverPerformanceReport({ timePeriod = "weekly" }: DriverPerformanceReportProps) {
  const supabase = createClient()
  const { startDateISO } = getDateRange(timePeriod)

  const { data: driverData = [], isLoading } = useSWR(
    `driver-performance-${timePeriod}`,
    async () => {
      const { data: allDrivers } = await supabase.from("drivers").select("id, full_name, status").order("full_name")

      if (!allDrivers || allDrivers.length === 0) {
        return []
      }

      // Get bookings with driver info
      let bookingsQuery = supabase.from("bookings").select("assigned_driver_id, status, created_at")

      if (startDateISO) {
        bookingsQuery = bookingsQuery.gte("created_at", startDateISO)
      }

      const { data: bookings } = await bookingsQuery

      // Get ratings
      const { data: ratings } = await supabase.from("driver_ratings").select("driver_id, rating")

      // Build driver map starting with ALL drivers
      const driverMap: any = {}

      allDrivers.forEach((driver: any) => {
        driverMap[driver.id] = {
          id: driver.id,
          name: driver.full_name,
          status: driver.status,
          totalTrips: 0,
          completedTrips: 0,
          avgRating: 0,
          ratings: [],
        }
      })

      // Add booking data
      bookings?.forEach((b: any) => {
        if (!b.assigned_driver_id || !driverMap[b.assigned_driver_id]) return
        driverMap[b.assigned_driver_id].totalTrips++
        if (b.status === "Completed") driverMap[b.assigned_driver_id].completedTrips++
      })

      // Add ratings
      ratings?.forEach((r: any) => {
        if (driverMap[r.driver_id]) {
          driverMap[r.driver_id].ratings.push(r.rating)
        }
      })

      // Calculate average ratings
      Object.keys(driverMap).forEach((id) => {
        if (driverMap[id].ratings.length > 0) {
          driverMap[id].avgRating = (
            driverMap[id].ratings.reduce((a: number, b: number) => a + b, 0) / driverMap[id].ratings.length
          ).toFixed(1)
        }
      })

      return Object.values(driverMap).sort((a: any, b: any) => b.totalTrips - a.totalTrips)
    },
    { refreshInterval: 15000 },
  )

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Active":
        return (
          <Badge variant="outline" className="text-green-600 border-green-600">
            Active
          </Badge>
        )
      case "Currently on Job":
        return (
          <Badge variant="outline" className="text-blue-600 border-blue-600">
            On Job
          </Badge>
        )
      case "Assigned to Job":
        return (
          <Badge variant="outline" className="text-orange-600 border-orange-600">
            Assigned
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Driver Performance</CardTitle>
        <CardDescription>{getPeriodLabel(timePeriod)} - Trips completed and ratings</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">Loading driver data...</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Driver Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total Trips</TableHead>
                <TableHead>Completed</TableHead>
                <TableHead>Avg Rating</TableHead>
                <TableHead>Completion Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {driverData.length > 0 ? (
                driverData.map((driver: any) => {
                  const rate =
                    driver.totalTrips > 0 ? ((driver.completedTrips / driver.totalTrips) * 100).toFixed(0) : "0"
                  return (
                    <TableRow key={driver.id}>
                      <TableCell className="font-medium">{driver.name || "Unknown"}</TableCell>
                      <TableCell>{getStatusBadge(driver.status)}</TableCell>
                      <TableCell>{driver.totalTrips}</TableCell>
                      <TableCell>{driver.completedTrips}</TableCell>
                      <TableCell>
                        <Badge variant={Number(driver.avgRating) >= 4 ? "default" : "secondary"}>
                          {driver.avgRating || "No ratings"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={Number.parseInt(rate) >= 80 ? "default" : "secondary"}>{rate}%</Badge>
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No driver data available
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
