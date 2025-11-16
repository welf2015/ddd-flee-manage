"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts"

export function FleetChart() {
  // Mock data - will be replaced with real data
  const data = [
    { name: "Mon", bookings: 4, trips: 12 },
    { name: "Tue", bookings: 3, trips: 15 },
    { name: "Wed", bookings: 5, trips: 18 },
    { name: "Thu", bookings: 2, trips: 10 },
    { name: "Fri", bookings: 6, trips: 20 },
    { name: "Sat", bookings: 4, trips: 16 },
    { name: "Sun", bookings: 3, trips: 14 },
  ]

  return (
    <Card className="bg-background/50 backdrop-blur">
      <CardHeader>
        <CardTitle>Weekly Activity</CardTitle>
        <CardDescription>Bookings and trips for the past week</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            bookings: {
              label: "Bookings",
              color: "hsl(var(--chart-1))",
            },
            trips: {
              label: "Trips",
              color: "hsl(var(--chart-2))",
            },
          }}
          className="h-[300px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="bookings" fill="var(--color-bookings)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="trips" fill="var(--color-trips)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
