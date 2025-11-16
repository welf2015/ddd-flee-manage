"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { VehiclesTable } from "@/components/vehicles-table"
import { CreateVehicleDialog } from "@/components/create-vehicle-dialog"
import { VehicleStats } from "@/components/vehicle-stats"
import { VehicleDetailDialog } from "@/components/vehicle-detail-dialog"
import { useState } from "react"

type VehiclesPageClientProps = {
  vehicles: any[]
  stats: { total: number; active: number; maintenance: number; inactive: number }
  onSignOut: () => void
}

export function VehiclesPageClient({ vehicles, stats, onSignOut }: VehiclesPageClientProps) {
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null)

  return (
    <DashboardLayout onSignOut={onSignOut}>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Vehicles</h1>
          <p className="text-sm text-muted-foreground">Manage your fleet vehicles and maintenance schedules</p>
        </div>
        <CreateVehicleDialog />
      </div>

      <VehicleStats {...stats} />

      <VehiclesTable vehicles={vehicles} onViewVehicle={setSelectedVehicle} />

      <VehicleDetailDialog
        open={!!selectedVehicle}
        onOpenChange={(open) => !open && setSelectedVehicle(null)}
        vehicle={selectedVehicle}
      />
    </DashboardLayout>
  )
}
