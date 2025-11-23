"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye } from "lucide-react"
import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"

const fetcher = async () => {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("vehicle_onboarding")
    .select(`
      *,
      assigned_to_profile:profiles!vehicle_onboarding_assigned_to_fkey(full_name),
      vehicle_onboarding_progress(is_completed)
    `)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[v0] Onboarding fetch error:", error.message)
    throw error
  }

  // Manually fetch procurement data to avoid circular reference
  if (data && data.length > 0) {
    const procurementIds = data.filter((item) => item.procurement_id).map((item) => item.procurement_id)

    if (procurementIds.length > 0) {
      const { data: procurements } = await supabase
        .from("procurements")
        .select(`
          id,
          procurement_number,
          vendor:vendors(name)
        `)
        .in("id", procurementIds)

      // Map procurement data to onboarding records
      data.forEach((item) => {
        if (item.procurement_id) {
          item.procurement = procurements?.find((p) => p.id === item.procurement_id)
        }
      })
    }
  }

  return data || []
}

interface OnboardingTableProps {
  search: string
  onViewDetails: (id: string) => void
}

export function OnboardingTable({ search, onViewDetails }: OnboardingTableProps) {
  const {
    data: onboarding,
    error,
    mutate,
  } = useSWR("vehicle-onboarding", fetcher, {
    refreshInterval: 30000,
  })

  const filteredData = onboarding?.filter((item) =>
    search ? item.vehicle_number?.toLowerCase().includes(search.toLowerCase()) : true,
  )

  if (error) {
    return (
      <div className="text-sm text-destructive">Failed to load onboarding data: {error.message || "Unknown error"}</div>
    )
  }

  if (!onboarding) {
    return <div className="text-sm text-muted-foreground">Loading...</div>
  }

  if (filteredData?.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No vehicles in onboarding</p>
      </div>
    )
  }

  const getCompletionPercentage = (progressArray: any[]) => {
    if (!progressArray || progressArray.length === 0) return 0
    const completed = progressArray.filter((p) => p.is_completed).length
    return Math.round((completed / progressArray.length) * 100)
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Vehicle Number</TableHead>
            <TableHead>Vehicle Type</TableHead>
            <TableHead>Make/Model</TableHead>
            <TableHead>Procurement</TableHead>
            <TableHead>Assigned To</TableHead>
            <TableHead>Progress</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredData?.map((item) => {
            const completion = getCompletionPercentage(item.vehicle_onboarding_progress)
            return (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.vehicle_number || "TBD"}</TableCell>
                <TableCell>{item.vehicle_type}</TableCell>
                <TableCell>
                  {item.make} {item.model} {item.year}
                </TableCell>
                <TableCell>
                  {item.procurement?.procurement_number || "N/A"}
                  {item.procurement?.vendor && (
                    <div className="text-xs text-muted-foreground">{item.procurement.vendor.name}</div>
                  )}
                </TableCell>
                <TableCell>{item.assigned_to_profile?.full_name || "Unassigned"}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div className="bg-accent h-2 rounded-full transition-all" style={{ width: `${completion}%` }} />
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">{completion}%</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={item.status === "Completed" ? "default" : "secondary"}>{item.status}</Badge>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" onClick={() => onViewDetails(item.id)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
