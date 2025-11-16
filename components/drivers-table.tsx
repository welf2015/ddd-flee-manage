"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Eye, Phone } from "lucide-react"
import { useState, useMemo } from "react"
import { DriverDetailDialog } from "./driver-detail-dialog"

type Driver = {
  id: string
  full_name: string
  phone: string | null
  license_number: string
  status: string
  vehicles?: {
    vehicle_number: string
  } | null
  current_job?: {
    job_id: string
    status: string
  } | null
}

type DriversTableProps = {
  drivers: Driver[]
}

export function DriversTable({ drivers }: DriversTableProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null)

  const filteredDrivers = useMemo(() => {
    return drivers.filter(
      (driver) =>
        searchQuery === "" ||
        driver.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        driver.license_number.toLowerCase().includes(searchQuery.toLowerCase()),
    )
  }, [drivers, searchQuery])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-500/10 text-green-500 border-green-500/20"
      case "Assigned to Job":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20"
      case "Currently on Job":
        return "bg-purple-500/10 text-purple-500 border-purple-500/20"
      case "Inactive":
        return "bg-gray-500/10 text-gray-500 border-gray-500/20"
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20"
    }
  }

  return (
    <>
      <Card className="bg-background/50 backdrop-blur">
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>All Drivers</CardTitle>
            <Input
              placeholder="Search drivers..."
              className="sm:w-[250px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {filteredDrivers.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              {drivers.length === 0
                ? "No drivers yet. Add your first driver to get started."
                : "No drivers match your search."}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>License Number</TableHead>
                  <TableHead>Assigned Vehicle</TableHead>
                  <TableHead>Current Job</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDrivers.map((driver) => (
                  <TableRow key={driver.id}>
                    <TableCell className="font-medium">{driver.full_name}</TableCell>
                    <TableCell>
                      {driver.phone ? (
                        <div className="flex items-center gap-2">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          {driver.phone}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>{driver.license_number}</TableCell>
                    <TableCell>
                      {driver.vehicles ? (
                        <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                          {driver.vehicles.vehicle_number}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {driver.current_job ? (
                        <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-500/20">
                          {driver.current_job.job_id}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getStatusColor(driver.status)}>
                        {driver.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => setSelectedDriver(driver)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {selectedDriver && (
        <DriverDetailDialog
          driver={selectedDriver}
          open={!!selectedDriver}
          onOpenChange={(open) => !open && setSelectedDriver(null)}
        />
      )}
    </>
  )
}
