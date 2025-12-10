"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { updateMaintenanceLog } from "@/app/actions/maintenance"

type EditMaintenanceLogDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  logId: string | null
  onLogUpdated?: () => void
}

export function EditMaintenanceLogDialog({ open, onOpenChange, logId, onLogUpdated }: EditMaintenanceLogDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    service_date: "",
    maintenance_type: "",
    service_centre: "",
    cost: "",
    current_mileage: "",
    next_service_date: "",
    nature_of_fault: "",
    parts_replaced: "",
    performed_by: "",
    repair_duration_from: "",
    repair_duration_to: "",
    vehicle_downtime_days: "",
    remarks: "",
  })
  const supabase = createClient()

  useEffect(() => {
    if (logId && open) {
      // Fetch log data
      const fetchLog = async () => {
        const { data } = await supabase.from("maintenance_logs").select("*").eq("id", logId).single()

        if (data) {
          setFormData({
            service_date: data.service_date || "",
            maintenance_type: data.maintenance_type || "",
            service_centre: data.service_centre || "",
            cost: data.cost || "",
            current_mileage: data.current_mileage || "",
            next_service_date: data.next_service_date || "",
            nature_of_fault: data.nature_of_fault || "",
            parts_replaced: data.parts_replaced || "",
            performed_by: data.performed_by || "",
            repair_duration_from: data.repair_duration_from || "",
            repair_duration_to: data.repair_duration_to || "",
            vehicle_downtime_days: data.vehicle_downtime_days || "",
            remarks: data.remarks || "",
          })
        }
      }
      fetchLog()
    }
  }, [logId, open, supabase])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!logId) return

    setIsLoading(true)

    const updateData: any = {
      service_date: formData.service_date,
      maintenance_type: formData.maintenance_type,
      service_centre: formData.service_centre,
      cost: formData.cost ? Number(formData.cost) : null,
      current_mileage: formData.current_mileage ? Number(formData.current_mileage) : null,
      next_service_date: formData.next_service_date || null,
      nature_of_fault: formData.nature_of_fault,
      parts_replaced: formData.parts_replaced,
      performed_by: formData.performed_by,
      repair_duration_from: formData.repair_duration_from || null,
      repair_duration_to: formData.repair_duration_to || null,
      vehicle_downtime_days: formData.vehicle_downtime_days ? Number(formData.vehicle_downtime_days) : null,
      remarks: formData.remarks,
    }

    const result = await updateMaintenanceLog(logId, updateData)

    setIsLoading(false)

    if (result.success) {
      toast.success("Maintenance log updated successfully")
      onLogUpdated?.()
      onOpenChange(false)
    } else {
      toast.error(result.error || "Failed to update maintenance log")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Maintenance Log</DialogTitle>
          <DialogDescription>Update maintenance log details</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="service_date">Service Date</Label>
              <Input
                name="service_date"
                type="date"
                required
                value={formData.service_date}
                onChange={(e) => setFormData({ ...formData, service_date: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="maintenance_type">Maintenance Type</Label>
              <Select value={formData.maintenance_type} onValueChange={(value) => setFormData({ ...formData, maintenance_type: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Routine">Routine</SelectItem>
                  <SelectItem value="Major">Major</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="service_centre">Service Centre</Label>
              <Input
                name="service_centre"
                placeholder="Service centre name"
                value={formData.service_centre}
                onChange={(e) => setFormData({ ...formData, service_centre: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="performed_by">Performed By</Label>
              <Input
                name="performed_by"
                placeholder="Service provider or technician"
                value={formData.performed_by}
                onChange={(e) => setFormData({ ...formData, performed_by: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="cost">Cost (₦)</Label>
              <Input
                name="cost"
                type="number"
                placeholder="0.00"
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="current_mileage">Current Mileage (km)</Label>
              <Input
                name="current_mileage"
                type="number"
                placeholder="0"
                value={formData.current_mileage}
                onChange={(e) => setFormData({ ...formData, current_mileage: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="next_service_date">Next Service Date</Label>
              <Input
                name="next_service_date"
                type="date"
                value={formData.next_service_date}
                onChange={(e) => setFormData({ ...formData, next_service_date: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="repair_duration_from">Repair Start Date</Label>
              <Input
                name="repair_duration_from"
                type="date"
                value={formData.repair_duration_from}
                onChange={(e) => setFormData({ ...formData, repair_duration_from: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="repair_duration_to">Repair End Date</Label>
              <Input
                name="repair_duration_to"
                type="date"
                value={formData.repair_duration_to}
                onChange={(e) => setFormData({ ...formData, repair_duration_to: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="vehicle_downtime_days">Vehicle Downtime (Days)</Label>
            <Input
              name="vehicle_downtime_days"
              type="number"
              placeholder="Number of days"
              value={formData.vehicle_downtime_days}
              onChange={(e) => setFormData({ ...formData, vehicle_downtime_days: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="nature_of_fault">Nature of Fault</Label>
            <Textarea
              name="nature_of_fault"
              placeholder="Describe the fault or issue"
              rows={3}
              value={formData.nature_of_fault}
              onChange={(e) => setFormData({ ...formData, nature_of_fault: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="parts_replaced">Parts Replaced</Label>
            <Textarea
              name="parts_replaced"
              placeholder="List parts that were replaced"
              rows={2}
              value={formData.parts_replaced}
              onChange={(e) => setFormData({ ...formData, parts_replaced: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="remarks">Remarks</Label>
            <Textarea
              name="remarks"
              placeholder="Additional notes or observations"
              rows={2}
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-accent hover:bg-accent/90">
              {isLoading ? "Updating..." : "Update Log"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
