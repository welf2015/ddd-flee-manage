"use client"

import { useState, useEffect } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { createClient } from "@/lib/supabase/client"
import { Printer, ChevronLeft, ChevronRight } from "lucide-react"
import { toast } from "sonner"

interface MaintenanceLogSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  vehicles: any[]
  onSuccess: () => void
}

const CHECKLIST_ITEMS = [
  { key: "coolant_level", label: "Coolant level and radiator condition" },
  { key: "brake_fluid", label: "Brake fluid level and effectiveness" },
  { key: "transmission_fluid", label: "Transmission fluid (if applicable)" },
  { key: "power_steering_fluid", label: "Power steering fluid (if applicable)" },
  { key: "battery_condition", label: "Battery condition and terminals" },
  { key: "lights_horn", label: "Headlights, taillights, indicators, and horn" },
  { key: "wiper_blades", label: "Wiper blades and washer fluid" },
  { key: "tire_condition", label: "Tire pressure and tread depth (including spare)" },
  { key: "air_conditioning", label: "Air conditioning performance" },
  { key: "dashboard_lights", label: "Dashboard warning lights (no alerts showing)" },
  { key: "seat_belts", label: "Seat belts and safety accessories" },
  { key: "air_bags", label: "Air bags are fully functional" },
  { key: "safety_equipment", label: "Fire extinguisher, first aid kit, Reflective Triangles available" },
]

