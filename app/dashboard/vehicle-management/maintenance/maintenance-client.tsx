'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import MaintenanceSchedulesTable from '@/components/maintenance/maintenance-schedules-table'
import CreateMaintenanceDialog from '@/components/maintenance/create-maintenance-dialog'
import MaintenanceStats from '@/components/maintenance/maintenance-stats'
import { MaintenanceLogSheet } from "@/components/maintenance/maintenance-log-sheet"

export default function MaintenanceClient({ initialSchedules, vehicles }: any) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [showLogSheet, setShowLogSheet] = useState(false)
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Maintenance Scheduling</h1>
          <p className="text-muted-foreground mt-1">
            Schedule and track vehicle maintenance with approval workflow
          </p>
        </div>
        <Button 
          onClick={() => setShowLogSheet(true)}
          className="bg-accent hover:bg-accent/90 text-accent-foreground"
        >
          <Plus className="mr-2 h-4 w-4" />
          Log Maintenance
        </Button>
      </div>

      <MaintenanceStats />

      <Card className="p-6">
        <MaintenanceSchedulesTable 
          initialSchedules={initialSchedules}
          vehicles={vehicles}
        />
      </Card>

      <MaintenanceLogSheet
        open={showLogSheet}
        onOpenChange={setShowLogSheet}
        vehicles={vehicles}
        onSuccess={() => {
          // Refresh data if needed, or just close
          // In a real app we might want to refetch schedules or logs
        }}
      />
    </div>
  )
}
