"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"

export function DriverPerformanceReport() {
  const supabase = createClient()

  const { data: driverData = [] } = useSWR(
    "driver-performance",
    async () => {
      const { data: bookings } = await supabase
        .from("bookings")
        .select("assigned_driver_id, driver:drivers(full_name), status")

      const { data: ratings } = await supabase.from("driver_ratings").select("driver_id, rating")

      if (!bookings) return []

      const driverMap: any = {}
      bookings.forEach((b: any) => {
        if (!b.assigned_driver_id) return
        if (!driverMap[b.assigned_driver_id]) {
          driverMap[b.assigned_driver_id] = {
            id: b.assigned_driver_id,
            name: b.driver?.full_name,
            totalTrips: 0,
            completedTrips: 0,
            avgRating: 0,
            ratings: [],
          }
        }
        driverMap[b.assigned_driver_id].totalTrips++
        if (b.status === "Completed") driverMap[b.assigned_driver_id].completedTrips++
      })

      ratings?.forEach((r: any) => {
        if (driverMap[r.driver_id]) {
          driverMap[r.driver_id].ratings.push(r.rating)
        }
      })

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Driver Performance</CardTitle>
        <CardDescription>Trips completed and ratings</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Driver Name</TableHead>
              <TableHead>Total Trips</TableHead>
              <TableHead>Completed</TableHead>
              <TableHead>Avg Rating</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {driverData.length > 0 ? (
              driverData.map((driver: any) => {
                const rate = ((driver.completedTrips / driver.totalTrips) * 100).toFixed(0)
                return (
                  <TableRow key={driver.id}>
                    <TableCell className="font-medium">{driver.name || "Unknown"}</TableCell>
                    <TableCell>{driver.totalTrips}</TableCell>
                    <TableCell>{driver.completedTrips}</TableCell>
                    <TableCell>
                      <Badge variant={driver.avgRating >= 4 ? "default" : "secondary"}>
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
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No driver data available
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
