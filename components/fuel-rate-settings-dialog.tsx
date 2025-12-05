"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Settings } from "lucide-react"
import { updateFuelRate } from "@/app/actions/settings"
import { toast } from "sonner"

interface FuelRateSettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRate: number
  onSuccess: () => void
}

export function FuelRateSettingsDialog({ open, onOpenChange, currentRate, onSuccess }: FuelRateSettingsDialogProps) {
  const [rate, setRate] = useState(currentRate.toString())
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    const rateNum = Number.parseFloat(rate)
    if (isNaN(rateNum) || rateNum <= 0) {
      toast.error("Please enter a valid fuel rate")
      return
    }

    setSaving(true)
    const result = await updateFuelRate(rateNum)
    setSaving(false)

    if (result.success) {
      toast.success("Fuel rate updated successfully")
      onSuccess()
      onOpenChange(false)
    } else {
      toast.error(result.error || "Failed to update fuel rate")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Fuel Rate Settings
          </DialogTitle>
          <DialogDescription>
            Set the current fuel rate per liter. This will be used to automatically calculate fuel costs.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="rate">Fuel Rate (₦ per liter)</Label>
            <Input
              id="rate"
              type="number"
              step="0.01"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              placeholder="1019"
            />
            <p className="text-sm text-muted-foreground">Current rate: ₦{currentRate.toLocaleString()} per liter</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
