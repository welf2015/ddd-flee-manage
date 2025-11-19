'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'

interface UpdateComplianceDialogProps {
  vehicle: {
    id: string
    vehicle_number: string
    insurance_expiry?: string
    license_expiry?: string
  }
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UpdateComplianceDialog({ vehicle, open, onOpenChange }: UpdateComplianceDialogProps) {
  const [insuranceExpiry, setInsuranceExpiry] = useState(
    vehicle.insurance_expiry ? new Date(vehicle.insurance_expiry).toISOString().split('T')[0] : ''
  )
  const [licenseExpiry, setLicenseExpiry] = useState(
    vehicle.license_expiry ? new Date(vehicle.license_expiry).toISOString().split('T')[0] : ''
  )
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase
        .from('vehicles')
        .update({
          insurance_expiry: insuranceExpiry || null,
          license_expiry: licenseExpiry || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', vehicle.id)

      if (error) throw error

      toast({
        title: 'Compliance Updated',
        description: `${vehicle.vehicle_number} compliance dates have been updated successfully.`,
      })
      
      onOpenChange(false)
    } catch (error: any) {
      console.error('[v0] Compliance update error:', error)
      toast({
        title: 'Update Failed',
        description: error.message || 'Failed to update compliance dates',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Update Compliance - {vehicle.vehicle_number}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="insurance">Insurance Expiry Date</Label>
            <Input
              id="insurance"
              type="date"
              value={insuranceExpiry}
              onChange={(e) => setInsuranceExpiry(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="license">License Expiry Date</Label>
            <Input
              id="license"
              type="date"
              value={licenseExpiry}
              onChange={(e) => setLicenseExpiry(e.target.value)}
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update Compliance'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
