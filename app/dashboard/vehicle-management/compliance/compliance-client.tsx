'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, AlertTriangle, CheckCircle, Clock, FileText } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { ComplianceChecklistSheet } from '@/components/compliance/compliance-checklist-sheet'
import { formatRelativeTime } from '@/lib/utils/time-format'
import { ComplianceProgressBar } from '@/components/compliance/compliance-progress-bar'

// Helper functions moved up before they are used to fix ReferenceError
const getCompletionPercentage = (vehicle: any) => {
  if (!vehicle.checklist) return 0

  const CHECKLIST_ITEMS = [
    'proof_of_ownership', 'vehicle_insurance', 'vehicle_license', 'customs_documents',
    'number_plate', 'road_worthiness', 'hackney_permit', 'cmr_registration',
    'local_govt_permit', 'npa_registration', 'heavy_duty_permit', 'tt_permit',
    'commercial_parking', 'cdl_license', 'driver_license', 'lasdri_card',
    'lasrra_card', 'medical_cert', 'fire_extinguisher', 'reflective_triangles',
    'jumpstart_cables', 'seatbelts', 'spare_tire', 'jack_spanner',
    'first_aid_kit', 'phone_usage', 'speed_limit', 'pretrip_check',
    'posttrip_check', 'violations_logged',
  ]

  let completedItems = 0
  CHECKLIST_ITEMS.forEach((item) => {
    if (vehicle.checklist[item] === 'Yes') completedItems++
  })

  return Math.round((completedItems / CHECKLIST_ITEMS.length) * 100)
}

const getExpiringItems = (vehicle: any) => {
  if (!vehicle.checklist) return []

  const thirtyDaysFromNow = new Date()
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

  const expiringItems: string[] = []
  const ITEMS_WITH_DATES = [
    { key: 'proof_of_ownership', label: 'Proof of Ownership' },
    { key: 'vehicle_insurance', label: 'Vehicle Insurance' },
    { key: 'vehicle_license', label: 'Vehicle License' },
    { key: 'customs_documents', label: 'Customs Documents' },
    { key: 'number_plate', label: 'Number Plate' },
    { key: 'road_worthiness', label: 'Road Worthiness' },
    { key: 'hackney_permit', label: 'Hackney Permit' },
    { key: 'cmr_registration', label: 'CMR Registration' },
    { key: 'local_govt_permit', label: 'Local Govt Permit' },
    { key: 'npa_registration', label: 'NPA Registration' },
    { key: 'heavy_duty_permit', label: 'Heavy Duty Permit' },
    { key: 'tt_permit', label: 'T&T Permit' },
    { key: 'commercial_parking', label: 'Commercial Parking' },
    { key: 'cdl_license', label: 'CDL License' },
    { key: 'driver_license', label: "Driver's License" },
    { key: 'lasdri_card', label: 'LASDRI Card' },
    { key: 'lasrra_card', label: 'LASRRA Card' },
    { key: 'medical_cert', label: 'Medical Certification' },
    { key: 'fire_extinguisher', label: 'Fire Extinguisher' },
    { key: 'first_aid_kit', label: 'First Aid Kit' },
  ]

  ITEMS_WITH_DATES.forEach((item) => {
    const expiryDate = vehicle.checklist[`${item.key}_expiry_date`]
    if (expiryDate) {
      const expiry = new Date(expiryDate)
      if (expiry < thirtyDaysFromNow && expiry > new Date()) {
        expiringItems.push(item.label)
      }
    }
  })

  return expiringItems
}

