'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, AlertTriangle, CheckCircle, Clock, FileText } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export function ComplianceClient() {
  const [search, setSearch] = useState('')
  const supabase = createClient()

  const { data: vehicles, error } = useSWR(
    'compliance-vehicles',
    async () => {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .order('vehicle_number')
      
      if (error) throw error
      return data || []
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
    v.insurance_expiry && new Date(v.insurance_expiry) > new Date() &&
    v.license_expiry && new Date(v.license_expiry) > new Date()
  ).length || 0
  const expiringSoon = vehicles?.filter((v) => {
    const insuranceExpiry = v.insurance_expiry ? new Date(v.insurance_expiry) : null
    const licenseExpiry = v.license_expiry ? new Date(v.license_expiry) : null
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
    
    return (
      (insuranceExpiry && insuranceExpiry < thirtyDaysFromNow && insuranceExpiry > new Date()) ||
      (licenseExpiry && licenseExpiry < thirtyDaysFromNow && licenseExpiry > new Date())
    )
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
                  <th className="p-3 text-left text-sm font-medium">Insurance Expiry</th>
                  <th className="p-3 text-left text-sm font-medium">License Expiry</th>
                  <th className="p-3 text-left text-sm font-medium">Status</th>
                  <th className="p-3 text-right text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredVehicles.map((vehicle) => {
                  const insuranceExpiry = vehicle.insurance_expiry ? new Date(vehicle.insurance_expiry) : null
                  const licenseExpiry = vehicle.license_expiry ? new Date(vehicle.license_expiry) : null
                  const now = new Date()
                  const thirtyDays = new Date()
                  thirtyDays.setDate(thirtyDays.getDate() + 30)

                  const insuranceStatus = insuranceExpiry
                    ? insuranceExpiry < now
                      ? 'expired'
                      : insuranceExpiry < thirtyDays
                      ? 'expiring'
                      : 'valid'
                    : 'missing'

                  const licenseStatus = licenseExpiry
                    ? licenseExpiry < now
                      ? 'expired'
                      : licenseExpiry < thirtyDays
                      ? 'expiring'
                      : 'valid'
                    : 'missing'

                  const overallStatus =
                    insuranceStatus === 'expired' || licenseStatus === 'expired'
                      ? 'non-compliant'
                      : insuranceStatus === 'expiring' || licenseStatus === 'expiring'
                      ? 'expiring-soon'
                      : insuranceStatus === 'missing' || licenseStatus === 'missing'
                      ? 'incomplete'
                      : 'compliant'

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
                        {insuranceExpiry ? (
                          <div className="flex items-center gap-2">
                            <span className="text-sm">
                              {insuranceExpiry.toLocaleDateString()}
                            </span>
                            {insuranceStatus === 'expired' && (
                              <Badge variant="destructive">Expired</Badge>
                            )}
                            {insuranceStatus === 'expiring' && (
                              <Badge variant="outline" className="border-yellow-500 text-yellow-500">
                                Expiring Soon
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <Badge variant="outline">Not Set</Badge>
                        )}
                      </td>
                      <td className="p-3">
                        {licenseExpiry ? (
                          <div className="flex items-center gap-2">
                            <span className="text-sm">
                              {licenseExpiry.toLocaleDateString()}
                            </span>
                            {licenseStatus === 'expired' && (
                              <Badge variant="destructive">Expired</Badge>
                            )}
                            {licenseStatus === 'expiring' && (
                              <Badge variant="outline" className="border-yellow-500 text-yellow-500">
                                Expiring Soon
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <Badge variant="outline">Not Set</Badge>
                        )}
                      </td>
                      <td className="p-3">
                        {overallStatus === 'compliant' && (
                          <Badge className="bg-accent text-accent-foreground">Compliant</Badge>
                        )}
                        {overallStatus === 'expiring-soon' && (
                          <Badge variant="outline" className="border-yellow-500 text-yellow-500">
                            Expiring Soon
                          </Badge>
                        )}
                        {overallStatus === 'non-compliant' && (
                          <Badge variant="destructive">Non-Compliant</Badge>
                        )}
                        {overallStatus === 'incomplete' && (
                          <Badge variant="outline">Incomplete</Badge>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <Button variant="ghost" size="sm">
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
    </div>
  )
}
