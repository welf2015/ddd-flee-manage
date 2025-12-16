"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { User, Phone, Award as IdCard, Calendar, Truck, Star, Briefcase, Edit, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { updateDriverVehicle, deleteDriver } from "@/app/actions/drivers"
import { useToast } from "@/hooks/use-toast"
import { CreateDriverDialog } from "@/components/create-driver-dialog"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

type DriverDetailDialogProps = {
  driver: any
  open: boolean
  onOpenChange: (open: boolean) => void
  onDriverUpdated?: () => void
}

export function DriverDetailDialog({ driver, open, onOpenChange, onDriverUpdated }: DriverDetailDialogProps) {
  const router = useRouter()
  const [ratings, setRatings] = useState<any[]>([])
  const [jobHistory, setJobHistory] = useState<any[]>([])
  const [averageRating, setAverageRating] = useState(0)
  const [vehicles, setVehicles] = useState<any[]>([])
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(driver?.vehicles?.id || "")
  const [isUpdating, setIsUpdating] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast: toastHook } = useToast()

  useEffect(() => {
    if (open && driver) {
      fetchDriverData()
      setSelectedVehicleId(driver?.vehicles?.id || "")
    }
  }, [open, driver])

  const fetchDriverData = async () => {
    const supabase = createClient()

    // Fetch available vehicles
    const { data: vehiclesData } = await supabase
      .from("vehicles")
      .select("id, vehicle_number, make, model, vehicle_type, status")
      .eq("status", "Active")
      .order("vehicle_number")

    if (vehiclesData) {
      setVehicles(vehiclesData)
    }

    // Fetch ratings
    const { data: ratingsData } = await supabase
      .from("driver_ratings")
      .select("*, bookings(job_id)")
      .eq("driver_id", driver.id)
      .order("created_at", { ascending: false })

    if (ratingsData) {
      setRatings(ratingsData)
      const avg = ratingsData.reduce((acc, r) => acc + r.rating, 0) / ratingsData.length
      setAverageRating(avg || 0)
    }

    // Fetch job history
    const { data: jobsData } = await supabase
      .from("bookings")
      .select("*")
      .eq("assigned_driver_id", driver.id)
      .order("created_at", { ascending: false })
      .limit(10)

    if (jobsData) {
      setJobHistory(jobsData)
    }
  }

  const handleVehicleAssignment = async () => {
    setIsUpdating(true)
    const vehicleId = selectedVehicleId === "none" || selectedVehicleId === "" ? null : selectedVehicleId
    const result = await updateDriverVehicle(driver.id, vehicleId)

    if (result.success) {
      toastHook({
        title: "Vehicle assigned",
        description: vehicleId ? "Vehicle has been assigned to driver" : "Vehicle assignment removed",
      })
      // Refresh driver data
      const supabase = createClient()
      const { data: updatedDriver } = await supabase
        .from("drivers")
        .select("*, vehicles:assigned_vehicle_id(*)")
        .eq("id", driver.id)
        .single()

      if (updatedDriver) {
        driver.vehicles = updatedDriver.vehicles
        setSelectedVehicleId(updatedDriver.vehicles?.id || "")
      }
    } else {
      toastHook({
        title: "Error",
        description: result.error || "Failed to assign vehicle",
        variant: "destructive",
      })
    }
    setIsUpdating(false)
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    const result = await deleteDriver(driver.id)

    if (result.success) {
      toast.success("Driver deleted successfully")
      setShowDeleteConfirm(false)
      onOpenChange(false)
      onDriverUpdated?.()
      router.refresh()
    } else {
      toast.error(result.error || "Failed to delete driver", {
        duration: 5000,
      })
    }
    setIsDeleting(false)
  }

  const handleEditSuccess = () => {
    onDriverUpdated?.()
    router.refresh()
    fetchDriverData()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-500/10 text-green-500 border-green-500/20"
      case "Assigned to Job":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20"
      case "Currently on Job":
        return "bg-purple-500/10 text-purple-500 border-purple-500/20"
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20"
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] bg-background/95 backdrop-blur-xl border-border/50">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-2xl">{driver.full_name}</DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">Driver Profile & Performance</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={getStatusColor(driver.status)}>
                  {driver.status}
                </Badge>
                <Button variant="outline" size="sm" onClick={() => setShowEditDialog(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={isDeleting}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-120px)]">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Driver Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Full Name</p>
                      <p className="font-medium">{driver.full_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium">{driver.phone || "N/A"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <IdCard className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">License Number</p>
                      <p className="font-medium">{driver.license_number}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">License Expiry</p>
                      <p className="font-medium">
                        {driver.license_expiry ? new Date(driver.license_expiry).toLocaleDateString() : "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Truck className="h-5 w-5 text-accent" />
                    <div className="flex-1">
                      <Label htmlFor="vehicle-assignment" className="text-sm text-muted-foreground">
                        Assigned Vehicle
                      </Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Select
                          value={selectedVehicleId || "none"}
                          onValueChange={setSelectedVehicleId}
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Select a vehicle" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None (Unassigned)</SelectItem>
                            {vehicles.map((vehicle) => (
                              <SelectItem key={vehicle.id} value={vehicle.id}>
                                {vehicle.vehicle_number} - {vehicle.make} {vehicle.model} ({vehicle.vehicle_type})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          onClick={handleVehicleAssignment}
                          disabled={isUpdating || selectedVehicleId === (driver?.vehicles?.id || "")}
                          size="sm"
                        >
                          {isUpdating ? "Updating..." : "Assign"}
                        </Button>
                      </div>
                      {driver.vehicles && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Current: {driver.vehicles.vehicle_number}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Performance Rating</CardTitle>
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 fill-yellow-500 text-yellow-500" />
                    <span className="text-2xl font-bold">{averageRating.toFixed(1)}</span>
                    <span className="text-sm text-muted-foreground">({ratings.length} ratings)</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {ratings.length > 0 ? (
                  <div className="space-y-3">
                    {ratings.slice(0, 5).map((rating) => (
                      <div key={rating.id} className="border-b last:border-0 pb-3 last:pb-0">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">{rating.bookings?.job_id}</span>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < rating.rating ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        {rating.feedback && <p className="text-sm text-muted-foreground">{rating.feedback}</p>}
                        {rating.client_feedback && (
                          <p className="text-sm text-muted-foreground mt-1">
                            <span className="font-medium">Client:</span> {rating.client_feedback}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-4">No ratings yet</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Job History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {jobHistory.length > 0 ? (
                  <div className="space-y-2">
                    {jobHistory.map((job) => (
                      <div key={job.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                        <div>
                          <p className="font-medium">{job.job_id}</p>
                          <p className="text-sm text-muted-foreground">{job.client_name}</p>
                        </div>
                        <Badge variant="outline">{job.status}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-4">No job history</p>
                )}
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>

    <CreateDriverDialog
      open={showEditDialog}
      onOpenChange={setShowEditDialog}
      driver={driver}
      onSuccess={handleEditSuccess}
    />

    <ConfirmDialog
      open={showDeleteConfirm}
      onOpenChange={setShowDeleteConfirm}
      title="Delete Driver"
      description={`Are you sure you want to delete ${driver.full_name}? This action cannot be undone.`}
      onConfirm={handleDelete}
      confirmText="Delete"
      cancelText="Cancel"
      variant="destructive"
    />
  </>
  )
}
