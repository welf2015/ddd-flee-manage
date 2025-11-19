import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import InspectionsClient from './inspections-client'
import { DashboardLayout } from "@/components/dashboard-layout"

export default async function InspectionsPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/auth/login')
  }
  
  // Fetch vehicles
  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('*')
    .eq('status', 'Active')
    .order('vehicle_number')
  
  // Fetch recent inspections
  const { data: inspections } = await supabase
    .from('vehicle_inspections')
    .select(`
      *,
      vehicles (vehicle_number, make, model),
      drivers (full_name)
    `)
    .order('inspection_date', { ascending: false })
    .limit(50)

  const handleSignOut = async () => {
    "use server"
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect("/auth/login")
  }
  
  return (
    <DashboardLayout onSignOut={handleSignOut}>
      <InspectionsClient 
        vehicles={vehicles || []}
        initialInspections={inspections || []}
      />
    </DashboardLayout>
  )
}
