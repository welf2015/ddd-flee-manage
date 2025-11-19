'use client'

import { useState } from 'react'
import { Plus, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { InspectionSheet } from '@/components/inspections/inspection-sheet'
import { formatRelativeTime } from '@/lib/utils/time-format'
import { useRouter } from 'next/navigation'

export default function InspectionsClient({ vehicles, initialInspections }: any) {
  const [showInspectionSheet, setShowInspectionSheet] = useState(false)
  const [selectedInspection, setSelectedInspection] = useState<any>(null)
  const [inspections, setInspections] = useState(initialInspections)
  const router = useRouter()
  
  const handleViewInspection = (inspection: any) => {
    setSelectedInspection(inspection)
    setShowInspectionSheet(true)
  }
  
  const handleNewInspection = () => {
    setSelectedInspection(null)
    setShowInspectionSheet(true)
  }
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved': return 'bg-green-500'
      case 'Rejected': return 'bg-red-500'
      default: return 'bg-yellow-500'
    }
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Vehicle Inspections</h1>
          <p className="text-muted-foreground mt-1">
            Daily vehicle inspection logs with photo documentation
          </p>
        </div>
        <Button 
          onClick={handleNewInspection}
          className="bg-accent hover:bg-accent/90 text-accent-foreground"
        >
          <Plus className="mr-2 h-4 w-4" />
          Log Inspection
        </Button>
      </div>

      <Card className="p-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead>Driver</TableHead>
              <TableHead>Odometer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Logged</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {inspections.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No inspections found. Log your first inspection to get started.
                </TableCell>
              </TableRow>
            ) : (
              inspections.map((inspection: any) => (
                <TableRow key={inspection.id}>
                  <TableCell>{new Date(inspection.inspection_date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {inspection.vehicles?.vehicle_number} - {inspection.vehicles?.make} {inspection.vehicles?.model}
                  </TableCell>
                  <TableCell>{inspection.drivers?.full_name}</TableCell>
                  <TableCell>{inspection.odometer_reading ? `${inspection.odometer_reading} km` : '-'}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(inspection.status)}>
                      {inspection.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatRelativeTime(inspection.created_at)}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewInspection(inspection)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <InspectionSheet
        open={showInspectionSheet}
        onOpenChange={setShowInspectionSheet}
        vehicles={vehicles}
        inspection={selectedInspection}
        onSuccess={() => {
          setShowInspectionSheet(false)
          router.refresh()
        }}
      />
    </div>
  )
}
