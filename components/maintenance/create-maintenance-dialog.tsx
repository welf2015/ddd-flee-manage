'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createMaintenanceSchedule } from '@/app/actions/maintenance'
import { useRouter } from 'next/navigation'

export default function CreateMaintenanceDialog({ open, onOpenChange, vehicles }: any) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    vehicle_id: '',
    maintenance_type: '',
    priority: 'Medium',
    scheduled_date: '',
    estimated_cost: '',
    description: '',
    service_provider: '',
  })
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    const result = await createMaintenanceSchedule({
      ...formData,
      estimated_cost: parseFloat(formData.estimated_cost) || 0,
    })
    
    if (result.success) {
      router.refresh()
      onOpenChange(false)
      setFormData({
        vehicle_id: '',
        maintenance_type: '',
        priority: 'Medium',
        scheduled_date: '',
        estimated_cost: '',
        description: '',
        service_provider: '',
      })
    } else {
      alert(result.error || 'Failed to create maintenance schedule')
    }
    
    setLoading(false)
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Schedule Maintenance</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Vehicle *</Label>
            <Select
              value={formData.vehicle_id}
              onValueChange={(value) => setFormData({ ...formData, vehicle_id: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select vehicle" />
              </SelectTrigger>
              <SelectContent>
                {vehicles?.map((vehicle: any) => (
                  <SelectItem key={vehicle.id} value={vehicle.id}>
                    {vehicle.vehicle_number} - {vehicle.make} {vehicle.model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Maintenance Type *</Label>
            <Select
              value={formData.maintenance_type}
              onValueChange={(value) => setFormData({ ...formData, maintenance_type: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Oil Change">Oil Change</SelectItem>
                <SelectItem value="Brake Service">Brake Service</SelectItem>
                <SelectItem value="Tire Replacement">Tire Replacement</SelectItem>
                <SelectItem value="Engine Repair">Engine Repair</SelectItem>
                <SelectItem value="Transmission Service">Transmission Service</SelectItem>
                <SelectItem value="Battery Replacement">Battery Replacement</SelectItem>
                <SelectItem value="AC Service">AC Service</SelectItem>
                <SelectItem value="General Inspection">General Inspection</SelectItem>
                <SelectItem value="Body Work">Body Work</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Priority *</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Scheduled Date *</Label>
              <Input
                type="date"
                value={formData.scheduled_date}
                onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Estimated Cost</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.estimated_cost}
              onChange={(e) => setFormData({ ...formData, estimated_cost: e.target.value })}
              placeholder="Enter estimated cost"
            />
          </div>
          
          <div className="space-y-2">
            <Label>Service Provider</Label>
            <Input
              value={formData.service_provider}
              onChange={(e) => setFormData({ ...formData, service_provider: e.target.value })}
              placeholder="Enter service provider name"
            />
          </div>
          
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter maintenance details..."
              rows={4}
            />
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-[#003e31] hover:bg-[#003e31]/90"
            >
              {loading ? 'Creating...' : 'Schedule Maintenance'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
