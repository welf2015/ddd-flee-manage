'use client'

import { Card } from '@/components/ui/card'
import { Star, TrendingUp, MessageSquare, Award } from 'lucide-react'
import useSWR from 'swr'
import { createClient } from '@/lib/supabase/client'

const fetcher = async () => {
  const supabase = createClient()
  
  const { data: ratings } = await supabase
    .from('driver_ratings')
    .select('rating, client_feedback')
  
  const totalRatings = ratings?.length || 0
  const avgRating = ratings?.length 
    ? (ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(1)
    : '0.0'
  const withFeedback = ratings?.filter(r => r.client_feedback)?.length || 0
  const fiveStarRatings = ratings?.filter(r => r.rating === 5)?.length || 0
  
  return { totalRatings, avgRating, withFeedback, fiveStarRatings }
}

export default function FeedbackStats({ ratings: initialRatings }: any) {
  const { data } = useSWR('feedback-stats', fetcher, {
    refreshInterval: 10000,
  })
  
  const stats = [
    {
      label: 'Average Rating',
      value: data?.avgRating || '0.0',
      icon: Star,
      color: 'text-yellow-600',
      suffix: ' / 5.0'
    },
    {
      label: 'Total Ratings',
      value: data?.totalRatings || 0,
      icon: TrendingUp,
      color: 'text-blue-600',
    },
    {
      label: 'With Feedback',
      value: data?.withFeedback || 0,
      icon: MessageSquare,
      color: 'text-purple-600',
    },
    {
      label: '5-Star Ratings',
      value: data?.fiveStarRatings || 0,
      icon: Award,
      color: 'text-[#003e31]',
    },
  ]
  
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label} className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </p>
              <h3 className="text-2xl font-bold mt-2">
                {stat.value}{stat.suffix || ''}
              </h3>
            </div>
            <stat.icon className={`h-8 w-8 ${stat.color}`} />
          </div>
        </Card>
      ))}
    </div>
  )
}
