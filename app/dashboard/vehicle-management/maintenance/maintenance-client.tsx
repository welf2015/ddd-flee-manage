'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import MaintenanceSchedulesTable from '@/components/maintenance/maintenance-schedules-table'
import CreateMaintenanceDialog from '@/components/maintenance/create-maintenance-dialog'
import MaintenanceStats from '@/components/maintenance/maintenance-stats'

export default function MaintenanceClient({ initialSchedules, vehicles }: any) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  
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
          onClick={() => setCreateDialogOpen(true)}
          className="bg-[#003e31] hover:bg-[#003e31]/90"
        >
          <Plus className="mr-2 h-4 w-4" />
          Schedule Maintenance
        </Button>
      </div>

      <MaintenanceStats />

      <Card className="p-6">
        <MaintenanceSchedulesTable 
          initialSchedules={initialSchedules}
          vehicles={vehicles}
        />
      </Card>

      <CreateMaintenanceDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        vehicles={vehicles}
      />
    </div>
  )
}
