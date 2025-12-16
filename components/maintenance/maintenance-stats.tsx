'use client'

import { Card } from '@/components/ui/card'
import { CalendarClock, CheckCircle, Clock, AlertTriangle } from 'lucide-react'
import useSWR from 'swr'
import { createClient } from '@/lib/supabase/client'

const fetcher = async () => {
  const supabase = createClient()

  // Get current month date range
  const now = new Date()
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  // Fetch schedules
  const { data: schedules } = await supabase
    .from('maintenance_schedules')
    .select('status, estimated_cost, actual_cost, scheduled_date, completed_at')

  // Fetch logs (already completed maintenance)
  const { data: logs } = await supabase
    .from('maintenance_logs')
    .select('cost, service_date')

  const pending = schedules?.filter(s => s.status === 'Pending').length || 0
  const inProgress = schedules?.filter(s => s.status === 'In Progress').length || 0
  const completed = schedules?.filter(s => s.status === 'Completed').length || 0

  // Calculate total cost for current month
  // Include BOTH schedules AND logs
  let totalCost = 0

  // Add costs from SCHEDULES (in current month)
  const scheduleCost = schedules?.reduce((sum, s) => {
    const scheduleDate = new Date(s.scheduled_date)
    if (scheduleDate < firstDayOfMonth || scheduleDate > lastDayOfMonth) {
      return sum
    }

    // Only count completed (actual cost) and in-progress/approved (estimated cost)
    if (s.status === 'Completed' && s.actual_cost) {
      return sum + Number(s.actual_cost)
    } else if ((s.status === 'In Progress' || s.status === 'Approved') && s.estimated_cost) {
      return sum + Number(s.estimated_cost)
    }

    return sum
  }, 0) || 0

  // Add costs from LOGS (in current month)
  const logCost = logs?.reduce((sum, log) => {
    const serviceDate = new Date(log.service_date)
    if (serviceDate < firstDayOfMonth || serviceDate > lastDayOfMonth) {
      return sum
    }

    return sum + (Number(log.cost) || 0)
  }, 0) || 0

  totalCost = scheduleCost + logCost

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
