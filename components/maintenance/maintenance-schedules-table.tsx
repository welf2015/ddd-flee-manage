'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Eye, Search } from 'lucide-react'
import MaintenanceDetailSheet from './maintenance-detail-sheet'

const fetcher = async () => {
  const supabase = createClient()
  const { data } = await supabase
    .from('maintenance_schedules')
    .select(`
      *,
      vehicle:vehicles(vehicle_number, make, model, vehicle_type),
      scheduled_by_user:profiles!maintenance_schedules_scheduled_by_fkey(full_name),
      approved_by_user:profiles!maintenance_schedules_approved_by_fkey(full_name)
    `)
    .order('scheduled_date', { ascending: true })
  
  return data || []
}

export default function MaintenanceSchedulesTable({ initialSchedules, vehicles }: any) {
  const { data: schedules } = useSWR('maintenance-schedules', fetcher, {
    fallbackData: initialSchedules,
    refreshInterval: 5000,
  })
  
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSchedule, setSelectedSchedule] = useState<any>(null)
  const [detailSheetOpen, setDetailSheetOpen] = useState(false)
  
  const filteredSchedules = schedules?.filter((schedule: any) =>
    schedule.schedule_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    schedule.vehicle?.vehicle_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    schedule.maintenance_type?.toLowerCase().includes(searchQuery.toLowerCase())
  )
  
  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      'Pending': 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20',
      'Approved': 'bg-[#003e31]/10 text-[#003e31] border-[#003e31]/20',
      'Rejected': 'bg-red-500/10 text-red-700 border-red-500/20',
      'In Progress': 'bg-blue-500/10 text-blue-700 border-blue-500/20',
      'Completed': 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
      'Cancelled': 'bg-gray-500/10 text-gray-700 border-gray-500/20',
    }
    
    return (
      <Badge variant="outline" className={variants[status] || ''}>
        {status}
      </Badge>
    )
  }
  
  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, string> = {
      'Low': 'bg-gray-500/10 text-gray-700 border-gray-500/20',
      'Medium': 'bg-blue-500/10 text-blue-700 border-blue-500/20',
      'High': 'bg-orange-500/10 text-orange-700 border-orange-500/20',
      'Urgent': 'bg-red-500/10 text-red-700 border-red-500/20',
    }
    
    return (
      <Badge variant="outline" className={variants[priority] || ''}>
        {priority}
      </Badge>
    )
  }
  
  const handleViewDetails = (schedule: any) => {
    setSelectedSchedule(schedule)
    setDetailSheetOpen(true)
  }
  
  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by schedule number, vehicle, or type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Schedule #</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Scheduled Date</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Est. Cost</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSchedules?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No maintenance schedules found
                  </TableCell>
                </TableRow>
              ) : (
                filteredSchedules?.map((schedule: any) => (
                  <TableRow key={schedule.id}>
                    <TableCell className="font-medium">{schedule.schedule_number}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{schedule.vehicle?.vehicle_number}</div>
                        <div className="text-sm text-muted-foreground">
                          {schedule.vehicle?.make} {schedule.vehicle?.model}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{schedule.maintenance_type}</TableCell>
                    <TableCell>
                      {new Date(schedule.scheduled_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{getPriorityBadge(schedule.priority)}</TableCell>
                    <TableCell>{getStatusBadge(schedule.status)}</TableCell>
                    <TableCell>₦{Number(schedule.estimated_cost || 0).toLocaleString()}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetails(schedule)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      
      <MaintenanceDetailSheet
        schedule={selectedSchedule}
        open={detailSheetOpen}
        onOpenChange={setDetailSheetOpen}
        vehicles={vehicles}
      />
    </>
  )
}
