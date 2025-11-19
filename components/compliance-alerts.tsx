'use client'

import { useEffect, useState } from 'react'
import useSWR from 'swr'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'

export function ComplianceAlerts() {
  const supabase = createClient()

  const { data: alerts } = useSWR(
    'compliance-alerts',
    async () => {
      const { data: vehicles } = await supabase
        .from('vehicles')
        .select('id, vehicle_number')

      const { data: checklists } = await supabase
        .from('vehicle_compliance_checklist')
        .select('*')

      const thirtyDaysFromNow = new Date()
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

      const alerts: any[] = []

      checklists?.forEach((checklist) => {
        const vehicle = vehicles?.find((v) => v.id === checklist.vehicle_id)
        if (!vehicle) return

        const ITEMS_WITH_DATES = [
          { key: 'vehicle_insurance', label: 'Vehicle Insurance' },
          { key: 'vehicle_license', label: 'Vehicle License' },
          { key: 'road_worthiness', label: 'Road Worthiness' },
          { key: 'hackney_permit', label: 'Hackney Permit' },
          { key: 'cdl_license', label: 'CDL License' },
          { key: 'driver_license', label: "Driver's License" },
        ]

        ITEMS_WITH_DATES.forEach((item) => {
          const expiryDate = checklist[`${item.key}_expiry_date`]
          if (expiryDate) {
            const expiry = new Date(expiryDate)
            if (expiry < thirtyDaysFromNow && expiry > new Date()) {
              const daysUntilExpiry = Math.ceil((expiry.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
              alerts.push({
                vehicle: vehicle.vehicle_number,
                item: item.label,
                expiryDate: expiry,
                daysUntilExpiry,
              })
            }
          }
        })
      })

      return alerts.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry)
    },
    { refreshInterval: 30000 }
  )

  if (!alerts || alerts.length === 0) return null

  return (
    <Card className="bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-yellow-700 dark:text-yellow-500">
          <AlertTriangle className="h-5 w-5" />
          Compliance Items Expiring Soon
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {alerts.slice(0, 5).map((alert, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-background rounded-md">
              <div className="flex-1">
                <p className="font-medium text-sm">{alert.vehicle}</p>
                <p className="text-xs text-muted-foreground">{alert.item}</p>
              </div>
              <Badge variant="outline" className="border-yellow-500 text-yellow-600">
                {alert.daysUntilExpiry} day{alert.daysUntilExpiry > 1 ? 's' : ''}
              </Badge>
            </div>
          ))}
          {alerts.length > 5 && (
            <p className="text-xs text-muted-foreground text-center pt-2">
              +{alerts.length - 5} more items expiring soon
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
