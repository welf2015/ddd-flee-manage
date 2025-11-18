'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Search, Star } from 'lucide-react'

const fetcher = async () => {
  const supabase = createClient()
  const { data } = await supabase
    .from('driver_ratings')
    .select(`
      *,
      driver:drivers(full_name, phone, photo_url),
      booking:bookings(job_id, client_name, route),
      rated_by_user:profiles(full_name, email)
    `)
    .order('created_at', { ascending: false })
  
  return data || []
}

export default function TruckFeedbackTab({ initialRatings }: any) {
  const { data: ratings } = useSWR('truck-feedback', fetcher, {
    fallbackData: initialRatings,
    refreshInterval: 5000,
  })
  
  const [searchQuery, setSearchQuery] = useState('')
  
  const filteredRatings = ratings?.filter((rating: any) =>
    rating.driver?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    rating.booking?.job_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    rating.booking?.client_name?.toLowerCase().includes(searchQuery.toLowerCase())
  )
  
  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return 'text-[#003e31]'
    if (rating >= 3.5) return 'text-yellow-600'
    return 'text-red-600'
  }
  
  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by driver, job, or client..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>
      
      <div className="space-y-4">
        {filteredRatings?.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No feedback found for truck deliveries
          </div>
        ) : (
          filteredRatings?.map((rating: any) => (
            <div key={rating.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={rating.driver?.photo_url || "/placeholder.svg"} />
                    <AvatarFallback>
                      {rating.driver?.full_name?.charAt(0) || 'D'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{rating.driver?.full_name}</p>
                    <p className="text-sm text-muted-foreground">
                      Job: {rating.booking?.job_id}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Star className={`h-5 w-5 fill-current ${getRatingColor(rating.rating)}`} />
                  <span className={`font-bold ${getRatingColor(rating.rating)}`}>
                    {rating.rating}.0
                  </span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Client:</span>
                  <span className="font-medium">{rating.booking?.client_name}</span>
                </div>
                {rating.booking?.route && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Route:</span>
                    <span>{rating.booking.route}</span>
                  </div>
                )}
              </div>
              
              {rating.client_feedback && (
                <div className="bg-muted/50 rounded-md p-3">
                  <p className="text-sm font-medium mb-1">Client Feedback:</p>
                  <p className="text-sm text-muted-foreground">{rating.client_feedback}</p>
                </div>
              )}
              
              {rating.feedback && (
                <div className="bg-muted/50 rounded-md p-3">
                  <p className="text-sm font-medium mb-1">Internal Notes:</p>
                  <p className="text-sm text-muted-foreground">{rating.feedback}</p>
                </div>
              )}
              
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                <span>Rated by: {rating.rated_by_user?.full_name}</span>
                <span>{new Date(rating.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
