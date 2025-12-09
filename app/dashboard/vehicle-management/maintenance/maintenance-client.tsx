"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import MaintenanceSchedulesTable from "@/components/maintenance/maintenance-schedules-table"
import MaintenanceStats from "@/components/maintenance/maintenance-stats"
import { MaintenanceLogSheet } from "@/components/maintenance/maintenance-log-sheet"
import { mutate } from "swr"
import { CreateMaintenanceDialog } from "@/components/maintenance/create-maintenance-dialog"

export default function MaintenanceClient({ initialSchedules, vehicles }: any) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [showLogSheet, setShowLogSheet] = useState(false)

  const handleMaintenanceLogSuccess = () => {
    // Revalidate maintenance schedules
    mutate("maintenance-schedules")
    // Revalidate maintenance stats
    mutate("maintenance-stats")
    // Close the sheet
    setShowLogSheet(false)
  }

  const handleScheduleCreated = () => {
    mutate("maintenance-schedules")
    mutate("maintenance-stats")
    setCreateDialogOpen(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Maintenance Scheduling</h1>
          <p className="text-muted-foreground mt-1">Schedule and track vehicle maintenance with approval workflow</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setCreateDialogOpen(true)}
            variant="outline"
            className="border-accent text-accent hover:bg-accent/10"
          >
            <Plus className="mr-2 h-4 w-4" />
            Schedule Maintenance
          </Button>
          <Button onClick={() => setShowLogSheet(true)} className="bg-accent hover:bg-accent/90 text-accent-foreground">
            <Plus className="mr-2 h-4 w-4" />
            Log Maintenance
          </Button>
        </div>
      </div>

      <MaintenanceStats />

      <Card className="p-6">
        <MaintenanceSchedulesTable initialSchedules={initialSchedules} vehicles={vehicles} />
      </Card>

      <CreateMaintenanceDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        vehicles={vehicles}
        onSuccess={handleScheduleCreated}
      />

      <MaintenanceLogSheet
        open={showLogSheet}
        onOpenChange={setShowLogSheet}
        vehicles={vehicles}
        onSuccess={handleMaintenanceLogSuccess}
      />
    </div>
  )
}
