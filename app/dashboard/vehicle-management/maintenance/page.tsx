import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import MaintenanceClient from './maintenance-client'

export default async function MaintenancePage() {
  const supabase = await createClient()
  
  // Fetch maintenance schedules with vehicle info
  const { data: schedules } = await supabase
    .from('maintenance_schedules')
    .select(`
      *,
      vehicle:vehicles(vehicle_number, make, model, vehicle_type, status),
      scheduled_by_user:profiles!maintenance_schedules_scheduled_by_fkey(full_name, email),
      approved_by_user:profiles!maintenance_schedules_approved_by_fkey(full_name, email)
    `)
    .order('scheduled_date', { ascending: true })
  
  // Fetch vehicles for creating new schedules
  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('*')
    .order('vehicle_number')
  
  return (
    <Suspense fallback={<div>Loading maintenance schedules...</div>}>
      <MaintenanceClient 
        initialSchedules={schedules || []} 
        vehicles={vehicles || []}
      />
    </Suspense>
  )
}
