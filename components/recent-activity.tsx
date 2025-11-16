"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ClipboardCheck, Truck, AlertTriangle } from "lucide-react"
import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"

export function RecentActivity() {
  const supabase = createClient()

  const { data: activities = [] } = useSWR(
    "recent-activities",
    async () => {
      const now = new Date()
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000)

      // Fetch recent bookings
      const { data: bookings = [] } = await supabase
        .from("bookings")
        .select("id, job_id, status, created_at, client_name")
        .gte("created_at", twoHoursAgo.toISOString())
        .order("created_at", { ascending: false })
        .limit(5)

      // Fetch recent incidents
      const { data: incidents = [] } = await supabase
        .from("incidents")
        .select("id, incident_number, severity, created_at")
        .gte("created_at", twoHoursAgo.toISOString())
        .order("created_at", { ascending: false })
        .limit(3)

      // Fetch maintenance logs
      const { data: maintenance = [] } = await supabase
        .from("maintenance_logs")
        .select("id, vehicle_id, service_date")
        .gte("service_date", new Date(twoHoursAgo).toISOString().split("T")[0])
        .order("service_date", { ascending: false })
        .limit(2)

      // Map to activity format
      const activities: any[] = []

      bookings.forEach((booking: any) => {
        activities.push({
          id: booking.id,
          type: "booking",
          title: booking.status === "Approved" ? "Booking approved" : "New booking created",
          description: `${booking.job_id} from ${booking.client_name}`,
          time: new Date(booking.created_at).toLocaleString(),
          icon: ClipboardCheck,
          status: booking.status,
        })
      })

      incidents.forEach((incident: any) => {
        activities.push({
          id: incident.id,
          type: "incident",
          title: "Incident reported",
          description: `${incident.incident_number} - ${incident.severity}`,
          time: new Date(incident.created_at).toLocaleString(),
          icon: AlertTriangle,
          status: "Open",
        })
      })

      maintenance.forEach((m: any) => {
        activities.push({
          id: m.id,
          type: "maintenance",
          title: "Vehicle maintenance scheduled",
          description: `Maintenance service scheduled`,
          time: new Date(m.service_date).toLocaleString(),
          icon: Truck,
          status: "Scheduled",
        })
      })

      return activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 5)
    },
    { refreshInterval: 5000 },
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Open":
        return "bg-yellow-500/10 text-yellow-500"
      case "Approved":
        return "bg-green-500/10 text-green-500"
      case "Scheduled":
        return "bg-blue-500/10 text-blue-500"
      default:
        return "bg-gray-500/10 text-gray-500"
    }
  }

  return (
    <Card className="bg-background/50 backdrop-blur">
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest updates across your fleet</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.length > 0 ? (
            activities.map((activity) => {
              const Icon = activity.icon
              return (
                <div key={activity.id} className="flex items-start gap-4">
                  <div className="rounded-full bg-muted p-2">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium leading-none">{activity.title}</p>
                      <Badge variant="outline" className={getStatusColor(activity.status)}>
                        {activity.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{activity.description}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              )
            })
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
