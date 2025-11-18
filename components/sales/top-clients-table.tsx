"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"

const fetcher = async (timeRange: string) => {
  const supabase = createClient()
  
  const now = new Date()
  let startDate = new Date()
  if (timeRange === "weekly") {
    startDate.setDate(now.getDate() - 7)
  } else if (timeRange === "monthly") {
    startDate.setMonth(now.getMonth() - 1)
  } else {
    startDate.setFullYear(now.getFullYear() - 1)
  }

  const { data: bookings } = await supabase
    .from("bookings")
    .select("client_id, client_name, current_negotiation_amount, status")
    .gte("created_at", startDate.toISOString())

  // Group by client
  const clientStats = bookings?.reduce((acc: any, booking) => {
    const clientId = booking.client_id || booking.client_name || "Unknown"
    if (!acc[clientId]) {
      acc[clientId] = {
        name: booking.client_name || "Unknown Client",
        totalBookings: 0,
        totalRevenue: 0,
        completedBookings: 0,
      }
    }
    acc[clientId].totalBookings++
    if (["Completed", "Closed"].includes(booking.status)) {
      acc[clientId].totalRevenue += Number(booking.current_negotiation_amount) || 0
      acc[clientId].completedBookings++
    }
    return acc
  }, {})

  // Convert to array and sort by revenue
  return Object.values(clientStats || {})
    .sort((a: any, b: any) => b.totalRevenue - a.totalRevenue)
    .slice(0, 10)
}

interface TopClientsTableProps {
  timeRange: string
}

export function TopClientsTable({ timeRange }: TopClientsTableProps) {
  const { data: clients } = useSWR(`top-clients-${timeRange}`, () => fetcher(timeRange), {
    refreshInterval: 10000,
  })

  const getClientBadge = (bookings: number) => {
    if (bookings >= 5) return { label: "VIP", variant: "default" as const }
    if (bookings >= 3) return { label: "Frequent", variant: "secondary" as const }
    return { label: "Active", variant: "outline" as const }
  }

  return (
    <Card className="bg-background/50 backdrop-blur">
      <CardHeader>
        <CardTitle>Top Clients by Revenue</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Rank</TableHead>
              <TableHead>Client Name</TableHead>
              <TableHead>Total Bookings</TableHead>
              <TableHead>Completed</TableHead>
              <TableHead>Total Revenue</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients?.map((client: any, index: number) => {
              const badge = getClientBadge(client.totalBookings)
              return (
                <TableRow key={index}>
                  <TableCell className="font-medium">#{index + 1}</TableCell>
                  <TableCell>{client.name}</TableCell>
                  <TableCell>{client.totalBookings}</TableCell>
                  <TableCell>{client.completedBookings}</TableCell>
                  <TableCell className="font-medium">
                    ₦{client.totalRevenue.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant={badge.variant}>{badge.label}</Badge>
                  </TableCell>
                </TableRow>
              )
            })}
            {(!clients || clients.length === 0) && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No client data available
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
