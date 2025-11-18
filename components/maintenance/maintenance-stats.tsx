'use client'

import { Card } from '@/components/ui/card'
import { CalendarClock, CheckCircle, Clock, AlertTriangle } from 'lucide-react'
import useSWR from 'swr'
import { createClient } from '@/lib/supabase/client'

const fetcher = async () => {
  const supabase = createClient()
  
  const { data: schedules } = await supabase
    .from('maintenance_schedules')
    .select('status, estimated_cost, actual_cost')
  
  const pending = schedules?.filter(s => s.status === 'Pending').length || 0
  const inProgress = schedules?.filter(s => s.status === 'In Progress').length || 0
  const completed = schedules?.filter(s => s.status === 'Completed').length || 0
  const totalCost = schedules?.reduce((sum, s) => sum + (Number(s.actual_cost) || Number(s.estimated_cost) || 0), 0) || 0
  
  return { pending, inProgress, completed, totalCost }
}

export default function MaintenanceStats() {
  const { data } = useSWR('maintenance-stats', fetcher, {
    refreshInterval: 5000,
  })
  
  const stats = [
    {
      label: 'Pending Approval',
      value: data?.pending || 0,
      icon: Clock,
      color: 'text-yellow-600',
    },
    {
      label: 'In Progress',
      value: data?.inProgress || 0,
      icon: AlertTriangle,
      color: 'text-blue-600',
    },
    {
      label: 'Completed',
      value: data?.completed || 0,
      icon: CheckCircle,
      color: 'text-[#003e31]',
    },
    {
      label: 'Total Cost (Month)',
      value: `₦${data?.totalCost?.toLocaleString() || 0}`,
      icon: CalendarClock,
      color: 'text-purple-600',
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
              <h3 className="text-2xl font-bold mt-2">{stat.value}</h3>
            </div>
            <stat.icon className={`h-8 w-8 ${stat.color}`} />
          </div>
        </Card>
      ))}
    </div>
  )
}
