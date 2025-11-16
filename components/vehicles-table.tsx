"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Eye, Wrench, MoreVertical } from "lucide-react"
import { useState, useMemo } from "react"
import { updateVehicleStatus } from "@/app/actions/vehicles"
import { useRouter } from "next/navigation"

type Vehicle = {
  id: string
  vehicle_number: string
  vehicle_type: string
  make: string
  model: string
  year: number
  status: string
  last_service_date: string | null
  next_service_date: string | null
  created_at: string
}

type VehiclesTableProps = {
  vehicles: Vehicle[]
  onViewVehicle: (vehicle: Vehicle) => void
}

export function VehiclesTable({ vehicles, onViewVehicle }: VehiclesTableProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const router = useRouter()

  const filteredVehicles = useMemo(() => {
    return vehicles.filter((vehicle) => {
      const matchesSearch =
        searchQuery === "" ||
        vehicle.vehicle_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vehicle.make.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vehicle.model.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesSearch
    })
  }, [vehicles, searchQuery])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-500/10 text-green-500 border-green-500/20"
      case "In Maintenance":
        return "bg-accent/10 text-accent border-accent/20"
      case "Inactive":
        return "bg-gray-500/10 text-gray-500 border-gray-500/20"
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20"
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Truck":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20"
      case "Car":
        return "bg-purple-500/10 text-purple-500 border-purple-500/20"
      case "Bike":
        return "bg-cyan-500/10 text-cyan-500 border-cyan-500/20"
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20"
    }
  }

  const handleStatusChange = async (vehicleId: string, newStatus: string) => {
    const result = await updateVehicleStatus(vehicleId, newStatus)
    if (result.success) {
      router.refresh()
    } else {
      alert(result.error)
    }
  }

  return (
    <Card className="bg-background/50 backdrop-blur">
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>All Vehicles</CardTitle>
          <Input
            placeholder="Search vehicles..."
            className="sm:w-[250px]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent>
        {filteredVehicles.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            {vehicles.length === 0
              ? "No vehicles yet. Add your first vehicle to get started."
              : "No vehicles match your search."}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vehicle Number</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Make & Model</TableHead>
                <TableHead>Year</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVehicles.map((vehicle) => (
                <TableRow key={vehicle.id}>
                  <TableCell className="font-medium">{vehicle.vehicle_number}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getTypeColor(vehicle.vehicle_type)}>
                      {vehicle.vehicle_type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {vehicle.make} {vehicle.model}
                  </TableCell>
                  <TableCell>{vehicle.year}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getStatusColor(vehicle.status)}>
                      {vehicle.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onViewVehicle(vehicle)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(vehicle.id, "In Maintenance")}>
                          <Wrench className="h-4 w-4 mr-2" />
                          Mark as Maintenance
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(vehicle.id, "Active")}>
                          Mark as Active
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(vehicle.id, "Inactive")}>
                          Mark as Inactive
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
