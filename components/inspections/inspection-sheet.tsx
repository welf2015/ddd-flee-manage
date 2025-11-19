"use client"

import { useState, useEffect } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createClient } from "@/lib/supabase/client"
import { Printer, Check, X, ImageIcon } from 'lucide-react'
import { toast } from "sonner"
import { approveInspection, rejectInspection } from "@/app/actions/inspections"

const INSPECTION_CATEGORIES = [
  {
    title: "Vehicle Identification",
    items: [
      { key: "vehicle_info", label: "Vehicle make, model, year, Registration, VIN" },
    ]
  },
  {
    title: "Handbook",
    items: [
      { key: "handbook_sops_available", label: "SOPs, 999 directory" },
    ]
  },
  {
    title: "Exterior Inspection",
    items: [
      { key: "body_condition", label: "Body condition" },
      { key: "bumpers", label: "Bumpers" },
      { key: "mirrors", label: "Mirrors" },
      { key: "windshield", label: "Windshield" },
      { key: "windows", label: "Windows" },
      { key: "wipers", label: "Wipers" },
      { key: "headlights", label: "Headlights" },
      { key: "brake_lights", label: "Brake lights" },
      { key: "horn", label: "Horn" },
      { key: "license_plate", label: "License plate" },
      { key: "doors_locks", label: "Doors & locks" },
    ]
  },
  {
    title: "Tires and Wheels",
    items: [
      { key: "tire_tread_depth", label: "Tire tread depth" },
      { key: "tire_pressure", label: "Tire pressure" },
      { key: "tire_wear", label: "Signs of wear" },
      { key: "wheel_nuts", label: "Wheel nuts" },
      { key: "spare_tire", label: "Spare tire" },
      { key: "jack_tools", label: "Jack and tools" },
    ]
  },
  {
    title: "Engine & Under the Hood",
    items: [
      { key: "coolant", label: "Coolant" },
      { key: "brake_fluid", label: "Brake fluid" },
      { key: "power_steering_fluid", label: "Power steering fluid" },
      { key: "transmission_fluid", label: "Transmission fluid" },
      { key: "battery", label: "Battery" },
      { key: "belts_hoses", label: "Belts & hoses" },
      { key: "air_filter", label: "Air filter" },
    ]
  },
  {
    title: "Braking System",
    items: [
      { key: "service_brake", label: "Service brake" },
      { key: "parking_brake", label: "Parking brake" },
      { key: "brake_pedal_pressure", label: "Brake pedal pressure" },
      { key: "brake_warning_light", label: "Brake warning light" },
    ]
  },
  {
    title: "Exhaust and Emission",
    items: [
      { key: "exhaust_pipe", label: "Exhaust pipe" },
      { key: "noise_level", label: "Noise level" },
      { key: "emission_compliance", label: "Emission compliance" },
    ]
  },
  {
    title: "Electrical & Controls",
    items: [
      { key: "dashboard_lights", label: "Dashboard lights" },
      { key: "gauges", label: "Gauges" },
      { key: "interior_lights", label: "Interior lights" },
      { key: "ignition", label: "Ignition" },
      { key: "power_windows_locks", label: "Power windows & locks" },
    ]
  },
  {
    title: "Interior Condition",
    items: [
      { key: "seats", label: "Seats" },
      { key: "seatbelts", label: "Seatbelts" },
      { key: "dashboard", label: "Dashboard" },
      { key: "ac_heating", label: "AC/heating" },
      { key: "cabin_lights", label: "Cabin lights" },
      { key: "fire_extinguisher", label: "Fire extinguisher" },
      { key: "first_aid_kit", label: "First aid kit" },
      { key: "reflective_triangle", label: "Reflective triangle" },
      { key: "cleanliness", label: "Cleanliness" },
    ]
  },
  {
    title: "Road Test / Functional Checks",
    items: [
      { key: "acceleration", label: "Acceleration" },
      { key: "gear_shifts", label: "Gear shifts" },
      { key: "steering", label: "Steering" },
      { key: "braking", label: "Braking" },
      { key: "noises_vibrations", label: "Noises/vibrations" },
      { key: "warning_indicators", label: "Warning indicators" },
    ]
  },
]

interface InspectionSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  vehicles: any[]
  inspection?: any
  onSuccess: () => void
}

