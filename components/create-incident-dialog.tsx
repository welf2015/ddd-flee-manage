"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Plus, Upload, CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createIncident } from "@/app/actions/incidents"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

export function CreateIncidentDialog() {
  const [open, setOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [vehicles, setVehicles] = useState<any[]>([])
  const [drivers, setDrivers] = useState<any[]>([])
  const [staff, setStaff] = useState<any[]>([])
  const [imageUrl, setImageUrl] = useState("")
  const [incidentDate, setIncidentDate] = useState<Date>()
  const [returnDate, setReturnDate] = useState<Date>()
  const [incidentTime, setIncidentTime] = useState("12:00")
  const [hasDowntime, setHasDowntime] = useState(false)
  const [insuranceFiled, setInsuranceFiled] = useState(false)
  const [policeContacted, setPoliceContacted] = useState(false)
  const [towContacted, setTowContacted] = useState(false)
  const router = useRouter()

  const [formState, setFormState] = useState<any>({})

  useEffect(() => {
    if (open) {
      fetchData()
    }
  }, [open])

  const fetchData = async () => {
    const supabase = createClient()

    const [vehiclesRes, driversRes, staffRes] = await Promise.all([
      supabase.from("vehicles").select("id, vehicle_number").order("vehicle_number"),
      supabase.from("drivers").select("id, full_name").order("full_name"),
      supabase
        .from("staff_directory")
        .select("id, full_name, position, department")
        .eq("is_active", true)
        .order("full_name"),
    ])

    if (vehiclesRes.data) setVehicles(vehiclesRes.data)
    if (driversRes.data) setDrivers(driversRes.data)
    if (staffRes.data) setStaff(staffRes.data)
  }

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
            Authorization: `Bearer ${config.authKey}`,
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

  const handleNext = () => {
    if (currentStep === 1) {
      if (!formState.vehicle_id || !incidentDate) {
        toast.error("Please fill in all required fields")
        return
      }
    }
    if (currentStep === 2) {
      if (!formState.immediate_action_taken) {
        toast.error("Please describe the immediate action taken")
        return
      }
    }
    setCurrentStep((prev) => Math.min(prev + 1, 3))
  }

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1))
  }

  const updateFormState = (key: string, value: any) => {
    setFormState((prev: any) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const incidentDateTime = incidentDate
      ? new Date(`${format(incidentDate, "yyyy-MM-dd")}T${incidentTime}`)
      : new Date()

    const formData = new FormData()

    // Basic Info (Step 1)
    if (formState.vehicle_id) formData.set("vehicle_id", formState.vehicle_id)
    if (formState.driver_id && formState.driver_id !== "none") formData.set("driver_id", formState.driver_id)
    formData.set("incident_date", incidentDateTime.toISOString())
    if (formState.severity) formData.set("severity", formState.severity)
    if (formState.description) formData.set("description", formState.description)
    if (formState.location) formData.set("location", formState.location)
    if (formState.total_amount_spent) formData.set("total_amount_spent", formState.total_amount_spent)
    if (imageUrl) formData.set("photo_url", imageUrl)

    // Parties & Witnesses (Step 2)
    if (formState.third_parties_involved) formData.set("third_parties_involved", formState.third_parties_involved)
    if (formState.witnesses) formData.set("witnesses", formState.witnesses)
    formData.set("police_contacted", policeContacted.toString())
    formData.set("tow_service_contacted", towContacted.toString())
    if (towContacted && formState.vehicle_towed_to) formData.set("vehicle_towed_to", formState.vehicle_towed_to)

    // Actions & Response (Step 2)
    if (formState.immediate_action_taken) formData.set("immediate_action_taken", formState.immediate_action_taken)
    formData.set("insurance_claim_filed", insuranceFiled.toString())
    if (insuranceFiled && formState.insurance_reference)
      formData.set("insurance_reference", formState.insurance_reference)
    if (formState.repairs_authorized_by) formData.set("repairs_authorized_by", formState.repairs_authorized_by)

    // Resolution (Step 3)
    formData.set("downtime", hasDowntime.toString())
    if (formState.workshop_name) formData.set("workshop_name", formState.workshop_name)
    if (returnDate) formData.set("date_returned_to_service", format(returnDate, "yyyy-MM-dd"))
    if (formState.final_comments) formData.set("final_comments", formState.final_comments)
    if (formState.resolved_by && formState.resolved_by !== "none") formData.set("resolved_by", formState.resolved_by)

    const result = await createIncident(formData)

    if (result.success) {
      toast.success("Incident reported successfully")
      setOpen(false)
      setCurrentStep(1)
      setFormState({})
      setImageUrl("")
      setIncidentDate(undefined)
      setReturnDate(undefined)
      setIncidentTime("12:00")
      setHasDowntime(false)
      setInsuranceFiled(false)
      setPoliceContacted(false)
      setTowContacted(false)
      router.refresh()
    } else {
      toast.error(result.error || "Failed to create incident")
    }

    setLoading(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen)
        if (!isOpen) {
          setCurrentStep(1)
          setFormState({})
        }
      }}
    >
      <DialogTrigger asChild>
        <Button className="bg-accent hover:bg-accent/90">
          <Plus className="mr-2 h-4 w-4" />
          Report Incident
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl bg-background/95 backdrop-blur-xl border-border/50 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Report New Incident - Step {currentStep} of 3</DialogTitle>
          <DialogDescription>
            {currentStep === 1 && "Provide basic incident information"}
            {currentStep === 2 && "Document parties involved and immediate response"}
            {currentStep === 3 && "Resolution and follow-up details"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="vehicle_id">Vehicle *</Label>
                  <Select
                    value={formState.vehicle_id}
                    onValueChange={(value) => updateFormState("vehicle_id", value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select vehicle" />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicles.map((vehicle) => (
                        <SelectItem key={vehicle.id} value={vehicle.id}>
                          {vehicle.vehicle_number}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="driver_id">Driver</Label>
                  <Select value={formState.driver_id} onValueChange={(value) => updateFormState("driver_id", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select driver (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No driver</SelectItem>
                      {drivers.map((driver) => (
                        <SelectItem key={driver.id} value={driver.id}>
                          {driver.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Incident Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn("justify-start text-left font-normal", !incidentDate && "text-muted-foreground")}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {incidentDate ? format(incidentDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={incidentDate} onSelect={setIncidentDate} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="incident_time">Incident Time *</Label>
                  <Input
                    id="incident_time"
                    type="time"
                    value={incidentTime}
                    onChange={(e) => setIncidentTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="severity">Severity *</Label>
                <Select
                  value={formState.severity}
                  onValueChange={(value) => updateFormState("severity", value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formState.description || ""}
                  onChange={(e) => updateFormState("description", e.target.value)}
                  placeholder="Describe what happened..."
                  rows={4}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  value={formState.location || ""}
                  onChange={(e) => updateFormState("location", e.target.value)}
                  placeholder="Where did this occur?"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="total_amount_spent">Total Cost of Damages</Label>
                <Input
                  id="total_amount_spent"
                  type="number"
                  step="0.01"
                  value={formState.total_amount_spent || ""}
                  onChange={(e) => updateFormState("total_amount_spent", e.target.value)}
                  placeholder="0.00"
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
            </div>
          )}

          {/* Step 2: Parties & Immediate Response */}
          {currentStep === 2 && (
            <div className="space-y-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="third_parties_involved">Third Parties Involved</Label>
                <Textarea
                  id="third_parties_involved"
                  value={formState.third_parties_involved || ""}
                  onChange={(e) => updateFormState("third_parties_involved", e.target.value)}
                  placeholder="LastMan, Towing company, Police, etc. Include names and contact details..."
                  rows={3}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="witnesses">Any Witnesses?</Label>
                <Textarea
                  id="witnesses"
                  value={formState.witnesses || ""}
                  onChange={(e) => updateFormState("witnesses", e.target.value)}
                  placeholder="Name, contact, and details of any witnesses..."
                  rows={3}
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

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="tow"
                    checked={towContacted}
                    onCheckedChange={(checked) => setTowContacted(checked as boolean)}
                  />
                  <label htmlFor="tow" className="text-sm font-medium">
                    Tow Service Contacted
                  </label>
                </div>

                {towContacted && (
                  <Input
                    value={formState.vehicle_towed_to || ""}
                    onChange={(e) => updateFormState("vehicle_towed_to", e.target.value)}
                    placeholder="Where was vehicle towed to?"
                  />
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="immediate_action_taken">Immediate Action Taken *</Label>
                <Textarea
                  id="immediate_action_taken"
                  value={formState.immediate_action_taken || ""}
                  onChange={(e) => updateFormState("immediate_action_taken", e.target.value)}
                  placeholder="Describe actions taken immediately after the incident..."
                  rows={4}
                  required
                />
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
                    value={formState.insurance_reference || ""}
                    onChange={(e) => updateFormState("insurance_reference", e.target.value)}
                    placeholder="Insurance claim reference number"
                  />
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="repairs_authorized_by">Repairs Authorized By</Label>
                <Input
                  id="repairs_authorized_by"
                  value={formState.repairs_authorized_by || ""}
                  onChange={(e) => updateFormState("repairs_authorized_by", e.target.value)}
                  placeholder="Name of person who authorized repairs"
                />
              </div>
            </div>
          )}

          {/* Step 3: Resolution */}
          {currentStep === 3 && (
            <div className="space-y-4 py-4">
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

              <div className="grid gap-2">
                <Label htmlFor="workshop_name">Workshop Name</Label>
                <Input
                  id="workshop_name"
                  value={formState.workshop_name || ""}
                  onChange={(e) => updateFormState("workshop_name", e.target.value)}
                  placeholder="Who is working on it?"
                />
              </div>

              <div className="grid gap-2">
                <Label>Date Vehicle Will Be Back to Service</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn("justify-start text-left font-normal", !returnDate && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {returnDate ? format(returnDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={returnDate} onSelect={setReturnDate} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="final_comments">Additional Remarks</Label>
                <Textarea
                  id="final_comments"
                  value={formState.final_comments || ""}
                  onChange={(e) => updateFormState("final_comments", e.target.value)}
                  placeholder="Any additional comments or remarks..."
                  rows={3}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="resolved_by">Resolved By</Label>
                <Select value={formState.resolved_by} onValueChange={(value) => updateFormState("resolved_by", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select person who resolved this" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not resolved yet</SelectItem>
                    {staff.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.full_name} {member.position && `- ${member.position}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter className="mt-6 flex justify-between">
            <div className="flex gap-2">
              {currentStep > 1 && (
                <Button type="button" variant="outline" onClick={handleBack}>
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                Cancel
              </Button>
              {currentStep < 3 ? (
                <Button type="button" onClick={handleNext} className="bg-accent hover:bg-accent/90">
                  Next
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button type="submit" disabled={loading || uploading} className="bg-accent hover:bg-accent/90">
                  {loading ? "Reporting..." : "Submit Report"}
                </Button>
              )}
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
