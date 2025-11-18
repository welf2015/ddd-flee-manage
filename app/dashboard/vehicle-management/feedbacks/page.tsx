import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardLayout } from '@/components/dashboard-layout'
import FeedbacksClient from './feedbacks-client'

export default async function FeedbacksPage() {
  const supabase = await createClient()
  
  // Check authentication
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/auth/login')
  }
  
  // Fetch driver ratings (truck feedback from jobs)
  const { data: ratings } = await supabase
    .from('driver_ratings')
    .select(`
      *,
      driver:drivers(full_name, phone, photo_url),
      booking:bookings(job_id, client_name, route),
      rated_by_user:profiles(full_name, email)
    `)
    .order('created_at', { ascending: false })
  
  const handleSignOut = async () => {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/auth/login')
  }
  
  return (
    <DashboardLayout onSignOut={handleSignOut}>
      <Suspense fallback={<div>Loading feedbacks...</div>}>
        <FeedbacksClient initialRatings={ratings || []} />
      </Suspense>
    </DashboardLayout>
  )
}
