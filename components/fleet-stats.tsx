"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Truck, ClipboardCheck, AlertTriangle } from "lucide-react"

export function FleetStats() {
  // Mock data - will be replaced with real data from Supabase
  const stats = [
    {
      title: "Active Bookings",
      value: "12",
      icon: ClipboardCheck,
      description: "+3 from last week",
      trend: "up",
    },
    {
      title: "Total Vehicles",
      value: "45",
      icon: Truck,
      description: "38 active, 7 maintenance",
      trend: "neutral",
    },
    {
      title: "Pending Approvals",
      value: "5",
      icon: ClipboardCheck,
      description: "Requires attention",
      trend: "neutral",
    },
    {
      title: "Open Incidents",
      value: "3",
      icon: AlertTriangle,
      description: "2 high priority",
      trend: "down",
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <Card key={stat.title} className="bg-background/50 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