export function ComplianceClient() {
  const [search, setSearch] = useState('')
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null)
  const [showUpdateDialog, setShowUpdateDialog] = useState(false)
  const supabase = createClient()

  const { data: vehicles, error } = useSWR(
    'compliance-vehicles',
    async () => {
      const { data: vehicleData, error: vehicleError } = await supabase
        .from('vehicles')
        .select('*')
        .order('vehicle_number')
      
      if (vehicleError) throw vehicleError

      // Fetch all compliance checklists
      const { data: checklistData } = await supabase
        .from('vehicle_compliance_checklist')
        .select('*')

      // Merge checklist data with vehicles
      const vehiclesWithProgress = (vehicleData || []).map((vehicle) => {
        const checklist = checklistData?.find((c) => c.vehicle_id === vehicle.id)
        return {
          ...vehicle,
          checklist,
        }
      })

      return vehiclesWithProgress
    },
    { refreshInterval: 5000 }
  )

  const filteredVehicles = vehicles?.filter((v) =>
    v.vehicle_number.toLowerCase().includes(search.toLowerCase()) ||
    v.make?.toLowerCase().includes(search.toLowerCase())
  ) || []

  // Calculate compliance metrics
  const totalVehicles = vehicles?.length || 0
  const compliantVehicles = vehicles?.filter((v) => 
    v.checklist && getCompletionPercentage(v) >= 80
  ).length || 0
  const expiringSoon = vehicles?.filter((v) => {
    const expiringItems = getExpiringItems(v)
    return expiringItems.length > 0
  }).length || 0
  const nonCompliant = totalVehicles - compliantVehicles

  const complianceRate = totalVehicles > 0 ? Math.round((compliantVehicles / totalVehicles) * 100) : 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Compliance Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track vehicle insurance, licenses, and regulatory requirements
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-background/50 backdrop-blur">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Compliance Rate</p>
                <p className="text-2xl font-bold">{complianceRate}%</p>
              </div>
              <CheckCircle className="h-8 w-8 text-accent" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-background/50 backdrop-blur">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Compliant</p>
                <p className="text-2xl font-bold">{compliantVehicles}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-background/50 backdrop-blur">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Expiring Soon</p>
                <p className="text-2xl font-bold">{expiringSoon}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-background/50 backdrop-blur">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Non-Compliant</p>
                <p className="text-2xl font-bold">{nonCompliant}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Table */}
      <Card className="bg-background/50 backdrop-blur border-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Vehicle Compliance Status</CardTitle>
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
          <div className="rounded-md border">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="p-3 text-left text-sm font-medium">Vehicle</th>
                  <th className="p-3 text-left text-sm font-medium">Progress</th>
                  <th className="p-3 text-left text-sm font-medium">Expiring Items</th>
                  <th className="p-3 text-left text-sm font-medium">Status</th>
                  <th className="p-3 text-right text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredVehicles.map((vehicle) => {
                  const completionPercentage = getCompletionPercentage(vehicle)
                  const expiringItems = getExpiringItems(vehicle)
                  
                  const overallStatus =
                    completionPercentage >= 80
                      ? 'compliant'
                      : completionPercentage >= 50
                      ? 'partial'
                      : 'non-compliant'

                  return (
                    <tr key={vehicle.id} className="border-b">
                      <td className="p-3">
                        <div>
                          <p className="font-medium">{vehicle.vehicle_number}</p>
                          <p className="text-sm text-muted-foreground">
                            {vehicle.make} {vehicle.model}
                          </p>
                        </div>
                      </td>
                      <td className="p-3">
                        <ComplianceProgressBar percentage={completionPercentage} />
                      </td>
                      <td className="p-3">
                        {expiringItems.length > 0 ? (
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-yellow-500" />
                            <span className="text-sm font-medium text-yellow-600">
                              {expiringItems.length} item{expiringItems.length > 1 ? 's' : ''}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">None</span>
                        )}
                      </td>
                      <td className="p-3">
                        {overallStatus === 'compliant' && (
                          <Badge className="bg-green-500 text-white">Compliant</Badge>
                        )}
                        {overallStatus === 'partial' && (
                          <Badge variant="outline" className="border-yellow-500 text-yellow-600">
                            Partial
                          </Badge>
                        )}
                        {overallStatus === 'non-compliant' && (
                          <Badge variant="destructive">Non-Compliant</Badge>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedVehicle(vehicle)
                            setShowUpdateDialog(true)
                          }}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Update
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Compliance Update Dialog */}
      {selectedVehicle && (
        <ComplianceChecklistSheet
          vehicle={selectedVehicle}
          open={showUpdateDialog}
          onOpenChange={setShowUpdateDialog}
        />
      )}
    </div>
  )
}
