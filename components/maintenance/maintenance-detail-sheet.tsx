'use client'

import { useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { CheckCircle, XCircle, Clock, PlayCircle } from 'lucide-react'
import { updateMaintenanceStatus, approveMaintenanceSchedule, rejectMaintenanceSchedule } from '@/app/actions/maintenance'
import { useRouter } from 'next/navigation'

export default function MaintenanceDetailSheet({ schedule, open, onOpenChange, vehicles }: any) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [actualCost, setActualCost] = useState('')
  const [completionNotes, setCompletionNotes] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  
  if (!schedule) return null
  
  const handleApprove = async () => {
    setLoading(true)
    const result = await approveMaintenanceSchedule(schedule.id)
    if (result.success) {
      router.refresh()
      onOpenChange(false)
    }
    setLoading(false)
  }
  
  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection')
      return
    }
    setLoading(true)
    const result = await rejectMaintenanceSchedule(schedule.id, rejectionReason)
    if (result.success) {
      router.refresh()
      onOpenChange(false)
    }
    setLoading(false)
  }
  
  const handleStartWork = async () => {
    setLoading(true)
    const result = await updateMaintenanceStatus(schedule.id, 'In Progress')
    if (result.success) {
      router.refresh()
    }
    setLoading(false)
  }
  
  const handleComplete = async () => {
    if (!actualCost) {
      alert('Please enter the actual cost')
      return
    }
    setLoading(true)
    const result = await updateMaintenanceStatus(
      schedule.id, 
      'Completed', 
      parseFloat(actualCost),
      completionNotes
    )
    if (result.success) {
      router.refresh()
      onOpenChange(false)
    }
    setLoading(false)
  }
  
  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      'Pending': 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20',
      'Approved': 'bg-[#003e31]/10 text-[#003e31] border-[#003e31]/20',
      'Rejected': 'bg-red-500/10 text-red-700 border-red-500/20',
      'In Progress': 'bg-blue-500/10 text-blue-700 border-blue-500/20',
      'Completed': 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
    }
    return <Badge variant="outline" className={variants[status] || ''}>{status}</Badge>
  }
  
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Maintenance Schedule Details</SheetTitle>
        </SheetHeader>
        
        <div className="space-y-6 mt-6">
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            {schedule.status === 'Pending' && (
              <>
                <Button 
                  onClick={handleApprove}
                  disabled={loading}
                  className="bg-[#003e31] hover:bg-[#003e31]/90"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Approve
                </Button>
                <Button 
                  onClick={handleReject}
                  disabled={loading}
                  variant="destructive"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject
                </Button>
              </>
            )}
            {schedule.status === 'Approved' && (
              <Button 
                onClick={handleStartWork}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <PlayCircle className="mr-2 h-4 w-4" />
                Start Work
              </Button>
            )}
            {schedule.status === 'In Progress' && (
              <Button 
                onClick={handleComplete}
                disabled={loading}
                className="bg-[#003e31] hover:bg-[#003e31]/90"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Mark Complete
              </Button>
            )}
          </div>
          
          {/* Schedule Info */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Schedule Number</p>
                <p className="font-medium">{schedule.schedule_number}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                {getStatusBadge(schedule.status)}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Vehicle</p>
                <p className="font-medium">{schedule.vehicle?.vehicle_number}</p>
                <p className="text-sm text-muted-foreground">
                  {schedule.vehicle?.make} {schedule.vehicle?.model}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Priority</p>
                <Badge variant="outline">{schedule.priority}</Badge>
              </div>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground">Maintenance Type</p>
              <p className="font-medium">{schedule.maintenance_type}</p>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground">Description</p>
              <p className="text-sm">{schedule.description || 'No description provided'}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Scheduled Date</p>
                <p className="font-medium">
                  {new Date(schedule.scheduled_date).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Service Provider</p>
                <p className="font-medium">{schedule.service_provider || 'Not assigned'}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Estimated Cost</p>
                <p className="font-medium">₦{Number(schedule.estimated_cost || 0).toLocaleString()}</p>
              </div>
              {schedule.actual_cost && (
                <div>
                  <p className="text-sm text-muted-foreground">Actual Cost</p>
                  <p className="font-medium">₦{Number(schedule.actual_cost).toLocaleString()}</p>
                </div>
              )}
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground">Scheduled By</p>
              <p className="font-medium">{schedule.scheduled_by_user?.full_name || 'Unknown'}</p>
            </div>
            
            {schedule.approved_by_user && (
              <div>
                <p className="text-sm text-muted-foreground">Approved By</p>
                <p className="font-medium">{schedule.approved_by_user.full_name}</p>
              </div>
            )}
          </div>
          
          {/* Rejection Reason Input (for Pending status) */}
          {schedule.status === 'Pending' && (
            <div className="space-y-2">
              <Label>Rejection Reason (if rejecting)</Label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter reason for rejection..."
              />
            </div>
          )}
          
          {/* Completion Form (for In Progress status) */}
          {schedule.status === 'In Progress' && (
            <div className="space-y-4 border-t pt-4">
              <h3 className="font-semibold">Complete Maintenance</h3>
              <div className="space-y-2">
                <Label>Actual Cost *</Label>
                <Input
                  type="number"
                  value={actualCost}
                  onChange={(e) => setActualCost(e.target.value)}
                  placeholder="Enter actual cost"
                />
              </div>
              <div className="space-y-2">
                <Label>Completion Notes</Label>
                <Textarea
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  placeholder="Enter completion notes..."
                  rows={4}
                />
              </div>
            </div>
          )}
          
          {/* Completion Notes (for Completed status) */}
          {schedule.status === 'Completed' && schedule.completion_notes && (
            <div className="border-t pt-4">
              <p className="text-sm text-muted-foreground mb-2">Completion Notes</p>
              <p className="text-sm bg-muted/50 rounded-md p-3">
                {schedule.completion_notes}
              </p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
