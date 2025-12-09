"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { updateOnboarding } from "@/app/actions/onboarding"
import { useToast } from "@/hooks/use-toast"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface EditOnboardingDialogProps {
  open: boolean
  onClose: () => void
  onboarding: any
  onSuccess?: () => void
}

export function EditOnboardingDialog({ open, onClose, onboarding, onSuccess }: EditOnboardingDialogProps) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    vehicle_number: onboarding?.vehicle_number || "",
    vehicle_type: onboarding?.vehicle_type || "",
    make: onboarding?.make || "",
    model: onboarding?.model || "",
    year: onboarding?.year || new Date().getFullYear(),
    registration_date: onboarding?.registration_date ? new Date(onboarding.registration_date) : undefined,
    registration_expiry_date: onboarding?.registration_expiry_date
      ? new Date(onboarding.registration_expiry_date)
      : undefined,
    insurance_expiry_date: onboarding?.insurance_expiry_date ? new Date(onboarding.insurance_expiry_date) : undefined,
    road_worthiness_expiry_date: onboarding?.road_worthiness_expiry_date
      ? new Date(onboarding.road_worthiness_expiry_date)
      : undefined,
    hackney_permit_expiry_date: onboarding?.hackney_permit_expiry_date
      ? new Date(onboarding.hackney_permit_expiry_date)
      : undefined,
    vehicle_license_expiry_date: onboarding?.vehicle_license_expiry_date
      ? new Date(onboarding.vehicle_license_expiry_date)
      : undefined,
    ownership_transfer_date: onboarding?.ownership_transfer_date
      ? new Date(onboarding.ownership_transfer_date)
      : undefined,
    hackney_permit_na: onboarding?.hackney_permit_na || false,
    ownership_transfer_na: onboarding?.ownership_transfer_na || false,
    notes: onboarding?.notes || "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await updateOnboarding(onboarding.id, formData)

      if (result.success) {
        toast({
          title: "Success",
          description: "Onboarding updated successfully",
        })
        onSuccess?.()
        onClose()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update onboarding",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An error occurred",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const DatePickerField = ({
    label,
    value,
    onChange,
    naField,
    naValue,
    onNaChange,
  }: {
    label: string
    value: Date | undefined
    onChange: (date: Date | undefined) => void
    naField?: string
    naValue?: boolean
    onNaChange?: (checked: boolean) => void
  }) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        {naField && (
          <div className="flex items-center space-x-2">
            <Checkbox id={naField} checked={naValue} onCheckedChange={(checked) => onNaChange?.(checked as boolean)} />
            <label htmlFor={naField} className="text-xs text-muted-foreground cursor-pointer">
              N/A
            </label>
          </div>
        )}
      </div>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn("w-full justify-start text-left font-normal", !value && "text-muted-foreground")}
            disabled={naValue}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value ? format(value, "PPP") : <span>Pick a date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar mode="single" selected={value} onSelect={onChange} initialFocus />
        </PopoverContent>
      </Popover>
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Vehicle Onboarding</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="vehicle_number">Vehicle Number</Label>
            <Input
              id="vehicle_number"
              value={formData.vehicle_number}
              onChange={(e) => setFormData({ ...formData, vehicle_number: e.target.value })}
              placeholder="e.g., FLT-001"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="vehicle_type">Vehicle Type</Label>
            <Select
              value={formData.vehicle_type}
              onValueChange={(value) => setFormData({ ...formData, vehicle_type: value })}
            >
              <SelectTrigger id="vehicle_type">
                <SelectValue placeholder="Select vehicle type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Truck">Truck</SelectItem>
                <SelectItem value="Car">Car</SelectItem>
                <SelectItem value="Bike">Bike</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="make">Make</Label>
              <Input
                id="make"
                value={formData.make}
                onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                placeholder="e.g., Hino"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <Input
                id="model"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                placeholder="e.g., 500 Series"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="year">Year</Label>
            <Input
              id="year"
              type="number"
              value={formData.year}
              onChange={(e) => setFormData({ ...formData, year: Number.parseInt(e.target.value) })}
              min="1990"
              max={new Date().getFullYear() + 1}
              required
            />
          </div>

          <div className="border-t pt-4">
            <h3 className="text-sm font-medium mb-3">Document Dates</h3>
            <div className="grid gap-4">
              <DatePickerField
                label="Registration Date"
                value={formData.registration_date}
                onChange={(date) => setFormData({ ...formData, registration_date: date })}
              />

              <DatePickerField
                label="Registration Expiry Date"
                value={formData.registration_expiry_date}
                onChange={(date) => setFormData({ ...formData, registration_expiry_date: date })}
              />

              <DatePickerField
                label="Insurance Expiry Date"
                value={formData.insurance_expiry_date}
                onChange={(date) => setFormData({ ...formData, insurance_expiry_date: date })}
              />

              <DatePickerField
                label="Road Worthiness Expiry Date"
                value={formData.road_worthiness_expiry_date}
                onChange={(date) => setFormData({ ...formData, road_worthiness_expiry_date: date })}
              />

              <DatePickerField
                label="Hackney Permit Expiry Date"
                value={formData.hackney_permit_expiry_date}
                onChange={(date) => setFormData({ ...formData, hackney_permit_expiry_date: date })}
                naField="hackney_permit_na"
                naValue={formData.hackney_permit_na}
                onNaChange={(checked) =>
                  setFormData({
                    ...formData,
                    hackney_permit_na: checked,
                    hackney_permit_expiry_date: checked ? undefined : formData.hackney_permit_expiry_date,
                  })
                }
              />

              <DatePickerField
                label="Vehicle License Expiry Date"
                value={formData.vehicle_license_expiry_date}
                onChange={(date) => setFormData({ ...formData, vehicle_license_expiry_date: date })}
              />

              <DatePickerField
                label="Ownership Transfer Date"
                value={formData.ownership_transfer_date}
                onChange={(date) => setFormData({ ...formData, ownership_transfer_date: date })}
                naField="ownership_transfer_na"
                naValue={formData.ownership_transfer_na}
                onNaChange={(checked) =>
                  setFormData({
                    ...formData,
                    ownership_transfer_na: checked,
                    ownership_transfer_date: checked ? undefined : formData.ownership_transfer_date,
                  })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Input
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-accent text-accent-foreground hover:bg-accent/90">
              {loading ? "Updating..." : "Update Onboarding"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
