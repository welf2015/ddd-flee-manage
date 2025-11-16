"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"

export function ClientPerformanceReport() {
  const supabase = createClient()

  const { data: clientData = [] } = useSWR(
    "client-performance",
    async () => {
      const { data } = await supabase.from("bookings").select("client_name, client_id, status, proposed_client_budget")

      if (!data) return []

      const grouped: any = {}
      data.forEach((b: any) => {
        if (!grouped[b.client_id]) {
          grouped[b.client_id] = {
            name: b.client_name,
            totalBookings: 0,
            completedBookings: 0,
            totalValue: 0,
          }
        }
        grouped[b.client_id].totalBookings++
        if (b.status === "Completed") grouped[b.client_id].completedBookings++
        grouped[b.client_id].totalValue += b.proposed_client_budget || 0
      })

      return Object.values(grouped)
        .sort((a: any, b: any) => b.totalBookings - a.totalBookings)
        .slice(0, 20)
    },
    { refreshInterval: 15000 },
  )

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Top Clients</CardTitle>
          <CardDescription>By number of bookings</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client Name</TableHead>
                <TableHead>Total Bookings</TableHead>
                <TableHead>Completed</TableHead>
                <TableHead>Total Value</TableHead>
                <TableHead>Completion Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clientData.length > 0 ? (
                clientData.map((client: any, idx) => {
                  const rate = ((client.completedBookings / client.totalBookings) * 100).toFixed(0)
                  return (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{client.name}</TableCell>
                      <TableCell>{client.totalBookings}</TableCell>
                      <TableCell>{client.completedBookings}</TableCell>
                      <TableCell>₦{client.totalValue.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant={Number.parseInt(rate) >= 80 ? "default" : "secondary"}>{rate}%</Badge>
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No client data available
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
