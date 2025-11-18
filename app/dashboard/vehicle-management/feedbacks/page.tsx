import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import FeedbacksClient from './feedbacks-client'

export default async function FeedbacksPage() {
  const supabase = await createClient()
  
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
  
  return (
    <Suspense fallback={<div>Loading feedbacks...</div>}>
      <FeedbacksClient initialRatings={ratings || []} />
    </Suspense>
  )
}