export function InspectionSheet({ open, onOpenChange, vehicles, inspection, onSuccess }: InspectionSheetProps) {
  const [loading, setLoading] = useState(false)
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null)
  const [assignedDriver, setAssignedDriver] = useState<any>(null)
  const [inspectionPhotos, setInspectionPhotos] = useState<any[]>([])
  const [formData, setFormData] = useState<any>({
    vehicle_id: "",
    inspection_date: new Date().toISOString().split('T')[0],
    inspection_time: new Date().toTimeString().split(' ')[0].substring(0, 5),
    odometer_reading: "",
    defects_noted: "",
    recommended_repairs: "",
    inspector_remarks: "",
  })
  const [checklist, setChecklist] = useState<Record<string, any>>({})
  
  const supabase = createClient()
  
  useEffect(() => {
    if (inspection) {
      setFormData({
        vehicle_id: inspection.vehicle_id,
        inspection_date: inspection.inspection_date,
        inspection_time: inspection.inspection_time,
        odometer_reading: inspection.odometer_reading || "",
        defects_noted: inspection.defects_noted || "",
        recommended_repairs: inspection.recommended_repairs || "",
        inspector_remarks: inspection.inspector_remarks || "",
      })
      
      const checklistData: any = {}
      INSPECTION_CATEGORIES.forEach(category => {
        category.items.forEach(item => {
          checklistData[item.key] = inspection[item.key] || 'NA'
          checklistData[`${item.key}_remarks`] = inspection[`${item.key}_remarks`] || ''
        })
      })
      setChecklist(checklistData)
      
      fetchInspectionPhotos(inspection.id)
    }
  }, [inspection])
  
  const fetchInspectionPhotos = async (inspectionId: string) => {
    const { data } = await supabase
      .from('inspection_photos')
      .select('*')
      .eq('inspection_id', inspectionId)
      .order('created_at', { ascending: true })
    
    setInspectionPhotos(data || [])
  }
  
  useEffect(() => {
    if (formData.vehicle_id) {
      fetchVehicleDetails(formData.vehicle_id)
    }
  }, [formData.vehicle_id])
  
  const fetchVehicleDetails = async (vehicleId: string) => {
    const vehicle = vehicles.find(v => v.id === vehicleId)
    setSelectedVehicle(vehicle)
    
    const { data: driver } = await supabase
      .from('drivers')
      .select('*')
      .eq('assigned_vehicle_id', vehicleId)
      .single()
    
    setAssignedDriver(driver)
  }
  
  const handleSubmit = async () => {
    if (!formData.vehicle_id) {
      toast.error("Please select a vehicle")
      return
    }
    
    if (!assignedDriver) {
      toast.error("No driver assigned to this vehicle")
      return
    }
    
    setLoading(true)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      const inspectionData: any = {
        vehicle_id: formData.vehicle_id,
        driver_id: assignedDriver.id,
        inspection_date: formData.inspection_date,
        inspection_time: formData.inspection_time,
        odometer_reading: formData.odometer_reading ? parseInt(formData.odometer_reading) : null,
        defects_noted: formData.defects_noted,
        recommended_repairs: formData.recommended_repairs,
        inspector_remarks: formData.inspector_remarks,
        created_by: user?.id,
        status: 'Pending',
      }
      
      INSPECTION_CATEGORIES.forEach(category => {
        category.items.forEach(item => {
          inspectionData[item.key] = checklist[item.key] || 'NA'
          inspectionData[`${item.key}_remarks`] = checklist[`${item.key}_remarks`] || ''
        })
      })
      
      const { error } = await supabase
        .from('vehicle_inspections')
        .insert(inspectionData)
      
      if (error) throw error
      
      toast.success("Inspection logged successfully")
      onSuccess()
      onOpenChange(false)
      resetForm()
    } catch (error: any) {
      console.error("[v0] Inspection error:", error)
      toast.error(error.message || "Failed to log inspection")
    } finally {
      setLoading(false)
    }
  }
  
  const resetForm = () => {
    setFormData({
      vehicle_id: "",
      inspection_date: new Date().toISOString().split('T')[0],
      inspection_time: new Date().toTimeString().split(' ')[0].substring(0, 5),
      odometer_reading: "",
      defects_noted: "",
      recommended_repairs: "",
      inspector_remarks: "",
    })
    setChecklist({})
    setSelectedVehicle(null)
    setAssignedDriver(null)
  }
  
  const handlePrint = () => {
    window.print()
  }
  
  const handleApprove = async () => {
    if (!inspection) return
    setLoading(true)
    const result = await approveInspection(inspection.id)
    setLoading(false)
    if (result.success) {
      toast.success("Inspection approved")
      onSuccess()
      onOpenChange(false)
    } else {
      toast.error(result.error)
    }
  }

  const handleReject = async () => {
    if (!inspection) return
    const reason = prompt("Please enter a reason for rejection:")
    if (reason === null) return // Cancelled

    setLoading(true)
    const result = await rejectInspection(inspection.id, reason || "No reason provided")
    setLoading(false)
    if (result.success) {
      toast.success("Inspection rejected")
      onSuccess()
      onOpenChange(false)
    } else {
      toast.error(result.error)
    }
  }
  
  const isReadOnly = !!inspection
  
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[90vw] max-w-[1400px] overflow-y-auto print:w-full">
        <SheetHeader className="print:hidden">
          <div className="flex items-center justify-between">
            <SheetTitle>{isReadOnly ? 'View Inspection' : 'Daily Vehicle Inspection'}</SheetTitle>
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </div>
        </SheetHeader>
        
        <div className="hidden print:block mb-6">
          <h1 className="text-2xl font-bold">Vehicle Inspection Report</h1>
          <p className="text-sm text-muted-foreground">Generated on {new Date().toLocaleDateString()}</p>
        </div>
        
        <Tabs defaultValue="inspection" className="mt-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="inspection">Inspection Details</TabsTrigger>
            <TabsTrigger value="photos">
              <ImageIcon className="h-4 w-4 mr-2" />
              Photos {inspectionPhotos.length > 0 && `(${inspectionPhotos.length})`}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="inspection" className="space-y-6 mt-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date</Label>
                <Input
                  type="date"
                  value={formData.inspection_date}
                  onChange={(e) => setFormData({ ...formData, inspection_date: e.target.value })}
                  disabled={isReadOnly}
                />
              </div>
              
              <div>
                <Label>Time</Label>
                <Input
                  type="time"
                  value={formData.inspection_time}
                  onChange={(e) => setFormData({ ...formData, inspection_time: e.target.value })}
                  disabled={isReadOnly}
                />
              </div>
              
              <div>
                <Label>Vehicle</Label>
                <Select 
                  value={formData.vehicle_id} 
                  onValueChange={(value) => setFormData({ ...formData, vehicle_id: value })}
                  disabled={isReadOnly}
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
                <Label>Driver</Label>
                <Input
                  value={assignedDriver?.full_name || 'No driver assigned'}
                  disabled
                />
              </div>
              
              <div>
                <Label>Odometer Reading (km)</Label>
                <Input
                  type="number"
                  value={formData.odometer_reading}
                  onChange={(e) => setFormData({ ...formData, odometer_reading: e.target.value })}
                  disabled={isReadOnly}
                />
              </div>
            </div>
            
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[15%]">Category</TableHead>
                    <TableHead className="w-[35%]">Inspection Item</TableHead>
                    <TableHead className="w-[15%]">Condition</TableHead>
                    <TableHead className="w-[35%]">Remarks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {INSPECTION_CATEGORIES.map((category) => (
                    category.items.map((item, idx) => (
                      <TableRow key={item.key}>
                        {idx === 0 && (
                          <TableCell rowSpan={category.items.length} className="font-semibold align-top">
                            {category.title}
                          </TableCell>
                        )}
                        <TableCell>{item.label}</TableCell>
                        <TableCell>
                          <Select
                            value={checklist[item.key] || 'NA'}
                            onValueChange={(value) => setChecklist({ ...checklist, [item.key]: value })}
                            disabled={isReadOnly}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="OK">OK</SelectItem>
                              <SelectItem value="Not OK">Not OK</SelectItem>
                              <SelectItem value="NA">N/A</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            className="h-8"
                            value={checklist[`${item.key}_remarks`] || ''}
                            onChange={(e) => setChecklist({ ...checklist, [`${item.key}_remarks`]: e.target.value })}
                            disabled={isReadOnly}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  ))}
                </TableBody>
              </Table>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label>Defects Noted</Label>
                <Textarea
                  value={formData.defects_noted}
                  onChange={(e) => setFormData({ ...formData, defects_noted: e.target.value })}
                  disabled={isReadOnly}
                />
              </div>
              
              <div>
                <Label>Recommended Repairs</Label>
                <Textarea
                  value={formData.recommended_repairs}
                  onChange={(e) => setFormData({ ...formData, recommended_repairs: e.target.value })}
                  disabled={isReadOnly}
                />
              </div>
              
              <div>
                <Label>Inspector Remarks</Label>
                <Textarea
                  value={formData.inspector_remarks}
                  onChange={(e) => setFormData({ ...formData, inspector_remarks: e.target.value })}
                  disabled={isReadOnly}
                />
              </div>
              {inspection?.supervisor_review && (
                 <div>
                  <Label className="text-red-500">Rejection Reason</Label>
                  <Textarea
                    value={inspection.supervisor_review}
                    disabled
                    className="border-red-200 bg-red-50"
                  />
                </div>
              )}
            </div>
            
            {!isReadOnly && (
              <div className="flex justify-end print:hidden">
                <Button onClick={handleSubmit} disabled={loading}>
                  {loading ? "Saving..." : "Save Inspection"}
                </Button>
              </div>
            )}

            {isReadOnly && inspection?.status === 'Pending' && (
              <div className="flex justify-end gap-2 print:hidden">
                <Button variant="destructive" onClick={handleReject} disabled={loading}>
                  <X className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={handleApprove} disabled={loading}>
                  <Check className="h-4 w-4 mr-2" />
                  Approve
                </Button>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="photos" className="space-y-6 mt-6">
            {inspectionPhotos.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {inspectionPhotos.map((photo) => (
                  <div key={photo.id} className="border rounded-lg overflow-hidden">
                    <div className="aspect-video relative bg-muted">
                      <img 
                        src={photo.photo_url || "/placeholder.svg"} 
                        alt={photo.photo_category || 'Inspection photo'}
                        className="object-cover w-full h-full"
                      />
                    </div>
                    <div className="p-3 space-y-1">
                      <p className="font-medium text-sm">{photo.photo_category || 'General'}</p>
                      {photo.location_address && (
                        <p className="text-xs text-muted-foreground">{photo.location_address}</p>
                      )}
                      {photo.captured_at && (
                        <p className="text-xs text-muted-foreground">
                          {new Date(photo.captured_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No photos submitted for this inspection</p>
                {!isReadOnly && (
                  <p className="text-sm mt-2">Photos can be uploaded via the mobile app</p>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}
