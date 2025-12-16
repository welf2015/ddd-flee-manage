"use client"

import type React from "react"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Upload } from "lucide-react"

export function CreateIncidentDialog({ open, onOpenChange, onSuccess }: any) {
  const [incidentType, setIncidentType] = useState("Accident")
  const [incidentDate, setIncidentDate] = useState<Date | undefined>(new Date())
  const [incidentTime, setIncidentTime] = useState(new Date().toTimeString().split(" ")[0].substring(0, 5))
  const [description, setDescription] = useState("")
  const [location, setLocation] = useState("")
  const [injuries, setInjuries] = useState("")
  const [thirdParties, setThirdParties] = useState("")
  const [witnesses, setWitnesses] = useState("")
  const [policeContacted, setPoliceContacted] = useState(false)
  const [policeRef, setPoliceRef] = useState("")
  const [towContacted, setTowContacted] = useState(false)
  const [towLocation, setTowLocation] = useState("")
  const [immediateAction, setImmediateAction] = useState("")
  const [insuranceFiled, setInsuranceFiled] = useState(false)
  const [insuranceRef, setInsuranceRef] = useState("")
  const [repairsAuthorizedBy, setRepairsAuthorizedBy] = useState("")
  const [hasDowntime, setHasDowntime] = useState(false)
  const [workshopName, setWorkshopName] = useState("")
  const [returnDate, setReturnDate] = useState("")
  const [totalCost, setTotalCost] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [uploading, setUploading] = useState(false)
  const [additionalRemarks, setAdditionalRemarks] = useState("")
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      // 1. Get Upload Configuration
      const response = await fetch(
        `/api/upload?filename=${encodeURIComponent(file.name)}&folder=incidents&contentType=${encodeURIComponent(file.type)}`,
      )

      if (!response.ok) {
        let errorMessage = "Failed to get upload configuration"
        try {
          const error = await response.json()
          errorMessage = error.error || errorMessage
        } catch (e) {
          console.error("Failed to parse error response", e)
          errorMessage = `Server error: ${response.status} ${response.statusText}`
        }
        throw new Error(errorMessage)
      }

      const config = await response.json()

      let publicUrl = ""

      // 2. Upload Logic - Only supports Cloudflare Worker now
      if (config.workerUrl) {
        const workerUrl = new URL(config.workerUrl)
        workerUrl.searchParams.set("filename", file.name)
        workerUrl.searchParams.set("folder", "incidents")

        const uploadResponse = await fetch(workerUrl.toString(), {
          method: "PUT",
          body: file,
          headers: {
            "X-Auth-Key": config.authKey,
            "Content-Type": file.type,
          },
        })

        if (!uploadResponse.ok) {
          throw new Error("Failed to upload to Worker")
        }

        const result = await uploadResponse.json()
        publicUrl = result.url
      } else {
        throw new Error("R2 Worker not configured")
      }

      setImageUrl(publicUrl)
      toast.success("Image uploaded successfully")
    } catch (error: any) {
      console.error("Upload error:", error)
      toast.error(error.message || "Failed to upload image")
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async () => {
    setLoading(true)

    const { data: user } = await supabase.auth.getUser()

    const { error } = await supabase.from("incidents").insert({
      incident_type: incidentType,
      incident_date: incidentDate ? format(incidentDate, "yyyy-MM-dd") : new Date().toISOString().split("T")[0],
      incident_time: incidentTime,
      description,
      location,
      injuries_damages: injuries,
      photo_url: imageUrl,
      third_parties_involved: thirdParties,
      witnesses,
      police_contacted: policeContacted,
      police_reference: policeRef,
      tow_service_contacted: towContacted,
      vehicle_towed_to: towLocation,
      immediate_action_taken: immediateAction,
      insurance_claim_filed: insuranceFiled,
      insurance_reference: insuranceRef,
      repairs_authorized_by: repairsAuthorizedBy,
      downtime: hasDowntime,
      workshop_name: workshopName,
      date_returned_to_service: returnDate || null,
      total_amount_spent: totalCost ? Number.parseFloat(totalCost) : null,
      final_comments: additionalRemarks,
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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Report Incident</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Basic Information */}
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
              <Input
                placeholder="Where did it happen?"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Incident Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !incidentDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {incidentDate ? format(incidentDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={incidentDate}
                    onSelect={setIncidentDate}
                    disabled={(date) => date > new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Incident Time *</Label>
              <Input
                type="time"
                value={incidentTime}
                onChange={(e) => setIncidentTime(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description *</Label>
            <Textarea
              placeholder="Describe what happened"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="photo">Incident Photo (Optional)</Label>
            <div className="flex gap-2">
              <Input
                id="photo"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploading}
                className="flex-1"
              />
              {uploading && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Upload className="h-4 w-4 animate-pulse" />
                  Uploading...
                </div>
              )}
            </div>
            {imageUrl && (
              <div className="mt-2">
                <img src={imageUrl || "/placeholder.svg"} alt="Preview" className="h-32 w-auto rounded border" />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Total Cost of Damages</Label>
            <Input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={totalCost}
              onChange={(e) => setTotalCost(e.target.value)}
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
            <Label>Third Parties Involved (LastMan, Towing, Police, etc.)</Label>
            <Textarea
              placeholder="Name, contact, vehicle details of third parties..."
              value={thirdParties}
              onChange={(e) => setThirdParties(e.target.value)}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Any Witnesses?</Label>
            <Textarea
              placeholder="Name, contact, and details of witnesses..."
              value={witnesses}
              onChange={(e) => setWitnesses(e.target.value)}
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
                Police Contacted
              </label>
            </div>

            {policeContacted && (
              <Input
                placeholder="Police reference number"
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

            {towContacted && (
              <Input
                placeholder="Where was vehicle towed to?"
                value={towLocation}
                onChange={(e) => setTowLocation(e.target.value)}
              />
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="insurance"
                checked={insuranceFiled}
                onCheckedChange={(checked) => setInsuranceFiled(checked as boolean)}
              />
              <label htmlFor="insurance" className="text-sm font-medium">
                Insurance Claim Filed
              </label>
            </div>

            {insuranceFiled && (
              <Input
                placeholder="Insurance claim reference"
                value={insuranceRef}
                onChange={(e) => setInsuranceRef(e.target.value)}
              />
            )}
          </div>

          <div className="space-y-2">
            <Label>Repairs Authorized By?</Label>
            <Input
              placeholder="Name of person who authorized repairs"
              value={repairsAuthorizedBy}
              onChange={(e) => setRepairsAuthorizedBy(e.target.value)}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="downtime"
                checked={hasDowntime}
                onCheckedChange={(checked) => setHasDowntime(checked as boolean)}
              />
              <label htmlFor="downtime" className="text-sm font-medium">
                Any Downtime?
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Workshop Name (Who is working on it?)</Label>
            <Input placeholder="Workshop name" value={workshopName} onChange={(e) => setWorkshopName(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Date Vehicle Will Be Back to Service</Label>
            <Input type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Additional Remarks</Label>
            <Textarea
              placeholder="Any additional comments..."
              value={additionalRemarks}
              onChange={(e) => setAdditionalRemarks(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading} className="flex-1 bg-accent hover:bg-accent/90">
              {loading ? "Reporting..." : "Submit Report"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
