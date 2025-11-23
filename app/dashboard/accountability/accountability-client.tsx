"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Search, Filter, Download } from "lucide-react"
import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"
import { formatDateTime } from "@/lib/utils"

const fetcher = async (url: string) => {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("system_activity_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100)

  if (error) throw error
  return data || []
}

export function AccountabilityClient() {
  const [search, setSearch] = useState("")
  const [moduleFilter, setModuleFilter] = useState<string>("all")

  const { data: activities, error } = useSWR("activity-log", fetcher, {
    refreshInterval: 10000,
  })

  const filteredActivities = activities?.filter((activity) => {
    const matchesSearch = search
      ? activity.reference_id?.toLowerCase().includes(search.toLowerCase()) ||
        activity.description?.toLowerCase().includes(search.toLowerCase()) ||
        activity.user_name?.toLowerCase().includes(search.toLowerCase())
      : true

    const matchesModule = moduleFilter !== "all" ? activity.module === moduleFilter : true

    return matchesSearch && matchesModule
  })

  const getModuleBadgeColor = (module: string) => {
    const colors: Record<string, string> = {
      Procurement: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      Booking: "bg-green-500/10 text-green-500 border-green-500/20",
      Inspection: "bg-purple-500/10 text-purple-500 border-purple-500/20",
      Incident: "bg-red-500/10 text-red-500 border-red-500/20",
      Maintenance: "bg-orange-500/10 text-orange-500 border-orange-500/20",
      Fuel: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
      Document: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
      Onboarding: "bg-pink-500/10 text-pink-500 border-pink-500/20",
      Inventory: "bg-teal-500/10 text-teal-500 border-teal-500/20",
    }
    return colors[module] || "bg-gray-500/10 text-gray-500 border-gray-500/20"
  }

  if (error) {
    return <div className="text-sm text-destructive">Failed to load activity log: {error.message}</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Accountability</h1>
          <p className="text-sm text-muted-foreground mt-1">Complete system activity log and audit trail</p>
        </div>
        <Button variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" />
          Export Log
        </Button>
      </div>

      <Card className="bg-background/50 backdrop-blur">
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search activities..."
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={moduleFilter} onValueChange={setModuleFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by module" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Modules</SelectItem>
                <SelectItem value="Procurement">Procurement</SelectItem>
                <SelectItem value="Booking">Booking</SelectItem>
                <SelectItem value="Inspection">Inspection</SelectItem>
                <SelectItem value="Incident">Incident</SelectItem>
                <SelectItem value="Maintenance">Maintenance</SelectItem>
                <SelectItem value="Fuel">Fuel</SelectItem>
                <SelectItem value="Document">Document</SelectItem>
                <SelectItem value="Onboarding">Onboarding</SelectItem>
                <SelectItem value="Inventory">Inventory</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {!activities ? (
            <div className="text-sm text-muted-foreground">Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Module</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredActivities?.map((activity) => (
                    <TableRow key={activity.id}>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDateTime(activity.created_at)}
                      </TableCell>
                      <TableCell>
                        <Badge className={getModuleBadgeColor(activity.module)} variant="outline">
                          {activity.module}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium text-sm">{activity.action}</TableCell>
                      <TableCell className="text-sm">{activity.reference_id || "N/A"}</TableCell>
                      <TableCell>
                        <div className="text-sm">{activity.user_name || "System"}</div>
                        <div className="text-xs text-muted-foreground">{activity.user_email}</div>
                      </TableCell>
                      <TableCell className="text-sm max-w-md truncate">{activity.description}</TableCell>
                    </TableRow>
                  ))}
                  {filteredActivities?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No activities found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
