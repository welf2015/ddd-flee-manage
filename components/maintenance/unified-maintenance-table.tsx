"use client"

import { useState } from "react"
import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Edit, Trash2, Eye } from "lucide-react"
import { format } from "date-fns"
import { deleteMaintenanceLog, deleteMaintenanceSchedule } from "@/app/actions/maintenance"
import { toast } from "sonner"
import { EditMaintenanceLogDialog } from "./edit-maintenance-log-dialog"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import MaintenanceDetailSheet from "./maintenance-detail-sheet"
import { MaintenanceLogSheet } from "./maintenance-log-sheet"

const fetcher = async () => {
  const supabase = createClient()

  // Fetch logs
  const { data: logs } = await supabase
    .from("maintenance_logs")
    .select(`
      *,
      vehicle:vehicles(vehicle_number, make, model, vehicle_type),
      logged_by_user:profiles!maintenance_logs_logged_by_fkey(full_name)
    `)
    .order("service_date", { ascending: false })

  // Fetch schedules
  const { data: schedules } = await supabase
    .from("maintenance_schedules")
    .select(`
      *,
      vehicle:vehicles(vehicle_number, make, model, vehicle_type),
      scheduled_by_user:profiles!maintenance_schedules_scheduled_by_fkey(full_name)
    `)
    .order("scheduled_date", { ascending: false })

  // Combine and add type tag
  const logsWithType = (logs || []).map((log: any) => ({ ...log, record_type: "Log" }))
  const schedulesWithType = (schedules || []).map((schedule: any) => ({ ...schedule, record_type: "Schedule" }))

  return [...logsWithType, ...schedulesWithType].sort((a, b) => {
    const dateA = new Date(a.service_date || a.scheduled_date)
    const dateB = new Date(b.service_date || b.scheduled_date)
    return dateB.getTime() - dateA.getTime()
  })
}

export default function UnifiedMaintenanceTable({ initialLogs, initialSchedules }: any) {
  const { data: records, mutate } = useSWR("unified-maintenance", fetcher, {
    fallbackData: [],
    refreshInterval: 5000,
  })

  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<"all" | "Log" | "Schedule">("all")
  const [editLogId, setEditLogId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; type: string; name: string } | null>(null)
  const [viewRecord, setViewRecord] = useState<any>(null)

  const confirmDelete = async () => {
    if (!deleteConfirm) return

    setDeletingId(deleteConfirm.id)
    const result = deleteConfirm.type === "Log"
      ? await deleteMaintenanceLog(deleteConfirm.id)
      : await deleteMaintenanceSchedule(deleteConfirm.id)

    if (result.success) {
      toast.success(`Maintenance ${deleteConfirm.type.toLowerCase()} deleted successfully`)
      mutate()
    } else {
      toast.error(result.error || `Failed to delete maintenance ${deleteConfirm.type.toLowerCase()}`)
    }
    setDeletingId(null)
    setDeleteConfirm(null)
  }

  const filteredRecords = records?.filter((record: any) => {
    const matchesSearch =
      record.vehicle?.vehicle_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.maintenance_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.service_centre?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesFilter = filterType === "all" || record.record_type === filterType

    return matchesSearch && matchesFilter
  })

  const getTypeBadge = (type: string) => {
    const variants: Record<string, string> = {
      Routine: "bg-blue-500/10 text-blue-700 border-blue-500/20",
      Major: "bg-orange-500/10 text-orange-700 border-orange-500/20",
    }

    return (
      <Badge variant="outline" className={variants[type] || ""}>
        {type}
      </Badge>
    )
  }

  const getRecordTypeBadge = (recordType: string) => {
    return recordType === "Log" ? (
      <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-500/20">
        Log
      </Badge>
    ) : (
      <Badge variant="outline" className="bg-purple-500/10 text-purple-700 border-purple-500/20">
        Schedule
      </Badge>
    )
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      Pending: "bg-yellow-500/10 text-yellow-700 border-yellow-500/20",
      Approved: "bg-blue-500/10 text-blue-700 border-blue-500/20",
      "In Progress": "bg-orange-500/10 text-orange-700 border-orange-500/20",
      Completed: "bg-green-500/10 text-green-700 border-green-500/20",
      Rejected: "bg-red-500/10 text-red-700 border-red-500/20",
    }

    return (
      <Badge variant="outline" className={variants[status] || ""}>
        {status}
      </Badge>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">All Maintenance Records</h2>
        <div className="flex items-center gap-4">
          <Tabs value={filterType} onValueChange={(value: any) => setFilterType(value)}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="Log">Logs</TabsTrigger>
              <TabsTrigger value="Schedule">Schedules</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by vehicle, type, or service centre..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead>Maintenance Type</TableHead>
              <TableHead>Service Centre</TableHead>
              <TableHead>Cost</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRecords?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No maintenance records found
                </TableCell>
              </TableRow>
            ) : (
              filteredRecords?.map((record: any) => (
                <TableRow key={`${record.record_type}-${record.id}`}>
                  <TableCell>{getRecordTypeBadge(record.record_type)}</TableCell>
                  <TableCell className="font-medium">
                    {format(new Date(record.service_date || record.scheduled_date), "MMM dd, yyyy")}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{record.vehicle?.vehicle_number}</div>
                      <div className="text-sm text-muted-foreground">
                        {record.vehicle?.make} {record.vehicle?.model}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getTypeBadge(record.maintenance_type)}</TableCell>
                  <TableCell>{record.service_centre || record.service_provider || "N/A"}</TableCell>
                  <TableCell>
                    {record.cost || record.estimated_cost || record.actual_cost
                      ? `₦${Number(record.cost || record.estimated_cost || record.actual_cost).toLocaleString()}`
                      : "N/A"}
                  </TableCell>
                  <TableCell>
                    {record.record_type === "Schedule" ? getStatusBadge(record.status) : getStatusBadge("Completed")}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => setViewRecord(record)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      {record.record_type === "Log" && (
                        <Button variant="ghost" size="icon" onClick={() => setEditLogId(record.id)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          setDeleteConfirm({
                            id: record.id,
                            type: record.record_type,
                            name: record.vehicle?.vehicle_number,
                          })
                        }
                        disabled={deletingId === record.id}
                        className="text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <EditMaintenanceLogDialog
        open={!!editLogId}
        onOpenChange={(open) => !open && setEditLogId(null)}
        logId={editLogId}
        onLogUpdated={mutate}
      />

      {/* View Dialog - shows details based on record type */}
      {viewRecord && viewRecord.record_type === "Schedule" && (
        <MaintenanceDetailSheet
          schedule={viewRecord}
          open={!!viewRecord}
          onOpenChange={(open) => !open && setViewRecord(null)}
          vehicles={[]}
        />
      )}

      {viewRecord && viewRecord.record_type === "Log" && (
        <MaintenanceLogSheet
          log={viewRecord}
          open={!!viewRecord}
          onOpenChange={(open) => !open && setViewRecord(null)}
        />
      )}

      <ConfirmDialog
        open={!!deleteConfirm}
        onOpenChange={(open) => !open && setDeleteConfirm(null)}
        title={`Delete Maintenance ${deleteConfirm?.type}`}
        description={`Are you sure you want to delete this maintenance ${deleteConfirm?.type.toLowerCase()} for ${deleteConfirm?.name}? This action cannot be undone.`}
        onConfirm={confirmDelete}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />
    </div>
  )
}
