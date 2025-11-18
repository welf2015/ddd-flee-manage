"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

export function CreateIncidentDialog({ open, onOpenChange, onSuccess }: any) {
  const [incidentType, setIncidentType] = useState("Accident")
  const [description, setDescription] = useState("")
  const [location, setLocation] = useState("")
  const [injuries, setInjuries] = useState("")
  const [thirdParties, setThirdParties] = useState("")
  const [policeContacted, setPoliceContacted] = useState(false)
  const [policeRef, setPoliceRef] = useState("")
  const [towContacted, setTowContacted] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleSubmit = async () => {
    setLoading(true)

    const { data: user } = await supabase.auth.getUser()

    const { error } = await supabase.from("incidents").insert({
      incident_type: incidentType,
      incident_date: new Date().toISOString().split("T")[0],
      incident_time: new Date().toTimeString().split(" ")[0],
      description,
      location,
      injuries_damages: injuries,
      third_parties_involved: thirdParties,
      police_contacted: policeContacted,
      police_reference: policeRef,
      tow_service_contacted: towContacted,
      status: "Open",
      report_prepared_by: user.user?.id,
    })

    setLoading(false)

    if (error) {
      toast.error("Failed to create incident")
    } else {
      toast.success("Incident reported successfully")
      onSuccess()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Report Incident</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Incident Type *</Label>
              <Select value={incidentType} onValueChange={setIncidentType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Accident">Accident</SelectItem>
                  <SelectItem value="Breakdown">Breakdown</SelectItem>
                  <SelectItem value="Theft">Theft</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Location *</Label>
              <Input placeholder="Where did it happen?" value={location} onChange={(e) => setLocation(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description *</Label>
            <Textarea
              placeholder="Describe what happened"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label>Injuries/Damages</Label>
            <Textarea
              placeholder="Describe any injuries or damages"
              value={injuries}
              onChange={(e) => setInjuries(e.target.value)}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Third Parties Involved</Label>
            <Textarea
              placeholder="Name, contact, vehicle details of others involved"
              value={thirdParties}
              onChange={(e) => setThirdParties(e.target.value)}
              rows={2}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="police"
                checked={policeContacted}
                onCheckedChange={(checked) => setPoliceContacted(checked as boolean)}
              />
              <label htmlFor="police" className="text-sm font-medium">
                Police/Emergency Services Contacted
              </label>
            </div>

            {policeContacted && (
              <Input
                placeholder="999 Reference Number"
                value={policeRef}
                onChange={(e) => setPoliceRef(e.target.value)}
              />
            )}

            <div className="flex items-center space-x-2">
              <Checkbox
                id="tow"
                checked={towContacted}
                onCheckedChange={(checked) => setTowContacted(checked as boolean)}
              />
              <label htmlFor="tow" className="text-sm font-medium">
                Tow/Recovery Service Contacted
              </label>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading} className="flex-1">
              {loading ? "Reporting..." : "Submit Report"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
