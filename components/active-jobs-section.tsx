"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Truck, MapPin, Clock, User } from "lucide-react"
import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"

type ActiveJob = {
  id: string
  job_id: string
  client_name: string
  status: string
  route: string
  timeline: string
  assigned_driver_id: string
  assigned_vehicle_id: string
}

export function ActiveJobsSection({ onJobClick }: { onJobClick?: (jobId: string) => void }) {
  const supabase = createClient()

  const { data: activeJobs = [], isLoading } = useSWR(
    "active-jobs",
    async () => {
      try {
        const { data, error } = await supabase
          .from("bookings")
          .select("id, job_id, client_name, status, route, timeline, assigned_driver_id, assigned_vehicle_id")
          .in("status", ["Assigned", "In Progress", "In Transit"])
          .order("created_at", { ascending: false })

        if (error) {
          console.error("[v0] Active jobs query error:", error)
          return []
        }

        const enrichedJobs = await Promise.all(
          (data || []).map(async (job) => {
            let driverName = "Unassigned"
            let vehicleNumber = "N/A"

            if (job.assigned_driver_id) {
              const { data: driver } = await supabase
                .from("drivers")
                .select("full_name")
                .eq("id", job.assigned_driver_id)
                .single()
              driverName = driver?.full_name || "Unassigned"
            }

            if (job.assigned_vehicle_id) {
              const { data: vehicle } = await supabase
                .from("vehicles")
                .select("vehicle_number")
                .eq("id", job.assigned_vehicle_id)
                .single()
              vehicleNumber = vehicle?.vehicle_number || "N/A"
            }

            return {
              ...job,
              driver_name: driverName,
              vehicle_number: vehicleNumber,
            }
          }),
        )

        return enrichedJobs
      } catch (err) {
        console.error("[v0] Active jobs fetch error:", err)
        return []
      }
    },
    { refreshInterval: 3000 },
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Assigned":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20"
      case "In Progress":
        return "bg-purple-500/10 text-purple-500 border-purple-500/20"
      case "In Transit":
        return "bg-cyan-500/10 text-cyan-500 border-cyan-500/20"
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Assigned":
        return "Preparing"
      case "In Progress":
        return "Loading"
      case "In Transit":
        return "En Route"
      default:
        return status
    }
  }

  return (
    <Card className="bg-background/50 backdrop-blur col-span-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-accent" />
              Active Jobs
            </CardTitle>
            <CardDescription>Live tracking of ongoing deliveries</CardDescription>
          </div>
          <Badge className="bg-accent text-accent-foreground">{activeJobs.length} Active</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading active jobs...</div>
        ) : activeJobs.length > 0 ? (
          <div className="grid gap-4">
            {activeJobs.map((job: any) => (
              <div
                key={job.id}
                className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => onJobClick?.(job.id)}
              >
                <div className="flex gap-4 flex-1">
                  <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center border-2 border-accent">
                    <User className="h-6 w-6 text-accent" />
                  </div>

                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{job.job_id}</p>
                      <Badge variant="outline" className={getStatusColor(job.status)}>
                        {getStatusIcon(job.status)}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <User className="h-3 w-3" />
                        <span>{job.driver_name}</span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Truck className="h-3 w-3" />
                        <span>{job.vehicle_number}</span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{job.timeline}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span>{job.route}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-sm font-medium text-muted-foreground">For</p>
                  <p className="font-medium">{job.client_name}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <Truck className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No active jobs at the moment</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
