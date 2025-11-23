"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DriverActivitiesTab } from "./driver-activities-tab"
import { VehicleActivitiesTab } from "./vehicle-activities-tab"

type FleetActivityClientProps = {
  initialDriverBookings: any[]
  initialDrivers: any[]
  initialVehicleFuelLogs: any[]
  initialVehicleMaintenance: any[]
  initialVehicleIncidents: any[]
  initialVehicles: any[]
}

export function FleetActivityClient({
  initialDriverBookings,
  initialDrivers,
  initialVehicleFuelLogs,
  initialVehicleMaintenance,
  initialVehicleIncidents,
  initialVehicles,
}: FleetActivityClientProps) {
  return (
    <Tabs defaultValue="drivers" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="drivers">Driver Activities</TabsTrigger>
        <TabsTrigger value="vehicles">Vehicle Activities</TabsTrigger>
      </TabsList>

      <TabsContent value="drivers" className="space-y-4 mt-4">
        <DriverActivitiesTab
          initialBookings={initialDriverBookings}
          initialDrivers={initialDrivers}
        />
      </TabsContent>

      <TabsContent value="vehicles" className="space-y-4 mt-4">
        <VehicleActivitiesTab
          initialFuelLogs={initialVehicleFuelLogs}
          initialMaintenance={initialVehicleMaintenance}
          initialIncidents={initialVehicleIncidents}
          initialVehicles={initialVehicles}
        />
      </TabsContent>
    </Tabs>
  )
}

