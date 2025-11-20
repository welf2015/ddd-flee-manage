"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, CheckCircle } from "lucide-react"
import { AddVehicleDialog } from "@/components/vehicles/add-vehicle-dialog"
import { markVehicleAsOnboarded } from "@/app/actions/vehicles"
import { toast } from "sonner"
import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"

const fetcher = async () => {
  const supabase = createClient()

  const { data, error } = await supabase.from("vehicles").select("*").order("created_at", { ascending: false })

  if (error) throw error
  return data || []
}

export function VehiclesClient() {
  const [search, setSearch] = useState("")
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [loadingOnboard, setLoadingOnboard] = useState<string | null>(null)

  const { data: vehicles, mutate } = useSWR("vehicles", fetcher, {
    refreshInterval: 5000,
  })

  const filteredVehicles = vehicles?.filter((vehicle) =>
    search
      ? vehicle.vehicle_number?.toLowerCase().includes(search.toLowerCase()) ||
        vehicle.make?.toLowerCase().includes(search.toLowerCase()) ||
        vehicle.model?.toLowerCase().includes(search.toLowerCase())
      : true,
  )

  const handleMarkAsOnboarded = async (vehicleId: string) => {
    setLoadingOnboard(vehicleId)
    try {
      const result = await markVehicleAsOnboarded(vehicleId)
      if (result.success) {
        toast.success("Vehicle marked as onboarded")
        mutate()
      } else {
        toast.error(result.error || "Failed to mark vehicle as onboarded")
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred")
    } finally {
      setLoadingOnboard(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Vehicles</h1>
        <Button onClick={() => setShowAddDialog(true)} className="bg-accent text-accent-foreground hover:bg-accent/90">
          <Plus className="mr-2 h-4 w-4" />
          Add Vehicle
        </Button>
      </div>

      <Card className="bg-background/50 backdrop-blur">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Vehicles</CardTitle>
            <div className="relative w-[300px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search vehicles..."
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vehicle Number</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Make/Model</TableHead>
                <TableHead>Year</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVehicles?.map((vehicle) => (
                <TableRow key={vehicle.id}>
                  <TableCell className="font-medium">{vehicle.vehicle_number}</TableCell>
                  <TableCell>{vehicle.vehicle_type}</TableCell>
                  <TableCell>
                    {vehicle.make} {vehicle.model}
                  </TableCell>
                  <TableCell>{vehicle.year}</TableCell>
                  <TableCell>
                    <Badge variant={vehicle.status === "Active" ? "default" : "secondary"}>{vehicle.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleMarkAsOnboarded(vehicle.id)}
                      disabled={loadingOnboard === vehicle.id}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      {loadingOnboard === vehicle.id ? "Marking..." : "Mark as Onboarded"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredVehicles?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No vehicles found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AddVehicleDialog open={showAddDialog} onClose={() => setShowAddDialog(false)} onSuccess={() => mutate()} />
    </div>
  )
}