export function MaintenanceLogSheet({ open, onOpenChange, vehicles, onSuccess }: MaintenanceLogSheetProps) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null)
  const [assignedDriver, setAssignedDriver] = useState<any>(null)
  const [lastServiceDate, setLastServiceDate] = useState<string>("")

  // Step 1 form data
  const [formData, setFormData] = useState({
    vehicle_id: "",
    service_date: new Date().toISOString().split("T")[0],
    next_service_date: "",
    current_mileage: "",
    service_centre: "",
    nature_of_fault: "",
    parts_replaced: "",
    maintenance_type: "Routine",
    status: "Completed",
    repair_duration_from: "",
    repair_duration_to: "",
    vehicle_downtime_days: "",
    cost: "",
    remarks: "",
  })

  // Step 2 checklist data
  const [checklist, setChecklist] = useState<Record<string, any>>({})

  const supabase = createClient()

  // Fetch driver and last service when vehicle is selected
  useEffect(() => {
    if (formData.vehicle_id) {
      fetchVehicleDetails(formData.vehicle_id)
    }
  }, [formData.vehicle_id])

  const fetchVehicleDetails = async (vehicleId: string) => {
    const vehicle = vehicles.find((v) => v.id === vehicleId)
    setSelectedVehicle(vehicle)

    // Fetch assigned driver
    const { data: driver } = await supabase.from("drivers").select("*").eq("assigned_vehicle_id", vehicleId).single()

    setAssignedDriver(driver)

    // Fetch last service date
    const { data: lastLog } = await supabase
      .from("maintenance_logs")
      .select("service_date")
      .eq("vehicle_id", vehicleId)
      .order("service_date", { ascending: false })
      .limit(1)
      .single()

    if (lastLog) {
      setLastServiceDate(lastLog.service_date)
    }
  }

  const handleNext = () => {
    if (!formData.vehicle_id) {
      toast.error("Please select a vehicle")
      return
    }
    setStep(2)
  }

  const handleBack = () => {
    setStep(1)
  }

  const handleSubmit = async () => {
    setLoading(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      // Insert maintenance log
      const { data: log, error: logError } = await supabase
        .from("maintenance_logs")
        .insert({
          vehicle_id: formData.vehicle_id,
          service_date: formData.service_date,
          next_service_date: formData.next_service_date || null,
          current_mileage: formData.current_mileage ? Number.parseInt(formData.current_mileage) : null,
          service_centre: formData.service_centre,
          nature_of_fault: formData.nature_of_fault,
          parts_replaced: formData.parts_replaced,
          maintenance_type: formData.maintenance_type,
          cost: formData.cost ? Number.parseFloat(formData.cost) : null,
          repair_duration_from: formData.repair_duration_from || null,
          repair_duration_to: formData.repair_duration_to || null,
          vehicle_downtime_days: formData.vehicle_downtime_days
            ? Number.parseInt(formData.vehicle_downtime_days)
            : null,
          remarks: formData.remarks,
          logged_by: user?.id,
          performed_by: formData.service_centre,
        })
        .select()
        .single()

      if (logError) throw logError

      // Insert checklist
      const checklistData: any = {
        maintenance_log_id: log.id,
        last_updated_by: user?.id,
      }

      CHECKLIST_ITEMS.forEach((item) => {
        checklistData[item.key] = checklist[`${item.key}_condition`] || "NA"
        checklistData[`${item.key}_remarks`] = checklist[`${item.key}_remarks`] || ""
        checklistData[`${item.key}_action`] = checklist[`${item.key}_action`] || ""
      })

      const { error: checklistError } = await supabase.from("maintenance_checklist").insert(checklistData)

      if (checklistError) throw checklistError

      toast.success("Maintenance log created successfully")
      resetForm()
      onSuccess()
    } catch (error: any) {
      console.error("[v0] Maintenance log error:", error)
      toast.error(error.message || "Failed to create maintenance log")
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setStep(1)
    setFormData({
      vehicle_id: "",
      service_date: new Date().toISOString().split("T")[0],
      next_service_date: "",
      current_mileage: "",
      service_centre: "",
      nature_of_fault: "",
      parts_replaced: "",
      maintenance_type: "Routine",
      status: "Completed",
      repair_duration_from: "",
      repair_duration_to: "",
      vehicle_downtime_days: "",
      cost: "",
      remarks: "",
    })
    setChecklist({})
    setSelectedVehicle(null)
    setAssignedDriver(null)
    setLastServiceDate("")
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[90vw] max-w-[1400px] overflow-y-auto print:w-full">
        <SheetHeader className="print:hidden">
          <div className="flex items-center justify-between">
            <SheetTitle>Maintenance Log - Step {step} of 2</SheetTitle>
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </div>
        </SheetHeader>

        <div className="hidden print:block mb-6">
          <h1 className="text-2xl font-bold">Maintenance Log</h1>
          <p className="text-sm text-muted-foreground">Generated on {new Date().toLocaleDateString()}</p>
        </div>

        <div className="mt-6 space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={formData.service_date}
                    onChange={(e) => setFormData({ ...formData, service_date: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Fleet ID / Vehicle</Label>
                  <Select
                    value={formData.vehicle_id}
                    onValueChange={(value) => setFormData({ ...formData, vehicle_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select vehicle" />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicles.map((vehicle) => (
                        <SelectItem key={vehicle.id} value={vehicle.id}>
                          {vehicle.vehicle_number} - {vehicle.make} {vehicle.model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Make / Model / Year</Label>
                  <Input
                    value={
                      selectedVehicle
                        ? `${selectedVehicle.make} ${selectedVehicle.model} ${selectedVehicle.year || ""}`
                        : ""
                    }
                    disabled
                  />
                </div>

                <div>
                  <Label>Assigned Driver</Label>
                  <Input value={assignedDriver?.full_name || "No driver assigned"} disabled />
                </div>

                <div>
                  <Label>Last Service Date</Label>
                  <Input value={lastServiceDate || "No previous service"} disabled />
                </div>

                <div>
                  <Label>Next Service Date</Label>
                  <Input
                    type="date"
                    value={formData.next_service_date}
                    onChange={(e) => setFormData({ ...formData, next_service_date: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Current Mileage (km)</Label>
                  <Input
                    type="number"
                    value={formData.current_mileage}
                    onChange={(e) => setFormData({ ...formData, current_mileage: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Service Centre / Technician</Label>
                  <Input
                    value={formData.service_centre}
                    onChange={(e) => setFormData({ ...formData, service_centre: e.target.value })}
                  />
                </div>

                <div className="col-span-2">
                  <Label>Nature of Fault/Complain</Label>
                  <Textarea
                    value={formData.nature_of_fault}
                    onChange={(e) => setFormData({ ...formData, nature_of_fault: e.target.value })}
                  />
                </div>

                <div className="col-span-2">
                  <Label>Part Replaced</Label>
                  <Textarea
                    value={formData.parts_replaced}
                    onChange={(e) => setFormData({ ...formData, parts_replaced: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Maintenance Type</Label>
                  <Select
                    value={formData.maintenance_type}
                    onValueChange={(value) => setFormData({ ...formData, maintenance_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Routine">Routine</SelectItem>
                      <SelectItem value="Major">Major</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Completed">Completed</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Repair Duration From</Label>
                  <Input
                    type="datetime-local"
                    value={formData.repair_duration_from}
                    onChange={(e) => setFormData({ ...formData, repair_duration_from: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Repair Duration To</Label>
                  <Input
                    type="datetime-local"
                    value={formData.repair_duration_to}
                    onChange={(e) => setFormData({ ...formData, repair_duration_to: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Vehicle Downtime (Days)</Label>
                  <Input
                    type="number"
                    value={formData.vehicle_downtime_days}
                    onChange={(e) => setFormData({ ...formData, vehicle_downtime_days: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Repair Amount (NGN)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                  />
                </div>

                <div className="col-span-2">
                  <Label>Remarks</Label>
                  <Textarea
                    value={formData.remarks}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end print:hidden">
                <Button onClick={handleNext}>
                  Next: Inspection Checklist
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40%]">Maintenance Item</TableHead>
                      <TableHead className="w-[15%]">Condition / Meets Standard</TableHead>
                      <TableHead className="w-[25%]">Remarks</TableHead>
                      <TableHead className="w-[20%]">Action Required</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {CHECKLIST_ITEMS.map((item) => (
                      <TableRow key={item.key}>
                        <TableCell className="font-medium">{item.label}</TableCell>
                        <TableCell>
                          <Select
                            value={checklist[`${item.key}_condition`] || "NA"}
                            onValueChange={(value) => setChecklist({ ...checklist, [`${item.key}_condition`]: value })}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Yes">Yes</SelectItem>
                              <SelectItem value="No">No</SelectItem>
                              <SelectItem value="NA">N/A</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            className="h-8"
                            value={checklist[`${item.key}_remarks`] || ""}
                            onChange={(e) => setChecklist({ ...checklist, [`${item.key}_remarks`]: e.target.value })}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            className="h-8"
                            value={checklist[`${item.key}_action`] || ""}
                            onChange={(e) => setChecklist({ ...checklist, [`${item.key}_action`]: e.target.value })}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex justify-between print:hidden">
                <Button variant="outline" onClick={handleBack}>
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button onClick={handleSubmit} disabled={loading}>
                  {loading ? "Saving..." : "Save Maintenance Log"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
